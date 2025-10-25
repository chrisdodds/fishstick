import {
    uniqueNamesGenerator,
    adjectives,
    animals,
} from 'unique-names-generator'

import { app } from '../slack'
import { IncidentMetadata } from '../storage'
import summaryMessage from '../messages/summary-message'
import teamSummaryMessage from '../messages/team-summary-message'
import { config } from '../config'

function startIncidentModal() {
    app.view('start_incident', async ({ ack, body, view, client, logger }) => {
        await ack()

        try {
            const values = view.state.values
            const issueInput = values.incident_issue?.incident_issue_input
            const optionsInput = values.incident_options?.incident_options_input

            const issueValue = issueInput?.value
            const selectedOptions = optionsInput?.selected_options || []

            const isPrivate = selectedOptions.some(opt => opt.value === 'private')
            const isTestMode = selectedOptions.some(opt => opt.value === 'test_mode')

            const userId = body.user.id
            const userName = body.user.name || 'unknown'

            const randomChannelName = uniqueNamesGenerator({
                dictionaries: [adjectives, animals],
            })
            const incidentChannelName = `incident_${randomChannelName}`

            const channel = await client.conversations.create({
                name: incidentChannelName,
                is_private: isPrivate,
            })

            const incidentChannelId = channel.channel?.id

            if (!incidentChannelId) {
                logger.error('Failed to get channel ID after creation')
                return
            }

            const metadata: IncidentMetadata = {
                name: incidentChannelName,
                issue: issueValue || 'Pending description',
                start_user_id: userId,
                start_user_name: userName,
                is_private: isPrivate,
                created_at: new Date().toISOString(),
            }

            // Invite user to incident channel
            await client.conversations.invite({
                channel: incidentChannelId,
                users: userId,
            })

            // Confirm to user that the channel has been created
            await client.chat.postMessage({
                channel: userId,
                text: `Created channel <#${incidentChannelId}|${incidentChannelName}>.`,
            })

            // Post incident summary to the new channel
            const sumMessage = await client.chat.postMessage({
                channel: incidentChannelId,
                text: `${incidentChannelName} Starting...`,
                blocks: summaryMessage(metadata),
            })

            if (!sumMessage?.ts) {
                logger.error('Failed to get message timestamp')
                return
            }

            // Update metadata with summary message timestamp
            metadata.summary_message_ts = sumMessage.ts

            // Pin the summary message to the channel
            await client.pins.add({
                channel: incidentChannelId,
                timestamp: sumMessage.ts,
            })

            // Post to team update channel if configured and not private
            const teamUpdateChannelId = config.incident.teamUpdateChannelId

            if (teamUpdateChannelId && !isPrivate && !isTestMode) {
                const teamSumMessage = await client.chat.postMessage({
                    channel: teamUpdateChannelId,
                    text: `🚨 ${incidentChannelName} - ${metadata.issue}`,
                    blocks: teamSummaryMessage(metadata),
                })

                if (teamSumMessage?.ts) {
                    metadata.team_message_ts = teamSumMessage.ts

                    // Update the pinned message with team_message_ts
                    await client.chat.update({
                        channel: incidentChannelId,
                        ts: metadata.summary_message_ts,
                        text: `${incidentChannelName} Starting...`,
                        blocks: summaryMessage(metadata),
                    })
                }
            }

            // Log channel creation as message in incident channel
            await client.chat.postMessage({
                channel: incidentChannelId,
                text: `🚨 Incident Channel Created by <@${userId}>`,
            })
        } catch (error) {
            logger.error(error)
        }
    })
}

export default startIncidentModal
