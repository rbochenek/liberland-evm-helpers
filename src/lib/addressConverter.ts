import { blake2AsU8a } from "@polkadot/util-crypto";
import { Keyring } from "@polkadot/api";

// Converts a Substrate address (32 bytes) to an Ethereum-compatible address (20 bytes)
// by truncating the Substrate address to its first 20 bytes.
export function substrateToEthereum(substrateAddress: string): string {
  // Convert SS58 address to public key
  const substratePublicKey = ss58addressToPublicKey(substrateAddress);

  // Validate length
  if (substratePublicKey.length !== 32) {
    throw new Error("Substrate address must be exactly 32 bytes");
  }

  // Create 20-byte result array
  const result = new Uint8Array(20);

  // Copy first 20 bytes of Substrate address into resulting array
  result.set(substratePublicKey.slice(0, 20));

  // Convert back to hex string for Ethereum format
  return bytesToHex(result);
}

// Decodes SS58 Substrate address into raw public key
export function ss58addressToPublicKey(ss58address: string): Uint8Array {
  const keyring = new Keyring();
  const publicKey = keyring.decodeAddress(ss58address);

  return publicKey;
}

// Converts an Ethereum address (20 bytes) to a Substrate address (32 bytes)
// by prefixing first 20 bytes with 'evm:' and hashing the result with Blake2 256-bit.
export function ethereumToSubstrate(ethereumAddress: string): string {
  // Convert hex string to bytes and validate length
  const addressBytes = hexToBytes(ethereumAddress);
  if (addressBytes.length !== 20) {
    throw new Error("Ethereum address must be exactly 20 bytes");
  }

  // Create 24-byte result array
  const result = new Uint8Array(24);
  // Prepare 'evm:' prefix
  const prefix = new TextEncoder().encode("evm:");

  // Copy prefix followed by first 20 bytes of Ethereum address into resulting array
  result.set(prefix);
  result.set(addressBytes, 4);

  // Hash resulting array using Blake2 256-bit algorithm
  const blake_hash = blake2AsU8a(result, 256);

  // Convert public key into SS58 address
  const keyring = new Keyring();
  const address = keyring.encodeAddress(blake_hash, 42);

  return address;
}

// Helper function to convert Uint8Array to hex string
export function bytesToHex(bytes: Uint8Array, prefix = true) {
  const hex = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return prefix ? "0x" + hex : hex;
}

// Helper function to convert hex string to Uint8Array
function hexToBytes(hexString: string) {
  const cleanHex = hexString.replace(/^0x/, "");
  const paddedHex = cleanHex.length % 2 === 0 ? cleanHex : "0" + cleanHex;

  return new Uint8Array(
    paddedHex.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16)),
  );
}
