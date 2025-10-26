import { describe, it, expect, jest } from '@jest/globals'
import type { WebClient } from '@slack/web-api'
import { requireIncidentChannel } from '../utils/command-helpers'

describe('requireIncidentChannel', () => {
    it('should return incident when in incident channel', async () => {
        const client = {
            conversations: {
                info: jest.fn<any>().mockResolvedValue({
                    channel: {
                        id: 'C123',
                        name: 'incident_test',
                        is_private: false,
                        created: 1735732800,
                    },
                }),
            },
            pins: {
                list: jest.fn<any>().mockResolvedValue({ items: [] }),
            },
        } as unknown as WebClient

        const result = await requireIncidentChannel(client, 'C123')

        expect(result.success).toBe(true)
        if (result.success) {
            expect(result.incident.name).toBe('incident_test')
        }
    })

    it('should return error when not in incident channel', async () => {
        const client = {
            conversations: {
                info: jest.fn<any>().mockResolvedValue({
                    channel: {
                        id: 'C123',
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

        const result = await requireIncidentChannel(client, 'C123')

        expect(result.success).toBe(false)
        if (!result.success) {
            expect(result.error).toBe(
                'This command must be used in an incident channel.'
            )
        }
    })
})

