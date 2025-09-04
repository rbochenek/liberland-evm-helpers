import "./style.css";
import { MetaMaskSDK } from "@metamask/sdk";
import {
  substrateToEthereum,
  ethereumToSubstrate,
} from "./lib/addressConverter";
import { sendTransfer } from "./lib/transfer";
import {
  callSystemRemark,
  callDemocracyVote,
  callLlmSendLlm,
} from "./lib/precompile";

const sdk = new MetaMaskSDK({
  dappMetadata: {
    name: "Liberland EVM Helpers",
    url: window.location.href,
  },
});

let currentAccount: string | null = null;

// Initialize UI
document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
  <div>
    <h1>Liberland EVM Helpers</h1>
    
    <div class="card">
      <button id="connect">Connect Wallet</button>
      <button id="disconnect" style="display:none">Disconnect</button>
      <div id="account"></div>
    </div>
    
    <div class="tabs">
      <button class="tab active" data-tab="converter">Address Converter</button>
      <button class="tab disabled" data-tab="transfer">Transfer</button>
      <button class="tab disabled" data-tab="precompile">Dispatch Precompile</button>
    </div>
    
    <!-- Address Converter -->
    <div class="tab-content active" id="converter">
      <div class="description">
        <p><strong>Address Converter:</strong> Frontier EVM uses deterministic uni-directional mapping between Substrate and Ethereum addresses.<br> 
        Converting Substrate address to Ethereum address is straightforward - the resulting Ethereum address consists of the first 20 bytes of Substrate public key. The remaining 12 bytes are discarded.<br>
        To convert from Ethereum address to Substrate address prepend public key with 'evm:' prefix. Next, hash the resulting bytes using Blake2-256 algorithm.
        </p>
      </div>
      <div class="section">
        <h3>Substrate → Ethereum</h3>
        <input id="sub-input" placeholder="Substrate address">
        <button id="sub-convert">Convert</button>
        <div id="sub-result"></div>
      </div>
      <div class="section">
        <h3>Ethereum → Substrate</h3>
        <input id="eth-input" placeholder="Ethereum address">
        <button id="eth-convert">Convert</button>
        <div id="eth-result"></div>
      </div>
    </div>
    
    <!-- Transfer -->
    <div class="tab-content" id="transfer">
      <div class="description">
        <p><strong>LLD Transfer:</strong> Showcases a simple token transfer using MetaMask on the EVM side of the chain.</p>
      </div>
      <div class="section">
        <h3>Send LLD</h3>
        <input id="to-address" placeholder="Ethereum address">
        <input id="amount" type="number" placeholder="Amount (LLD)" step="0.001">
        <button id="send">Send Transfer</button>
        <div id="transfer-result"></div>
      </div>
    </div>
    
    <!-- Dispatch Precompile -->
    <div class="tab-content" id="precompile">
      <div class="description">
        <p><strong>Dispatch Precompile:</strong> Shows how to call Substrate extrinsics from EVM side of the chain using Dispatch Precompile.<br>The calls need to be properly SCALE-encoded to be recognized by the runtime.</p>
      </div>
      
      <!-- System.remark -->
      <div class="section">
        <h3>System.remark</h3>
        <p class="section-desc">Add a remark (comment) to the blockchain.</p>
        <textarea id="remark-data" placeholder="Enter remark text" rows="2"></textarea>
        <button id="call-remark">Send System.remark</button>
        <div id="remark-result"></div>
      </div>
      
      <!-- Democracy.vote -->
      <div class="section">
        <h3>Democracy.vote</h3>
        <p class="section-desc">Vote on a democracy referendum.</p>
        <div class="form-row">
          <input id="referendum-index" type="number" placeholder="Referendum Index" min="0">
          <select id="vote-decision">
            <option value="aye">Aye (Yes)</option>
            <option value="nay">Nay (No)</option>
          </select>
        </div>
        <div class="form-row">
          <input id="vote-balance" type="number" placeholder="Amount (LLD)" step="0.001" min="0">
        </div>
        <button id="call-vote">Send Democracy.vote</button>
        <div id="vote-result"></div>
      </div>
      
      <!-- LLM.sendLlm -->
      <div class="section">
        <h3>LLM.sendLlm</h3>
        <p class="section-desc">Send Liberland Merits to another account.</p>
        <div class="form-row">
          <input id="llm-recipient" placeholder="Substrate address">
          <input id="llm-amount" type="number" placeholder="Amount (LLM)" step="0.001" min="0">
        </div>
        <button id="call-sendllm">Send LLM.sendLlm</button>
        <div id="sendllm-result"></div>
      </div>
    </div>
  </div>
