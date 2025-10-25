/**
 * Parsing utilities for incident summary messages.
 * These functions extract structured data from Slack block messages.
 */

// Type definitions for Slack blocks we care about
interface SlackBlock {
    type: string
    [key: string]: unknown
}

interface SlackSectionBlock extends SlackBlock {
    type: 'section'
    text?: {
        type: string
        text: string
    }
}

interface SlackMessage {
    ts: string
    blocks?: SlackBlock[]
    [key: string]: unknown
}

export interface ParsedIncidentData {
    issue: string
    start_user_id: string
    incident_commander_id: string
    team_message_ts?: string
}

/**
 * Type guard to check if a block is a section block with text
 */
function isSectionBlock(block: SlackBlock): block is SlackSectionBlock {
    return (
        block.type === 'section' &&
        'text' in block &&
        typeof block.text === 'object' &&
        block.text !== null &&
        'text' in block.text &&
        typeof block.text.text === 'string'
    )
}

/**
 * Check if a message has a header block (identifies summary messages)
 */
export function hasSummaryMessageHeader(message: SlackMessage): boolean {
    if (!message.blocks || !Array.isArray(message.blocks)) {
        return false
    }
    return message.blocks.some((block) => block.type === 'header')
}

/**
 * Extract issue description from a section block
 */
function extractIssue(text: string): string | null {
    if (text.startsWith('*Issue:*')) {
        return text.replace(/^\*Issue:\*\s*\n?\s*/, '').trim()
    }
    return null
}

/**
 * Extract incident commander ID from text
 */
function extractIncidentCommander(text: string): string | null {
    if (!text.includes('*Incident Commander:*')) {
        return null
    }
    const match = text.match(/<@(\w+)>/)
    return match ? match[1] : null
}

/**
 * Extract starter user ID from text
 */
function extractStarterUser(text: string): string | null {
    if (!text.includes('Started by')) {
        return null
    }
    const match = text.match(/Started by \*<@(\w+)>/)
    return match ? match[1] : null
}

/**
 * Extract team message timestamp from context block link
 * Format: https://slack.com/archives/CHANNEL/p1234567890123456
 * Returns: 1234567890.123456
 */
function extractTeamMessageTs(block: SlackBlock): string | null {
    if (block.type !== 'context' || !('elements' in block)) {
        return null
    }

    const elements = block.elements as unknown[]
    if (!Array.isArray(elements)) {
        return null
    }

    for (const element of elements) {
        if (
            typeof element === 'object' &&
            element !== null &&
            'type' in element &&
            element.type === 'mrkdwn' &&
            'text' in element &&
            typeof element.text === 'string' &&
            element.text.includes('slack.com/archives/')
        ) {
            // Extract timestamp from URL: /archives/CHANNEL/p1234567890123456
            const match = element.text.match(/\/archives\/[^/]+\/p(\d+)/)
            if (match) {
                // Convert p1234567890123456 back to 1234567890.123456
                const ts = match[1]
                return `${ts.slice(0, 10)}.${ts.slice(10)}`
            }
        }
    }

    return null
}

/**
 * Parse incident data from a summary message
 */
export function parseSummaryMessage(message: SlackMessage): ParsedIncidentData {
    const result: ParsedIncidentData = {
        issue: '',
        start_user_id: '',
        incident_commander_id: '',
    }

    if (!message.blocks || !Array.isArray(message.blocks)) {
        return result
    }

    for (const block of message.blocks) {
        if (isSectionBlock(block) && block.text) {
            const text = block.text.text

            // Try to extract each field
            const issue = extractIssue(text)
            if (issue !== null) {
                result.issue = issue
            }

            const ic = extractIncidentCommander(text)
            if (ic !== null) {
                result.incident_commander_id = ic
            }

            const starter = extractStarterUser(text)
            if (starter !== null) {
                result.start_user_id = starter
            }
        }

        // Check for team message link in context blocks
        const teamTs = extractTeamMessageTs(block)
        if (teamTs !== null) {
            result.team_message_ts = teamTs
        }
    }

    return result
}

/**
 * Find the first summary message from a list of pinned messages
 */
export async function findSummaryMessage(
    messages: SlackMessage[]
): Promise<SlackMessage | null> {
    for (const message of messages) {
        if (hasSummaryMessageHeader(message)) {
            return message
        }
    }
    return null
}

