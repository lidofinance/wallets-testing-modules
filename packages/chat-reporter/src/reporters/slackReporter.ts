import { ReporterOptions, ReportType, RunInfo } from '../index';
import { postJson, testStatusToEmoji } from '../utils/helpers';
import { ConsoleLogger } from '@nestjs/common';

type AttachmentBlock = { color: string; blocks: any[] }; // See the blocks structure in the Slack documentation
type SlackPayload = { attachments: AttachmentBlock[] };

export class SlackReporter {
  logger = new ConsoleLogger(SlackReporter.name);
  private mention = this.options.slackDutyTag?.startsWith('S')
    ? `<!subteam^${this.options.slackDutyTag}>`
    : `<@${this.options.slackDutyTag}>`;
  private dutyMention = `${this.mention} please take a look at the test results`;

  constructor(private options: ReporterOptions, private runInfo: RunInfo) {}

  // Send message to chat. Need to put the correct payload data
  async send(payload: SlackPayload) {
    if (!this.options.slackWebhookUrl) return;

    try {
      await postJson(this.options.slackWebhookUrl, payload);
      this.logger.log('Slack message sent');
    } catch (e: any) {
      this.logger.error(`Slack send error: ${e?.message}`);
    }
  }

  // Build payload from the test run data located in the this.runInfo
  getEmbed(): SlackPayload {
    const attachment: AttachmentBlock = {
      color: this.toSlackHex(this.runInfo.status.color),
      blocks: [],
    };

    // Mention block
    if (this.runInfo.testCount.failed > 0 && this.options.slackDutyTag) {
      attachment.blocks.push(this.getTextBlock(this.dutyMention));
    }

    // Title block
    const title = `${this.options.customTitle || ''} ${
      this.runInfo.status.title
    }`.trim();
    if (title) attachment.blocks.push(this.getHeaderBlock(title));

    // Description block
    if (
      this.options.customDescription &&
      this.options.reportType !== ReportType.short
    )
      attachment.blocks.push(
        this.getTextBlock(this.options.customDescription),
        { type: 'divider' },
      );

    // Main content block
    const fields = this.getMainContent();
    if (fields.length) attachment.blocks.push(...this.getContentBlocks(fields));

    // Test run duration block
    attachment.blocks.push(
      { type: 'divider' },
      this.getTextBlock(`⏳ *Run Time:* ${this.runInfo.duration}`),
    );

    // Action button with GutHub link
    if (this.runInfo.ciUrl)
      attachment.blocks.push(this.getActionBtnBlock(this.runInfo.ciUrl));

    return {
      attachments: [attachment],
    };
  }

  private toSlackHex(n: number) {
    return '#' + (n >>> 0).toString(16).padStart(6, '0');
  }

  private getMainContent() {
    if (this.options.reportType == ReportType.list) {
      return [
        Object.entries(this.runInfo.testNames)
          .map(([, name]) => name)
          .join('\n'),
      ];
    }

    if (this.options.reportType == ReportType.count) {
      return [
        `${testStatusToEmoji.passed} *Passed:* ${this.runInfo.testCount.passed}`,
        `${testStatusToEmoji.failed} *Failed:* ${this.runInfo.testCount.failed}`,
        `${testStatusToEmoji.skipped} *Skipped:* ${this.runInfo.testCount.skipped}`,
        `${testStatusToEmoji.flaky} *Flaky:* ${this.runInfo.testCount.flaky}`,
      ];
    }

    if (this.options.reportType == ReportType.short) {
      const result: string[] = [];
      if (this.runInfo.testCount.passed > 0)
        result.push(
          `${testStatusToEmoji.passed} *Passed:* ${this.runInfo.testCount.passed}`,
        );
      if (this.runInfo.testCount.failed > 0)
        result.push(
          `${testStatusToEmoji.failed} *Failed:* ${this.runInfo.testCount.failed}`,
        );
      if (this.runInfo.testCount.skipped > 0)
        result.push(
          `${testStatusToEmoji.skipped} *Skipped:* ${this.runInfo.testCount.skipped}`,
        );
      if (this.runInfo.testCount.flaky > 0)
        result.push(
          `${testStatusToEmoji.flaky} *Flaky:* ${this.runInfo.testCount.flaky}`,
        );
      return result;
    }

    return [];
  }

  private getHeaderBlock(title: string) {
    const resultTitle =
      this.options.reportType === ReportType.short && this.options.tag
        ? `@${this.options.tag} ${title}`
        : title;
    return {
      type: 'header',
      text: {
        type: 'plain_text',
        text: resultTitle,
      },
    };
  }

  private getTextBlock(text: string) {
    return {
      type: 'section',
      text: { type: 'mrkdwn', text: text },
    };
  }

  private getContentBlocks(fields: string[]) {
    const blocks = [];
    if (this.options.reportType == ReportType.list) {
      fields.map((t) =>
        blocks.push({
          type: 'section',
          text: { type: 'mrkdwn', text: t },
        }),
      );
    } else if (
      this.options.reportType == ReportType.count ||
      this.options.reportType == ReportType.short
    ) {
      blocks.push({
        type: 'section',
        fields: fields.map((t) => ({ type: 'mrkdwn', text: t })),
      });
    }

    return blocks;
  }

  private getActionBtnBlock(url: string) {
    return {
      type: 'actions',
      elements: [
        {
          type: 'button',
          text: {
            type: 'plain_text',
            text: 'View GitHub Run',
            emoji: true,
          },
          style: this.runInfo.testCount.failed > 0 ? 'danger' : 'primary',
          url: url,
        },
      ],
    };
  }
}
