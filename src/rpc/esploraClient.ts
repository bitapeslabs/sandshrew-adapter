// src/rpc/forwardToEsplora.ts
import {
  esplora_getaddress,
  esplora_getaddressbalance,
  esplora_getutxos,
  esplora_getfee,
  esplora_broadcastTx,
  esplora_getaddresstxs,
  esplora_getbulktransactions,
  esplora_getspendableinputs,
  esplora_gettransaction,
} from "@/apis/esplora";
import { EsploraUtxo } from "@/apis/esplora/types";

import { consumeOrThrow } from "@/boxed";

import { JsonRpcRequest, JsonRpcResponse } from "@/types";

export async function forwardToEsplora<Final = unknown>(
  req: JsonRpcRequest
): Promise<JsonRpcResponse<Final>> {
  const { method, params = [], id } = req;

  try {
    let result: unknown;

    switch (method) {
      /* ---------- address endpoints ------------------------------ */

      case "esplora_tx":
        result = consumeOrThrow(
          await esplora_gettransaction(params[0] as string)
        );
        break;

      case "esplora_address":
        result = consumeOrThrow(await esplora_getaddress(params[0] as string));
        break;

      case "esplora_address::balance":
        result = consumeOrThrow(
          await esplora_getaddressbalance(params[0] as string)
        );
        break;

      case "esplora_address::utxo":
        result = consumeOrThrow(await esplora_getutxos(params[0] as string));
        break;

      case "esplora_address::txs":
        /* params: [address, lastSeenTxid?] */
        result = consumeOrThrow(
          await esplora_getaddresstxs(
            params[0] as string,
            params[1] as string | undefined
          )
        );
        break;

      /* ---------- transaction-bulk helpers ----------------------- */
      case "esplora_txs:bulk":
        result = consumeOrThrow(
          await esplora_getbulktransactions(params[0] as string[])
        );
        break;

      case "esplora_utxos:spendable":
        result = consumeOrThrow(
          await esplora_getspendableinputs(params[0] as EsploraUtxo[])
        );
        break;

      /* ---------- fee & broadcast -------------------------------- */
      case "esplora_fee":
        result = consumeOrThrow(await esplora_getfee());
        break;

      case "esplora_tx::broadcast":
        /* params: [rawHex, electrumProvider?] */
        result = consumeOrThrow(
          await esplora_broadcastTx(
            params[0] as string,
            params[1] as string | undefined
          )
        );
        break;

      /* ---------- unknown method --------------------------------- */
      default:
        return {
          jsonrpc: "2.0",
          id,
          error: { code: -32601, message: `Method ${method} not found` },
        };
    }

    return { jsonrpc: "2.0", id, result: result as Final };
  } catch (err) {
    return {
      jsonrpc: "2.0",
      id,
      error: {
        code: -32603,
        message: (err as Error).message,
      },
    };
  }
}
