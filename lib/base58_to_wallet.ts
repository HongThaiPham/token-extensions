import bs58 from "bs58";
export default function base58ToWallet(privkey: string): Uint8Array {
  const wallet = bs58.decode(privkey);
  return wallet;
}
