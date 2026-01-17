/**
 * Helper utilities for command handlers
 */

import { WebClient } from '@slack/web-api'
import { getIncidentMetadata } from '../storage'
import type { RequireIncidentResult } from '../types'

// Re-export for backwards compatibility
export type { RequireIncidentResult } from '../types'

/**
 * Require that the command is being run in an incident channel.
 * Returns the incident metadata or an error message.
 */
export async function requireIncidentChannel(
    client: WebClient,
    channelId: string
): Promise<RequireIncidentResult> {
    const incident = await getIncidentMetadata(client, channelId)

    if (!incident) {
        return {
            success: false,
            error: 'This command must be used in an incident channel.',
        }
    }

    return {
        success: true,
        incident,
    }
}

/**
 * Format duration from seconds to human-readable string
 */
export function formatDuration(seconds: number): string {
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60

    return `${hours}h ${remainingMinutes}m`
}

