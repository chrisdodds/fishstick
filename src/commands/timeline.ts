import { SlashCommand, App } from '@slack/bolt'
import { WebClient } from '@slack/web-api'
import {
    parseTimelineEvents,
    sortTimelineEvents,
    getParticipants,
    type TimelineEvent,
} from '../parsers/timeline-parser'
import {
    requireIncidentChannel,
    formatDuration,
} from '../utils/command-helpers'

async function generateTimeline(
    body: SlashCommand,
    client: WebClient,
    logger: App['logger']
) {
    try {
        const result = await requireIncidentChannel(client, body.channel_id)

        if (!result.success) {
            await client.chat.postEphemeral({
                channel: body.channel_id,
                user: body.user_id,
                text: result.error,
            })
            return
        }

        const incident = result.incident

        // Get channel history
        const [history, pins] = await Promise.all([
            client.conversations.history({
                channel: body.channel_id,
                limit: 1000,
            }),
            client.pins.list({
                channel: body.channel_id,
            }),
        ])

        if (!history.messages) {
            await client.chat.postEphemeral({
                channel: body.channel_id,
                text: 'No messages found in this channel.',
                user: body.user_id,
            })
            return
        }

        // Extract all events into a unified timeline
        const allEvents: TimelineEvent[] = []

        // Add incident start as the first event
        if (incident.created_at && incident.start_user_id) {
            allEvents.push({
                timestamp: new Date(incident.created_at).getTime() / 1000,
                type: 'start',
                text: `Incident started by <@${incident.start_user_id}>`,
                user: incident.start_user_id,
            })
        }

        // Parse all timeline events from messages
        const parsedEvents = parseTimelineEvents(history.messages as never[])
        allEvents.push(...parsedEvents)

        // Sort all events by timestamp (oldest first)
        const sortedEvents = sortTimelineEvents(allEvents)

        // Calculate duration
        const createdAt = new Date(incident.created_at).getTime() / 1000
        const endTime = incident.closed_at
            ? new Date(incident.closed_at).getTime() / 1000
            : Math.floor(Date.now() / 1000)
        const durationSeconds = endTime - createdAt
        const durationStr = formatDuration(durationSeconds)

        // Build report
        let report = `*Incident Timeline Report*\n\n`
        report += `*Channel:* ${incident.name}\n`
        report += `*Issue:* ${incident.issue}\n`
        report += `*Duration:* ${durationStr}`

        if (incident.closed_at) {
            report += ` (resolved)`
        }
        report += `\n`

        if (incident.incident_commander_id) {
            report += `*Incident Commander:* <@${incident.incident_commander_id}>\n`
        }

        // Add participant count (exclude bot messages)
        const participants = getParticipants(history.messages as never[])
        // Subtract 1 to exclude the bot itself
        const participantCount = Math.max(0, participants.size - 1)
        report += `*Participants:* ${participantCount}\n`

        report += `\n---\n\n`

        // Unified timeline
        if (sortedEvents.length > 0) {
            report += `*📋 Timeline* (all times UTC)\n\n`
            sortedEvents.forEach(event => {
                const date = new Date(event.timestamp * 1000)
                const dateStr = date.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    timeZone: 'UTC'
                })
                const timeStr = date.toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false,
                    timeZone: 'UTC'
                })

                let prefix = ''
                let text = event.text

                if (event.type === 'start') {
                    prefix = '🚨'
                } else if (event.type === 'log') {
                    prefix = '🕐'
                    // User is already in the text from the parser
                } else if (event.type === 'update') {
                    prefix = '📢'
                    text = `<@${event.user}>: ${text}`
                } else if (event.type === 'ic') {
                    prefix = '🎯'
                } else if (event.type === 'resolve') {
                    prefix = '✅'
                }

                report += `• ${dateStr} ${timeStr} ${prefix} ${text}\n`
            })
            report += `\n`
        } else {
            report += `*📋 Timeline*\n\n_No events logged yet._\n\n`
        }

        // Pinned items (excluding the summary message)
        // Filter out the summary message by checking for the one with ts matching summary_message_ts
        const pinnedItems = pins.items?.filter((item: unknown) => {
            const pinnedItem = item as Record<string, unknown>
            const message = pinnedItem.message as Record<string, unknown> | undefined
            return message?.ts !== incident.summary_message_ts
        }) || []

        if (pinnedItems.length > 0) {
            report += `*📌 Pinned Items* (all times UTC)\n\n`
            pinnedItems.forEach((item: unknown) => {
                const pinnedItem = item as Record<string, unknown>
                const message = pinnedItem.message as Record<string, unknown> | undefined
                if (message) {
                    const timestamp = parseFloat(String(message.ts || '0'))
                    const date = new Date(timestamp * 1000)
                    const dateStr = date.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        timeZone: 'UTC'
                    })
                    const timeStr = date.toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false,
                        timeZone: 'UTC'
                    })

                    // Create link to message in channel
                    const messageTs = String(message.ts || '').replace('.', '')
                    const messageLink = `https://slack.com/archives/${body.channel_id}/p${messageTs}`

                    // Show file attachments
                    const files = message.files as Array<Record<string, unknown>> | undefined
                    if (files && files.length > 0) {
                        files.forEach((file: Record<string, unknown>) => {
                            const fileName = String(file.name || 'File')
                            report += `• ${dateStr} ${timeStr} - <${messageLink}|📎 ${fileName}>\n`
                        })
                    } else if (message.text) {
                        // Show text messages
                        const msgText = String(message.text)
                        const text = msgText.length > 100
                            ? msgText.substring(0, 100) + '...'
                            : msgText
                        report += `• ${dateStr} ${timeStr} - <${messageLink}|${text}>\n`
                    }
                }
            })
            report += `\n`
        }

        // Post report (ephemeral to avoid pinging participants)
        await client.chat.postEphemeral({
            channel: body.channel_id,
            user: body.user_id,
            text: report,
        })

    } catch (error) {
        logger.error('Error generating timeline:', error)
        await client.chat.postEphemeral({
            channel: body.channel_id,
            text: 'Failed to generate timeline. Please try again.',
            user: body.user_id,
        })
    }
}

export default generateTimeline

