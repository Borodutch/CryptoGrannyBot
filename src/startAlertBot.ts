import { alertBot } from '@/helpers/alertBot'

export function startAlertBot() {
  // Errors
  alertBot.catch(console.error)
  // Start bot
  alertBot.launch().then(() => {
    console.info(`Bot ${alertBot.botInfo.username} is up and running`)
  })
}
