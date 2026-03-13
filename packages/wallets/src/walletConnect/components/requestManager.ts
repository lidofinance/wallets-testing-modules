import { ConsoleLogger } from '@nestjs/common';
import { test } from '@playwright/test';

export type WCSessionRequest = {
  topic: string;
  id: number;
  params: {
    chainId: string;
    request: {
      method: string;
      params: any[] | any;
    };
  };
};

const logger = new ConsoleLogger('WCWallet.RequestManager');

export class RequestManager {
  public queue: WCSessionRequest[] = [];
  public pendings: WCSessionRequest[] = [];
  public waiters: Array<(req: WCSessionRequest) => void> = [];

  async nextRequest(): Promise<WCSessionRequest> {
    return test.step('Wait for next WC transaction request', async () => {
      const timeoutMs = 30000;
      if (this.pendings.length > 0) {
        logger.warn(
          'Some requests are still pending and have not been processed yet',
        );
      }

      const queued = this.queue.shift();
      if (queued) {
        this.pendings.push(queued);
        return queued;
      }

      return new Promise<WCSessionRequest>((resolve, reject) => {
        const t = setTimeout(() => {
          const idx = this.waiters.indexOf(resolve);
          if (idx >= 0) this.waiters.splice(idx, 1);
          reject(new Error(`WC: session_request timeout after ${timeoutMs}ms`));
        }, timeoutMs);

        this.waiters.push((req) => {
          clearTimeout(t);
          this.pendings.push(req);
          resolve(req);
        });
      });
    });
  }

  async getCurrentRequest(): Promise<WCSessionRequest> {
    return this.pendings[0] || this.nextRequest();
  }

  getTx(req: WCSessionRequest, index = 0): any {
    return req.params?.request?.params?.[index];
  }

  getRequestInfo(req) {
    const tx = this.getTx(req);
    return {
      method: req.params.request.method,
      params: tx,
    };
  }

  resolveRequest(req: WCSessionRequest) {
    this.pendings = this.pendings.filter((r) => r.id !== req.id);
  }

  clear() {
    this.queue = [];
    this.pendings = [];
    this.waiters = [];
  }
}
