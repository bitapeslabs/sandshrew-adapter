import "dotenv/config";

export const BTC_RPC_URL = process.env.BTC_RPC_URL ?? "";
export const BTC_RPC_USER = process.env.BTC_RPC_USER ?? "";
export const BTC_RPC_PASS = process.env.BTC_RPC_PASS ?? "";

export const METASHREW_RPC_URL = process.env.METASHREW_RPC_URL ?? "";

export const ELECTRUM_API_URL = process.env.ELECTRUM_API_URL ?? "";

if (
  !BTC_RPC_URL ||
  !BTC_RPC_USER ||
  !BTC_RPC_PASS ||
  !METASHREW_RPC_URL ||
  !ELECTRUM_API_URL
) {
  throw new Error("Missing RPC env vars – check .env");
}
