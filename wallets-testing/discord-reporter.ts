import {
  FullResult,
  Reporter,
  TestCase,
  TestResult,
} from '@playwright/test/reporter';
import * as fs from 'fs';
import path from 'path';
import { ConsoleLogger } from '@nestjs/common';

const testStatusToEmoji = {
  passed: '✅',
  failed: '❌',
  timedOut: '❌',
  skipped: '⏸️',
  interrupted: '❌',
};

const successField = {
  name: '**💆‍♂️️ Periodically running wallet tests PASSED**',
  value: `[🔗 Tests summary](${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID})`,
  inline: false,
};

const failedField = {
  name: '🙅‍♂️ Periodically running wallet tests FAILED',
  value: `[🔗 Tests summary](${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID})`,
  inline: false,
};

const GREEN = 47872;
const RED = 13959168;

const resultToStatus = {
  passed: { embed: successField, color: GREEN },
  failed: { embed: failedField, color: RED },
  timedout: { embed: failedField, color: RED },
  interrupted: { embed: failedField, color: RED },
};

export const discordReporterSkipAnnotation = {
  type: 'discordReporterSkip',
  description: 'Skip discord reporter',
};

class DiscordReporter implements Reporter {
  logger = new ConsoleLogger(DiscordReporter.name);
  groups: { [key: string]: { [key: string]: string } } = {};
  options: { outputFile: string };

  constructor(options: { outputFile: string }) {
    this.options = options;
  }

  onTestEnd(test: TestCase, result: TestResult) {
    if (!this.groups[test.parent.title]) this.groups[test.parent.title] = {};
    const walletVersion = this.getTestWalletVersion(test.title);

    this.groups[test.parent.title][test.id] =
      testStatusToEmoji[result.status] + ' ' + test.title + ' ' + walletVersion;
  }

  onEnd(result: FullResult): void | Promise<void> {
    const fields = Object.entries(this.groups).map(([name, tests]) => ({
      name,
      value: Object.values(tests).join('\n'),
      inline: true,
    }));
    const embeds = {
      embeds: [
        {
          color: resultToStatus[result.status].color,
          fields: [
            resultToStatus[result.status].embed,
            ...fields.sort((a, b) => a.value.length - b.value.length).reverse(),
          ],
        },
      ],
    };
    fs.writeFileSync(this.options.outputFile, JSON.stringify(embeds));
  }

  getTestWalletVersion(testName: string) {
    const filePath = path.join(process.cwd(), 'testToExtensionVersion.json');
    if (!fs.existsSync(filePath)) {
      this.logger.error(`extensions version file is not found (${filePath})`);
    }
    const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    for (const el of content) {
      if (testName === el.testName) {
        return `(v.${el.extensionVersion})`;
      }
    }
    return '';
  }
}

export default DiscordReporter;