`;

// Tab switching
document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", (e) => {
    const target = e.target as HTMLElement;
    if (target.classList.contains("disabled")) return;

    document
      .querySelectorAll(".tab")
      .forEach((t) => t.classList.remove("active"));
    document
      .querySelectorAll(".tab-content")
      .forEach((t) => t.classList.remove("active"));

    target.classList.add("active");
    document.getElementById(target.dataset.tab!)!.classList.add("active");
  });
});

// Update UI based on connection
function updateUI(connected: boolean, account?: string) {
  const connectBtn = document.getElementById("connect")!;
  const disconnectBtn = document.getElementById("disconnect")!;
  const accountDiv = document.getElementById("account")!;

  connectBtn.style.display = connected ? "none" : "block";
  disconnectBtn.style.display = connected ? "block" : "none";
  accountDiv.innerHTML = connected ? `<p>Account: ${account}</p>` : "";

  // Enable/disable tabs
  const transferTab = document.querySelector('[data-tab="transfer"]')!;
  const precompileTab = document.querySelector('[data-tab="precompile"]')!;

  if (connected) {
    transferTab.classList.remove("disabled");
    precompileTab.classList.remove("disabled");
  } else {
    transferTab.classList.add("disabled");
    precompileTab.classList.add("disabled");

    // Switch to converter if on disabled tab
    if (document.querySelector(".tab.active")!.classList.contains("disabled")) {
      document
        .querySelectorAll(".tab")
        .forEach((t) => t.classList.remove("active"));
      document
        .querySelectorAll(".tab-content")
        .forEach((t) => t.classList.remove("active"));
      document.querySelector('[data-tab="converter"]')!.classList.add("active");
      document.getElementById("converter")!.classList.add("active");
    }
  }

  currentAccount = account || null;
}

// Event listeners
document.getElementById("connect")!.addEventListener("click", async () => {
  try {
    const accounts = await sdk.connect();
    updateUI(true, accounts[0]);
  } catch (error) {
    console.error("Connection failed:", error);
  }
});

document.getElementById("disconnect")!.addEventListener("click", async () => {
  await sdk.terminate();
  updateUI(false);
});

// Address converter
document.getElementById("sub-convert")!.addEventListener("click", () => {
  const input = (document.getElementById("sub-input") as HTMLInputElement)
    .value;
  const result = document.getElementById("sub-result")!;

  try {
    const ethAddr = substrateToEthereum(input);
    result.innerHTML = `<p class="success">✅ ${ethAddr}</p>`;
  } catch (error) {
    result.innerHTML = `<p class="error">❌ ${(error as Error).message}</p>`;
  }
});

document.getElementById("eth-convert")!.addEventListener("click", () => {
  const input = (document.getElementById("eth-input") as HTMLInputElement)
    .value;
  const result = document.getElementById("eth-result")!;

  try {
    const subAddr = ethereumToSubstrate(input);
    result.innerHTML = `<p class="success">✅ ${subAddr}</p>`;
  } catch (error) {
    result.innerHTML = `<p class="error">❌ ${(error as Error).message}</p>`;
  }
});

// Transfer
document.getElementById("send")!.addEventListener("click", async () => {
  const to = (document.getElementById("to-address") as HTMLInputElement).value;
  const amount = (document.getElementById("amount") as HTMLInputElement).value;
  const result = document.getElementById("transfer-result")!;

  if (!currentAccount) {
    result.innerHTML = '<p class="error">Connect wallet first</p>';
    return;
  }

  try {
    result.innerHTML = "<p>Sending...</p>";
    const txHash = await sendTransfer(
      sdk,
      currentAccount,
      to,
      parseFloat(amount),
    );
    result.innerHTML = `<p class="success">✅ Sent! TX: ${txHash}</p>`;
  } catch (error) {
    result.innerHTML = `<p class="error">❌ ${(error as Error).message}</p>`;
  }
});

// Dispatch Precompile calls
document.getElementById("call-remark")!.addEventListener("click", async () => {
  const remarkData = (
    document.getElementById("remark-data") as HTMLTextAreaElement
  ).value;
  const result = document.getElementById("remark-result")!;

  if (!currentAccount) {
    result.innerHTML = '<p class="error">Connect wallet first</p>';
    return;
  }

  if (!remarkData.trim()) {
    result.innerHTML = '<p class="error">Remark text is required</p>';
    return;
  }

  try {
    result.innerHTML = "<p>Sending System.remark...</p>";
    const txHash = await callSystemRemark(sdk, currentAccount, remarkData);
    result.innerHTML = `<p class="success">✅ System.remark sent! TX: ${txHash}</p>`;
  } catch (error) {
    result.innerHTML = `<p class="error">❌ ${(error as Error).message}</p>`;
  }
});

document.getElementById("call-vote")!.addEventListener("click", async () => {
  const referendumIndex = (
    document.getElementById("referendum-index") as HTMLInputElement
  ).value;
  const voteDecision = (
    document.getElementById("vote-decision") as HTMLSelectElement
  ).value as "aye" | "nay";
  const voteBalance = (
    document.getElementById("vote-balance") as HTMLInputElement
  ).value;
  const result = document.getElementById("vote-result")!;

  if (!currentAccount) {
    result.innerHTML = '<p class="error">Connect wallet first</p>';
    return;
  }

  if (!referendumIndex) {
    result.innerHTML = '<p class="error">Referendum index is required</p>';
    return;
  }

  if (!voteBalance) {
    result.innerHTML = '<p class="error">Vote balance is required</p>';
    return;
  }

  try {
    result.innerHTML = "<p>Sending Democracy.vote...</p>";
    const txHash = await callDemocracyVote(
      sdk,
      currentAccount,
      parseInt(referendumIndex),
      voteDecision,
      parseFloat(voteBalance),
    );
    result.innerHTML = `<p class="success">✅ Democracy.vote sent! TX: ${txHash}</p>`;
  } catch (error) {
    result.innerHTML = `<p class="error">❌ ${(error as Error).message}</p>`;
  }
});

document.getElementById("call-sendllm")!.addEventListener("click", async () => {
  const recipient = (
    document.getElementById("llm-recipient") as HTMLInputElement
  ).value;
  const amount = (document.getElementById("llm-amount") as HTMLInputElement)
    .value;
  const result = document.getElementById("sendllm-result")!;

  if (!currentAccount) {
    result.innerHTML = '<p class="error">Connect wallet first</p>';
    return;
  }

  if (!recipient || !amount) {
    result.innerHTML = '<p class="error">Recipient and amount are required</p>';
    return;
  }

  try {
    result.innerHTML = "<p>Sending LLM.sendLlm...</p>";
    const txHash = await callLlmSendLlm(
      sdk,
      currentAccount,
      recipient,
      parseFloat(amount),
    );
    result.innerHTML = `<p class="success">✅ LLM.sendLlm sent! TX: ${txHash}</p>`;
  } catch (error) {
    result.innerHTML = `<p class="error">❌ ${(error as Error).message}</p>`;
  }
});

// Initialize
updateUI(false);
