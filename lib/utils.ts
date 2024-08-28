import {
  Cluster,
  Connection,
  Keypair,
  PublicKey,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";

/*
  Compute the Solana explorer address for the various data
*/
export function explorerURL({
  address,
  txSignature,
  cluster,
}: {
  address?: string;
  txSignature?: string;
  cluster?: Cluster;
}) {
  let baseUrl: string;
  //
  if (address) baseUrl = `https://explorer.solana.com/address/${address}`;
  else if (txSignature)
    baseUrl = `https://explorer.solana.com/tx/${txSignature}`;
  else return "[unknown]";

  // auto append the desired search params
  const url = new URL(baseUrl);
  url.searchParams.append("cluster", cluster || "devnet");
  return url.toString() + "\n";
}

/*
  Helper function to extract a transaction signature from a failed transaction's error message
*/
export async function extractSignatureFromFailedTransaction(
  connection: Connection,
  err: any,
  fetchLogs?: boolean
) {
  if (err?.signature) return err.signature;

  // extract the failed transaction's signature
  const failedSig = new RegExp(
    /^((.*)?Error: )?(Transaction|Signature) ([A-Z0-9]{32,}) /gim
  ).exec(err?.message?.toString())?.[4];

  // ensure a signature was found
  if (failedSig) {
    // when desired, attempt to fetch the program logs from the cluster
    if (fetchLogs)
      await connection
        .getTransaction(failedSig, {
          maxSupportedTransactionVersion: 0,
        })
        .then((tx) => {
          console.log(`\n==== Transaction logs for ${failedSig} ====`);
          console.log(explorerURL({ txSignature: failedSig }), "");
          console.log(
            tx?.meta?.logMessages ?? "No log messages provided by RPC"
          );
          console.log(`==== END LOGS ====\n`);
        });
    else {
      console.log("\n========================================");
      console.log(explorerURL({ txSignature: failedSig }));
      console.log("========================================\n");
    }
  }

  // always return the failed signature value
  return failedSig;
}

/*
  Standard number formatter
*/
export function numberFormatter(num: number, forceDecimals = false) {
  // set the significant figures
  const minimumFractionDigits = num < 1 || forceDecimals ? 10 : 2;

  // do the formatting
  return new Intl.NumberFormat(undefined, {
    minimumFractionDigits,
  }).format(num);
}

/*
  Display a separator in the console, with our without a message
*/
export function printConsoleSeparator(message?: string) {
  console.log("\n===============================================");
  console.log("===============================================\n");
  if (message) console.log(message);
}

/**
 * Helper function to build a signed transaction
 */
export async function buildTransaction({
  connection,
  payer,
  signers,
  instructions,
}: {
  connection: Connection;
  payer: PublicKey;
  signers: Keypair[];
  instructions: TransactionInstruction[];
}): Promise<VersionedTransaction> {
  let blockhash = await connection
    .getLatestBlockhash()
    .then((res) => res.blockhash);

  const messageV0 = new TransactionMessage({
    payerKey: payer,
    recentBlockhash: blockhash,
    instructions,
  }).compileToV0Message();

  const tx = new VersionedTransaction(messageV0);

  signers.forEach((s) => tx.sign([s]));

  return tx;
}
