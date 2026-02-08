import { AgentExecutor, DefaultRequestHandler, RequestContext } from '@a2a-js/sdk/server';
import { OstridIntent, OstridMode, OstridBid, OstridAttestation, OstridTaskJob } from '../types';
import { OstridSuiHelper } from '../sui';
import { Message } from '@a2a-js/sdk';

export class OstridAgentExecutor implements AgentExecutor {
  private sui: OstridSuiHelper;

  constructor(suiHelper: OstridSuiHelper) {
    this.sui = suiHelper;
  }


  // 2. Ostrid executor functions (calling adapter via A2A)
  async executeOstridTaskJob(taskJob: OstridTaskJob, context: RequestContext): Promise<OstridTaskJob> {

    const adapterUrl = 'https://adapter.ostrid.sui'; // Configurable
    const message: Message = {
      type: 'ostrid-task-execute',
      content: JSON.stringify(taskJob),
      extensions: ['ostrid-negotiation'],
    };
    const response = await context.client.sendMessage(adapterUrl, message); // Assuming context has A2A client

    // Update taskJob status
    taskJob.status = response.status || 'matched';

    return taskJob;
  }

  async negotiateOstridTerms(intent: OstridIntent, mode: OstridMode, context: RequestContext): Promise<OstridBid> {
    // Similar: Send to adapter for solver/auction
    const message: Message = {
      type: 'ostrid-negotiate',
      content: JSON.stringify({ intent, mode }),
      extensions: ['ostrid-negotiation'],
    };
    const response = await context.client.sendMessage('https://adapter.ostrid.sui', message);

    return { terms: response.terms };
  }

  async attestOstridCompletion(jobId: string, attestation: OstridAttestation, context: RequestContext): Promise<void> {
    const message: Message = {
      type: 'ostrid-attest',
      content: JSON.stringify({ jobId, attestation }),
      extensions: ['ostrid-settlement'],
    };
    await context.client.sendMessage('https://adapter.ostrid.sui', message);

    // Sui release if satisfied
    if (attestation.satisfied) {
      await this.sui.signAndExecuteRelease(jobId);
    }
  }
}

export class OstridDefaultRequestHandler extends DefaultRequestHandler {
  async handleOstridMessage(message: a2a.Message, context: RequestContext): Promise<a2a.Message | void> {
    if (message.extensions?.includes('ostrid-negotiation')) {
      // Ostrid-specific pre-handling, e.g., validate intent
      const payload = JSON.parse(message.content);
      if (payload.intent) {
        // Add Ostrid logic, e.g., check reputation
      }
      // Then pass to default handling or custom
    }
  }
}