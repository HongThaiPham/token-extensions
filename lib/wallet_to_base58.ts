import bs58 from "bs58";
export default function walletToBase58(wallet: Uint8Array): string {
  return bs58.encode(wallet);
}
