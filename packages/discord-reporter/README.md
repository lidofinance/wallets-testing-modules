# Wallets Module

`@lidofinance/discord-reporter` is a custom Playwright reporter that sends test run results directly to a Discord channel via a webhook. It collects statistics on passed, failed, and skipped tests, formats the results in a Discord embed message, and sends it when the test suite has finished executing.

## Features
- **Test Result Statistics**: Automatically counts passed, failed, and skipped tests.
- **Custom Discord Embed**: Formats test results (including run duration and a link to the GitHub run if available) as a Discord embed.
- **Self reporting for scripts**: Easy to using as a report function for simple script.
- **Easy Integration**: Simply add the reporter to your Playwright configuration to enable notifications in your Discord channel.
- **CI Integration**: Supports linking to GitHub Actions runs when executed in a CI environment.


## Install

```bash
yarn add @lidofinance/discord-reporter
```

## Configuration
Environment Variables
Before running your tests, make sure the following environment variables are set:

- `DISCORD_REPORTER_ENABLED`: Set to true to enable Discord notifications.
- `DISCORD_WEBHOOK_URL`: Your Discord webhook URL where the report messages will be sent.
- `GITHUB_SERVER_URL`: (Optional) GitHub server URL (e.g., https://github.com) if running in CI.
- `GITHUB_REPOSITORY`: (Optional) The GitHub repository in the format username/repository.
- `GITHUB_RUN_ID`: (Optional) The GitHub Actions run ID.
- `CI`: (Optional) Set to any value to indicate that tests are running in a CI environment.

## Playwright Configuration
To use the reporter, update your Playwright configuration (e.g., `playwright.config.ts`) to include `@lidofinance/discord-reporter`:

```ts
// playwright.config.ts
const config = {
  // ... your existing configuration
  reporter: [
    // Other reporters if any
    '@lidofinance/discord-reporter',
  ],
};

export default config;
```

Alternatively, if you use a custom configuration object with specific options, you can also pass options accordingly.

## Usage
Set up the environment variables:

You can use a .env file or set the environment variables in your CI/CD pipeline:

```env
DISCORD_REPORTER_ENABLED=true
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/your_webhook_url
GITHUB_SERVER_URL=https://github.com
GITHUB_REPOSITORY=yourusername/yourrepository
GITHUB_RUN_ID=123456789
CI=true
```

Run your tests with Playwright:

```bash
npx playwright test
```

Once the tests complete, the reporter will automatically send a formatted message with the results to the specified Discord channel.

## Using sendDiscordWebhook in Custom Scripts

You can also use the webhook sender directly from your own scripts to send custom messages to Discord. For example:

```ts
const discordReporter = new DiscordReporter({
  enabled: 'true',
});
await discordReporter.sendDiscordWebhook({
  embeds: [
    {
      title: 'Custom title',
      description: '',
      color: 3066993,
      fields: [
        {
          name: 'Some information',
          value: 1,
          inline: false,
        },
      ],
    },
  ],
});
```

This allows you to trigger Discord notifications outside the normal Playwright test run—for example, as part of a maintenance script or additional CI/CD steps.
