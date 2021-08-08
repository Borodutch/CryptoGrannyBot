import { PotentialArbitrage } from '@/models/PotentialArbitrage'
import { exchangesMap, tickers } from '@/helpers/ccxt'
import { addDeal } from '@/helpers/addDeal'

export function startArbitrager() {
  setInterval(checkArbitrage, 5000)
}

function checkArbitrage() {
  const symbols = {}
  for (const exchange in tickers) {
    const exchangeTickers = tickers[exchange]
    for (const ticker in exchangeTickers) {
      if (!symbols[ticker]) {
        symbols[ticker] = {}
      }
      const fee = (exchangesMap[exchange].fees as any).trading.taker
      symbols[ticker][exchange] = {
        ask: exchangeTickers[ticker].ask,
        bid: exchangeTickers[ticker].bid,
        fee,
      }
    }
  }
  for (const symbol in symbols) {
    if (Object.keys(symbols[symbol]).length < 2) {
      delete symbols[symbol]
    }
  }
  const potentialArbitrages = [] as PotentialArbitrage[]
  for (const symbol in symbols) {
    const exchangeMap = symbols[symbol]
    let lowestAsk = Infinity
    let lowestExchange: string
    let lowestFee: number
    let highestBid = 0
    let highestExchange: string
    let highestFee: number
    for (const exchange in exchangeMap) {
      const { ask, bid, fee } = exchangeMap[exchange]
      if (ask < lowestAsk) {
        lowestAsk = ask
        lowestExchange = exchange
        lowestFee = fee
      }
      if (bid > highestBid) {
        highestBid = bid
        highestExchange = exchange
        highestFee = fee
      }
    }
    const lowestAskWithFee = lowestAsk * (1 + lowestFee)
    const highestBidWithFee = highestBid * (1 - highestFee)
    if (
      ((highestBidWithFee - lowestAskWithFee) / lowestAskWithFee) * 100 >
      0.01
    ) {
      potentialArbitrages.push({
        symbol,
        lowestAsk,
        lowestExchange,
        lowestFee,
        highestBid,
        highestExchange,
        highestFee,
        exchangePrices: Object.keys(exchangeMap).map((key) => ({
          ...exchangeMap[key],
          name: key,
        })),
      })
    }
  }
  for (const potentialArbitrage of potentialArbitrages) {
    addDeal(potentialArbitrage)
  }
}
