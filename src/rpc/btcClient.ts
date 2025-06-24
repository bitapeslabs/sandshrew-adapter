import fetch from "node-fetch";
import { BTC_RPC_URL, BTC_RPC_USER, BTC_RPC_PASS } from "@/consts";

export const callBtc = async (
  method: string,
  params: unknown[],
  id: string | number | null
) => {
  const body = JSON.stringify({ jsonrpc: "1.0", method, params, id });
  const auth = Buffer.from(`${BTC_RPC_USER}:${BTC_RPC_PASS}`).toString(
    "base64"
  );

  const res = await fetch(BTC_RPC_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${auth}`,
    },
    body,
  });

  return res.json();
};
