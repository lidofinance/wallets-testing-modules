import { Embed, ReporterOptions, RunInfo } from '../index';
import { FullResult } from '@playwright/test/reporter';
import {
  formatDuration,
  postJson,
  resultToStatus,
  testStatusToEmoji,
} from '../utils/helpers';
import { ConsoleLogger } from '@nestjs/common';

type DiscordPayload = {
  content?: string;
  embeds: Embed[];
};

export class DiscordReporter {
  logger = new ConsoleLogger(DiscordReporter.name);
  dutyMention = `<@${this.options.discordDutyTag}> please take a look at the test results`;

  constructor(private options: ReporterOptions, private runInfo: RunInfo) {}

  async send(payload: DiscordPayload) {
    if (!this.options.discordWebhookUrl) return;

    try {
      await postJson(this.options.discordWebhookUrl, payload);
      this.logger.log('Discord message sent');
    } catch (e: any) {
      this.logger.error(`Discord send error: ${e?.message}`);
    }
  }

  getEmbed(result: FullResult): DiscordPayload {
    const status = resultToStatus[result.status];

    const embed: Embed = {
      title: `${this.options.customTitle || ''} ${status.title}`.trim(),
      description: this.options.customDescription,
      color: status.color,
      fields: [],
      url: this.options.ciRunUrl?.trim() || undefined,
      status: result.status,
    };

    // Main content
    embed.fields.push(...this.getMainContent());

    // Test run duration
    const duration = formatDuration(result.duration);
    embed.fields.push({
      name: '⏳ *Run Time:*',
      value: duration,
      inline: true,
    });

    // Mention
    const mention =
      this.runInfo.testCount.failed > 0 && this.options.discordDutyTag
        ? this.dutyMention
        : undefined;

    return {
      content: mention,
      embeds: [embed],
    };
  }

  private getMainContent() {
    const fields = [];
    if (this.options.reportType == 'count') {
      fields.push(
        {
          name: `${testStatusToEmoji.passed} *Passed:*`,
          value: String(this.runInfo.testCount.passed),
          inline: true,
        },
        {
          name: `${testStatusToEmoji.failed} *Failed:*`,
          value: String(this.runInfo.testCount.failed),
          inline: true,
        },
        { name: '', value: '', inline: true },
        {
          name: `${testStatusToEmoji.skipped} *Skipped:*`,
          value: String(this.runInfo.testCount.skipped),
          inline: true,
        },
        {
          name: `${testStatusToEmoji.flaky} *Flaky:*`,
          value: String(this.runInfo.testCount.flaky),
          inline: true,
        },
        { name: '', value: '', inline: true },
      );
    } else if (this.options.reportType == 'list') {
      fields.push({
        name: '',
        value: this.runInfo.testNames.join('\n'),
        inline: false,
      });
    }

    return fields;
  }
}
