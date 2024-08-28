import { Keypair, PublicKey } from "@solana/web3.js";
import fs from "fs";
import path from "path";
import { connection } from "./config";
/*
  Load a locally stored JSON keypair file and convert it to a valid Keypair
*/
export function loadKeypairFromFile(absPath: string) {
  try {
    if (!absPath) throw Error("No path provided");
    if (!fs.existsSync(absPath)) throw Error("File does not exist.");

    // load the keypair from the file
    const keyfileBytes = JSON.parse(
      fs.readFileSync(absPath, { encoding: "utf-8" })
    );
    // parse the loaded secretKey into a valid keypair
    const keypair = Keypair.fromSecretKey(new Uint8Array(keyfileBytes));
    return keypair;
  } catch (err) {
    // return false;
    throw err;
  }
}

/*
  Save a locally stored JSON keypair file for later importing
*/
export function saveKeypairToFile(
  keypair: Keypair,
  fileName: string,
  dirName: string = (process.env.DEFAULT_KEY_DIR_NAME as string) || "./wallets"
) {
  fileName = path.join(dirName, `${fileName}.wallet.json`);

  // create the `dirName` directory, if it does not exists
  if (!fs.existsSync(`./${dirName}/`)) fs.mkdirSync(`./${dirName}/`);

  // remove the current file, if it already exists
  if (fs.existsSync(fileName)) fs.unlinkSync(fileName);

  // write the `secretKey` value as a string
  fs.writeFileSync(fileName, `[${keypair.secretKey.toString()}]`, {
    encoding: "utf-8",
  });

  return fileName;
}

/**
 * Load locally stored PublicKey addresses
 */
export function loadPublicKeysFromFile(
  absPath: string = `${
    (process.env.DEFAULT_KEY_DIR_NAME as string) || "./wallets"
  }/default.wallet.json`
) {
  try {
    if (!absPath) throw Error("No path provided");
    if (!fs.existsSync(absPath)) throw Error("File does not exist.");

    // load the public keys from the file
    const data =
      JSON.parse(fs.readFileSync(absPath, { encoding: "utf-8" })) || {};

    // convert all loaded keyed values into valid public keys
    for (const [key, value] of Object.entries(data)) {
      data[key] = new PublicKey(value as string) ?? "";
    }

    return data;
  } catch (err) {
    console.warn("Unable to load local file");
  }
  // always return an object
  return {};
}

/*
  Attempt to load a keypair from the filesystem, or generate and save a new one
*/
export function loadOrGenerateKeypair(
  fileName: string,
  dirName: string = (process.env.DEFAULT_KEY_DIR_NAME as string) || "./wallets"
) {
  try {
    // compute the path to locate the file
    const searchPath = path.join(dirName, `${fileName}.json`);
    let keypair = Keypair.generate();

    // attempt to load the keypair from the file
    if (fs.existsSync(searchPath)) keypair = loadKeypairFromFile(searchPath);
    // when unable to locate the keypair, save the new one
    else saveKeypairToFile(keypair, fileName, dirName);

    return keypair;
  } catch (err) {
    console.error("loadOrGenerateKeypair:", err);
    throw err;
  }
}

export async function airdropToWallet(
  address: string | PublicKey,
  lamports: number,
  force: boolean = false
) {
  const wallet = new PublicKey(address as string);
  const balance = await connection.getBalance(wallet);
  console.log("Balance:", balance);

  if (!force && balance > 0) {
    console.log(
      `Wallet ${wallet.toBase58()} already has a balance of ${balance} lamports`
    );
    return;
  }

  try {
    const signature = await connection.requestAirdrop(wallet, lamports);
    await connection.confirmTransaction({
      signature,
      ...(await connection.getLatestBlockhash()),
    });

    console.log(
      `Success! Check out your TX here:\nhttps://explorer.solana.com/tx/${signature}?cluster=devnet`
    );
  } catch (e) {
    console.error(`Oops, something went wrong: ${e}`);
  }
}
