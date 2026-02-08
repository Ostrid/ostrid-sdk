import { AgentCard } from "@a2a-js/sdk";
import { ClientFactory } from "@a2a-js/sdk/client";
import axios, { AxiosInstance } from "axios";
import { OstridOptions, OstridIntent, OstridMode, OstridCapabilities, OstridBid, OstridAttestation } from "./constants/types";

export class OstridClient extends EventEmitter {
  private options: OstridOptions;
  private clientFactory: ClientFactory;
  private http: AxiosInstance;
  private logger: (level: string, msg: string, ...args: any[]) => void;

  constructor(options: OstridOptions) {
    super();
    this.options = {
      logLevel: 'info',
      ...options,
    };

    this.http = axios.create({
      baseURL: this.options.ostridApiUrl,
      timeout: 15000,
    });

    // Extend the base AgentCard with Ostrid-specific extensions
    const extendedCard: AgentCard = {
      ...this.options.agentCard,
      extensions: [
        ...(this.options.agentCard.extensions || []),
        'ostrid-negotiation', // Ostrid-specific A2A extension
      ],
      // You can add Ostrid-specific metadata here if the spec allows
    };

    // Initialize A2A client Factory
    this.clientFactory = new ClientFactory();

    this.logger = (level, msg, ...args) => {
      if (this.shouldLog(level)) {
        console[level === 'error' ? 'error' : 'log'](`[OstridSDK:${level.toUpperCase()}] ${msg}`, ...args);
      }
    };

    // Forward relevant A2A events with Ostrid context
    // this.clientFactory.on('message', (msg: SendMessageParams) => {
    //   if (msg.extensions?.includes('ostrid-negotiation')) {
    //     this.emit('ostrid-notification', msg);
    //     this.logger('debug', 'Received Ostrid negotiation message', msg);
    //   }
    //   // You can also emit generic 'a2a-message' if needed
    //   this.emit('a2a-message', msg);
    // });

    // Optional: attach A2A server routes to provided Express app
    if (this.options.expressApp) {
      this.attachA2AServer(this.options.expressApp);
    }
  }

  private shouldLog(level: string): boolean {
    const levels = { debug: 0, info: 1, error: 2 };
    return levels[this.options.logLevel!] <= levels[level];
  }

  private attachA2AServer(app: Express) {
    app.use(bodyParser.json({ limit: '10mb' }));

    const a2aServer = new A2AServer({
      agentCard: this.options.agentCard,
      // other server config
    });

    // Mount A2A routes (adjust path as needed)
    app.use('/a2a', (req: Request, res: Response, next) => {
      a2aServer.handle(req, res, next);
    });

    this.logger('info', 'A2A server routes attached at /a2a');
  }

  // Sign data for AP2 mandate (simplified placeholder — adapt to real AP2 format)
  private async signAp2Mandate(payload: any): Promise<string> {
    const messageBytes = new TextEncoder().encode(JSON.stringify(payload));
    const signature = await this.options.suiSigner.signData(messageBytes);
    return Buffer.from(signature.signature).toString('base64');
  }

  // Principal agent: Raise a task-job via Ostrid platform
  async raiseTaskJob(intent: OstridIntent, mode: OstridMode = OstridMode.SOLVER): Promise<string> {
    const mandatePayload = { intent, mode, timestamp: new Date().toISOString() };
    const ap2Mandate = await this.signAp2Mandate(mandatePayload);

    const response = await this.http.post('/broadcast-task-job', {
      intent: { ...intent, ap2_mandate: ap2Mandate },
      mode: mode,
      headers: {
        'A2A-Version': '1.1', // or whatever version your Ostrid uses
        'A2A-Extensions': 'ostrid-negotiation',
      },
    });

    const jobId = response.data.jobId;
    this.logger('info', `Task-job raised successfully`, { jobId, mode });

    // Optionally broadcast summary via pure A2A if desired
    // await this.a2aClient.broadcast({ type: 'task-summary', jobId, task: intent.task });

    return jobId;
  }

  // Remote agent: Register capabilities/profile (via Ostrid registry + A2A Card update)
  async registerProfile(capabilities: OstridCapabilities): Promise<void> {
    const signed = await this.signAp2Mandate(capabilities);
    await this.http.post('/register-profile', {
      capabilities: { ...capabilities, signed_profile: signed },
    });

    // Optionally update your A2A card capabilities if the SDK allows dynamic updates
    this.logger('info', 'Profile registered with Ostrid');
  }

  // Remote: Submit bid in auction mode
  async submitBid(jobId: string, bid: OstridBid): Promise<void> {
    const signedBid = await this.signAp2Mandate(bid);
    await this.http.post(`/submit-bid/${jobId}`, {
      bid: { ...bid, signed_bid: signedBid },
    });
    this.logger('info', `Bid submitted for job ${jobId}`);
  }

  // Principal: Submit attestation after receiving output
  async attestCompletion(jobId: string, attestation: OstridAttestation): Promise<void> {
    const signed = await this.signAp2Mandate(attestation);
    await this.http.post(`/submit-attestation/${jobId}`, {
      attestation: { ...attestation, signed_attestation: signed },
    });
    this.logger('info', `Attestation submitted for job ${jobId}`);
  }

  // Delegate common A2A operations
  async sendA2AMessage(toAgentUrl: string, payload: any, extensions: string[] = []): Promise<any> {
    return this.a2aClient.sendMessage(toAgentUrl, {
      parts: [{ content: JSON.stringify(payload) }],
      extensions: [...extensions, 'ostrid-negotiation'],
    });
  }

  // Get current agent card (for debugging)
  getAgentCard(): AgentCard {
    return this.options.agentCard;
  }
}