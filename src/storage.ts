import { WebClient } from '@slack/web-api'
import {
    parseSummaryMessage,
    findSummaryMessage,
} from './parsers/summary-message-parser'
import { app } from './slack'
import type {
    IncidentMetadata,
    ParsedIncidentData,
    ConversationInfoResponse,
    ConversationsListResponse,
    PinsListResponse,
    HistoryResponse,
    SlackMessage,
} from './types'

const logger = app.logger

// Re-export IncidentMetadata for backwards compatibility
export type { IncidentMetadata } from './types'

/**
 * Fetch and parse incident metadata from a Slack channel
 */
export async function getIncidentMetadata(
    client: WebClient,
    channel_id: string
): Promise<IncidentMetadata | null> {
    try {
        // Get channel info
        const channelInfo = (await client.conversations.info({
            channel: channel_id,
        })) as ConversationInfoResponse

        const channel = channelInfo.channel

        // Check if this is an incident channel
        if (!channel?.name?.startsWith('incident_')) {
            return null
        }

        // Get pinned messages
        const pinsResponse = (await client.pins.list({
            channel: channel_id,
        })) as PinsListResponse

        const pins = pinsResponse.items || []

        // Find the summary message among pinned items
        let summaryMessage: SlackMessage | undefined = undefined

        for (const item of pins) {
            const msg = item.message
            if (!msg?.ts) continue

            try {
                const messageResult = (await client.conversations.history({
                    channel: channel_id,
                    latest: String(msg.ts),
                    limit: 1,
                    inclusive: true,
                })) as HistoryResponse

                const actualMessage = messageResult.messages?.[0]

                if (actualMessage) {
                    const found = await findSummaryMessage([actualMessage])
                    if (found) {
                        summaryMessage = actualMessage
                        break
                    }
                }
            } catch (err) {
                logger.error('Failed to fetch pinned message:', err)
            }
        }

        // Parse data from summary message
        let parsedData: ParsedIncidentData = {
            issue: '',
            start_user_id: '',
            incident_commander_id: '',
        }

        if (summaryMessage) {
            parsedData = parseSummaryMessage(summaryMessage)
        }

        return {
            name: channel.name || '',
            issue: parsedData.issue,
            start_user_id: parsedData.start_user_id,
            start_user_name: '',
            incident_commander_id: parsedData.incident_commander_id || '',
            incident_commander_name: '',
            is_private: channel.is_private ?? false,
            created_at: channel.created
                ? new Date(channel.created * 1000).toISOString()
                : '',
            closed_at: undefined,
            summary_message_ts: summaryMessage?.ts
                ? String(summaryMessage.ts)
                : undefined,
            team_message_ts: parsedData.team_message_ts,
        }
    } catch (error) {
        logger.error('Failed to get incident metadata:', error)
        return null
    }
}

/**
 * Extract team message timestamp from pinned summary message
 */
export async function getTeamMessageTs(
    client: WebClient,
    channel_id: string
): Promise<string | undefined> {
    try {
        const pinsResponse = (await client.pins.list({
            channel: channel_id,
        })) as PinsListResponse

        const summaryMessage = pinsResponse.items?.[0]?.message

        if (!summaryMessage?.blocks) {
            return undefined
        }

        const parsed = parseSummaryMessage(summaryMessage as SlackMessage)
        return parsed.team_message_ts
    } catch (error) {
        logger.error('Failed to get team message ts:', error)
        return undefined
    }
}

/**
 * Update incident metadata (merges with existing data)
 */
export async function updateIncidentMetadata(
    client: WebClient,
    channel_id: string,
    updates: Partial<IncidentMetadata>
): Promise<IncidentMetadata> {
    const current = await getIncidentMetadata(client, channel_id)
    if (!current) {
        throw new Error('No incident found in this channel')
    }

    const updated = { ...current, ...updates }
    return updated
}

/**
 * List all incident channels with their metadata
 */
export async function listIncidents(
    client: WebClient
): Promise<Array<{ channel_id: string; metadata: IncidentMetadata }>> {
    try {
        const result = (await client.conversations.list({
            types: 'public_channel,private_channel',
            limit: 1000,
        })) as ConversationsListResponse

        const incidents: Array<{
            channel_id: string
            metadata: IncidentMetadata
        }> = []

        for (const channel of result.channels || []) {
            if (channel.id && channel.name?.startsWith('incident_')) {
                const metadata = await getIncidentMetadata(client, channel.id)
                if (metadata) {
                    incidents.push({
                        channel_id: channel.id,
                        metadata,
                    })
                }
            }
        }

        return incidents
    } catch (error) {
        logger.error('Failed to list incidents:', error)
        return []
    }
}

/**
 * Get all messages from incident channel (timeline)
 */
export async function getIncidentTimeline(
    client: WebClient,
    channel_id: string
) {
    try {
        const result = (await client.conversations.history({
            channel: channel_id,
            limit: 1000,
        })) as HistoryResponse

        return result.messages || []
    } catch (error) {
        logger.error('Failed to get incident timeline:', error)
        return []
    }
}
