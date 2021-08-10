import { Context } from 'telegraf'
import { sendReturns } from '@/handlers/sendReturns'
import { SubscriptionStatus } from '@/models'

export async function sendHelp(ctx: Context) {
  const startPayload = (ctx as any).startPayload as string
  if (startPayload && startPayload === 'returns') {
    return sendReturns(ctx)
  }
  if (startPayload && startPayload === 'en') {
    const user = ctx.dbuser
    user.language = 'en'
    await user.save()
    const anyI18N = ctx.i18n as any
    anyI18N.locale('en')
  }
  return ctx.replyWithHTML(ctx.i18n.t('help'), {
    reply_markup: { inline_keyboard: helpKeyboard(ctx) },
  })
}

function helpKeyboard(ctx: Context) {
  return [
    [
      {
        text:
          ctx.dbuser.subscriptionStatus === SubscriptionStatus.inactive
            ? ctx.i18n.t('buy_subscription_button')
            : ctx.i18n.t('manage_subscription_button'),
        callback_data: 'subscription',
      },
    ],
  ]
}
