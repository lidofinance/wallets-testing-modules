import { ReporterOptions, RunInfo } from '../index';
import { postJson, resultToStatus, testStatusToEmoji } from '../utils/helpers';
import { ConsoleLogger } from '@nestjs/common';

type AttachmentBlock = { color: string; blocks: any[] }; // See the blocks structure in the Slack documentation
type SlackPayload = { attachments: AttachmentBlock[] };

export class SlackReporter {
  logger = new ConsoleLogger(SlackReporter.name);
  dutyMention = `<!subteam^${this.options.slackDutyTag}> please take a look at the test results`;

  constructor(private options: ReporterOptions, private runInfo: RunInfo) {}

  async send() {
    if (!this.options.slackWebhookUrl) return;

    try {
      const payload = this.getEmbed();
      await postJson(this.options.slackWebhookUrl, payload);
      this.logger.log('Slack message sent');
    } catch (e: any) {
      this.logger.error(`Slack send error: ${e?.message}`);
    }
  }

  getEmbed(): SlackPayload {
    const ciUrl = this.options.ciRunUrl?.trim() || undefined;
    const status = resultToStatus[this.runInfo.status];

    const attachment: AttachmentBlock = {
      color: this.toSlackHex(status.color),
      blocks: [],
    };

    // Mention block
    if (this.runInfo.testCount.failed > 0 && this.options.slackDutyTag) {
      attachment.blocks.push(this.getTextBlock(this.dutyMention));
    }

    // Title block
    const title = `${this.options.customTitle || ''} ${status.title}`.trim();
    if (title) attachment.blocks.push(this.getHeaderBlock(title));

    // Description block
    if (this.options.customDescription)
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
    if (ciUrl) attachment.blocks.push(this.getActionBtnBlock(ciUrl));

    return {
      attachments: [attachment],
    };
  }

  private toSlackHex(n: number) {
    return '#' + (n >>> 0).toString(16).padStart(6, '0');
  }

  private getMainContent() {
    if (
      this.options.reportType == 'list' &&
      this.runInfo.testNames.length > 0
    ) {
      return [this.runInfo.testNames.join('\n')];
    }

    if (this.options.reportType == 'count') {
      return [
        `${testStatusToEmoji.passed} *Passed:* ${this.runInfo.testCount.passed}`,
        `${testStatusToEmoji.failed} *Failed:* ${this.runInfo.testCount.failed}`,
        `${testStatusToEmoji.skipped} *Skipped:* ${this.runInfo.testCount.skipped}`,
        `${testStatusToEmoji.flaky} *Flaky:* ${this.runInfo.testCount.flaky}`,
      ];
    }

    return [];
  }

  private getHeaderBlock(title: string) {
    return {
      type: 'header',
      text: { type: 'plain_text', text: title },
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
    if (this.options.reportType == 'list') {
      fields.map((t) =>
        blocks.push({
          type: 'section',
          text: { type: 'mrkdwn', text: t },
        }),
      );
    } else if (this.options.reportType == 'count') {
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
