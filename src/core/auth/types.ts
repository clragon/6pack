// The authenticated-request seam. The cookie + CSRF implementation hits e621's
// same-origin endpoints; an API-key implementation can replace it without
// touching callers.
type Body = Record<string, string | number | boolean | null | undefined>;

export interface Transport {
  post(path: string, body: Body): Promise<unknown>;
  put(path: string, body: Body): Promise<unknown>;
  del(path: string, body: Body): Promise<unknown>;
}
