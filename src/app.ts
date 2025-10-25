import IncidentCommand from './commands/incident.js'
import { app } from './slack.js'
import ModalListeners from './listeners/listeners.js'
import { config } from './config.js'

;(async () => {
    try {
        IncidentCommand()

        ModalListeners()

        await app.start(config.server.port)
        console.log('⚡️ Bolt app is running!')
    } catch (error) {
        console.error(error)
    }
})()