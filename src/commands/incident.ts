import {app} from '../slack'
import startIncident from './start-incident'
import updateIncident from './update-incident'
import logIncidentEvent from './log-incident-event'
import icCheckIn from './ic-check-in'
import generateTimeline from './timeline'
import resolveIncident from './resolve-incident'

const IncidentCommand = () => {
    app.command('/incident', async ({ ack, body, client, logger }) => {
        await ack()

        try {
            const subcommand = body.text.toLowerCase().trim()

            if (subcommand === '' || subcommand === 'start') {
                // Start a new incident
                await startIncident(body, client)
            } else if (subcommand === 'update') {
                // Send an update
                await updateIncident(body, client)
            } else if (subcommand === 'ic') {
                // Check in as IC
                await icCheckIn(body, client, logger)
            } else if (subcommand === 'timeline') {
                // Generate timeline report
                await generateTimeline(body, client, logger)
            } else if (subcommand === 'resolve') {
                // Mark incident as resolved
                await resolveIncident(body, client, logger)
            } else if (subcommand === 'help') {
                // Show help
                await client.chat.postEphemeral({
                    channel: body.channel_id,
                    user: body.user_id,
                    text: '*Fishstick Incident Bot*\n\n`/incident` - Start a new incident\n`/incident update` - Send an update to the team channel\n`/incident ic` - Check in as Incident Commander\n`/incident log <event>` - Log a timeline event\n`/incident timeline` - Generate incident timeline report\n`/incident resolve` - Mark incident as resolved',
                })
            } else if (subcommand.startsWith('log ')) {
                // Log timeline event
                const eventText = body.text.substring(4).trim() // Remove "log " prefix
                await logIncidentEvent(eventText, body, client, logger)
            } else {
                // Unknown command
                await client.chat.postEphemeral({
                    channel: body.channel_id,
                    user: body.user_id,
                    text: `Unknown command: \`${body.text}\`\n\nTry \`/incident help\` for available commands.`,
                })
            }
        } catch (error) {
            logger.error(error)
        }
    })
}

export default IncidentCommand
