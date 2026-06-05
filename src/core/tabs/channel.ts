export interface Channel<M> {
  // BroadcastChannel delivers a message to every other context on the name and
  // not to the poster.
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
