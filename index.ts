import transferSol from "./examples/transfer-sol";
import { payer, testWallet } from "./lib/config";
import { airdropToWallet } from "./lib/wallet";

(async () => {
  console.table({
    Payer: payer.publicKey.toBase58(),
    "Test Wallet": testWallet.publicKey.toBase58(),
  });

  await airdropToWallet(payer.publicKey, 1000000000);
  await transferSol(payer, testWallet.publicKey, 1000000);
})();
