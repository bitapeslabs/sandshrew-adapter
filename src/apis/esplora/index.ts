import { ELECTRUM_API_URL } from "@/consts";
import { getEsploraTransactionWithHex, satsToBTC } from "@/crypto/utils";

import {
  type EsploraAddressResponse,
  EsploraFetchError,
  type EsploraUtxo,
  type IEsploraSpendableUtxo,
  type IEsploraTransaction,
} from "./types";

import {
  BoxedError,
  type BoxedResponse,
  BoxedSuccess,
  isBoxedError,
} from "@/boxed";
export async function esplora_getaddress(
  address: string
): Promise<BoxedResponse<EsploraAddressResponse, EsploraFetchError>> {
  try {
    const url = `${ELECTRUM_API_URL}/address/${address}`;
    const res = await fetch(url);

    if (!res.ok) {
      return new BoxedError(
        EsploraFetchError.UnknownError,
        `Failed to fetch address data from ${url}: ${res.statusText}`
      );
    }

    const json = await res.json();
    return new BoxedSuccess(json as EsploraAddressResponse);
  } catch (error) {
    return new BoxedError(
      EsploraFetchError.UnknownError,
      `Failed to fetch address data: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

export async function esplora_getaddressbalance(
  address: string
): Promise<BoxedResponse<number, EsploraFetchError>> {
  try {
    const addressResponse = await esplora_getaddress(address);
    if (isBoxedError(addressResponse)) {
      return addressResponse;
    }
    const { chain_stats } = addressResponse.data;
    const balance = chain_stats.funded_txo_sum - chain_stats.spent_txo_sum;

    return new BoxedSuccess(satsToBTC(balance));
  } catch (error) {
    return new BoxedError(
      EsploraFetchError.UnknownError,
      `Failed to fetch address balance: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

export async function esplora_getutxos(
  address: string
): Promise<BoxedResponse<EsploraUtxo[], EsploraFetchError>> {
  try {
    const url = `${ELECTRUM_API_URL}/address/${address}/utxo`;
    const res = await fetch(url);

    if (!res.ok) {
      return new BoxedError(
        EsploraFetchError.UnknownError,
        `Failed to fetch UTXOs from ${url}: ${res.statusText}`
      );
    }

    const utxos = (await res.json()).filter(
      (utxo: EsploraUtxo) => utxo.status.confirmed
    );

    return new BoxedSuccess(utxos);
  } catch (error) {
    return new BoxedError(
      EsploraFetchError.UnknownError,
      `Failed to fetch UTXOs: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

export async function esplora_getfee(): Promise<
  BoxedResponse<number, EsploraFetchError>
> {
  try {
    const url = `${ELECTRUM_API_URL}/fee-estimates`;

    const res = await fetch(url);
    if (!res.ok) {
      return new BoxedError(
        EsploraFetchError.UnknownError,
        `Failed to fetch fee estimates from ${url}: ${res.statusText}`
      );
    }

    const json = await res.json();

    if (!json["1"]) {
      return new BoxedError(
        EsploraFetchError.UnknownError,
        `Fee tier "1" not available in response`
      );
    }

    return new BoxedSuccess(Number(json["1"]));
  } catch (error) {
    return new BoxedError(
      EsploraFetchError.UnknownError,
      `Failed to fetch fee estimates: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

export async function esplora_broadcastTx(
  rawHex: string,
  electrumProvider?: string
): Promise<BoxedResponse<string, EsploraFetchError>> {
  try {
    const url = `${electrumProvider ?? ELECTRUM_API_URL}/tx`;

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: rawHex,
    });

    if (!res.ok) {
      const msg = await res.text();
      return new BoxedError(
        EsploraFetchError.UnknownError,
        `Failed to broadcast transaction: ${msg}`
      );
    }

    const txid = await res.text(); // response is just the txid as plain text
    return new BoxedSuccess(txid.trim());
  } catch (error) {
    return new BoxedError(
      EsploraFetchError.UnknownError,
      `Failed to broadcast transaction: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

/**
 * Fetch transactions for an address.
 * If `lastSeenTxid` is provided, fetch the *next* page after that tx
 * (Esplora’s “chain” pagination). Otherwise fetch the first page.
 */
export async function esplora_getaddresstxs(
  address: string,
  lastSeenTxid?: string
): Promise<BoxedResponse<IEsploraTransaction[], EsploraFetchError>> {
  try {
    const base = `${ELECTRUM_API_URL}/address/${address}/txs`;
    const url = lastSeenTxid ? `${base}/chain/${lastSeenTxid}` : base;

    const res = await fetch(url);
    if (!res.ok) {
      return new BoxedError(
        EsploraFetchError.UnknownError,
        `Failed to fetch transactions from ${url}: ${res.statusText}`
      );
    }

    const json = await res.json();
    // Esplora returns an array; cast to our typed interface
    return new BoxedSuccess(json as IEsploraTransaction[]);
  } catch (error) {
    return new BoxedError(
      EsploraFetchError.UnknownError,
      `Failed to fetch address transactions: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

export async function esplora_getbulktransactions(
  txids: string[]
): Promise<BoxedResponse<IEsploraTransaction[], EsploraFetchError>> {
  try {
    const url = `${ELECTRUM_API_URL}/txs`;

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ txs: txids }),
    });
    if (!res.ok) {
      return new BoxedError(
        EsploraFetchError.UnknownError,
        `Failed to fetch transactions from ${url}: ${res.statusText}`
      );
    }

    const json = await res.json();
    // Esplora returns an array; cast to our typed interface
    return new BoxedSuccess(json as IEsploraTransaction[]);
  } catch (error) {
    return new BoxedError(
      EsploraFetchError.UnknownError,
      `Failed to fetch bulk transactions: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

export const esplora_getspendableinputs = async (
  inputs: EsploraUtxo[]
): Promise<BoxedResponse<IEsploraSpendableUtxo[], EsploraFetchError>> => {
  try {
    const fullTransactionsResponse = await esplora_getbulktransactions(
      inputs.map((input) => input.txid)
    );

    if (isBoxedError(fullTransactionsResponse)) {
      return fullTransactionsResponse;
    }

    const fullTransactions = fullTransactionsResponse.data.filter(
      (tx) => tx.txid
    );

    const transactionMap = new Map(fullTransactions.map((tx) => [tx.txid, tx]));

    const response: IEsploraSpendableUtxo[] = [];

    for (const input of inputs) {
      const tx = transactionMap.get(input.txid);
      if (!tx) {
        return new BoxedError(
          EsploraFetchError.UnknownError,
          `Input not found in inputs map for txid: ${input.txid}`
        );
      }
      response.push({
        ...input,
        prevTx: getEsploraTransactionWithHex(tx),
      });
    }
    return new BoxedSuccess(response);
  } catch (error) {
    return new BoxedError(
      EsploraFetchError.UnknownError,
      `Failed to get spendable inputs: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
};

export async function esplora_gettransaction(
  txid: string
): Promise<BoxedResponse<IEsploraTransaction, EsploraFetchError>> {
  try {
    const url = `${ELECTRUM_API_URL}/tx/${txid}`;

    const res = await fetch(url);
    if (!res.ok) {
      return new BoxedError(
        EsploraFetchError.UnknownError,
        `Failed to fetch transaction ${txid} from ${url}: ${res.statusText}`
      );
    }

    const json = await res.json();
    return new BoxedSuccess(json as IEsploraTransaction);
  } catch (error) {
    return new BoxedError(
      EsploraFetchError.UnknownError,
      `Failed to fetch transaction ${txid}: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

export async function esplora_getrawtransaction(
  txid: string
): Promise<BoxedResponse<string, EsploraFetchError>> {
  try {
    const url = `${ELECTRUM_API_URL}/tx/${txid}/hex`;
    const res = await fetch(url);
    if (!res.ok) {
      return new BoxedError(
        EsploraFetchError.UnknownError,
        `Failed to fetch raw transaction ${txid} from ${url}: ${res.statusText}`
      );
    }
    const rawHex = await res.text();
    return new BoxedSuccess(rawHex);
  } catch (error) {
    return new BoxedError(
      EsploraFetchError.UnknownError,
      `Failed to fetch raw transaction ${txid}: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

export function esplora_getutxofromparenttx(
  tx: IEsploraTransaction,
  voutIndex: number
): BoxedResponse<EsploraUtxo, EsploraFetchError> {
  return new BoxedSuccess({
    txid: tx.txid,
    vout: voutIndex,
    value: tx.vout[voutIndex].value,
    status: tx.status,
  } as EsploraUtxo);
}

export async function esplora_getutxo(
  utxo: string
): Promise<BoxedResponse<EsploraUtxo, EsploraFetchError>> {
  try {
    if (!utxo || !utxo.includes(":")) {
      return new BoxedError(
        EsploraFetchError.UnknownError,
        `Invalid UTXO format: ${utxo}. Expected format is "txid:vout".`
      );
    }
    const [txid, voutStr] = utxo.split(":");
    const transaction = await esplora_gettransaction(txid);
    if (isBoxedError(transaction)) {
      return transaction;
    }
    const vout = Number(voutStr);

    const esploraUtxo = esplora_getutxofromparenttx(transaction.data, vout);
    if (isBoxedError(esploraUtxo)) {
      return esploraUtxo;
    }

    return new BoxedSuccess(esploraUtxo.data);
  } catch (error) {
    return new BoxedError(
      EsploraFetchError.UnknownError,
      `Failed to get UTXO: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}
