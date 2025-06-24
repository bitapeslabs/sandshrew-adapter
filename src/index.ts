import express from "express";
import { jsonRpcHandler } from "@/handlers/jsonRpcHandler";

const app = express();
app.use(express.json({ limit: "800mb" }));
app.use(express.urlencoded({ limit: "800mb" }));

app.post("/", jsonRpcHandler);

const PORT = process.env.PORT ?? 8080;
app.listen(PORT, () => console.log(`JSON-RPC proxy listening on :${PORT}`));
