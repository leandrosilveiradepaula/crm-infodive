import { NextResponse } from 'next/server';
import { getRequestId } from './request-context';
import { recordOperationalEvent, type OperationalLevel } from './operational-events';

type JsonHeaders = HeadersInit | undefined;

export function createAiRouteContext(request: Request, operation: string) {
  const requestId = getRequestId(request.headers.get('X-Request-Id'));
  const startedAt = Date.now();

  return {
    requestId,
    respond(body: unknown, status = 200, headers?: JsonHeaders) {
      const responseHeaders = new Headers(headers);
      responseHeaders.set('X-Request-Id', requestId);
      return NextResponse.json(body, { status, headers: responseHeaders });
    },
    record(outcome: string, statusCode: number, level?: OperationalLevel) {
      recordOperationalEvent({
        area: 'ai',
        operation,
        outcome,
        requestId,
        durationMs: Date.now() - startedAt,
        statusCode,
        level,
      });
    },
  };
}
