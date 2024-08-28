import {
  createMint,
  getMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import transferSol from "./examples/transfer-sol";
import { connection, payer, testWallet } from "./lib/config";
import { airdropToWallet } from "./lib/wallet";

(async () => {
  console.table({
    Payer: payer.publicKey.toBase58(),
    "Test Wallet": testWallet.publicKey.toBase58(),
  });

  airdropToWallet(payer.publicKey, 1000000000);
  // airdropToWallet(testWallet.publicKey, 1000000000);

  const mint = await createMint(
    connection,
    payer,
    payer.publicKey,
    null,
    9,
    undefined,
    {
      commitment: "finalized",
    },
    TOKEN_2022_PROGRAM_ID
  );

  console.log("Fetching mint info...");

  const mintInfo = await getMint(
    connection,
    mint,
    "finalized",
    TOKEN_2022_PROGRAM_ID
  );

  console.log("Mint Info", mintInfo);

  const tokenAccount = await getOrCreateAssociatedTokenAccount(
    connection,
    payer,
    mint,
    payer.publicKey,
    false,
    "finalized",
    { commitment: "finalized" },
    TOKEN_2022_PROGRAM_ID
  );

  await mintTo(
    connection,
    payer,
    mint,
    tokenAccount.address,
    payer.publicKey,
    1000_000_000_000,
    [],
    { commitment: "finalized" },
    TOKEN_2022_PROGRAM_ID
  );

  const tokenAccounts = await getTokenAccountsByOwner();

  console.table(tokenAccounts);
})();

async function getTokenAccountsByOwner() {
  const { value: tokenAccounts } = await connection.getTokenAccountsByOwner(
    payer.publicKey,
    {
      programId: TOKEN_PROGRAM_ID,
    }
  );

  const { value: tokenExtAccounts } = await connection.getTokenAccountsByOwner(
    payer.publicKey,
    {
      programId: TOKEN_2022_PROGRAM_ID,
    }
  );

  return [...tokenAccounts, ...tokenExtAccounts];
}
