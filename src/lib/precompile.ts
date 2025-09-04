import type { MetaMaskSDK } from "@metamask/sdk";
import * as $ from "scale-codec";
import { bytesToHex, ss58addressToPublicKey } from "./addressConverter";

// Dispatch Precompile address
const DISPATCH_PRECOMPILE_ADDRESS =
  "0x0000000000000000000000000000000000000006";

// Call System.remark extrinsic via Dispatch Precompile
export async function callSystemRemark(
  sdk: MetaMaskSDK,
  from: string,
  remark: string,
): Promise<string> {
  const encodedData = encodeSystemRemark(remark);

  return sendDispatchCall(sdk, from, encodedData);
}

// Call Democracy.vote extrinsic via Dispatch Precompile
export async function callDemocracyVote(
  sdk: MetaMaskSDK,
  from: string,
  referendumIndex: number,
  vote: "aye" | "nay",
  amount: number,
): Promise<string> {
  const vote_bool = vote == "aye" ? true : false;
  const encodedData = encodeDemocracyVote(referendumIndex, vote_bool, amount);

  return sendDispatchCall(sdk, from, encodedData);
}

// Call LLM.sendLlm extrinsic via Dispatch Precompile
export async function callLlmSendLlm(
  sdk: MetaMaskSDK,
  from: string,
  to: string,
  amount: number,
): Promise<string> {
  const encodedData = encodeLlmSendLlm(to, amount);

  return sendDispatchCall(sdk, from, encodedData);
}

// Send dispatch call to precompile
async function sendDispatchCall(
  sdk: MetaMaskSDK,
  from: string,
  data: string,
): Promise<string> {
  const provider = sdk.getProvider();
  if (!provider) throw new Error("MetaMask provider not available");

  const txHash = (await provider.request({
    method: "eth_sendTransaction",
    params: [
      {
        from,
        to: DISPATCH_PRECOMPILE_ADDRESS,
        data,
        gas: "0xF4240", // 1000000
      },
    ],
  })) as string;

  return txHash;
}

// SCALE encoding functions
function encodeSystemRemark(remark: string): string {
  const $scaleCall = $.object(
    $.field("pallet_index", $.u8),
    $.field("call_index", $.u8),
    $.field("remark", $.array($.u8)),
  );

  const encoder = new TextEncoder();
  const dataBytes = encoder.encode(remark);

  const valueToEncode = {
    pallet_index: 0, // frame-system
    call_index: 0, // `remark` extrinsic
    remark: Array.from(dataBytes), // remark itself
  };

  const encoded = $scaleCall.encode(valueToEncode);

  return bytesToHex(encoded);
}

function encodeDemocracyVote(referendumIndex: number, aye: boolean, amount: number): string {
  const $scaleCall = $.object(
    $.field("pallet_index", $.u8),
    $.field("call_index", $.u8),
    $.field("account_vote", $.tuple($.compact($.u8), $.compact($.u8))),
    $.field("vote", $.u8),
    $.field("amount", $.u128),
  );

  // pallet-democracy Vote type has a custom encoding
  const conviction = 1;
  const vote = aye ? (conviction | 0x80) : (conviction & 0x7F);

  const valueToEncode = {
    pallet_index: 10, // pallet-democracy
    call_index: 2, // `vote` extrinsic
    account_vote: [referendumIndex, 0] as any, // referendum index, standard vote (as opposed to split vote)
    vote, // aye boolean, conviction
    amount: BigInt(amount), // amount in LLD
  };

  const encoded = $scaleCall.encode(valueToEncode);

  console.log(`encoded = ${bytesToHex(encoded)}`);

  return bytesToHex(encoded);
}

function encodeLlmSendLlm(to: string, amount: number): string {
  const $scaleCall = $.object(
    $.field("pallet_index", $.u8),
    $.field("call_index", $.u8),
    $.field("to_account", $.sizedArray($.u8, 32)),
    $.field("amount", $.u128),
  );

  const publicKeyBytes = Array.from(ss58addressToPublicKey(to));

  const valueToEncode = {
    pallet_index: 46, // pallet-llm
    call_index: 5, // `send_llm` extrinsic
    to_account: publicKeyBytes as any, // recipient
    amount: BigInt(amount), // amount
  };

  const encoded = $scaleCall.encode(valueToEncode);

  return bytesToHex(encoded);
}
