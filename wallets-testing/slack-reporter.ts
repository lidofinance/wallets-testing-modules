import {
  FullResult,
  Reporter,
  TestCase,
  TestResult,
} from '@playwright/test/reporter';
import DiscordReporter, { Embed } from '@lidofinance/discord-reporter';

const testStatusToEmoji = {
  passed: '✅',
  failed: '❌',
  timedOut: '❌',
  skipped: '⏸️',
  interrupted: '❌',
};

const GREEN = 47872;
const RED = 13959168;

class SlackReporter implements Reporter {
  groups: string[] = [];

  onTestEnd(test: TestCase, result: TestResult) {
    let walletVersion = '';
    if (test.annotations.length > 0) {
      walletVersion = `(_v.${test.annotations[0].description}_)`;
    }

    this.groups.push(
      testStatusToEmoji[result.status] + ' ' + test.title + ' ' + walletVersion,
    );
  }

  async onEnd(result: FullResult) {
    const embed: Embed = {
      title: `📘 [ETH Widget] Wallet tests ${
        result.status == 'passed' ? '🧘 Completed!' : '❌ Failed!'
      }`,
      description: '',
      color: result.status == 'passed' ? GREEN : RED,
      fields: [
        this.groups.join('\n'),
        `⏳ *Run Time:* ${this.formatDuration(result.duration)}`,
      ],
      url: `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`,
      status: result.status,
    };

    await this.getSlackReporter().sendSlack(embed);
  }

  private formatDuration(ms: number): string {
    const s = Math.floor(ms / 1000);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${h} hours ${m} minutes ${sec} seconds`;
  }

  private getSlackReporter() {
    return new DiscordReporter({
      enabled: process.env.REPORT_ENABLED,
      slackWebhookUrl: process.env.SLACK_WEBHOOK_URL,
      slackDutyTag: process.env.SLACK_DUTY_TAG,
      listView: true,
    });
  }
}

export default SlackReporter;
