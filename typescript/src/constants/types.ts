import { AgentCard } from '@a2a-js/sdk';
import { Ed25519Keypair, JsonRpcProvider, RawSigner } from '@mysten/sui';
import { OstridAgentCard } from './a2a.bindings';

export enum OstridMode {
  SOLVER = 'solver',
  AUCTION = 'auction',
}

export interface OstridIntent {
  task: string;
  utility_weights: Record<string, number>;
  constraints: Record<string, any>;
  validation_mode?: 'client_attestation' | 'oracle' | 'zk_proof';
  escrow_amount: number; // in USDC (smallest unit or decimal string)
}

export interface OstridCapabilities {
  skills: string[];
  capabilities: Record<string, any>;
  reputation?: number;
}

export interface OstridBid {
  price: number;
  quality: number;
  time: number;
  // Add any Ostrid-specific bid fields
}

export interface OstridAttestation {
  satisfied: boolean;
  evidence: Record<string, any>;
}

export interface OstridOptions {
  ostridApiUrl: string;                  // e.g. 'https://api.ostrid.sui'
  suiProvider: JsonRpcProvider;          // Sui RPC provider (mainnet/testnet)
  suiSigner: RawSigner;                  // For signing AP2 mandates & Sui txns
  agentCard: OstridAgentCard;             
  ownA2AUrl?: string;                  
  logLevel?: 'debug' | 'info' | 'error';
}