import type { KnownBlock } from '@slack/types'
import type { IncidentMetadata } from '../storage'

/**
 * Returns a message block for the incident summary.
 *
 * @param {IncidentMetadata} incident The incident object.
 * @returns {KnownBlock[]} The message blocks for the incident summary.
 */
function teamSummaryMessage(incident: IncidentMetadata): KnownBlock[] {
    const { name, issue } = incident

    const blocks: KnownBlock[] = [
        {
            type: 'header',
            text: {
                type: 'plain_text',
                text: `🚨 ${name}`,
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
            type: 'divider',
        },
        {
            type: 'section',
            text: {
                type: 'mrkdwn',
                text: `*Incident Channel:* #${name}`,
            },
        },
    ]

    return blocks
}

export default teamSummaryMessage
