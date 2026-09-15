import { supabase } from './supabase';

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