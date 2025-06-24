export interface JsonRpcRequest<Params extends unknown[] = unknown[]> {
  jsonrpc: "2.0";
  id: string | number | null;
  method: string;
  params: Params;
}

/** Electrum replies are always wrapped in this envelope. */
export interface JsonRpcResponse<Result = unknown> {
  jsonrpc: "2.0";
  id: string | number | null;
  result?: Result;
  error?: { code: number; message: string };
}
