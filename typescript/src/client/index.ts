import {
  Client,
  ClientConfig,
  ClientFactory,
  Transport,
} from "@a2a-js/sdk/client";
import type { AgentCard, Message } from "@a2a-js/sdk";
import {
  OstridIntent,
  OstridMode,
  OstridBid,
  OstridAttestation,
  OstridTaskJob,
} from "../types";
import { OstridSuiHelper } from "../sui";
import axios from "axios";

export interface OstridClientOptions {
  transport: Transport;
  clientConfig?: ClientConfig;
  agentCard: AgentCard; // Extended with ostrid?
  ostridAdapterUrl: string; // e.g., 'https://adapter.ostrid.sui'
  suiHelper: OstridSuiHelper; // For secure Sui interactions
}

const factory = new ClientFactory();
export class OstridClient extends Client {
  private adapter: Client;
  private sui: OstridSuiHelper;

  constructor(options: OstridClientOptions) {
    super(options.transport, options.agentCard, options.clientConfig);
    this.initAdapter(options.ostridAdapterUrl);
    this.sui = options.suiHelper;
  }

  async initAdapter(url: string) {
    this.adapter = await factory.createFromUrl(url);
  }

  // 2. Functions for calling Ostrid adapter (A2A-based)
  async raiseTaskJob(intent: OstridIntent, mode: OstridMode): Promise<string> {
    const message: Message = {
      type: "ostrid-task-initiate",
      content: JSON.stringify({ intent, mode }),
      extensions: ["ostrid-negotiation"],
    };

    // Send via A2A to adapter
    const response = await this.adapter.sendMessage(message);

    let { kind, metadata } = response; // Process response as needed (e.g., extract job ID)
    // Sign escrow txn via Sui
    let txresponse = await this.sui.signAndExecuteEscrow(
      metadata!["task_job_id"],
      intent.escrow_amount,
    );

    return txresponse;
  }

  async submitBid(jobId: string, bid: OstridBid): Promise<void> {
    const message: a2a.Message = {
      type: "ostrid-bid",
      content: JSON.stringify({ jobId, bid }),
      extensions: ["ostrid-negotiation"],
    };
    await this.sendMessage(this.adapterHttp.defaults.baseURL!, message);
  }

  async attestCompletion(
    jobId: string,
    attestation: OstridAttestation,
  ): Promise<void> {
    const message: a2a.Message = {
      type: "ostrid-attestation",
      content: JSON.stringify({ jobId, attestation }),
      extensions: ["ostrid-settlement"],
    };
    await this.sendMessage(this.adapterHttp.defaults.baseURL!, message);

    // If satisfied, release escrow via Sui
    if (attestation.satisfied) {
      await this.sui.signAndExecuteRelease(jobId);
    }
  }
}
