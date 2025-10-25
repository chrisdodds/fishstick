import { describe, it, expect } from '@jest/globals'
import generateSummaryMessage from '../messages/summary-message.js'
import generateTeamSummaryMessage from '../messages/team-summary-message.js'
import type { IncidentMetadata } from '../storage.js'

describe('Summary Message Generation', () => {
    const mockMetadata: IncidentMetadata = {
        name: 'incident_test_chicken',
        issue: 'Database down',
        start_user_id: 'U123',
        start_user_name: 'testuser',
        incident_commander_id: 'U456',
        incident_commander_name: 'icuser',
        is_private: false,
        created_at: new Date('2025-01-01T12:00:00Z').toISOString(),
        summary_message_ts: '1234567890.123456',
        team_message_ts: '1234567890.123456',
    }

    it('should generate incident summary with all required fields', () => {
        const blocks = generateSummaryMessage({ ...mockMetadata, channel_id: 'C123' })

        const jsonStr = JSON.stringify(blocks)
        expect(jsonStr).toContain('incident_test_chicken')
        expect(jsonStr).toContain('Database down')
        expect(jsonStr).toContain('U123')
        expect(jsonStr).toContain('U456')
    })

    it('should handle incident without IC assigned', () => {
        const metadataNoIC: IncidentMetadata = {
            ...mockMetadata,
            incident_commander_id: undefined,
            incident_commander_name: undefined,
        }

        const blocks = generateSummaryMessage({ ...metadataNoIC, channel_id: 'C123' })
        const jsonStr = JSON.stringify(blocks)
        expect(jsonStr).toContain('None assigned')
    })

    it('should generate team summary message', () => {
        const blocks = generateTeamSummaryMessage(mockMetadata)

        const jsonStr = JSON.stringify(blocks)
        expect(jsonStr).toContain('incident_test_chicken')
        expect(jsonStr).toContain('Database down')
    })

    it('should include incident commander when assigned', () => {
        const blocks = generateSummaryMessage({ ...mockMetadata, channel_id: 'C123' })

        const jsonStr = JSON.stringify(blocks)
        expect(jsonStr).toContain('<@U456>')
    })
})
