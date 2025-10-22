import {
  FullResult,
  Reporter,
  TestCase,
  TestResult,
} from '@playwright/test/reporter';
import { ConsoleLogger } from '@nestjs/common';
import { DiscordReporter } from './reporters/discordReporter';
import { SlackReporter } from './reporters/slackReporter';
import {
  formatDuration,
  resultToStatus,
  testStatusToEmoji,
} from './utils/helpers';

export type RunInfo = {
  testNames: { [key: string]: string };
  testCount: {
    passed: number;
    failed: number;
    flaky: number;
    skipped: number;
  };
  ciUrl: string;
  duration?: string;
  status?: { color: number; title: string };
};

export type ReporterOptions = {
  enabled: string;
  customTitle?: string;
  customDescription?: string;
  ciRunUrl?: string;
  reportType: 'count' | 'list';

  // Discord
  discordWebhookUrl?: string;
  discordDutyTag?: string;

  // Slack
  slackWebhookUrl?: string;
  slackDutyTag?: string;
};

class ChatReporter implements Reporter {
  logger = new ConsoleLogger(ChatReporter.name);
  public discordReporter: DiscordReporter;
  public slackReporter: SlackReporter;
  private enabled: boolean;
  private runInfo: RunInfo;

  constructor(options: ReporterOptions) {
    this.enabled = (options.enabled ?? '').trim().toLowerCase() === 'true';
    if (!options.discordWebhookUrl && !options.slackWebhookUrl) {
      this.logger.error('No discordWebhookUrl nor slackWebhookUrl provided');
      this.enabled = false;
    }
    if (!this.enabled) return;

    this.runInfo = {
      ciUrl: options.ciRunUrl?.trim() || undefined,
      testNames: {},
      testCount: {
        passed: 0,
        failed: 0,
        flaky: 0,
        skipped: 0,
      },
    };

    this.discordReporter = new DiscordReporter(options, this.runInfo);
    this.slackReporter = new SlackReporter(options, this.runInfo);
  }

  onTestEnd(test: TestCase, result: TestResult) {
    if (!this.enabled) return;

    switch (result.status) {
      case 'passed':
        if (result.retry > 0) this.runInfo.testCount.flaky++;
        else this.runInfo.testCount.passed++;
        break;
      case 'failed':
      case 'timedOut':
      case 'interrupted':
        if (result.retry === test.retries) this.runInfo.testCount.failed++;
        break;
      case 'skipped':
        this.runInfo.testCount.skipped++;
        break;
    }

    const walletVersion =
      test.annotations.length > 0 && test.annotations[0].description
        ? ` \`(v.${test.annotations[0].description})\``
        : '';

    this.runInfo.testNames[test.id] = `- ${testStatusToEmoji[result.status]} ${
      test.title
    } ${walletVersion}`;
  }

  async onEnd(result: FullResult) {
    if (!this.enabled) return;
    this.runInfo.duration = formatDuration(result.duration);
    this.runInfo.status = resultToStatus[result.status];

    const discordPayload = this.discordReporter.getEmbed();
    const slackPayload = this.slackReporter.getEmbed();

    const tasks: Promise<any>[] = [];
    tasks.push(this.discordReporter.send(discordPayload));
    tasks.push(this.slackReporter.send(slackPayload));

    await Promise.allSettled(tasks);
  }
}

export default ChatReporter;
