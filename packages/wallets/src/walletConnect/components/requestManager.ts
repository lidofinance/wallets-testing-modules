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
  processed: boolean; // custom field to track if request was handled
};

export class RequestManager {
  public queue: WCSessionRequest[] = [];
  public pendings: WCSessionRequest[] = [];
  public waiters: Array<(req: WCSessionRequest) => void> = [];

  async nextRequest(timeoutMs?: number): Promise<WCSessionRequest> {
    const queued = this.queue.shift();
    if (queued) {
      this.pendings.push(queued);
      return queued;
    }

    return await new Promise<WCSessionRequest>((resolve, reject) => {
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
  }

  isWCSessionRequest(x: any): x is WCSessionRequest {
    return (
      x && typeof x === 'object' && 'topic' in x && 'id' in x && 'params' in x
    );
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

  async validateRequest(
    req: WCSessionRequest,
  ): Promise<WCSessionRequest | undefined> {
    if (!req) {
      return this.nextRequest();
    }

    if (!this.isWCSessionRequest(req)) {
      throw new Error(
        'WC: Page parameter instead WCSessionRequest is not supported in WC wallet',
      );
    }
    if (req.processed) {
      console.log('Request already processed');
      return undefined;
    }
    return req;
  }

  resolveRequest(req: WCSessionRequest) {
    req.processed = true;
    this.pendings = this.pendings.filter((r) => r.id !== req.id);
  }
}
