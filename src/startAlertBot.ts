import { DealModel, findUser, SubscriptionStatus } from '@/models'
import { alertBot, reportDeal } from '@/helpers/alertBot'
import { channels } from './helpers/channels'

export function startAlertBot() {
  // Errors
  alertBot.catch(console.error)
  // Start bot
  alertBot
    .launch({
      allowedUpdates: [
        'callback_query',
        'channel_post',
        'chat_member',
        'chosen_inline_result',
        'edited_channel_post',
        'edited_message',
        'inline_query',
        'message',
        'my_chat_member',
        'pre_checkout_query',
        'poll_answer',
        'poll',
        'shipping_query',
      ],
    })
    .then(() => {
      console.info(`Bot ${alertBot.botInfo.username} is up and running`)
    })
  // Filter newcomers
  alertBot.on('chat_member', async (ctx) => {
    const liveChannels = [
      channels.en.live,
      channels.en.liveOnePlus,
      channels.en.liveTenPlus,
      channels.ru.live,
      channels.ru.liveOnePlus,
      channels.ru.liveTenPlus,
    ].map((v) => +v)
    if (!liveChannels.includes(ctx.chat.id)) {
      return
    }
    if (ctx.chatMember.new_chat_member.status === 'member') {
      const user = await findUser(ctx.chatMember.new_chat_member.user.id)
      if (user.subscriptionStatus === SubscriptionStatus.inactive) {
        try {
          await alertBot.telegram.kickChatMember(ctx.chat.id, user.id)
        } catch (e) {
          console.error(`Error kicking newcomer ${user.id}`, e.message || e)
        }
      }
    }
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
