# Wallets Module

`@lidofinance/chat-reporter` is a custom Playwright reporter that sends test run results directly to a Discord or a Slack channel via a webhook. It collects statistics on passed, failed, and skipped tests, and sends it when the test suite has finished executing.

## Features
- **Test Result Statistics**: Automatically counts passed, failed, and skipped tests.
- **Custom Discord & Slack Embed**: Formats test results (including run duration and a link to the GitHub run if available) as a Discord or Slack embed.
- **Self reporting for scripts**: Easy to using as a report function for simple script.
- **Easy Integration**: Simply add the reporter to your Playwright configuration to enable notifications in your Discord or Slack channel.
- **CI Integration**: Supports linking to GitHub Actions runs when executed in a CI environment.

## Install

```bash
yarn add @lidofinance/chat-reporter
```

## Configuration
Environment Variables
Before running your tests, make sure the following environment variables are set:

- `CI`: (Optional) Set to any value to indicate that tests are running in a CI environment.

## Playwright Configuration
To use the reporter, update your Playwright configuration (e.g., `playwright.config.ts`) to include `@lidofinance/chat-reporter`:

```ts
// playwright.config.ts
const config = {
  // ... your existing configuration
  reporter: [
    // Other reporters if any
    '@lidofinance/chat-reporter',
  ],
};

export default config;
```

Available options for report:
- `enabled`- A string indicating whether the report is enabled. Typically accepts values like "true" or "false".
- `customTitle` - An optional value for setting a custom title in the report.
- `customDescription` - An optional value for adding a custom description or summary in the report.
- `ciRunUrl` - An optional value pointing to the CI/CD run or job URL. Useful for referencing the pipeline run details.
- `discordWebhookUrl` - A value containing the Discord webhook URL where the report/notification should be sent.
- `discordDutyTag` - An optional value for specifying the Discord user or role ID to receive test notifications. 
  It can be either a user ID or a role ID; 
  if it refers to a role, prefix its numeric ID with an ampersand (&), otherwise provide the numeric user ID alone.
- `reportType` - this determines the type of message
  - `count` - report with count of `passed`/`failed`/`skipped`/`flaky` statuses
  - `list` - report with list of test names from the test run

Alternatively, if you use a custom configuration object with specific options, you can also pass options accordingly.

## Usage
Set up the environment variables:

You can use a .env file or set the environment variables in your CI/CD pipeline:

```env
REPORT_ENABLED=true
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/your_webhook_url
SLACK_WEBHOOK_URL=httphttps://hooks.slack.com/services/your_webhook_url
CI=true
```

Run your tests with Playwright:

```bash
npx playwright test
```

Once the tests complete, the reporter will automatically send a formatted message with the results to the specified Discord channel.
