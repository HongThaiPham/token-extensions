import {
  AccountLayout,
  createAssociatedTokenAccountInstruction,
  createBurnCheckedInstruction,
  createCloseAccountInstruction,
  createInitializeMintCloseAuthorityInstruction,
  createInitializeMintInstruction,
  createMint,
  createMintToCheckedInstruction,
  ExtensionType,
  getAssociatedTokenAddressSync,
  getMint,
  getMintLen,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import transferSol from "./examples/transfer-sol";
import { connection, payer, testWallet } from "./lib/config";
import { airdropToWallet } from "./lib/wallet";
import {
  Keypair,
  PublicKey,
  sendAndConfirmTransaction,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import { buildTransaction } from "./lib/utils";
type TokenTypeForDisplay = "Token Program" | "Token Extensions Program";
interface TokenInfoForDisplay {
  mint: PublicKey;
  amount: number;
  decimals: number;
  displayAmount: number;
  type: TokenTypeForDisplay;
}
(async () => {
  console.table({
    Payer: payer.publicKey.toBase58(),
    "Test Wallet": testWallet.publicKey.toBase58(),
  });

  airdropToWallet(payer.publicKey, 1000000000);
  // airdropToWallet(testWallet.publicKey, 1000000000);
  const mint = Keypair.generate();
  const extensions = [ExtensionType.MintCloseAuthority];
  const mintLength = getMintLen(extensions);

  const mintLamports = await connection.getMinimumBalanceForRentExemption(
    mintLength
  );

  const tokenAccount = getAssociatedTokenAddressSync(
    mint.publicKey,
    payer.publicKey,
    false,
    TOKEN_2022_PROGRAM_ID
  );

  const createAccountInstruction = SystemProgram.createAccount({
    fromPubkey: payer.publicKey,
    newAccountPubkey: mint.publicKey,
    space: mintLength,
    lamports: mintLamports,
    programId: TOKEN_2022_PROGRAM_ID,
  });

  const initializeMintCloseAuthorityInstruction =
    createInitializeMintCloseAuthorityInstruction(
      mint.publicKey,
      payer.publicKey,
      TOKEN_2022_PROGRAM_ID
    );

  const initializeMintInstruction = createInitializeMintInstruction(
    mint.publicKey,
    9,
    payer.publicKey,
    null,
    TOKEN_2022_PROGRAM_ID
  );

  const initializeTokenAccountInstruction =
    createAssociatedTokenAccountInstruction(
      payer.publicKey,
      tokenAccount,
      payer.publicKey,
      mint.publicKey,
      TOKEN_2022_PROGRAM_ID
    );

  const mintToInstruction = createMintToCheckedInstruction(
    mint.publicKey,
    tokenAccount,
    payer.publicKey,
    1000_000_000_000,
    9,
    [],
    TOKEN_2022_PROGRAM_ID
  );

  const mintTransaction = await buildTransaction({
    connection,
    payer: payer.publicKey,
    signers: [payer, mint],
    instructions: [
      createAccountInstruction,
      initializeMintCloseAuthorityInstruction,
      initializeMintInstruction,
      initializeTokenAccountInstruction,
      mintToInstruction,
    ],
  });

  const signature = await connection.sendTransaction(mintTransaction);

  console.log("Signature", signature);

  await new Promise((resolve) => setTimeout(resolve, 5000));

  const closeTransaction = await buildTransaction({
    connection,
    payer: payer.publicKey,
    signers: [payer],
    instructions: [
      createBurnCheckedInstruction(
        tokenAccount,
        mint.publicKey,
        payer.publicKey,
        1000_000_000_000,
        9,
        [],
        TOKEN_2022_PROGRAM_ID
      ),
      createCloseAccountInstruction(
        mint.publicKey,
        payer.publicKey,
        payer.publicKey,
        [],
        TOKEN_2022_PROGRAM_ID
      ),
    ],
  });

  await connection.sendTransaction(closeTransaction);
})();

async function getTokenAccountsByOwner() {
  // const { value: tokenAccounts } = await connection.getTokenAccountsByOwner(
  //   payer.publicKey,
  //   {
  //     programId: TOKEN_PROGRAM_ID,
  //   }
  // );

  const { value: tokenExtAccounts } = await connection.getTokenAccountsByOwner(
    payer.publicKey,
    {
      programId: TOKEN_2022_PROGRAM_ID,
    }
  );

  const ownedTokens: TokenInfoForDisplay[] = [];

  for (const tokenAccount of tokenExtAccounts) {
    const accountData = AccountLayout.decode(tokenAccount.account.data);

    const mintInfo = await getMint(
      connection,
      accountData.mint,
      "finalized",
      TOKEN_2022_PROGRAM_ID
    );

    ownedTokens.push({
      mint: accountData.mint,
      amount: Number(accountData.amount),
      decimals: mintInfo.decimals,
      displayAmount: Number(accountData.amount) / 10 ** mintInfo.decimals,
      type: "Token Extensions Program",
    });
  }

  console.table(ownedTokens);

  return [...tokenExtAccounts];
}
