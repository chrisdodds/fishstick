# Fish Stick 🔥

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D22.0.0-brightgreen)](https://nodejs.org)

**A stateless incident management bot for Slack. No database. No web UI. Just Slack.**

Fish Stick helps engineering teams manage incidents with minimal overhead. Create channels, log events, track timelines, and generate postmortem reports—all without setting up infrastructure.

## Why Fish Stick?

**The Problem:** Most incident management tools are either too simple (basic Slack workflows) or too complex (enterprise platforms with a million knobs, dependencies, and steep learning curves).

**The Solution:** Fish Stick sits in the sweet spot:

- ✅ More powerful than Slack workflows (timeline generation, threading, analytics)
- ✅ Simpler than enterprise tools (stateless, no infrastructure)
- ✅ Fast to deploy (one command, no database)
- ✅ Easy to customize (clean TypeScript codebase)

## Demo

![Fish Stick Demo](docs/demo.gif)

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

[![Create Slack App](https://img.shields.io/badge/Create%20Slack%20App-4A154B?style=for-the-badge&logo=slack&logoColor=white)](https://api.slack.com/apps/new)

**Option A: Use the App Manifest (Recommended - 1 minute setup)**

1. Go to [api.slack.com/apps](https://api.slack.com/apps)
2. Click **Create New App** → **From an app manifest**
3. Select your workspace
4. Copy and paste the contents of [`slack-app-manifest.yml`](slack-app-manifest.yml)
5. Review and create the app
6. **For local development:** Enable Socket Mode in app settings → Generate an App-Level Token with `connections:write` scope
7. **For production:** Configure Request URL to `https://your-domain.com/slack/events`
8. Install the app to your workspace
9. Copy your tokens (Bot Token, Signing Secret, and App Token if using Socket Mode)

**Option B: Manual Setup**

1. Go to [api.slack.com/apps](https://api.slack.com/apps)
2. Create a new app (from scratch)
3. Enable **Socket Mode** and generate an app token with `connections:write` scope
4. Add these OAuth scopes (see [full list below](#required-oauth-scopes))
5. Create the `/incident` slash command (see [Slash Command Setup](#slash-command-setup))
6. Install the app to your workspace
7. Copy your tokens

### 2. Create an Incidents Channel

1. Create a public channel in your Slack workspace (e.g., `#incidents`)
2. Invite Fish Stick to the channel: `/invite @Fish Stick`
3. Copy the channel ID:
   - Right-click the channel name → **View channel details**
   - Scroll down to find the Channel ID (looks like `C123456789`)
   - You'll use this as `TEAM_UPDATE_CHANNEL_ID` in your environment variables

This is where Fish Stick will post announcements whenever a new incident is created.

### 3. Install & Configure

```bash
# Clone and install
git clone https://github.com/chrisdodds/fishstick.git
cd fishstick
npm install

# Configure environment variables
cp .env.example .env
# Edit .env with your tokens
```

### 4. Run

```bash
# Development (with auto-reload)
npm run dev

# Production (build first)
npm run build
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

# Recommended
TEAM_UPDATE_CHANNEL_ID=C123456  # Where to post incident announcements

# Development (Socket Mode) - no public URL needed
SOCKET_MODE=true
SLACK_APP_TOKEN=xapp-your-app-token

# Production (HTTP Mode) - default, requires public URL
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
# Build the image
docker build -t fishstick .

# Run with environment file
docker run --env-file .env fishstick

# Or pass environment variables directly
docker run \
  -e SLACK_BOT_TOKEN=xoxb-... \
  -e SLACK_SIGNING_SECRET=... \
  -e SLACK_APP_TOKEN=xapp-... \
  -e SOCKET_MODE=true \
  -e TEAM_UPDATE_CHANNEL_ID=C123456 \
  fishstick
```

### Render / Fly.io / Railway

- **Build command:** `npm run build`
- **Start command:** `npm start`
- Set environment variables in dashboard

### Heroku

```bash
heroku create
heroku config:set SLACK_BOT_TOKEN=xoxb-...
heroku config:set SLACK_SIGNING_SECRET=...
heroku config:set SLACK_APP_TOKEN=xapp-...
heroku config:set SOCKET_MODE=true
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

## Deployment Modes

Fish Stick supports two deployment modes:

### Socket Mode (Development)

**Best for:** Local development, no public URL needed

1. Enable **Socket Mode** in your Slack app settings
2. Generate an **App-Level Token** with `connections:write` scope
3. Set environment variables:
   ```bash
   SOCKET_MODE=true
   SLACK_APP_TOKEN=xapp-your-token
   ```
4. The `/incident` command Request URL can be left blank

### HTTP Mode (Production)

**Best for:** Production deployments on any hosting platform

1. Deploy your app to a publicly accessible URL
2. In Slack app settings, set Request URL for:
   - **Slash Commands** (`/incident`): `https://your-domain.com/slack/events`
   - **Interactivity & Shortcuts**: `https://your-domain.com/slack/events`
   - **Event Subscriptions**: `https://your-domain.com/slack/events`
3. Set environment variables:
   ```bash
   SOCKET_MODE=false  # or leave unset
   PORT=3000
   ```
4. Ensure Socket Mode is **disabled** in your Slack app settings

## Development

```bash
npm run dev            # Dev mode with auto-restart (tsx watch)
npm run build          # Build with esbuild
npm start              # Production mode (run built code)
npm run lint           # Run linter
npm test               # Run tests
npm run test:watch     # Run tests in watch mode
npm run test:coverage  # Run tests with coverage
```

**Project Structure:**
- `src/` - TypeScript source code
- `src/commands/` - Slash command handlers
- `src/listeners/` - Slack event listeners
- `src/parsers/` - Message parsing logic
- `src/utils/` - Helper functions
- `src/__tests__/` - Jest unit tests
- `build.js` - esbuild configuration
- `dist/` - Compiled output (gitignored)

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
