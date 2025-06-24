import { Request, Response } from "express";
import { methodNotFound, invalidRequest } from "../utils/errors.js";
import { callBtc } from "../rpc/btcClient.js";
import { forwardToMetashrew } from "../rpc/metashrewClient.js";
import { forwardToEsplora } from "@/rpc/esploraClient.js";

export const jsonRpcHandler = async (req: Request, res: Response) => {
  const { body } = req;

  if (!body || body.jsonrpc !== "2.0" || typeof body.method !== "string") {
    res.json(invalidRequest(null));
    return;
  }

  const {
    method,
    params = [],
    id = null,
  } = body as {
    method: string;
    params?: unknown[];
    id?: string | number | null;
  };

  try {
    if (method.startsWith("btc_")) {
      const rpcMethod = method.slice(4).toLowerCase(); // btc_getBlock -> getblock
      const result = await callBtc(rpcMethod, params, id);
      res.json(result);
      return;
    }

    if (method.startsWith("metashrew_")) {
      const result = await forwardToMetashrew(body);
      res.json(result);
      return;
    }

    if (method.startsWith("esplora_")) {
      const result = await forwardToEsplora(body);
      res.json(result);
      return;
    }

    res.json(methodNotFound(id));
    return;
  } catch (err: unknown) {
    res.json({
      jsonrpc: "2.0",
      id,
      error: {
        code: -32603,
        message: (err instanceof Error && err.message) ?? "Internal error",
      },
    });
    return;
  }
};
