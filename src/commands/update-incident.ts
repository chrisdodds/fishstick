import { SlashCommand } from '@slack/bolt'
import { WebClient } from '@slack/web-api'

import { requireIncidentChannel } from '../utils/command-helpers'

async function updateIncident(body: SlashCommand, client: WebClient) {
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

    if (incident.is_private) {
        await client.chat.postEphemeral({
            channel: body.channel_id,
            text: 'This incident channel is private so no public updates can be shared.',
            user: body.user_id,
        })
    } else {
            await client.views.open({
                trigger_id: body.trigger_id,
                view: {
                    type: 'modal',
                    callback_id: 'update_incident',
                    private_metadata: body.channel_id,
                    title: {
                        type: 'plain_text',
                        text: 'Send an update',
                    },
                    submit: {
                        type: 'plain_text',
                        text: 'Send',
                    },
                    close: {
                        type: 'plain_text',
                        text: 'Cancel',
                    },
                    blocks: [
                        {
                            type: 'input',
                            label: {
                                type: 'plain_text',
                                text: 'Update',
                            },
                            block_id: 'incident_update',
                            element: {
                                type: 'plain_text_input',
                                action_id: 'incident_update_input',
                                max_length: 300,
                                multiline: true,
                                placeholder: {
                                    type: 'plain_text',
                                    text: `This will be posted as a thread reply on the team announcement.`,
                                },
                            },
                        },
                        {
                            type: 'input',
                            optional: true,
                            label: {
                                type: 'plain_text',
                                text: ' ',
                            },
                            block_id: 'update_options',
                            element: {
                                type: 'checkboxes',
                                action_id: 'update_options_input',
                                options: [
                                    {
                                        value: 'post_to_channel',
                                        text: {
                                            type: 'plain_text',
                                            text: 'Also post in this incident channel',
                                        },
                                    },
                                ],
                            },
                        },
                    ],
                },
            })
    }
}

export default updateIncident

