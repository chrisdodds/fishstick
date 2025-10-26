import IncidentCommand from './commands/incident'
import { app } from './slack'
import ModalListeners from './listeners/listeners'
import { config } from './config'

;(async () => {
    try {
        IncidentCommand()

        ModalListeners()

        await app.start(config.server.port)
        app.logger.info('⚡️ Bolt app is running!')
    } catch (error) {
        app.logger.error('Failed to start app:', error)
    }
})()