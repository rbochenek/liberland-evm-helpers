# Liberland EVM Helpers

A set of interactive tools for working with Liberland's EVM (Ethereum Virtual Machine) integration.

## What's Included

### 🔄 Address Converter

Convert addresses between Substrate and Ethereum formats using Liberland's deterministic address mapping:

- **Substrate → Ethereum**: Uses the first 20 bytes of the Substrate public key
- **Ethereum → Substrate**: Prepends 'evm:' prefix and hashes with Blake2-256

### 💰 LLD Transfer

Simple token transfer functionality showcasing how to send LLD (Liberland Dollars) using MetaMask on the EVM side of the chain.

### ⚙️ Dispatch Precompile

Demonstrates calling Substrate extrinsics from the EVM side using the Dispatch Precompile. Includes examples for:

- **System.remark**: Add comments to the blockchain
- **Democracy.vote**: Vote on referendums with specified balance
- **LLM.sendLlm**: Send Liberland Merits between accounts

All precompile calls use proper SCALE encoding to be recognized by the Substrate runtime.

## Setup Instructions

### Prerequisites

- Node.js (v18 or later)
- npm
- MetaMask browser extension

### Installation

1. Clone this repository

```bash
git clone https://github.com/rbochenek/liberland-evm-helpers.git
cd liberland-evm-helpers
```

2. Install dependencies:

```bash
npm install
```

3. Build and start the development server:

```bash
npm run build && npm run dev
```

4. Open your browser and navigate to the development server URL (typically `http://localhost:5173`)

5. **Important**: Add and select the Liberland blockchain network in MetaMask before submitting transactions!

6. Connect your MetaMask wallet to start using the tools

## Usage

1. **Connect Wallet**: Click "Connect Wallet" to connect your MetaMask
2. **Address Converter**: Works without wallet connection - convert addresses between formats
3. **Transfer & Precompile**: Requires wallet connection - interact with the blockchain
