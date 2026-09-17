import { getEventByCode } from './events';
import { parseQRPayload } from './qr';
import { supabase } from './supabase';

export type RegisterResult = {
  success: boolean;
  message: string;
  eventTitle?: string;
};

export type AttendanceRecord = {
  id: string;
  eventId: string;
  eventTitle: string;
  scannedAt: string;
};

export type TeacherEventAttendance = {
  eventId: string;
  eventCode: string;
  title: string;
  startTime: string | null;
  endTime: string | null;
  attendeeCount: number;
  attendees: {
    studentId: string;
    fullName: string | null;
    scannedAt: string;
  }[];
};

export async function registerAttendance(
  rawPayload: string,
  studentId: string
): Promise<RegisterResult> {
  const parsed = parseQRPayload(rawPayload);

  if (!parsed.ok) {
    return {
      success: false,
      message: parsed.message,
    };
  }

  const payload = parsed.payload;

  const now = Date.now();

  const start = payload.start
    ? new Date(payload.start).getTime()
    : null;

  const end = payload.end
    ? new Date(payload.end).getTime()
    : null;

  if (start && now < start) {
    return {
      success: false,
      message: 'Event has not started yet.',
    };
  }

  if (end && now > end) {
    return {
      success: false,
      message: 'Event has already ended.',
    };
  }

  const title = payload.title ?? payload.event;

  let event: {
    id: string;
    title: string;
  } | null = null;

  const foundEvent = await getEventByCode(payload.event);

  if (foundEvent) {
    event = foundEvent;
  } else {
    const { data: newEvent, error: insertError } = await supabase
      .from('events')
      .insert([
        {
          event_code: payload.event,
          title,
          start_time: payload.start ?? null,
          end_time: payload.end ?? null,
        },
      ])
      .select('id, title')
      .single();

    if (insertError || !newEvent) {
      return {
        success: false,
        message: 'Could not create event.',
      };
    }

    event = newEvent;
  }

  const { error: attError } = await supabase
    .from('attendance')
    .insert([
      {
        student_id: studentId,
        event_id: event.id,
      },
    ]);

  if (attError) {
    if (attError.code === '23505') {
      return {
        success: false,
        message: 'Already registered for this event.',
        eventTitle: event.title,
      };
    }

    return {
      success: false,
      message: attError.message,
    };
  }

  return {
    success: true,
    message: 'Attendance recorded!',
    eventTitle: event.title,
  };
}

export async function getAttendanceHistory(
  studentId: string
): Promise<AttendanceRecord[]> {
  if (!studentId || studentId === 'unknown') {
    return [];
  }

  const { data, error } = await supabase
    .from('attendance')
    .select(
      'id, scanned_at, events ( event_code, title )'
    )
    .eq('student_id', studentId)
    .order('scanned_at', { ascending: false });

  if (error || !data) {
    return [];
  }

  return data.map((row: any) => ({
    id: row.id,
    eventId: row.events?.event_code ?? '',
    eventTitle: row.events?.title ?? '',
    scannedAt: row.scanned_at,
  }));
}

export async function getTeacherEventAttendance(
  teacherId: string
): Promise<TeacherEventAttendance[]> {
  const { data: events, error: eventError } = await supabase
    .from('events')
    .select(
      'id, event_code, title, start_time, end_time, created_at'
    )
    .eq('created_by', teacherId)
    .order('created_at', { ascending: false });

  if (eventError) {
    console.error(
      'Error fetching teacher events:',
      eventError.message
    );
    return [];
  }

  if (!events || events.length === 0) {
    return [];
  }

  const eventIds = events.map((event) => event.id);

  const { data: attendance, error: attendanceError } =
  await supabase
    .from('attendance')
    .select('student_id, scanned_at, event_id')
    .in('event_id', eventIds)
    .order('scanned_at', { ascending: false });

  if (attendanceError) {
    console.error(
      'Error fetching attendance:',
      attendanceError.message
    );
    return [];
  }

  const studentIds = [
    ...new Set(
      (attendance ?? []).map((row) => row.student_id)
    ),
  ];

  const { data: profiles, error: profilesError } =
    studentIds.length > 0
      ? await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', studentIds)
      : { data: [], error: null };

  if (profilesError) {
    console.error(
      'Error fetching student profiles:',
      profilesError.message
    );
  }

  return events.map((event) => {
    const rows = (attendance ?? []).filter(
      (row) => row.event_id === event.id
    );

    return {
      eventId: event.id,
      eventCode: event.event_code,
      title: event.title,
      startTime: event.start_time,
      endTime: event.end_time,
      attendeeCount: rows.length,
      attendees: rows.map((row) => {
        const profile = (profiles ?? []).find(
          (item) => item.id === row.student_id
        );

        return {
          studentId: row.student_id,
          fullName: profile?.full_name ?? null,
          scannedAt: row.scanned_at,
        };
      }),
    };
  });
}

export type TeacherEventSummary = {
  eventId: string;
  eventCode: string;
  title: string;
  attendeeCount: number;
};

export async function getTeacherEventSummary(
  teacherId: string
): Promise<TeacherEventSummary[]> {
  // 1. Get the teacher's events
  const {
    data: events,
    error: eventError,
  } = await supabase
    .from('events')
    .select('id, event_code, title')
    .eq('created_by', teacherId)
    .order('created_at', { ascending: false });

  // Always check the Supabase error before using events
  if (eventError || !events) {
    console.error(
      'Error fetching teacher events:',
      eventError?.message
    );
    return [];
  }

  // No events
  if (events.length === 0) {
    return [];
  }

  // 2. Get only event_id from attendance
  const eventIds = events.map((e) => e.id);

  const { data: attRows, error: attError } = await supabase
    .from('attendance')
    .select('event_id')
    .in('event_id', eventIds);

  if (attError || !attRows) {
    console.error(
      'Error fetching attendance counts:',
      attError?.message
    );
    return [];
  }

  // 3. Count attendance rows for each event
  const counts: Record<string, number> = {};
  attRows.forEach((r) => {
    counts[r.event_id] = (counts[r.event_id] ?? 0) + 1;
  });

  // 4. Return the summary
  return events.map((e) => ({
    eventId: e.id,
    eventCode: e.event_code,
    title: e.title,
    attendeeCount: counts[e.id] ?? 0,
  }));
}