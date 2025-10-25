import { app } from '../slack'
import { getIncidentMetadata, getTeamMessageTs } from '../storage'
import { config } from '../config'

async function updateIncidentModal() {
    app.view('update_incident', async ({ ack, body, view, client, logger }) => {
        await ack()

        try {
            const channelId = body.view.private_metadata

            if (!channelId) {
                logger.error('No channel ID in private_metadata')
                return
            }

            const incident = await getIncidentMetadata(client, channelId)

            if (!incident) {
                logger.error('No incident found in channel')
                return
            }

            const updateInput = view.state.values.incident_update?.incident_update_input
            const updateValue = updateInput?.value

            if (!updateValue) {
                logger.error('No update value provided')
                return
            }

            const optionsInput = view.state.values.update_options?.update_options_input
            const selectedOptions = optionsInput?.selected_options || []
            const alsoPostToMainChannel = selectedOptions.some(opt => opt.value === 'post_to_channel')

            // Always update team channel with threading (if configured)
            const teamUpdateChannelId = config.incident.teamUpdateChannelId
            let teamUpdateSent = false

            if (teamUpdateChannelId) {
                // Get team message ts from pinned message
                const teamMessageTs = await getTeamMessageTs(client, channelId)

                if (teamMessageTs) {
                    // Post as thread on the original team message
                    // Use reply_broadcast to also show in main channel if checkbox is checked
                    await client.chat.postMessage({
                        channel: teamUpdateChannelId,
                        thread_ts: teamMessageTs,
                        reply_broadcast: alsoPostToMainChannel,
                        text: `📢 Update from <@${body.user.id}> at <!date^${Math.floor(Date.now() / 1000)}^{time}|now>:\n\n${updateValue}`,
                    })
                    teamUpdateSent = true
                }
            }

            // ALSO post update to incident channel if checkbox is checked
            if (alsoPostToMainChannel) {
                await client.chat.postMessage({
                    channel: channelId,
                    text: `📢 Update from <@${body.user.id}>:\n\n${updateValue}`,
                })
            }

            // Confirmation message
            let confirmText = ''
            if (teamUpdateSent && alsoPostToMainChannel) {
                confirmText = 'Update sent to team channel (visible in main channel) and posted in incident channel.'
            } else if (teamUpdateSent) {
                confirmText = 'Update sent to team channel thread.'
            } else if (alsoPostToMainChannel) {
                confirmText = 'Update posted in incident channel only (no team channel configured).'
            } else {
                confirmText = 'No team channel configured.'
            }

            await client.chat.postEphemeral({
                channel: channelId,
                text: confirmText,
                user: body.user.id,
            })
        } catch (error) {
            logger.error(error)
        }
    })
}

export default updateIncidentModal

