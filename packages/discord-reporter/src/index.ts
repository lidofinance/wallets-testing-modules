import {
  FullResult,
  Reporter,
  TestCase,
  TestResult,
} from '@playwright/test/reporter';
import axios from 'axios';
import { ConsoleLogger } from '@nestjs/common';

interface EmbedField {
  name: string;
  value: string;
  inline?: boolean;
}

interface Embed {
  title: string;
  description: string;
  color: number;
  fields: EmbedField[];
  url?: string;
}

interface WebhookPayload {
  content?: string;
  embeds: Embed[];
}

const testStatusToEmoji = {
  passed: '✅',
  failed: '❌',
  timedOut: '❌',
  skipped: '⏸️',
  interrupted: '❌',
  flaky: '🎲',
};

const GREEN = 47872;
const RED = 13959168;

const resultToStatus = {
  passed: { content: undefined, color: GREEN, title: '🎉 Testing Completed!' },
  failed: {
    content:
      process.env.DISCORD_DUTY_TAG &&
      `<@${process.env.DISCORD_DUTY_TAG}> please take a look at the test results`,
    color: RED,
    title: `${testStatusToEmoji.failed} Testing Failed!`,
  },
  timedout: {
    content: undefined,
    color: RED,
    title: `${testStatusToEmoji.failed} Testing Failed!`,
  },
  interrupted: {
    content: undefined,
    color: RED,
    title: `${testStatusToEmoji.failed} Testing Failed!`,
  },
};

interface ReporterOptions {
  enabled: string;
}

class DiscordReporter implements Reporter {
  logger = new ConsoleLogger(DiscordReporter.name);
  private enabled: boolean;

  private webhookUrl: string;
  private passedTestCount = 0;
  private failedTestCount = 0;
  private flakyTestCount = 0;
  private skippedTestCount = 0;

  constructor(options: ReporterOptions) {
    this.enabled = options.enabled
      ? options.enabled.toLowerCase() === 'true'
      : true;

    if (!this.enabled) return;

    const webhook = process.env.DISCORD_WEBHOOK_URL;
    if (!webhook) {
      this.logger.error(
        'DISCORD_WEBHOOK_URL is not defined in environment variables',
      );
      this.enabled = false;
      return;
    }
    this.webhookUrl = webhook;
  }

  async sendDiscordWebhook(payload: WebhookPayload) {
    try {
      const response = await axios.post(this.webhookUrl, payload, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      this.logger.log('Discord message successfully sended:', response.status);
    } catch (error: any) {
      this.logger.error('Error while discord message sended:', error?.message);
    }
  }

  onTestEnd(test: TestCase, result: TestResult) {
    if (!this.enabled) return;
    switch (result.status) {
      case 'passed':
        if (result.retry > 0) {
          this.flakyTestCount = (this.flakyTestCount ?? 0) + 1;
        } else {
          this.passedTestCount++;
        }
        break;
      case 'failed':
      case 'timedOut':
      case 'interrupted': {
        if (result.retry === test.retries) {
          this.failedTestCount++;
        }
        break;
      }
      case 'skipped':
        this.skippedTestCount++;
        break;
    }
  }

  async onEnd(result: FullResult) {
    if (!this.enabled) return;
    const duration = this.formatDuration(result.duration);
    const githubRunUrl = `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`;

    const payload: WebhookPayload = {
      content: resultToStatus[result.status].content,
      embeds: [
        {
          title: resultToStatus[result.status].title,
          description: process.env.GH_JOB_NAME
            ? `Test job name: ${process.env.GH_JOB_NAME}`
            : 'Here are the test run results:',
          color: resultToStatus[result.status].color,
          fields: [
            {
              name: `${testStatusToEmoji.passed} Passed`,
              value: `${this.passedTestCount}`,
              inline: true,
            },
            {
              name: `${testStatusToEmoji.failed} Failed`,
              value: `${this.failedTestCount}`,
              inline: true,
            },
            { name: '', value: '', inline: true }, // just empty column
            {
              name: `${testStatusToEmoji.skipped} Skipped`,
              value: `${this.skippedTestCount}`,
              inline: true,
            },
            {
              name: `${testStatusToEmoji.flaky} Flaky`,
              value: `${this.flakyTestCount}`,
              inline: true,
            },
            { name: '', value: '', inline: true }, // just empty column
            {
              name: '⏳ Run Time',
              value: `${duration}`,
              inline: false,
            },
            {
              name: '🔗 GitHub Run',
              value: process.env.CI
                ? `[View GitHub Run](${githubRunUrl})`
                : 'Local run',
              inline: true,
            },
          ],
          url: process.env.CI ? githubRunUrl : undefined,
        },
      ],
    };

    await this.sendDiscordWebhook(payload);
  }

  private formatDuration(durationMs: number): string {
    const totalSeconds = Math.floor(durationMs / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return `${hours} hours ${minutes} minutes ${seconds} seconds`;
  }
}

export default DiscordReporter;
