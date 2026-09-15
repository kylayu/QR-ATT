export type QRPayload = {
  v: 1;
  event: string;
  title?: string;
  start?: string;
  end?: string;
};

type BuildQRPayloadParams = {
  eventId: string;
  title?: string;
  start?: string;
  end?: string;
};

export function buildQRPayload({
  eventId,
  title,
  start,
  end,
}: BuildQRPayloadParams): string {
  const payload: QRPayload = {
    v: 1,
    event: eventId,
  };

  if (title) {
    payload.title = title;
  }

  if (start) {
    payload.start = start;
  }

  if (end) {
    payload.end = end;
  }

  return JSON.stringify(payload);
}

export function parseQRPayload(raw: string): QRPayload | null {
  try {
    const payload = JSON.parse(raw);

    if (
      !payload ||
      payload.v !== 1 ||
      typeof payload.event !== 'string' ||
      !payload.event.trim()
    ) {
      return null;
    }

    return payload as QRPayload;
  } catch {
    return null;
  }
}