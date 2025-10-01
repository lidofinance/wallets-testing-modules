import {
  FullResult,
  Reporter,
  TestCase,
  TestResult,
} from '@playwright/test/reporter';
import axios from 'axios';
import { ConsoleLogger } from '@nestjs/common';

const GREEN = 47872;
const RED = 13959168;

type EmbedField = {
  name: string;
  value: string;
  inline?: boolean;
};

type Embed = {
  title: string;
  description: string;
  color: number;
  fields: EmbedField[];
  url?: string;
};

type WebhookPayload = {
  content?: string;
  embeds: Embed[];
};

type ReporterOptions = {
  enabled: string;
  customTitle?: string;
  customDescription?: string;
  ciRunUrl?: string;

  // Discord
  discordWebhookUrl?: string;
  discordDutyTag?: string;

  // Slack
  slackWebhookUrl?: string;
  slackDutyTag?: string;
};

type Status = {
  color: number;
  title: string;
};

type ResultToStatus = {
  passed: Status;
  failed: Status;
  timedout: Status;
  interrupted: Status;
};

const testStatusToEmoji = {
  passed: '✅',
  failed: '❌',
  timedOut: '❌',
  skipped: '⏸️',
  interrupted: '❌',
  flaky: '🎲',
};

class DiscordReporter implements Reporter {
  logger = new ConsoleLogger(DiscordReporter.name);
  private enabled: boolean;
  private options: ReporterOptions;
  private resultToStatus: ResultToStatus;

  private passedTestCount = 0;
  private failedTestCount = 0;
  private flakyTestCount = 0;
  private skippedTestCount = 0;

  constructor(options: ReporterOptions) {
    this.options = options;
    this.enabled = (options.enabled ?? '').trim().toLowerCase() === 'true';
    if (!this.enabled) return;

    if (!this.options.discordWebhookUrl && !this.options.slackWebhookUrl) {
      this.logger.error(
        'Neither discordWebhookUrl nor slackWebhookUrl provided',
      );
      this.enabled = false;
      return;
    }

    this.resultToStatus = {
      passed: { color: GREEN, title: '🧘 Testing Completed!' },
      failed: {
        color: RED,
        title: `${testStatusToEmoji.failed} Testing Failed!`,
      },
      timedout: {
        color: RED,
        title: `${testStatusToEmoji.failed} Testing Failed!`,
      },
      interrupted: {
        color: RED,
        title: `${testStatusToEmoji.failed} Testing Failed!`,
      },
    };
  }

  onTestEnd(test: TestCase, result: TestResult) {
    if (!this.enabled) return;
    switch (result.status) {
      case 'passed':
        if (result.retry > 0) this.flakyTestCount++;
        else this.passedTestCount++;
        break;
      case 'failed':
      case 'timedOut':
      case 'interrupted':
        if (result.retry === test.retries) this.failedTestCount++;
        break;
      case 'skipped':
        this.skippedTestCount++;
        break;
    }
  }

  async onEnd(result: FullResult) {
    if (!this.enabled) return;

    const duration = this.formatDuration(result.duration);
    const status = this.resultToStatus[result.status as keyof ResultToStatus];
    const ciUrl = this.options.ciRunUrl?.trim();
    const viewLinkLine = ciUrl ? `• View [GitHub Run](${ciUrl})` : '';

    const discordEmbed: Embed = {
      title: `${this.options.customTitle || ''} ${status.title} `.trim(),
      description: `${
        this.options.customDescription || 'Here are the test run results:'
      }${viewLinkLine ? `\n${viewLinkLine}` : ''}`,
      color: status.color,
      fields: [
        {
          name: `${testStatusToEmoji.passed} Passed`,
          value: String(this.passedTestCount),
          inline: true,
        },
        {
          name: `${testStatusToEmoji.failed} Failed`,
          value: String(this.failedTestCount),
          inline: true,
        },
        { name: '', value: '', inline: true },
        {
          name: `${testStatusToEmoji.skipped} Skipped`,
          value: String(this.skippedTestCount),
          inline: true,
        },
        {
          name: `${testStatusToEmoji.flaky} Flaky`,
          value: String(this.flakyTestCount),
          inline: true,
        },
        { name: '', value: '', inline: true },
        { name: '⏳ Run Time', value: duration, inline: false },
      ],
      url: ciUrl || undefined,
    };

    const slackEmbed: Embed = {
      ...discordEmbed,
      description: this.options.customDescription,
    };

    const tasks: Promise<any>[] = [];
    if (this.options.discordWebhookUrl)
      tasks.push(this.sendDiscord(discordEmbed));
    if (this.options.slackWebhookUrl) tasks.push(this.sendSlack(slackEmbed));
    await Promise.allSettled(tasks);
  }

  async sendDiscord(embed: Embed) {
    if (!this.options.discordWebhookUrl) return;
    const mention =
      this.failedTestCount > 0 && this.options.discordDutyTag
        ? `<@${this.options.discordDutyTag}> please take a look at the test results`
        : undefined;

    const payload: WebhookPayload = {
      content: mention,
      embeds: [embed],
    };
    try {
      await this.postJson(this.options.discordWebhookUrl, payload);
      this.logger.log('Discord message sent');
    } catch (e: any) {
      this.logger.error(`Discord send error: ${e?.message}`);
    }
  }

  async sendSlack(embed: Embed) {
    if (!this.options.slackWebhookUrl) return;

    const payload = this.buildSlackPayload(embed);
    try {
      await this.postJson(this.options.slackWebhookUrl, payload);
      this.logger.log('Slack message sent');
    } catch (e: any) {
      this.logger.error(`Slack send error: ${e?.message}`);
    }
  }

  private buildSlackPayload(embed: Embed) {
    const slackMention =
      this.failedTestCount > 0 && this.options.slackDutyTag
        ? `<!subteam^${this.options.slackDutyTag}> please take a look at the test results`
        : undefined;

    const colorHex = this.toSlackHex(embed.color);
    const title = (embed.title || '').trim();

    const fields = (embed.fields || [])
      .filter((f) => f.name?.trim() || f.value?.trim())
      .map((f) => `*${f.name}:* ${f.value}`);

    const blocks: any[] = [];

    if (slackMention) {
      blocks.push({
        type: 'section',
        text: { type: 'mrkdwn', text: slackMention },
      });
    }

    if (title) {
      blocks.push({
        type: 'header',
        text: { type: 'plain_text', text: title },
      });
    }

    if (embed.description) {
      blocks.push({
        type: 'section',
        text: { type: 'mrkdwn', text: embed.description },
      });
    }

    if (fields.length) {
      blocks.push({
        type: 'section',
        fields: fields.map((t) => ({ type: 'mrkdwn', text: t })),
      });
    }

    if (embed.url) {
      blocks.push({
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: { type: 'plain_text', text: 'View GitHub Run', emoji: true },
            style: this.failedTestCount > 0 ? 'danger' : 'primary',
            url: embed.url,
          },
        ],
      });
    }

    return { attachments: [{ color: colorHex, blocks }] };
  }

  private formatDuration(ms: number): string {
    const s = Math.floor(ms / 1000);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${h} hours ${m} minutes ${sec} seconds`;
  }

  private async postJson(url: string, payload: any) {
    return axios.post(url, payload, {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  private toSlackHex(n: number) {
    return '#' + (n >>> 0).toString(16).padStart(6, '0');
  }
}

export default DiscordReporter;
