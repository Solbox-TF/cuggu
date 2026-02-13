import { SSEEventSchema, type SSEEvent } from '@/schemas/ai';

/**
 * SSE 버퍼를 파싱하여 검증된 이벤트 배열 반환
 *
 * - `\n\n` 구분자로 split
 * - `data: ` 프리픽스 제거 후 JSON 파싱
 * - Zod 스키마로 검증 — 실패 시 skip + console.warn
 * - 아직 완성되지 않은 마지막 청크는 remaining으로 반환
 */
export function parseSSEEvents(buffer: string): {
  events: SSEEvent[];
  remaining: string;
} {
  const chunks = buffer.split('\n\n');
  const remaining = chunks.pop() || '';
  const events: SSEEvent[] = [];

  for (const chunk of chunks) {
    if (!chunk.startsWith('data: ')) continue;

    let raw: unknown;
    try {
      raw = JSON.parse(chunk.slice(6));
    } catch {
      console.warn('[SSE] JSON parse failed:', chunk);
      continue;
    }

    const result = SSEEventSchema.safeParse(raw);
    if (!result.success) {
      console.warn('[SSE] Validation failed:', result.error.issues, raw);
      continue;
    }

    events.push(result.data);
  }

  return { events, remaining };
}
