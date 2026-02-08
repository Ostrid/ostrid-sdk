import type * as a2a_base from "@a2a-js/sdk";
import type * as a2a_server from "@a2a-js/sdk/server";
import { OstridAgentCard, OstridMessage, TaskJob } from "./a2a.bindings";

declare module "@a2a-js/sdk" {
  type AgentCard = a2a_base.AgentCard & OstridAgentCard;
  type Message = a2a_base.Message & OstridMessage;
  type Task = a2a_base.Task & TaskJob;
}


declare module "@a2a-js/sdk/server" {

  interface AgentExecutor {
    private_key?: string;
    executeOstridTask?(
      task: Task,
      context: a2a_server.RequestContext,
    ): AsyncIterable<OstridExecutionEvent>;

    signAndSendOstridTransaction?(
      txPayload: any, 
      context: a2a_server.RequestContext,
    ): Promise<{ txDigest: string; effects?: any }>;
  }

  interface DefaultRequestHandler {
    handleOstridNegotiationExtension?(
      message: Message,
      context: a2a_server.RequestContext,
    ): Promise<void | Message>;
  }
}

interface OstridExecutionEvent {
  type: "progress" | "result" | "attestation-request" | "error";
  data?: any;
  jobId?: string;
}
