export type JsonHandlerResult = Readonly<{
  status: number;
  body?: unknown;
  headers?: Record<string, string>;
  stream?: ReadableStream | NodeJS.ReadableStream;
}>;
