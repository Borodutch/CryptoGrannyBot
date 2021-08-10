import { Context } from 'koa'
import { Controller, Ctx, Post } from 'amala'
import { stripe } from '@/helpers/stripe'
import { SubscriptionStatus, UserModel } from '@/models'
import { channels } from '@/helpers/channels'
import { alertBot } from '@/helpers/alertBot'
import { sendSubscriptionToUser } from '@/handlers/sendSubscription'

@Controller('/webhook')
export default class WebhookController {
  @Post('/')
  async webhook(@Ctx() ctx: Context) {
    try {
      // Construct event
      const event = stripe.webhooks.constructEvent(
        String(ctx.request.rawBody),
        ctx.headers['stripe-signature'],
        process.env.STRIPE_SIGNING_SECRET
      )
      // Handle event
      if (event.type === 'customer.subscription.deleted') {
        const anyData = event.data.object as any
        const subscriptionId = anyData.id
        const user = await UserModel.findOne({ subscriptionId })
        const userId = user.id
        if (!user) {
          return ctx.throw(
            400,
            `Webhook Error: No user found for subscription id ${subscriptionId}`
          )
        }
        if (user.subscriptionStatus !== SubscriptionStatus.lifetime) {
          user.subscriptionStatus = SubscriptionStatus.inactive
        }
        await user.save()
        try {
          await Promise.all(
            [channels.live, channels.liveOnePlus, channels.liveTenPlus].map(
              (channel) => alertBot.telegram.kickChatMember(channel, userId)
            )
          )
        } catch (e) {
          console.error(`Error kicking user ${userId}`, e.message || e)
        }
      } else if (event.type === 'checkout.session.completed') {
        const anyData = event.data.object as any
        const userId = +anyData.client_reference_id
        const user = await UserModel.findOne({ id: userId })
        if (!user) {
          return ctx.throw(
            400,
            `Webhook Error: No user found with id ${userId}`
          )
        }
        if (anyData.mode === 'subscription') {
          user.subscriptionId = anyData.subscription
          user.subscriptionStatus = SubscriptionStatus.active
        } else {
          user.subscriptionStatus = SubscriptionStatus.lifetime
        }
        await user.save()
        try {
          await sendSubscriptionToUser(user)
        } catch (e) {
          console.error(`Error sending subscription to user ${userId}`)
        }
      }
      // Respond
      return { received: true }
    } catch (err) {
      return ctx.throw(400, `Webhook Error: ${err.message}`)
    }
  }
}
