import { App, SlashCommand } from '@slack/bolt'
import { WebClient } from '@slack/web-api'
import { requireIncidentChannel } from '../utils/command-helpers'

async function logIncidentEvent(
    eventText: string,
    body: SlashCommand,
    client: WebClient,
    logger: App['logger']
) {
    try {
        const result = await requireIncidentChannel(client, body.channel_id)

        if (!result.success) {
            await client.chat.postEphemeral({
                channel: body.channel_id,
                user: body.user_id,
                text: result.error,
            })
            return
        }

        if (!eventText || eventText.trim() === '') {
            await client.chat.postEphemeral({
                channel: body.channel_id,
                text: 'Please provide an event description: `/incident log <your event>`',
                user: body.user_id,
            })
            return
        }

        // Post formatted timeline event
        const timestamp = Math.floor(Date.now() / 1000)
        await client.chat.postMessage({
            channel: body.channel_id,
            text: `🕐 <!date^${timestamp}^{time}|${new Date().toISOString()}> - <@${body.user_id}>: ${eventText.trim()}`,
            blocks: [
                {
                    type: 'context',
                    elements: [
                        {
                            type: 'mrkdwn',
                            text: `🕐 <!date^${timestamp}^{date_short_pretty} at {time}|${new Date().toISOString()}> - <@${body.user_id}>: *${eventText.trim()}*`,
                        },
                    ],
                },
            ],
        })
    } catch (error) {
        logger.error('Error logging incident event:', error)
        await client.chat.postEphemeral({
            channel: body.channel_id,
            text: 'Failed to log event. Please try again.',
            user: body.user_id,
        })
    }
}

export default logIncidentEvent
