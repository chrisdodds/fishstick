import { App } from '@slack/bolt'
import { config } from './config'

const app = new App({
    token: config.slack.botToken,
    signingSecret: config.slack.signingSecret,
    socketMode: config.slack.socketMode,
    appToken: config.slack.appToken,
    port: config.server.port,
})

export { app }