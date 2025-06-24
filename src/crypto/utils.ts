import type { IEsploraTransaction } from "@/apis/esplora/types";
import { Transaction as BitcoinJsTransaction } from "bitcoinjs-lib";
import * as bitcoin from "bitcoinjs-lib";
import { ecc } from "./ecc";

bitcoin.initEccLib(ecc);

export const getEsploraTransactionWithHex = (
  tx: IEsploraTransaction
): IEsploraTransaction & { hex: string } => {
  const transaction = new BitcoinJsTransaction();

  transaction.version = tx.version;
  transaction.locktime = tx.locktime;

  tx.vin.forEach((input) => {
    if (input.is_coinbase) {
      // Coinbase transactions dont have txid
      transaction.addInput(
        Buffer.alloc(32),
        0xffffffff,
        input.sequence,
        Buffer.from(input.scriptsig, "hex")
      );
      return;
    }

    const txidBuffer = Buffer.from(input.txid, "hex").reverse();
    const scriptSigBuffer = Buffer.from(input.scriptsig, "hex");

    const vinIndex = transaction.addInput(
      txidBuffer,
      input.vout,
      input.sequence,
      Buffer.from(input.scriptsig, "hex")
    );

    transaction.ins[vinIndex].script = scriptSigBuffer;
  });

  tx.vout.forEach((output) => {
    const scriptPubKeyBuffer = Buffer.from(output.scriptpubkey, "hex");
    transaction.addOutput(scriptPubKeyBuffer, output.value);
  });

  return {
    ...tx,
    hex: transaction.toHex(),
  };
};

export function satsToBTC(sats: number): number {
  if (!Number.isFinite(sats)) throw new Error("Invalid satoshi input");
  return sats / 100_000_000;
}
