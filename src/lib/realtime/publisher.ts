type SSEClient = {
  controller: ReadableStreamDefaultController;
  channel: string;
};

const clients = new Map<string, SSEClient[]>();

export function addClient(channel: string, controller: ReadableStreamDefaultController) {
  if (!clients.has(channel)) clients.set(channel, []);
  clients.get(channel)!.push({ controller, channel });
  return () => {
    const channelClients = clients.get(channel);
    if (channelClients) {
      const idx = channelClients.findIndex(c => c.controller === controller);
      if (idx >= 0) channelClients.splice(idx, 1);
    }
  };
}

export function broadcast(channel: string, event: string, data: any) {
  const channelClients = clients.get(channel);
  if (!channelClients) return;
  const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const client of channelClients) {
    try {
      client.controller.enqueue(new TextEncoder().encode(message));
    } catch {
      // Client disconnected
    }
  }
}
