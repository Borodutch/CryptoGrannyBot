import { Deal } from '@/models/Deal'
import { Telegraf } from 'telegraf'

export const alertBot = new Telegraf(process.env.ALERT_TOKEN)

function listOrderedExchanges(deal: Deal) {
  if (deal.exchangePrices.length < 3) {
    return ''
  }
  const orderedExchanges = deal.exchangePrices.sort((a, b) => b.ask - a.ask)
  return `\n${orderedExchanges
    .map(
      (exchange) =>
        `${exchange.name}, ask: ${exchange.ask}, bid: ${exchange.bid}`
    )
    .join('\n')}`
}

export async function reportDealToLive(deal: Deal) {
  const highestBidWithFee = deal.highestBid * (1 - deal.highestFee)
  const lowestAskWithFee = deal.lowestAsk * (1 + deal.lowestFee)
  const percentageBetweenHighestAndLowest = (
    ((highestBidWithFee - lowestAskWithFee) / lowestAskWithFee) *
    100
  ).toFixed(2)
  const message = `#${deal.pair.replace(
    '/',
    '_'
  )} +${percentageBetweenHighestAndLowest}%${
    +percentageBetweenHighestAndLowest >= 1 ? ' #one_plus' : ''
  }${+percentageBetweenHighestAndLowest >= 10 ? ' #ten_plus' : ''}
<b>${deal.buyExchange}</b> (${deal.lowestAsk}) ➡️ <b>${
    deal.sellExchange
  }</b> (${deal.highestBid})
${listOrderedExchanges(deal)}`
  try {
    await alertBot.telegram.sendMessage(
      process.env.ALERT_LIVE_CHAT_ID,
      message,
      {
        parse_mode: 'HTML',
      }
    )
  } catch (e) {
    console.error('Error adding deal to live channel', e.message || e)
  }
}
