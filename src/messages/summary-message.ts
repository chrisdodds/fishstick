import { IncidentMetadata } from '../storage'
import { config } from '../config'

const messageText = `Use \`/incident help\` to get command options.`

/**
 * Generates a summary message for an incident.
 */
function summaryMessage(incident: IncidentMetadata & { channel_id?: string }) {
    const {
        name,
        issue,
        start_user_id,
        created_at,
        incident_commander_id,
    } = incident

    const blocks = [
        {
            type: 'header',
            text: {
                type: 'plain_text',
                text: name,
            },
        },
        {
            type: 'divider',
        },
        {
            type: 'section',
            text: {
                type: 'mrkdwn',
                text: `*Issue:*\n ${issue}`,
            },
        },
        {
            type: 'section',
            text: {
                type: 'mrkdwn',
                text: `*Incident Commander:* ${
                    incident_commander_id
                        ? `<@${incident_commander_id}>`
                        : '_None assigned_'
                }`,
            },
        },
        {
            type: 'section',
            text: {
                type: 'mrkdwn',
                text: `Started by *<@${start_user_id}>* <!date^${Math.floor(new Date(created_at).getTime() / 1000)}^{date_short_pretty} at {time}|${created_at}>`,
            },
        },
        {
            type: 'divider',
        },
        {
            type: 'context',
            elements: [
                {
                    type: 'mrkdwn',
                    text: messageText,
                },
            ],
        },
    ]

    // Store team_message_ts as a link (for threading updates)
    if (incident.team_message_ts) {
        const teamChannelId = config.incident.teamUpdateChannelId
        if (teamChannelId) {
            // Convert timestamp 1234567890.123456 to p1234567890123456 for Slack URL
            const urlTs = incident.team_message_ts.replace('.', '')
            blocks.push({
                type: 'context',
                elements: [
                    {
                        type: 'mrkdwn',
                        text: `<https://slack.com/archives/${teamChannelId}/p${urlTs}|View team announcement>`,
                    },
                ],
            })
        }
    }

    return blocks
}

export default summaryMessage
