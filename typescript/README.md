# Ostrid SDK

Extends @a2a-js/sdk for Ostrid agent integration.

## Installation
npm install @ostrid/ostrid-sdk

## Usage
```ts
import { OstridClient, OstridAgentExecutor } from '@ostrid/ostrid-sdk';
import { Ed25519Keypair } from '@mysten/sui/dist/cryptography';

// Secure keypair (from env or secure store, NEVER commit)
const keypair = Ed25519Keypair.fromSecretKey(Buffer.from(process.env.PRIVATE_KEY!, 'base64'));

const suiHelper = new OstridSuiHelper({ providerUrl: 'https://fullnode.mainnet.sui.io', keypair });

const client = new OstridClient({
  agentCard: { name: 'MyAgent', ... }, // Extend with ostrid: { ... }
  ostridAdapterUrl: 'https://adapter.ostrid.sui',
  suiHelper,
});

// Raise task
const jobId = await client.raiseTaskJob({ task: 'sim', ... }, 'auction');

// In server/executor context
const executor = new OstridAgentExecutor(suiHelper);
await executor.executeOstridTaskJob({ jobId, intent: {...} }, context);
```