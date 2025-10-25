/**
 * Configuration management for the application.
 * Validates and provides type-safe access to environment variables.
 */
import dotenv from 'dotenv'

// Load .env before accessing process.env
dotenv.config()

interface Config {
    slack: {
        botToken: string
        signingSecret: string
        appToken?: string
        socketMode: boolean
    }
    server: {
        port: number
    }
    incident: {
        teamUpdateChannelId?: string
    }
}

function loadConfig(): Config {
    const botToken = process.env.SLACK_BOT_TOKEN || ''
    const signingSecret = process.env.SLACK_SIGNING_SECRET || ''

    // Only validate in production (not during tests)
    if (process.env.NODE_ENV !== 'test') {
        if (!botToken) {
            throw new Error('SLACK_BOT_TOKEN environment variable is required')
        }

        if (!signingSecret) {
            throw new Error('SLACK_SIGNING_SECRET environment variable is required')
        }
    }

    const socketMode = process.env.SOCKET_MODE === 'true'
    const appToken = process.env.SLACK_APP_TOKEN

    if (socketMode && !appToken && process.env.NODE_ENV !== 'test') {
        throw new Error('SLACK_APP_TOKEN is required when SOCKET_MODE is true')
    }

    return {
        slack: {
            botToken,
            signingSecret,
            appToken,
            socketMode,
        },
        server: {
            port: parseInt(process.env.PORT || '3000', 10),
        },
        incident: {
            teamUpdateChannelId: process.env.TEAM_UPDATE_CHANNEL_ID,
        },
    }
}

// Load and validate config once at startup
export const config = loadConfig()

