import type { MetaMaskSDK } from "@metamask/sdk";

export async function sendTransfer(
  sdk: MetaMaskSDK,
  from: string,
  to: string,
  amount: number,
): Promise<string> {
  // Convert ETH to Wei
  const value = "0x" + BigInt(Math.floor(amount * 1e18)).toString(16);

  const provider = sdk.getProvider();
  if (!provider) throw new Error("No provider");

  const txHash = (await provider.request({
    method: "eth_sendTransaction",
    params: [
      {
        from,
        to,
        value,
        gas: "0x5208", // 21000
      },
    ],
  })) as string;

  return txHash;
}
