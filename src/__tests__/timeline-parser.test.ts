import { describe, it, expect } from '@jest/globals'
import {
    parseLogEvent,
    parseUpdateEvent,
    parseICEvent,
    parseTimelineEvents,
    sortTimelineEvents,
    getParticipants,
} from '../parsers/timeline-parser'

describe('parseLogEvent', () => {
    it('should parse logged timeline events', () => {
        const message = {
            ts: '1234567890.123456',
            text: '🕐 Timeline event logged',
            blocks: [
                {
                    type: 'context',
                    elements: [
                        {
                            type: 'mrkdwn',
                            text: '<!date^1609459200^{date_short_pretty} at {time}|Jan 1, 2021 at 00:00> - *Database restored*',
                        },
                    ],
                },
            ],
        }

        const result = parseLogEvent(message)

        expect(result).toEqual({
            timestamp: 1609459200,
            type: 'log',
            text: 'Database restored',
        })
    })

    it('should return null for non-log messages', () => {
        const message = {
            ts: '1234567890.123456',
            text: 'Just a regular message',
            blocks: [],
        }

        const result = parseLogEvent(message)

        expect(result).toBeNull()
    })

    it('should return null for malformed log events', () => {
        const message = {
            ts: '1234567890.123456',
            text: '🕐 Event',
            blocks: [
                {
                    type: 'context',
                    elements: [
                        {
                            type: 'mrkdwn',
                            text: 'Invalid format',
                        },
                    ],
                },
            ],
        }

        const result = parseLogEvent(message)

        expect(result).toBeNull()
    })
})

describe('parseUpdateEvent', () => {
    it('should parse update messages', () => {
        const message = {
            ts: '1234567890.123456',
            text: '📢 Update from <@U123>:\n\nWe have identified the root cause',
        }

        const result = parseUpdateEvent(message)

        expect(result).toEqual({
            timestamp: 1234567890.123456,
            type: 'update',
            text: 'We have identified the root cause',
            user: 'U123',
        })
    })

    it('should return null for non-update messages', () => {
        const message = {
            ts: '1234567890.123456',
            text: 'Regular message',
        }

        const result = parseUpdateEvent(message)

        expect(result).toBeNull()
    })

    it('should return null for malformed updates', () => {
        const message = {
            ts: '1234567890.123456',
            text: '📢 Update from <@U123>',
        }

        const result = parseUpdateEvent(message)

        expect(result).toBeNull()
    })
})

describe('parseICEvent', () => {
    it('should parse IC assignment messages with emoji', () => {
        const message = {
            ts: '1234567890.123456',
            text: '🎯 <@U123> is now the Incident Commander!',
        }

        const result = parseICEvent(message)

        expect(result).toEqual({
            timestamp: 1234567890.123456,
            type: 'ic',
            text: '<@U123> is now the Incident Commander!',
        })
    })

    it('should parse IC assignment messages with :dart: emoji', () => {
        const message = {
            ts: '1234567890.123456',
            text: ':dart: <@U123> is now the Incident Commander!',
        }

        const result = parseICEvent(message)

        expect(result).toEqual({
            timestamp: 1234567890.123456,
            type: 'ic',
            text: '<@U123> is now the Incident Commander!',
        })
    })

    it('should parse IC handoff messages', () => {
        const message = {
            ts: '1234567890.123456',
            text: '🎯 Incident Commander handoff: <@U123> → <@U456>',
        }

        const result = parseICEvent(message)

        expect(result).toEqual({
            timestamp: 1234567890.123456,
            type: 'ic',
            text: 'Incident Commander handoff: <@U123> → <@U456>',
        })
    })

    it('should return null for non-IC messages', () => {
        const message = {
            ts: '1234567890.123456',
            text: 'Regular message',
        }

        const result = parseICEvent(message)

        expect(result).toBeNull()
    })
})

describe('parseTimelineEvents', () => {
    it('should parse multiple event types from messages', () => {
        const messages = [
            {
                ts: '1234567890.111111',
                text: '🕐 Timeline event',
                blocks: [
                    {
                        type: 'context',
                        elements: [
                            {
                                type: 'mrkdwn',
                                text: '<!date^1609459200^{date_short_pretty} at {time}|...> - *Event 1*',
                            },
                        ],
                    },
                ],
            },
            {
                ts: '1234567890.222222',
                text: '📢 Update from <@U123>:\n\nUpdate text',
            },
            {
                ts: '1234567890.333333',
                text: '🎯 <@U456> is now the Incident Commander!',
            },
            {
                ts: '1234567890.444444',
                text: 'Regular message - should be ignored',
            },
        ]

        const events = parseTimelineEvents(messages)

        expect(events).toHaveLength(3)
        expect(events[0].type).toBe('log')
        expect(events[1].type).toBe('update')
        expect(events[2].type).toBe('ic')
    })

    it('should return empty array for no events', () => {
        const messages = [
            {
                ts: '1234567890.123456',
                text: 'Regular message',
            },
        ]

        const events = parseTimelineEvents(messages)

        expect(events).toEqual([])
    })
})

describe('sortTimelineEvents', () => {
    it('should sort events by timestamp ascending', () => {
        const events = [
            { timestamp: 3, type: 'log' as const, text: 'Third' },
            { timestamp: 1, type: 'log' as const, text: 'First' },
            { timestamp: 2, type: 'log' as const, text: 'Second' },
        ]

        const sorted = sortTimelineEvents(events)

        expect(sorted[0].timestamp).toBe(1)
        expect(sorted[1].timestamp).toBe(2)
        expect(sorted[2].timestamp).toBe(3)
    })

    it('should not mutate original array', () => {
        const events = [
            { timestamp: 3, type: 'log' as const, text: 'Third' },
            { timestamp: 1, type: 'log' as const, text: 'First' },
        ]

        const sorted = sortTimelineEvents(events)

        expect(events[0].timestamp).toBe(3)
        expect(sorted[0].timestamp).toBe(1)
    })
})

describe('getParticipants', () => {
    it('should extract unique user IDs from messages', () => {
        const messages = [
            { user: 'U123', text: 'Message 1' },
            { user: 'U456', text: 'Message 2' },
            { user: 'U123', text: 'Message 3' },
            { user: 'U789', text: 'Message 4' },
        ]

        const participants = getParticipants(messages)

        expect(participants.size).toBe(3)
        expect(participants.has('U123')).toBe(true)
        expect(participants.has('U456')).toBe(true)
        expect(participants.has('U789')).toBe(true)
    })

    it('should exclude bot messages', () => {
        const messages = [
            { user: 'U123', text: 'User message' },
            { user: 'U456', bot_id: 'B123', text: 'Bot message' },
            { user: 'U789', subtype: 'bot_message', text: 'Bot message' },
        ]

        const participants = getParticipants(messages)

        expect(participants.size).toBe(1)
        expect(participants.has('U123')).toBe(true)
        expect(participants.has('U456')).toBe(false)
        expect(participants.has('U789')).toBe(false)
    })

    it('should handle messages without user field', () => {
        const messages = [
            { user: 'U123', text: 'User message' },
            { text: 'Message without user' },
        ]

        const participants = getParticipants(messages)

        expect(participants.size).toBe(1)
        expect(participants.has('U123')).toBe(true)
    })
})

