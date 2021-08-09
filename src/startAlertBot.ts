import { DealModel } from '@/models'
import { alertBot, reportDeal } from '@/helpers/alertBot'

export function startAlertBot() {
  // Errors
  alertBot.catch(console.error)
  // Start bot
  alertBot.launch().then(() => {
    console.info(`Bot ${alertBot.botInfo.username} is up and running`)
  })
}

async function checkFreeAndReport() {
  const hourAgo = new Date()
  hourAgo.setHours(hourAgo.getHours() - 1)
  const hourAndFifteenMinutesAgo = new Date()
  hourAndFifteenMinutesAgo.setHours(hourAndFifteenMinutesAgo.getHours() - 1)
  hourAndFifteenMinutesAgo.setMinutes(
    hourAndFifteenMinutesAgo.getMinutes() - 15
  )
  const deals = await DealModel.find({
    createdAt: {
      $lte: hourAgo,
      $gt: hourAndFifteenMinutesAgo,
    },
    sentToFreeChannel: false,
  })
  for (const deal of deals) {
    reportDeal(deal, true)
    deal.sentToFreeChannel = true
    deal.save()
  }
}

setInterval(checkFreeAndReport, 10 * 1000)
