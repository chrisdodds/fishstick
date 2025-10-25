import { describe, it, expect, jest } from '@jest/globals'
import type { WebClient } from '@slack/web-api'
import { getIncidentMetadata, type IncidentMetadata } from '../storage.js'
import generateSummaryMessage from '../messages/summary-message.js'

// Helper to create a properly formatted summary message using the REAL message generator
function createSummaryMessage(data: Partial<IncidentMetadata>) {
    const metadata: IncidentMetadata = {
        name: data.name || 'incident_test',
        issue: data.issue || 'Test issue',
        start_user_id: data.start_user_id || 'U123',
        start_user_name: data.start_user_name || 'testuser',
        incident_commander_id: data.incident_commander_id,
        incident_commander_name: data.incident_commander_name,
        is_private: data.is_private ?? false,
        created_at: data.created_at || new Date().toISOString(),
        closed_at: data.closed_at,
        summary_message_ts: data.summary_message_ts,
        team_message_ts: data.team_message_ts,
    }

    return {
        ts: '1234567890.123456',
        blocks: generateSummaryMessage(metadata),
    }
}

describe('getIncidentMetadata', () => {
    it('should extract full incident metadata from channel and pinned message', async () => {
        const channelId = 'C123INCIDENT'
        const created = 1735732800 // 2025-01-01 12:00:00 UTC

        const summaryMessage = createSummaryMessage({
            name: 'incident_furious_chicken',
            issue: 'Database connection pool exhausted',
            start_user_id: 'U123START',
            incident_commander_id: 'U456IC',
            created_at: new Date(created * 1000).toISOString(),
            team_message_ts: '1735732900.123456',
        })

        const client = {
            conversations: {
                info: jest.fn<any>().mockResolvedValue({
                    channel: {
                        id: channelId,
                        name: 'incident_furious_chicken',
                        is_private: false,
                        created: created,
                    },
                }),
                history: jest.fn<any>().mockResolvedValue({
                    messages: [summaryMessage],
                }),
            },
            pins: {
                list: jest.fn<any>().mockResolvedValue({
                    items: [{ message: { ts: summaryMessage.ts } }],
                }),
            },
        } as unknown as WebClient

        const metadata = await getIncidentMetadata(client, channelId)

        expect(metadata).toEqual({
            name: 'incident_furious_chicken',
            issue: 'Database connection pool exhausted',
            start_user_id: 'U123START',
            start_user_name: '',
            incident_commander_id: 'U456IC',
            incident_commander_name: '',
            is_private: false,
            created_at: new Date(created * 1000).toISOString(),
            closed_at: undefined,
            summary_message_ts: summaryMessage.ts,
            team_message_ts: '1735732900.123456',
        })
    })

    it('should handle incident without IC assigned', async () => {
        const channelId = 'C123INCIDENT'

        const summaryMessage = createSummaryMessage({
            name: 'incident_brave_penguin',
            issue: 'API gateway timeout',
            start_user_id: 'U789',
            created_at: new Date().toISOString(),
        })

        const client = {
            conversations: {
                info: jest.fn<any>().mockResolvedValue({
                    channel: {
                        id: channelId,
                        name: 'incident_brave_penguin',
                        is_private: false,
                        created: 1735732800,
                    },
                }),
                history: jest.fn<any>().mockResolvedValue({
                    messages: [summaryMessage],
                }),
            },
            pins: {
                list: jest.fn<any>().mockResolvedValue({
                    items: [{ message: { ts: summaryMessage.ts } }],
                }),
            },
        } as unknown as WebClient

        const metadata = await getIncidentMetadata(client, channelId)

        expect(metadata?.incident_commander_id).toBe('')
        expect(metadata?.name).toBe('incident_brave_penguin')
    })

    it('should return null for non-incident channels', async () => {
        const channelId = 'C123GENERAL'

        const client = {
            conversations: {
                info: jest.fn<any>().mockResolvedValue({
                    channel: {
                        id: channelId,
                        name: 'general',
                        is_private: false,
                        created: 1735732800,
                    },
                }),
            },
            pins: {
                list: jest.fn<any>().mockResolvedValue({ items: [] }),
            },
        } as unknown as WebClient

        const metadata = await getIncidentMetadata(client, channelId)

        expect(metadata).toBeNull()
    })

    it('should handle API errors gracefully', async () => {
        const channelId = 'C123INCIDENT'

        const client = {
            conversations: {
                info: jest.fn<any>().mockRejectedValue(new Error('API error')),
            },
            pins: {
                list: jest.fn<any>().mockResolvedValue({ items: [] }),
            },
        } as unknown as WebClient

        const metadata = await getIncidentMetadata(client, channelId)

        expect(metadata).toBeNull()
    })

    it('should filter out non-summary pinned messages', async () => {
        const channelId = 'C123INCIDENT'

        const summaryMessage = createSummaryMessage({
            name: 'incident_test',
            issue: 'Test issue',
            start_user_id: 'U123',
            created_at: new Date().toISOString(),
        })

        const regularMessage = {
            ts: '1234567890.999999',
            blocks: [
                {
                    type: 'section',
                    text: {
                        type: 'mrkdwn',
                        text: 'Just a pinned message',
                    },
                },
            ],
        }

        let callCount = 0
        const client = {
            conversations: {
                info: jest.fn<any>().mockResolvedValue({
                    channel: {
                        id: channelId,
                        name: 'incident_test',
                        is_private: false,
                        created: 1735732800,
                    },
                }),
                history: jest.fn<any>().mockImplementation(() => {
                    callCount++
                    if (callCount === 1) {
                        return Promise.resolve({ messages: [regularMessage] })
                    }
                    return Promise.resolve({ messages: [summaryMessage] })
                }),
            },
            pins: {
                list: jest.fn<any>().mockResolvedValue({
                    items: [
                        { message: { ts: regularMessage.ts } },
                        { message: { ts: summaryMessage.ts } },
                    ],
                }),
            },
        } as unknown as WebClient

        const metadata = await getIncidentMetadata(client, channelId)

        expect(metadata?.issue).toBe('Test issue')
        expect(metadata?.summary_message_ts).toBe(summaryMessage.ts)
    })
})
