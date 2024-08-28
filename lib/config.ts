import dotenv from "dotenv";
import { Connection, clusterApiUrl } from "@solana/web3.js";
import { loadKeypairFromFile, loadOrGenerateKeypair } from "./wallet";

// load the env variables from file
dotenv.config();

console.log(process.env?.LOCAL_PAYER_JSON_ABSPATH);

/**
 * Load the `payer` keypair from the local file system, or load/generate a new
 * one and storing it within the local directory
 */
export const payer = process.env?.LOCAL_PAYER_JSON_ABSPATH
  ? loadKeypairFromFile(process.env?.LOCAL_PAYER_JSON_ABSPATH)
  : loadOrGenerateKeypair("default.wallet");

// generate a new Keypair for testing, named `wallet`
export const testWallet = loadOrGenerateKeypair("test.wallet");

// load the env variables and store the cluster RPC url
export const CLUSTER_URL = process.env.RPC_URL ?? clusterApiUrl("devnet");

// create a new rpc connection
export const connection = new Connection(CLUSTER_URL, {
  commitment: "confirmed",
});

console.log(`✅ Connected! Cluster: ${CLUSTER_URL}`);
