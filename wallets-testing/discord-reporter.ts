import {
  FullResult,
  Reporter,
  TestCase,
  TestResult,
} from '@playwright/test/reporter';
import * as fs from 'fs';

const testStatusToEmoji = {
  passed: '✅',
  failed: '❌',
  timedOut: '⏰',
  skipped: '⏭️',
  interrupted: '🚫',
};

const successField = {
  name: '**💆‍♂️️ Periodically running wallet tests pass**',
  value: `[🔗 Tests summary](${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID})`,
  inline: false,
};

const failedField = {
  name: '🙅‍♂️ Periodically running wallet tests failed',
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
  groups: { [key: string]: string[] } = {};
  options: { outputFile: string };

  constructor(options: { outputFile: string }) {
    this.options = options;
  }

  onTestEnd(test: TestCase, result: TestResult) {
    if (!this.groups[test.parent.title]) this.groups[test.parent.title] = [];

    this.groups[test.parent.title].push(
      testStatusToEmoji[result.status] + ' ' + test.title,
    );
  }

  onEnd(result: FullResult): void | Promise<void> {
    const fields = Object.entries(this.groups).map(([name, tests]) => ({
      name,
      value: tests.join('\n'),
      inline: true,
    }));
    let embeds = {
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
}

export default DiscordReporter;
