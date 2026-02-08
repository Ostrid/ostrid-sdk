import { AgentCard, Message, Task } from "@a2a-js/sdk";

export interface IDecodedToken {
  user_id: string;
  roles: string[];
  iat: number;
  exp: number;
}

export enum OstridAdapterActions {
  RAISE_TASK_JOB = "raise-task-job",
  DISCOVERY = "discovery",
  ATTEST = "attest",
  NEGOTIATION = "negotiation",
}

export type OstridAgentCard = {
  ostrid: {
    version: string;
    protocolOverview?: string;
    baseApiUrl?: string;
    endpoints?: {
      name: string;
      url: string;
      description?: string;
      method?: string;
      x402?: {
        fee: string;
        currency: string;
      };
    }[];
    negotiationModes?: {
      mode?: string;
      description?: string;
      supportedDimensions?: any;
      decayMechanism?: any;
      latencyEstimate?: string;
      useCases?: string;
    }[];
    settlement?: {
      token?: string;
      chain?: string;
      micropayments?: string;
      mandates?: string;
      escrowMechanism?: string;
    };
    validation?: {
      default: string;
      options?: any;
      disputeFallback?: string;
    };
    documentation?: string;
  };
};

export type TaskJob = {
  ostrid: {
    id: string;
    budget: string; // USDC amount in bigint string format
    quality?: number; // 0 to 1
  };
};

export type OstridMessage = {
  ostrid?: {
    version?: string;
    action: OstridAdapterActions;
    taskJob?: TaskJob;
    negotiationMode?: string;
    settlementDetails?: {
      token?: string;
      escrowAddress?: string;
    };
    validationDetails?: {
      method?: string;
      attestation?: string;
    };
  };
};
