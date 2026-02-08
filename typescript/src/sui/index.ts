import {
  JsonRpcProvider,
  RawSigner,
  Transaction,
  getExecutionStatusType,
} from "@mysten/sui";
import { Ed25519Keypair } from "@mysten/sui";

export interface OstridSuiOptions {
  providerUrl: string;
  keypair: Ed25519Keypair;
}

export class OstridSuiHelper {
  private provider: JsonRpcProvider;
  private signer: RawSigner;

  constructor(options: OstridSuiOptions) {
    this.provider = new JsonRpcProvider(options.providerUrl);
    this.signer = new RawSigner(options.keypair, this.provider);
  }

  // 3. Secure Sui functions (sign/execute txns, hold tokens/address)
  getAddress(): Promise<string> {
    return this.signer.getAddress();
  }

  async getBalance(token: string = "USDC"): Promise<bigint> {
    const balance = await this.provider.getBalance({
      owner: await this.getAddress(),
      coinType: token,
    });
    return balance.totalBalance;
  }

  async signAndExecuteEscrow(jobId: string, amount: number): Promise<string> {
    const tx = new Transaction();

    const result = await this.signer.signAndExecuteTransaction({
      transaction: tx,
    });
    const status = getExecutionStatusType(result);
    if (status !== "success") throw new Error("Escrow failed");

    return result.digest;
  }

  async signAndExecuteRelease(jobId: string): Promise<string> {
    const tx = new Transaction();

    const result = await this.signer.signAndExecuteTransaction({
      transaction: tx,
    });
    return result.digest;
  }

}
