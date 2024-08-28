import {
  Keypair,
  PublicKey,
  sendAndConfirmTransaction,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import { connection } from "../lib/config";
import { buildTransaction, explorerURL } from "../lib/utils";

export default async function transferSol(
  from: Keypair,
  to: PublicKey,
  lamports?: number
) {
  try {
    const sourceBalance = await connection.getBalance(from.publicKey);
    console.log("Source balance:", sourceBalance);

    // If no lamports are provided, transfer the entire balance
    if (!lamports) lamports = sourceBalance;

    // Create a test transaction to calculate fees
    const dryrunTransaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: from.publicKey,
        toPubkey: to,
        lamports,
      })
    );
    dryrunTransaction.recentBlockhash = (
      await connection.getLatestBlockhash("confirmed")
    ).blockhash;
    dryrunTransaction.feePayer = from.publicKey;

    // Calculate exact fee rate to transfer the lamports amount
    const fee =
      (
        await connection.getFeeForMessage(
          dryrunTransaction.compileMessage(),
          "confirmed"
        )
      ).value || 0;

    if (sourceBalance < lamports + fee) {
      lamports = sourceBalance - fee;
    }

    // Create the actual transaction

    const transaction = await buildTransaction({
      connection,
      payer: from.publicKey,
      signers: [from],
      instructions: [
        SystemProgram.transfer({
          fromPubkey: from.publicKey,
          toPubkey: to,
          lamports,
        }),
      ],
    });
    const signature = await connection.sendTransaction(transaction);

    console.log(
      `Transaction sent. Explorer: ${explorerURL({ txSignature: signature })}`
    );
  } catch (error) {}
}
