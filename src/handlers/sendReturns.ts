import { Context } from 'telegraf'

export async function sendReturns(ctx: Context) {
  return ctx.replyWithHTML(ctx.i18n.t('returns'))
}
