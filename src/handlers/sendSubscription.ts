import I18N from 'telegraf-i18n'
import { prices } from '@/helpers/prices'
import { alertBot } from '@/helpers/alertBot'
import { channels } from '@/helpers/channels'
import { stripe } from '@/helpers/stripe'
import { SubscriptionStatus, User } from '@/models'
import { Context } from 'telegraf'
import { bot } from '@/helpers/bot'
import { i18n } from '@/helpers/i18n'
import I18n from 'telegraf-i18n'

export async function sendSubscriptionToUser(user: User) {
  const localization = i18n.createContext(user.language, {}) as any as I18n
  try {
    await Promise.all(
      Object.values(channels).map((channelId) =>
        alertBot.telegram.unbanChatMember(channelId, user.id)
      )
    )
  } catch (e) {
    console.error(`Cannot unban user ${user.id}`, e.message || e)
  }
  return bot.telegram.sendMessage(
    user.id,
    localization.t(
      user.subscriptionStatus === SubscriptionStatus.lifetime
        ? 'lifetime_subscription'
        : 'active_subscription'
    ),
    {
      reply_markup: {
        inline_keyboard: await invitesKeyboard(user, localization),
      },
    }
  )
}

export async function sendSubscription(ctx: Context) {
  if (ctx.callbackQuery) {
    await ctx.answerCbQuery()
    try {
      await ctx.telegram.sendChatAction(ctx.chat.id, 'typing')
    } catch (e) {
      console.error('Cannot send typing action', e.message || e)
    }
  }
  if (
    ctx.dbuser.subscriptionStatus === SubscriptionStatus.lifetime ||
    ctx.dbuser.subscriptionStatus === SubscriptionStatus.active
  ) {
    try {
      await Promise.all(
        Object.values(channels).map((channelId) =>
          alertBot.telegram.unbanChatMember(channelId, ctx.from.id)
        )
      )
    } catch (e) {
      console.error(`Cannot unban user ${ctx.from.id}`, e.message || e)
    }
    return ctx.reply(
      ctx.i18n.t(
        ctx.dbuser.subscriptionStatus === SubscriptionStatus.lifetime
          ? 'lifetime_subscription'
          : 'active_subscription'
      ),
      {
        reply_markup: {
          inline_keyboard: await invitesKeyboard(ctx.dbuser, ctx.i18n),
        },
      }
    )
  }
  return ctx.reply(ctx.i18n.t('inactive_subscription'), {
    reply_markup: { inline_keyboard: await subscriptionsKeyboard(ctx) },
  })
}

async function invitesKeyboard(user: User, i18n: I18N) {
  const unixTimestampInTenMinutes = Math.floor(Date.now() / 1000) + 600
  const mainInvite = await alertBot.telegram.createChatInviteLink(
    channels.live,
    {
      expire_date: unixTimestampInTenMinutes,
    }
  )
  const onePlusInvite = await alertBot.telegram.createChatInviteLink(
    channels.liveOnePlus,
    {
      expire_date: unixTimestampInTenMinutes,
    }
  )
  const tenPlusInvite = await alertBot.telegram.createChatInviteLink(
    channels.liveTenPlus,
    {
      expire_date: unixTimestampInTenMinutes,
    }
  )

  const keyboard = []
  if (user.subscriptionStatus === SubscriptionStatus.active) {
    const subscription = await stripe.subscriptions.retrieve(
      user.subscriptionId
    )
    const customerId = subscription.customer as string
    const url = (
      await stripe.billingPortal.sessions.create({
        customer: customerId,
      })
    ).url
    keyboard.push([
      {
        text: i18n.t('manage_subscription_button'),
        url,
      },
    ])
  }
  keyboard.push([{ text: 'Crypto Granny Live', url: mainInvite.invite_link }])
  keyboard.push([
    { text: 'Crypto Granny Live #one_plus', url: onePlusInvite.invite_link },
  ])
  keyboard.push([
    { text: 'Crypto Granny Live #ten_plus', url: tenPlusInvite.invite_link },
  ])
  return keyboard
}

async function subscriptionsKeyboard(ctx: Context) {
  const monthlySession = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price: prices.monthly,
        quantity: 1,
      },
    ],
    success_url: `https://t.me/CryptoGrannyBot`,
    cancel_url: `https://t.me/CryptoGrannyBot`,
    client_reference_id: `${ctx.from.id}`,
    locale: (ctx.i18n.locale() || 'en') as 'en' | 'ru',
    mode: 'subscription',
    allow_promotion_codes: true,
  })
  const yearlySession = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price: prices.yearly,
        quantity: 1,
      },
    ],
    success_url: `https://t.me/CryptoGrannyBot`,
    cancel_url: `https://t.me/CryptoGrannyBot`,
    client_reference_id: `${ctx.from.id}`,
    locale: (ctx.i18n.locale() || 'en') as 'en' | 'ru',
    mode: 'subscription',
    allow_promotion_codes: true,
  })
  const lifetimeSession = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price: prices.lifetime,
        quantity: 1,
      },
    ],
    success_url: `https://t.me/CryptoGrannyBot`,
    cancel_url: `https://t.me/CryptoGrannyBot`,
    client_reference_id: `${ctx.from.id}`,
    locale: (ctx.i18n.locale() || 'en') as 'en' | 'ru',
    mode: 'payment',
    allow_promotion_codes: true,
  })
  return [
    [
      {
        text: ctx.i18n.t('montly_subscription_button'),
        url: monthlySession.url,
      },
    ],
    [
      {
        text: ctx.i18n.t('yearly_subscription_button'),
        url: yearlySession.url,
      },
    ],
    [
      {
        text: ctx.i18n.t('lifetime_subscription_button'),
        url: lifetimeSession.url,
      },
    ],
  ]
}
