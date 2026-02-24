import { ConsoleLogger } from '@nestjs/common';
import { ReporterOptions, RunInfo } from '../index';
import opsgenie from 'opsgenie-sdk';

export class OpsGenieReporter {
  logger = new ConsoleLogger(OpsGenieReporter.name);
  opsGenieSdk: opsgenie;

  constructor(private options: ReporterOptions, private runInfo: RunInfo) {
    this.opsGenieSdk.configure({
      api_key: this.options.opsGenieApiKey,
      host: this.options.opsGenieApiUrl,
    });
  }

  getEmbed() {
    if (this.runInfo.testCount.failed > 0) {
      return {
        message: `[${this.options.customTitle}] ❗@${this.options.tag} FAILED`,
        description: `Failed ${this.runInfo.testCount.failed} test(s). (action: ${this.runInfo.ciUrl}`,
        tags: [this.options.tag],
        alias: this.runInfo.ciUrl,
        source: 'github-actions',
      };
    }
    return null;
  }

  async send(payload: any) {
    if (!payload) {
      this.logger.error('OpsGenie request payload is empty');
      return;
    }

    this.opsGenieSdk.alertV2.create(payload, (err) => {
      if (err) this.logger.error('Error sending alert to OpsGenie:', err);
    });
  }
}
