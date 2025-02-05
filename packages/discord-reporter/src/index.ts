import {
  FullResult,
  Reporter,
  TestCase,
  TestResult,
} from '@playwright/test/reporter';
import axios from 'axios';

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
  embeds: Embed[];
}

const testStatusToEmoji = {
  passed: '✅',
  failed: '❌',
  timedOut: '❌',
  skipped: '⏸️',
  interrupted: '❌',
};

const GREEN = 47872;
const RED = 13959168;

const resultToStatus = {
  passed: { color: GREEN, title: '🎉 Testing Completed!' },
  failed: { color: RED, title: `${testStatusToEmoji.failed} Testing Failed!` },
  timedout: {
    color: RED,
    title: `${testStatusToEmoji.failed} Testing Failed!`,
  },
  interrupted: {
    color: RED,
    title: `${testStatusToEmoji.failed} Testing Failed!`,
  },
};

interface ReporterOptions {
  enabled: string;
}

class DiscordReporter implements Reporter {
  private enabled: boolean;

  private webhookUrl: string;
  private passedTestCount = 0;
  private failedTestCount = 0;
  private skippedTestCount = 0;

  constructor(options: ReporterOptions) {
    this.enabled = options.enabled
      ? options.enabled.toLowerCase() === 'true'
      : true;

    if (!this.enabled) return;

    const webhook = process.env.DISCORD_WEBHOOK_URL;
    if (!webhook) {
      throw new Error(
        'DISCORD_WEBHOOK_URL is not defined in environment variables',
      );
    }
    this.webhookUrl = webhook;
  }

  async sendDiscordWebhook(payload: WebhookPayload) {
    try {
      console.log(JSON.stringify(payload));
      const response = await axios.post(this.webhookUrl, payload, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      console.log('Discord message successfully sended:', response.status);
    } catch (error: any) {
      console.error('Error while discord message sended:', error?.message);
    }
  }

  onTestEnd(test: TestCase, result: TestResult) {
    if (!this.enabled) return;
    switch (result.status) {
      case 'passed':
        this.passedTestCount++;
        break;
      case 'failed':
      case 'timedOut':
      case 'interrupted': {
        this.failedTestCount++;
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
      embeds: [
        {
          title: resultToStatus[result.status].title,
          description: 'Here are the test run results:',
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
            {
              name: `${testStatusToEmoji.skipped} Skipped`,
              value: `${this.skippedTestCount}`,
              inline: true,
            },
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
