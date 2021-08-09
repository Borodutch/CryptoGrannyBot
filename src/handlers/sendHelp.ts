import { Context } from 'telegraf'

export async function sendHelp(ctx: Context) {
  console.log((ctx as any).startPayload)
  const startPayload = (ctx as any).startPayload as string
  if (startPayload && startPayload === 'en') {
    const user = ctx.dbuser
    user.language = 'en'
    await user.save()
    const anyI18N = ctx.i18n as any
    anyI18N.locale('en')
  }
  return ctx.replyWithHTML(ctx.i18n.t('help'))
}
