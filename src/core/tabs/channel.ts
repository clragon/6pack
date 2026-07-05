// A same-origin message bus across the user's open e621 tabs, over BroadcastChannel.
// Generic over the message union so each domain owns its own protocol; transport-only.

export interface Channel<M> {
  // Broadcast to every other tab on this channel. The sender does not hear its
  // own messages, matching BroadcastChannel semantics.
  post(message: M): void;
  subscribe(handler: (message: M) => void): () => void;
  close(): void;
}

export function openChannel<M>(name: string): Channel<M> {
  const bc = new BroadcastChannel(`sixpack.${name}`);
  const handlers = new Set<(message: M) => void>();
  bc.onmessage = (event: MessageEvent<M>) => {
    for (const handler of handlers) handler(event.data);
  };
  return {
    post: (message) => bc.postMessage(message),
    subscribe: (handler) => {
      handlers.add(handler);
      return () => {
        handlers.delete(handler);
      };
    },
    close: () => {
      handlers.clear();
      bc.close();
    },
  };
}
