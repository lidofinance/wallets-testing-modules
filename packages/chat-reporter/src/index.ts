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
  getResultMessageStatus,
  testStatusToEmoji,
} from './utils/helpers';
import { OpsGenieReporter } from './reporters/opsgenieReporter';

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

export enum ReportType {
  count = 'count',
  short = 'short',
  list = 'list',
}

export type ReporterOptions = {
  customTitle?: string;
  customDescription?: string;
  ciRunUrl?: string;
  reportType?: ReportType;
  failuresOnly?: boolean;
  tag?: string;

  // Discord
  discordEnabled?: boolean;
  discordWebhookUrl?: string;
  discordDutyTag?: string;

  // Slack
  slackEnabled?: boolean;
  slackWebhookUrl?: string;
  slackDutyTag?: string;

  // OpsGenie
  opsGenieEnabled?: boolean;
  opsGenieApiKey?: string;
  opsGenieApiUrl?: string;
};

class ChatReporter implements Reporter {
  logger = new ConsoleLogger(ChatReporter.name);
  public discordReporter: DiscordReporter;
  public slackReporter: SlackReporter;
  public opsGenieReporter: OpsGenieReporter;
  private runInfo: RunInfo;

  constructor(private options: ReporterOptions) {
    if (this.options.discordEnabled && !this.options.discordWebhookUrl) {
      this.logger.error('No discordWebhookUrl provided');
      this.options.discordEnabled = false;
    }

    if (this.options.slackEnabled && !this.options.slackWebhookUrl) {
      this.logger.error('No slackWebhookUrl provided');
      this.options.slackEnabled = false;
    }

    if (
      this.options.opsGenieEnabled &&
      (!this.options.opsGenieApiUrl || !this.options.opsGenieApiKey)
    ) {
      this.logger.error('No opsGenieApiUrl or opsGenieApiKey provided');
      this.options.opsGenieEnabled = false;
    }

    this.runInfo = {
      ciUrl: this.options.ciRunUrl?.trim() || '',
      testNames: {},
      testCount: {
        passed: 0,
        failed: 0,
        flaky: 0,
        skipped: 0,
      },
    };

    this.options.reportType = this.options.reportType || ReportType.count;

    this.discordReporter = new DiscordReporter(this.options, this.runInfo);
    this.slackReporter = new SlackReporter(this.options, this.runInfo);
    this.opsGenieReporter = new OpsGenieReporter(this.options, this.runInfo);
  }

  onTestEnd(test: TestCase, result: TestResult) {
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

    this.runInfo.testNames[test.id] = this.getTestName(test, result);
  }

  async onEnd(result: FullResult) {
    if (this.options.failuresOnly) {
      this.options.discordEnabled =
        this.runInfo.testCount.failed > 0 && this.options.discordEnabled;
      this.options.slackEnabled =
        this.runInfo.testCount.failed > 0 && this.options.slackEnabled;
      return;
    }

    this.runInfo.duration = formatDuration(result.duration);
    this.runInfo.status = getResultMessageStatus(result.status, this.runInfo);

    await this.sendEnabledReports();
  }

  private async sendEnabledReports() {
    const tasks: Promise<any>[] = [];

    if (this.options.discordEnabled) {
      const discordPayload = this.discordReporter.getEmbed();
      tasks.push(this.discordReporter.send(discordPayload));
    }

    if (this.options.slackEnabled) {
      const slackPayload = this.slackReporter.getEmbed();
      tasks.push(this.slackReporter.send(slackPayload));
    }

    if (this.options.opsGenieEnabled) {
      const opsGeniePayload = this.opsGenieReporter.getEmbed();
      tasks.push(this.opsGenieReporter.send(opsGeniePayload));
    }

    await Promise.allSettled(tasks);
  }

  private getTestName(test: TestCase, result: TestResult) {
    const walletVersion =
      test.annotations.length > 0 && test.annotations[0].description
        ? ` \`(v.${test.annotations[0].description})\``
        : '';

    const emojiStatus =
      testStatusToEmoji[
        result.retry > 0 && result.status == 'passed' ? 'flaky' : result.status
      ];

    return `- ${emojiStatus} ${test.title} ${walletVersion}`;
  }
}

export default ChatReporter;
