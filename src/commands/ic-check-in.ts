import { App, SlashCommand } from '@slack/bolt'
import { WebClient } from '@slack/web-api'

import { updateIncidentMetadata } from '../storage'
import summaryMessage from '../messages/summary-message'
import { requireIncidentChannel } from '../utils/command-helpers'

async function icCheckIn(
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

        if (body.user_id === incident.incident_commander_id) {
            await client.chat.postEphemeral({
                channel: body.channel_id,
                text: "You're already the Incident Commander, but extra points for enthusiasm!",
                user: body.user_id,
            })
        } else {
            const previousIC = incident.incident_commander_id

            // Set incident commander
            const updated = await updateIncidentMetadata(client, body.channel_id, {
                incident_commander_id: body.user_id,
                incident_commander_name: body.user_name,
            })

                // Update pinned summary message
                if (incident.summary_message_ts) {
                    await client.chat.update({
                        channel: body.channel_id,
                        ts: incident.summary_message_ts,
                        text: `${incident.name} - Incident`,
                        blocks: summaryMessage(updated),
                    })
                }

                // Post to incident channel
                if (previousIC) {
                    // IC handoff
                    await client.chat.postMessage({
                        channel: body.channel_id,
                        text: `🎯 Incident Commander handoff: <@${previousIC}> → <@${body.user_id}>`,
                    })
                } else {
                    // First IC
                    await client.chat.postMessage({
                        channel: body.channel_id,
                        text: `🎯 <@${body.user_id}> is now the Incident Commander!`,
                    })
                }
            }
        } catch (error) {
            logger.error(error)
        }
    }

export default icCheckIn

