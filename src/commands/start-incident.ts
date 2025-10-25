import { SlashCommand } from '@slack/bolt'
import { WebClient } from '@slack/web-api'

async function startIncident(body: SlashCommand, client: WebClient) {
    await client.views.open({
        trigger_id: body.trigger_id,
        view: {
            type: 'modal',
            callback_id: 'start_incident',
            title: {
                type: 'plain_text',
                text: 'Start Incident',
            },
            submit: {
                type: 'plain_text',
                text: 'Start',
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
                        text: 'Brief description of the issue',
                    },
                    block_id: 'incident_issue',
                    element: {
                        type: 'plain_text_input',
                        action_id: 'incident_issue_input',
                        max_length: 400,
                        multiline: true,
                        placeholder: {
                            type: 'plain_text',
                            text: `Give some brief context for others working the incident.\n\nTake a deep breath. You've got this.`,
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
                    block_id: 'incident_options',
                    element: {
                        type: 'checkboxes',
                        action_id: 'incident_options_input',
                        options: [
                            {
                                value: 'private',
                                text: {
                                    type: 'plain_text',
                                    text: 'Make channel private',
                                },
                            },
                            {
                                value: 'test_mode',
                                text: {
                                    type: 'plain_text',
                                    text: 'Test mode (skip team announcement)',
                                },
                            },
                        ],
                    },
                },
            ],
        },
    })
}

export default startIncident
