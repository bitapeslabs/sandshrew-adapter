export const methodNotFound = (id: string | number | null) => ({
  jsonrpc: "2.0",
  id,
  error: { code: -32601, message: "Method not supported" },
});

export const invalidRequest = (id: null) => ({
  jsonrpc: "2.0",
  id,
  error: { code: -32600, message: "Invalid JSON-RPC request" },
});
