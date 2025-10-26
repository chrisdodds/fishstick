import { describe, it, expect } from '@jest/globals'
import {
    parseSummaryMessage,
    hasSummaryMessageHeader,
    findSummaryMessage,
} from '../parsers/summary-message-parser'

describe('hasSummaryMessageHeader', () => {
    it('should return true for messages with header block', () => {
        const message = {
            ts: '123.456',
            blocks: [{ type: 'header' }, { type: 'section' }],
        }

        expect(hasSummaryMessageHeader(message)).toBe(true)
    })

    it('should return false for messages without header block', () => {
        const message = {
            ts: '123.456',
            blocks: [{ type: 'section' }, { type: 'divider' }],
        }

        expect(hasSummaryMessageHeader(message)).toBe(false)
    })

    it('should return false for messages with no blocks', () => {
        const message = {
            ts: '123.456',
        }

        expect(hasSummaryMessageHeader(message)).toBe(false)
    })
})

describe('parseSummaryMessage', () => {
    it('should extract all incident data from a summary message', () => {
        const message = {
            ts: '1234567890.123456',
            blocks: [
                {
                    type: 'header',
                    text: {
                        type: 'plain_text',
                        text: 'incident_test',
                    },
                },
                {
                    type: 'section',
                    text: {
                        type: 'mrkdwn',
                        text: '*Issue:*\n Database connection timeout',
                    },
                },
                {
                    type: 'section',
                    text: {
                        type: 'mrkdwn',
                        text: '*Incident Commander:* <@U123IC>',
                    },
                },
                {
                    type: 'section',
                    text: {
                        type: 'mrkdwn',
                        text: 'Started by *<@U456START>* <!date^1234567890^{date_short_pretty} at {time}|...>',
                    },
                },
                {
                    type: 'context',
                    elements: [
                        {
                            type: 'mrkdwn',
                            text: '<https://slack.com/archives/C123TEAM/p1735732900123456|View team announcement>',
                        },
                    ],
                },
            ],
        }

        const result = parseSummaryMessage(message)

        expect(result).toEqual({
            issue: 'Database connection timeout',
            start_user_id: 'U456START',
            incident_commander_id: 'U123IC',
            team_message_ts: '1735732900.123456',
        })
    })

    it('should handle missing IC (None assigned)', () => {
        const message = {
            ts: '1234567890.123456',
            blocks: [
                {
                    type: 'section',
                    text: {
                        type: 'mrkdwn',
                        text: '*Issue:*\n Test issue',
                    },
                },
                {
                    type: 'section',
                    text: {
                        type: 'mrkdwn',
                        text: '*Incident Commander:* _None assigned_',
                    },
                },
                {
                    type: 'section',
                    text: {
                        type: 'mrkdwn',
                        text: 'Started by *<@U789>* <!date^1234567890^{date_short_pretty} at {time}|...>',
                    },
                },
            ],
        }

        const result = parseSummaryMessage(message)

        expect(result.incident_commander_id).toBe('')
        expect(result.start_user_id).toBe('U789')
    })

    it('should handle message with no team announcement link', () => {
        const message = {
            ts: '1234567890.123456',
            blocks: [
                {
                    type: 'section',
                    text: {
                        type: 'mrkdwn',
                        text: '*Issue:*\n Test issue',
                    },
                },
            ],
        }

        const result = parseSummaryMessage(message)

        expect(result.team_message_ts).toBeUndefined()
    })

    it('should return empty data for message with no blocks', () => {
        const message = {
            ts: '1234567890.123456',
        }

        const result = parseSummaryMessage(message)

        expect(result).toEqual({
            issue: '',
            start_user_id: '',
            incident_commander_id: '',
        })
    })

    it('should handle malformed blocks gracefully', () => {
        const message = {
            ts: '1234567890.123456',
            blocks: [
                {
                    type: 'section',
                    // Missing text field
                },
                {
                    type: 'section',
                    text: {
                        type: 'mrkdwn',
                        text: '*Issue:*\n Still works',
                    },
                },
            ],
        }

        const result = parseSummaryMessage(message)

        expect(result.issue).toBe('Still works')
    })
})

describe('findSummaryMessage', () => {
    it('should find the first message with a header block', async () => {
        const messages = [
            {
                ts: '123.456',
                blocks: [{ type: 'section' }],
            },
            {
                ts: '123.789',
                blocks: [{ type: 'header' }, { type: 'section' }],
            },
            {
                ts: '123.999',
                blocks: [{ type: 'header' }, { type: 'section' }],
            },
        ]

        const result = await findSummaryMessage(messages)

        expect(result?.ts).toBe('123.789')
    })

    it('should return null if no summary message found', async () => {
        const messages = [
            {
                ts: '123.456',
                blocks: [{ type: 'section' }],
            },
            {
                ts: '123.789',
                blocks: [{ type: 'divider' }],
            },
        ]

        const result = await findSummaryMessage(messages)

        expect(result).toBeNull()
    })

    it('should return null for empty message list', async () => {
        const result = await findSummaryMessage([])

        expect(result).toBeNull()
    })
})

