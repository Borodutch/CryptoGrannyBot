import { channels } from '@/helpers/channels'
import { Deal } from '@/models/Deal'
import { Telegraf } from 'telegraf'
import { ExtraReplyMessage } from 'telegraf/typings/telegram-types'

export const alertBot = new Telegraf(process.env.ALERT_TOKEN)

function listOrderedExchanges(deal: Deal) {
  if (deal.exchangePrices.length < 3) {
    return ''
  }
  const orderedExchanges = deal.exchangePrices.sort((a, b) =>
    !!b.close ? b.close - a.close : b.ask - a.ask
  )
  return `\n${orderedExchanges
    .map((exchange) =>
      exchange.close
        ? `${exchange.name}, close: ${exchange.close}`
        : `${exchange.name}, ask: ${exchange.ask}, bid: ${exchange.bid}`
    )
    .join('\n')}`
}

export async function reportDeal(deal: Deal, free: boolean) {
  const highestBidWithFee = deal.highestBid * (1 - deal.highestFee)
  const lowestAskWithFee = deal.lowestAsk * (1 + deal.lowestFee)
  const percentageBetweenHighestAndLowest = (
    ((highestBidWithFee - lowestAskWithFee) / lowestAskWithFee) *
    100
  ).toFixed(2)
  // Send to the main channel
  sendDealToChannel(
    deal,
    free,
    free ? channels.free : channels.live,
    percentageBetweenHighestAndLowest
  )
  // Send to the one plus channel
  if (+percentageBetweenHighestAndLowest >= 1) {
    sendDealToChannel(
      deal,
      free,
      free ? channels.freeOnePlus : channels.liveOnePlus,
      percentageBetweenHighestAndLowest
    )
  }
  // Send to the ten plus channel
  if (+percentageBetweenHighestAndLowest >= 10) {
    sendDealToChannel(
      deal,
      free,
      free ? channels.freeTenPlus : channels.liveTenPlus,
      percentageBetweenHighestAndLowest
    )
  }
}

async function sendDealToChannel(
  deal: Deal,
  free: boolean,
  channel: string,
  percentageBetweenHighestAndLowest: string
) {
  const message = `${free ? '<b>1 hour ago:</b>\n' : ''}#${deal.pair.replace(
    '/',
    '_'
  )} +${percentageBetweenHighestAndLowest}%${
    +percentageBetweenHighestAndLowest >= 1 ? ' #one_plus' : ''
  }${+percentageBetweenHighestAndLowest >= 10 ? ' #ten_plus' : ''}${
    deal.isDex ? ' #dex' : ''
  }
<b>${
    deal.buyExchangeLink
      ? `<a href="${deal.buyExchangeLink}">${deal.buyExchange}</a>`
      : deal.buyExchange
  }</b> (${deal.lowestAsk}) ➡️ <b>${
    deal.sellExchangeLink
      ? `<a href="${deal.sellExchangeLink}">${deal.sellExchange}</a>`
      : deal.sellExchange
  }</b> (${deal.highestBid})
${listOrderedExchanges(deal)}`
  const options = {
    parse_mode: 'HTML',
    disable_web_page_preview: true,
  } as ExtraReplyMessage
  if (free) {
    options.reply_markup = {
      inline_keyboard: [
        [
          {
            text: 'Remove 1 hour delay',
            url: 'https://t.me/CryptoGrannyBot?start=en',
          },
        ],
      ],
    }
  }
  try {
    await alertBot.telegram.sendMessage(channel, message, options)
  } catch (e) {
    console.error('Error adding deal to live channel', e.message || e)
  }
}
