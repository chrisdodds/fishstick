/**
 * Centralized type definitions for Fishstick.
 * These types are used across the codebase for Slack API responses and incident data.
 */

// ============================================================================
// Incident Types
// ============================================================================

/**
 * Full incident metadata stored/reconstructed from Slack channel properties
 */
export interface IncidentMetadata {
    name: string
    issue: string
    start_user_id: string
    start_user_name: string
    incident_commander_id?: string
    incident_commander_name?: string
    is_private: boolean
    created_at: string
    closed_at?: string
    summary_message_ts?: string
    team_message_ts?: string
}

/**
 * Data extracted from parsing an incident summary message
 */
export interface ParsedIncidentData {
    issue: string
    start_user_id: string
    incident_commander_id: string
    team_message_ts?: string
}

/**
 * Timeline event types for incident history
 */
export type TimelineEventType = 'start' | 'log' | 'update' | 'ic' | 'resolve'

/**
 * A single event in an incident timeline
 */
export interface TimelineEvent {
    timestamp: number
    type: TimelineEventType
    text: string
    user?: string
}

/**
 * Result of requiring an incident channel for a command
 */
export type RequireIncidentResult =
    | { success: true; incident: IncidentMetadata }
    | { success: false; error: string }

// ============================================================================
// Slack API Response Types
// ============================================================================

/**
 * Slack channel information
 */
export interface SlackChannel {
    id?: string
    name?: string
    is_private?: boolean
    created?: number
}

/**
 * Response from conversations.info API
 */
export interface ConversationInfoResponse {
    channel?: SlackChannel
}

/**
 * Response from conversations.list API
 */
export interface ConversationsListResponse {
    channels?: SlackChannel[]
}

/**
 * A pinned item from pins.list API
 */
export interface SlackPinItem {
    message?: {
        ts?: string
        text?: string
        blocks?: SlackBlock[]
        files?: SlackFile[]
    }
}

/**
 * Response from pins.list API
 */
export interface PinsListResponse {
    items?: SlackPinItem[]
}

/**
 * Response from conversations.history API
 */
export interface HistoryResponse {
    messages?: SlackMessage[]
}

// ============================================================================
// Slack Block Types
// ============================================================================

/**
 * Base Slack block type
 */
export interface SlackBlock {
    type: string
    [key: string]: unknown
}

/**
 * Slack section block with text
 */
export interface SlackSectionBlock extends SlackBlock {
    type: 'section'
    text?: {
        type: string
        text: string
    }
}

/**
 * Slack context block with elements
 */
export interface SlackContextBlock extends SlackBlock {
    type: 'context'
    elements?: SlackElement[]
}

/**
 * Slack block element (used in context blocks, etc.)
 */
export interface SlackElement {
    type: string
    text?: string
    [key: string]: unknown
}

/**
 * Slack file attachment
 */
export interface SlackFile {
    id?: string
    name?: string
    mimetype?: string
    url_private?: string
    [key: string]: unknown
}

// ============================================================================
// Slack Message Types
// ============================================================================

/**
 * A Slack message (from history, pins, etc.)
 */
export interface SlackMessage {
    ts?: string
    text?: string
    blocks?: SlackBlock[]
    user?: string
    bot_id?: string
    subtype?: string
    files?: SlackFile[]
    [key: string]: unknown
}

/**
 * Type guard to check if a block is a section block with text
 */
export function isSectionBlock(block: SlackBlock): block is SlackSectionBlock {
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
 * Type guard to check if a block is a context block with elements
 */
export function isContextBlock(block: SlackBlock): block is SlackContextBlock {
    return block.type === 'context' && 'elements' in block && Array.isArray(block.elements)
}
