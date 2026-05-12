import { NextRequest, NextResponse } from "next/server";
import { addClient, broadcast } from "@/lib/realtime/publisher";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ channel: string }> }
) {
  const { channel } = await params;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      const cleanup = addClient(channel, controller);

      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode("event: heartbeat\ndata: {}\n\n"));
        } catch {
          clearInterval(heartbeat);
          cleanup();
        }
      }, 30000);

      request.signal.addEventListener("abort", () => {
        clearInterval(heartbeat);
        cleanup();
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ channel: string }> }
) {
  const { channel } = await params;
  const body = await request.json();
  const { type, data } = body;

  if (!type) {
    return NextResponse.json({ error: "Se requiere 'type' en el body" }, { status: 400 });
  }

  broadcast(channel, type, data);

  return NextResponse.json({ ok: true, channel, event: type });
}
