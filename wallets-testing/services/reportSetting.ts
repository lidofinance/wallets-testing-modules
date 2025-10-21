import { ReporterDescription } from '@playwright/test';

export interface ReporterOptions {
  app: {
    name: string;
    emojiPrefix?: string;
  };
}

export class ReportersSettings {
  private readonly reporters: {
    htmlReporter: ReporterDescription;
    consoleReporter: ReporterDescription;
    githubReporter: ReporterDescription;
    chatReporter: ReporterDescription;
  };

  constructor(private options: ReporterOptions) {
    this.reporters = {
      htmlReporter: ['html', { open: 'never' }],
      consoleReporter: ['list', { printSteps: !process.env.CI }],
      githubReporter: ['github'],
      chatReporter: [
        '@lidofinance/chat-reporter',
        {
          enabled: process.env.REPORT_ENABLED,
          customTitle: `${this.options.app.emojiPrefix} ${this.options.app.name}`,
          customDescription: ``,
          ciRunUrl: `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`,
          reportType: 'list',

          // ───── Discord settings ─────
          discordWebhookUrl: process.env.DISCORD_WEBHOOK_URL,
          discordDutyTag: process.env.DISCORD_DUTY_TAG,

          // ───── Slack settings ─────
          slackWebhookUrl: process.env.SLACK_WEBHOOK_URL,
          slackDutyTag: process.env.SLACK_DUTY_TAG,
        },
      ],
    };
  }

  getReporters(): ReporterDescription[] {
    const reporterConfig: ReporterDescription[] = [
      this.reporters.htmlReporter,
      this.reporters.consoleReporter,
    ];

    if (process.env.CI) {
      reporterConfig.push(
        this.reporters.githubReporter,
        this.reporters.chatReporter,
      );
    }

    return reporterConfig;
  }
}
