import { SlashCommand, App } from '@slack/bolt'
import { WebClient } from '@slack/web-api'
import { updateIncidentMetadata } from '../storage'
import summaryMessage from '../messages/summary-message'
import { requireIncidentChannel, formatDuration } from '../utils/command-helpers'

async function resolveIncident(
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

        const incident = result.incident

        if (incident.closed_at) {
            await client.chat.postEphemeral({
                channel: body.channel_id,
                text: 'This incident is already resolved.',
                user: body.user_id,
            })
            return
        }

        // Update incident status
        const updated = await updateIncidentMetadata(client, body.channel_id, {
            closed_at: new Date().toISOString(),
        })

        // Update pinned summary message
        if (incident.summary_message_ts) {
            await client.chat.update({
                channel: body.channel_id,
                ts: incident.summary_message_ts,
                text: `${incident.name} - RESOLVED`,
                blocks: summaryMessage(updated),
            })
        }

        // Calculate duration
        const createdAt = new Date(incident.created_at).getTime()
        const resolvedAt = Date.now()
        const durationSeconds = Math.floor((resolvedAt - createdAt) / 1000)
        const durationStr = formatDuration(durationSeconds)

        // Post resolution message
        await client.chat.postMessage({
            channel: body.channel_id,
            text: `✅ Incident resolved by <@${body.user_id}> after ${durationStr}`,
        })

    } catch (error) {
        logger.error('Error resolving incident:', error)
        await client.chat.postEphemeral({
            channel: body.channel_id,
            text: 'Failed to resolve incident. Please try again.',
            user: body.user_id,
        })
    }
}

export default resolveIncident

