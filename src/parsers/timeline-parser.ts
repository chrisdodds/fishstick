/**
 * Parser for timeline events from Slack messages.
 * Extracts structured data from different types of incident-related messages.
 */

export type TimelineEventType = 'start' | 'log' | 'update' | 'ic' | 'resolve'

export interface TimelineEvent {
    timestamp: number
    type: TimelineEventType
    text: string
    user?: string
}

interface SlackMessage {
    text?: string
    ts?: string
    blocks?: unknown[]
    user?: string
    bot_id?: string
    subtype?: string
}

/**
 * Parse a logged timeline event (from /incident log command)
 * Format: Message with 🕐 emoji and context block containing timestamp
 */
export function parseLogEvent(message: SlackMessage): TimelineEvent | null {
    const text = message.text || ''

    // Check for clock emoji (Unicode or Slack emoji notation)
    if (!text.includes('🕐') && !text.includes(':clock') && !message.blocks) {
        return null
    }

    const contextBlock = message.blocks?.find(
        (b: unknown) => (b as Record<string, unknown>).type === 'context'
    )

    if (!contextBlock) {
        return null
    }

    const elements = (contextBlock as Record<string, unknown>).elements
    if (!Array.isArray(elements) || elements.length === 0) {
        return null
    }

    const element = elements[0]
    if (!element || typeof element !== 'object' || !('text' in element)) {
        return null
    }

    // Extract: "🕐 <!date^1234567890^{date_short_pretty} at {time}|...> - <@USER>: *Event text*"
    const elementText = String((element as Record<string, unknown>).text)

    // Try new format with user first
    let match = elementText.match(
        /date\^(\d+)\^.+?\|.+?> - <@(\w+)>: \*(.+?)\*/
    )

    if (match) {
        return {
            timestamp: parseInt(match[1]),
            type: 'log',
            text: `<@${match[2]}>: ${match[3]}`,
            user: match[2],
        }
    }

    // Fall back to old format without user
    match = elementText.match(
        /date\^(\d+)\^.+?\|.+?> - \*(.+?)\*/
    )

    if (!match) {
        return null
    }

    return {
        timestamp: parseInt(match[1]),
        type: 'log',
        text: match[2],
        user: message.user,
    }
}

/**
 * Parse an incident update message (from /incident update command)
 * Format: "📢 Update from <@USER>:\n\nUpdate text"
 */
export function parseUpdateEvent(message: SlackMessage): TimelineEvent | null {
    const text = message.text || ''

    if (!text.includes('📢 Update from')) {
        return null
    }

    const userMatch = text.match(/<@(\w+)>/)
    const parts = text.split(':\n\n')

    if (!userMatch || parts.length < 2) {
        return null
    }

    const updateText = parts[1]
    const ts = parseFloat(message.ts || '0')

    return {
        timestamp: ts,
        type: 'update',
        text: updateText,
        user: userMatch[1],
    }
}

/**
 * Parse IC assignment or handoff message
 * Formats:
 * - "🎯 <@USER> is now the Incident Commander!"
 * - "🎯 Incident Commander handoff: <@USER1> → <@USER2>"
 */
export function parseICEvent(message: SlackMessage): TimelineEvent | null {
    const text = message.text || ''

    if (!text.includes('Incident Commander') && !text.includes('handoff')) {
        return null
    }

    // Remove emoji prefix
    const cleanText = text
        .replace(/^:dart:\s*/, '')
        .replace(/^🎯\s*/, '')

    const ts = parseFloat(message.ts || '0')

    return {
        timestamp: ts,
        type: 'ic',
        text: cleanText,
    }
}

/**
 * Parse incident resolution message
 * Format: "✅ Incident resolved by <@USER> after Xh Ym"
 */
export function parseResolveEvent(message: SlackMessage): TimelineEvent | null {
    const text = message.text || ''

    // Check for checkmark emoji (Unicode or Slack emoji notation)
    if ((!text.includes('✅') && !text.includes(':white_check_mark:')) || !text.includes('Incident resolved')) {
        return null
    }

    const ts = parseFloat(message.ts || '0')

    // Extract user
    const userMatch = text.match(/<@(\w+)>/)
    const user = userMatch ? userMatch[1] : undefined

    return {
        timestamp: ts,
        type: 'resolve',
        text: `Incident resolved by <@${user}>`,
        user,
    }
}

/**
 * Parse all timeline events from a list of Slack messages
 */
export function parseTimelineEvents(messages: SlackMessage[]): TimelineEvent[] {
    const events: TimelineEvent[] = []

    for (const message of messages) {
        // Try each parser
        const logEvent = parseLogEvent(message)
        if (logEvent) {
            events.push(logEvent)
            continue
        }

        const updateEvent = parseUpdateEvent(message)
        if (updateEvent) {
            events.push(updateEvent)
            continue
        }

        const icEvent = parseICEvent(message)
        if (icEvent) {
            events.push(icEvent)
            continue
        }

        const resolveEvent = parseResolveEvent(message)
        if (resolveEvent) {
            events.push(resolveEvent)
            continue
        }
    }

    return events
}

/**
 * Sort events by timestamp (oldest first)
 */
export function sortTimelineEvents(events: TimelineEvent[]): TimelineEvent[] {
    return [...events].sort((a, b) => a.timestamp - b.timestamp)
}

/**
 * Get unique participants from messages (excludes bots)
 */
export function getParticipants(messages: SlackMessage[]): Set<string> {
    const participants = new Set<string>()

    messages.forEach(m => {
        if (m.user && !m.bot_id && m.subtype !== 'bot_message') {
            participants.add(m.user)
        }
    })

    return participants
}

