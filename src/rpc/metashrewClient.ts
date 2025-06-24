import fetch from "node-fetch";
import { METASHREW_RPC_URL } from "@/consts";

export const forwardToMetashrew = async (body: unknown) => {
  const res = await fetch(METASHREW_RPC_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  return res.json();
};
