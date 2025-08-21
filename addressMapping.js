import { blake2AsU8a } from '@polkadot/util-crypto';
import { Keyring } from '@polkadot/api';

// Converts a Substrate address (32 bytes) to an Ethereum-compatible address (20 bytes)
// by truncating the Substrate address to its first 20 bytes.
function substrateToEthereum(substrateAddress) {
  if (substrateAddress.length !== 32) {
    throw new Error('Substrate address must be exactly 32 bytes');
  }

  // Create 20-byte result array
  const result = new Uint8Array(20);

  // Copy first 20 bytes of Substrate address into resulting array
  result.set(substrateAddress.slice(0, 20));

  return result;
}

// Converts an Ethereum address (20 bytes) to a Substrate address (32 bytes)
// by prefixing first 20 bytes with 'evm:' and hashing the result with Blake2 256-bit.
function ethereumToSubstrate(ethereumAddress) {
  if (ethereumAddress.length !== 20) {
    throw new Error('Ethereum address must be exactly 20 bytes');
  }

  // Create 24-byte result array
  const result = new Uint8Array(24);
  // Prepare 'evm:' prefix
  const prefix = new TextEncoder().encode('evm:');

  // Copy prefix followed by first 20 bytes of Ethereum address into resulting array
  result.set(prefix);
  result.set(ethereumAddress.slice(0, 20), 4);

  // Hash resulting array using Blake2 256-bit algorithm
  const blake_hash = blake2AsU8a(result, 256);

  return blake_hash;
}

// Helper function to convert Uint8Array to hex string
function uint8ArrayToHex(uint8Array, prefix = true) {
  const hex = Array.from(uint8Array)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  return prefix ? '0x' + hex : hex;
}

// Helper function to convert hex string to Uint8Array
function hexToUint8Array(hexString) {
  const cleanHex = hexString.replace(/^0x/, '');
  const paddedHex = cleanHex.length % 2 === 0 ? cleanHex : '0' + cleanHex;

  return new Uint8Array(
    paddedHex.match(/.{1,2}/g).map(byte => parseInt(byte, 16))
  );
}

// Usage example below
const keyring = new Keyring();

// Convert Ethereum address to Substrate address
const ethereumAddress = "d43593c715fdd31c61141abd04a99fd6822c8558";
const substratePublicKey = ethereumToSubstrate(hexToUint8Array(ethereumAddress));
const ss58address = keyring.encodeAddress(substratePublicKey, 42);
console.log(`Ethereum address: ${ethereumAddress} -> Substrate address: ${ss58address}`);

// Convert Substrate address to Ethereum address
const substratePublicKey2 = keyring.decodeAddress(ss58address);
const ethereumPublicKey = substrateToEthereum(substratePublicKey2);
console.log(`Substrate address: ${ss58address} -> Ethereum address: ${uint8ArrayToHex(ethereumPublicKey)}`);
