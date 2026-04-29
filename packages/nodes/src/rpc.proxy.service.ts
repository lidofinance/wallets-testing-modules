import { ConsoleLogger } from '@nestjs/common';
import {
  APIRequestContext,
  APIResponse,
  BrowserContext,
  Page,
  Request,
} from '@playwright/test';
import { ServiceUnreachableError } from './node.constants';

const logger = new ConsoleLogger('RpcProxyService');

export class RpcProxyService {
  constructor(
    private readonly rpcUrlToMock: string[],
    private readonly resolveRpcUrl: () => string,
  ) {}

  /**
   * Intercepts browser RPC requests and proxies them to the local Anvil node.
   * Allows tests to use a real wallet UI while all blockchain calls go to the fork.
   */
  async mockRoute(contextOrPage: BrowserContext | Page): Promise<void> {
    const rpcUrl = this.resolveRpcUrl();
    logger.debug(
      `[mockRoute] RPC mocker enabled. Proxying to ${rpcUrl} (pattern: /${this.rpcUrlToMock}/)`,
    );

    await contextOrPage.route(
      new RegExp(this.rpcUrlToMock.join('|')),
      async (route) => {
        const postDataRaw = route.request().postData();
        if (!postDataRaw) return route.continue();

        let parsed: unknown;
        try {
          parsed = JSON.parse(postDataRaw);
        } catch (err) {
          logger.error(`[mockRoute] JSON parse error`, err);
          return route.continue();
        }

        const singleResponse = await this.proxyRpcRequest(
          contextOrPage.request,
          rpcUrl,
          parsed,
        );
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(singleResponse),
        });
      },
    );
  }

  /** Forwards a single RPC request to the local node and returns a JSON-RPC response. */
  private async proxyRpcRequest(
    request: APIRequestContext,
    rpcUrl: string,
    payload: any,
  ): Promise<unknown> {
    const res = await this.fetchSafety(request, rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      data: JSON.stringify(payload),
    });

    if (!res) {
      return {
        jsonrpc: '2.0',
        id: payload.id ?? null,
        error: { code: -32000, message: 'Mock route fetch failed' },
      };
    }

    try {
      return JSON.parse(await res.text());
    } catch {
      return {
        jsonrpc: '2.0',
        id: payload.id ?? null,
        error: { code: -32700, message: 'Invalid JSON in response' },
      };
    }
  }

  /** Playwright fetch wrapper with 3 retries. Returns undefined if the browser context is closed. */
  private async fetchSafety(
    request: APIRequestContext,
    urlOrRequest: string | Request,
    options: any,
  ): Promise<APIResponse | undefined> {
    let lastErr: { message: string } | undefined;

    const fetchOptions = {
      ...options,
      timeout: 0,
      headers: {
        'Content-Type': 'application/json',
        Connection: 'Keep-Alive',
        'Keep-Alive': 'timeout=1',
        ...options.headers,
      },
    };

    for (let tryCount = 0; tryCount < 3; tryCount++) {
      try {
        return await request.fetch(urlOrRequest, fetchOptions);
      } catch (err) {
        lastErr = err as { message: string };
      }
    }

    logger.error(`[fetchSafety] Failed after 3 attempts`, lastErr);

    if (
      lastErr &&
      !String(lastErr.message).includes(
        'Target page, context or browser has been closed',
      )
    ) {
      throw new ServiceUnreachableError(lastErr, fetchOptions);
    }

    return undefined;
  }
}
