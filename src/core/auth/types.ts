type Body = Record<string, string | number | boolean | null | undefined>;

export interface Transport {
  post(path: string, body: Body): Promise<unknown>;
  put(path: string, body: Body): Promise<unknown>;
  del(path: string, body: Body): Promise<unknown>;
}
