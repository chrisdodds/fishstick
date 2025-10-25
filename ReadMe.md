# Fish Stick 🔥

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D22.0.0-brightgreen)](https://nodejs.org)

**A stateless incident management bot for Slack. No database. No web UI. Just Slack.**

Fish Stick helps engineering teams manage incidents with minimal overhead. Create channels, log events, track timelines, and generate postmortem reports—all without setting up infrastructure.

## Why Fish Stick?

**The Problem:** Most incident management tools are either too simple (basic Slack workflows) or too complex (enterprise platforms with databases, web UIs, and steep learning curves).

**The Solution:** Fish Stick sits in the sweet spot:

- ✅ More powerful than Slack workflows (timeline generation, threading, analytics)
- ✅ Simpler than enterprise tools (stateless, no infrastructure)
- ✅ Fast to deploy (one command, no database)
- ✅ Easy to customize (clean TypeScript codebase)

## Features

- 🎲 **Random channel names** - `incident_furious_chicken`, `incident_brave_penguin`
- 📋 **Timeline logging** - Track events with timestamps
- 📢 **Team updates** - Threaded announcements to stakeholders
- 👨‍✈️ **IC tracking** - Incident commander handoffs
- 📊 **Timeline reports** - Auto-generated from channel history
- 📌 **Pinned items** - Key resources tracked automatically
- 🔒 **Private incidents** - Optional private channels
- 🧪 **Test mode** - Skip announcements during testing / game days

## Quick Start

**Requirements:** Node.js 22+

### 1. Create a Slack App

1. Go to [api.slack.com/apps](https://api.slack.com/apps)
2. Create a new app (from scratch)
3. Enable **Socket Mode** and generate an app token
4. Add these OAuth scopes (see [full list below](#required-oauth-scopes))
5. Install the app to your workspace
6. Copy your tokens

### 2. Install & Configure

```bash
# Clone and install
git clone https://github.com/chrisdodds/fishstick.git
cd fishstick
npm install

# Configure environment variables
cp .env.example .env
# Edit .env with your tokens
```

### 3. Run

```bash
npm start
```

That's it! The bot is now running in your Slack workspace.

## Commands

| Command | Description |
|---------|-------------|
| `/incident` | Create a new incident (opens modal) |
| `/incident update` | Send a threaded update to team channel |
| `/incident log <event>` | Log a timeline event |
| `/incident ic` | Check in as Incident Commander |
| `/incident timeline` | Generate incident report |
| `/incident resolve` | Mark incident as resolved |
| `/incident help` | Show available commands |

## Environment Variables

```bash
# Required
SLACK_BOT_TOKEN=xoxb-your-bot-token
SLACK_SIGNING_SECRET=your-signing-secret
SLACK_APP_TOKEN=xapp-your-app-token  # For socket mode

# Optional
TEAM_UPDATE_CHANNEL_ID=C123456  # Where to post incident announcements
SOCKET_MODE=true                # Use socket mode (recommended for dev)
PORT=3000                       # Server port (default: 3000)
```

## Architecture

**Radically simple:**

- **Incident metadata** → Reconstructed from channel properties and pinned messages
- **Timeline** → Messages in the incident channel
- **Summary** → Pinned message in the incident channel
- **No database, no web interface, no OAuth flow**

The entire bot is stateless. You can restart it anytime without losing data—everything lives in Slack.

## Deployment

Deploy anywhere that runs Node.js:

### Docker

```bash
docker build -t fishstick .
docker run -e SLACK_BOT_TOKEN=xoxb-... -e SLACK_SIGNING_SECRET=... fishstick
```

### Render / Fly.io / Railway

- **Build command:** `npm install`
- **Start command:** `npm start`
- Set environment variables in dashboard

### Heroku

```bash
heroku create
heroku config:set SLACK_BOT_TOKEN=xoxb-...
git push heroku main
```

## Required OAuth Scopes

Bot Token Scopes needed for your Slack app:

- `app_mentions:read`
- `channels:history`
- `channels:manage`
- `channels:read`
- `chat:write`
- `chat:write.public`
- `commands`
- `groups:history`
- `groups:read`
- `groups:write`
- `im:history`
- `im:read`
- `im:write`
- `incoming-webhook`
- `mpim:history`
- `mpim:read`
- `mpim:write`
- `pins:read`
- `pins:write`

## Slash Command Setup

In your Slack app settings, create the `/incident` command:

- **Command:** `/incident`
- **Request URL:** Leave blank if using Socket Mode for development
- **Request URL (Production):** `https://your-domain.com/slack/events`
- **Short Description:** `Manage incidents`
- **Usage Hint:** `[update|log|ic|timeline|resolve|help]`

Socket Mode (for local dev):

- Enable **Socket Mode** in your app settings
- Generate an **App-Level Token** with `connections:write` scope
- Set `SOCKET_MODE=true` and `SLACK_APP_TOKEN=xapp-...` in your `.env`

Production (HTTP mode):

- Disable Socket Mode or set `SOCKET_MODE=false`
- Configure **Request URL** to point to your deployed app
- Ensure your app is publicly accessible

## Development

```bash
npm start  # Auto-restarts on file changes
npm run lint  # Run linter
npm test  # Run tests
npm run test:watch  # Run tests in watch mode
npm run test:coverage  # Run tests with coverage
npm run build  # Build TypeScript
```

## Contributing

Contributions welcome! This is OSS.

**Good First Issues:**

- Add more tests
- Improve error messages
- Add integrations (PagerDuty, Jira, etc.)
- Better documentation

**How to Contribute:**

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT © 2025 Fishstick Labs

See [LICENSE](LICENSE) for details.

## Support

- **Issues:** [GitHub Issues](https://github.com/chrisdodds/fishstick/issues)
- **Discussions:** [GitHub Discussions](https://github.com/chrisdodds/fishstick/discussions)
- **Security:** Report vulnerabilities via GitHub Security tab

---

Built with ❤️ for incident responders everywhere.
