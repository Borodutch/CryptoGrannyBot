import { DealModel } from '@/models'
import { PotentialArbitrage } from '@/models/PotentialArbitrage'
import { reportDeal } from '@/helpers/alertBot'

export async function addDeal(
  potentialArbitrage: PotentialArbitrage,
  isDex = false
) {
  const anHourAgo = new Date()
  anHourAgo.setHours(anHourAgo.getHours() - 1)
  const previousDeal = await DealModel.findOne({
    pair: potentialArbitrage.symbol,
    buyExchange: potentialArbitrage.lowestExchange,
    sellExchange: potentialArbitrage.highestExchange,
    createdAt: { $gte: anHourAgo },
  })
  if (previousDeal) {
    return
  }
  const deal = await DealModel.create({
    pair: potentialArbitrage.symbol,
    buyExchange: potentialArbitrage.lowestExchange,
    sellExchange: potentialArbitrage.highestExchange,
    lowestAsk: potentialArbitrage.lowestAsk,
    highestBid: potentialArbitrage.highestBid,
    exchangePrices: potentialArbitrage.exchangePrices,
    lowestFee: potentialArbitrage.lowestFee,
    highestFee: potentialArbitrage.highestFee,
    buyExchangeLink: potentialArbitrage.buyExchangeLink,
    sellExchangeLink: potentialArbitrage.sellExchangeLink,
    isDex,
  })
  return reportDeal(deal, false)
}
