import { PotentialArbitrage } from '@/models/PotentialArbitrage'
import { exchangesMap, tickers } from '@/helpers/ccxt'
import { addDeal } from '@/helpers/addDeal'
import { dexTickers } from '@/helpers/dex'

export function startArbitrager() {
  console.log('Arbitrager launched')
  setInterval(checkArbitrage, 5000)
}

function checkArbitrage() {
  checkCentralizedExchanges()
  checkDecentralizedExchanges()
}

function checkCentralizedExchanges() {
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

function checkDecentralizedExchanges() {
  const symbols = {} as {
    [symbol: string]: {
      [exchange: string]: { close: number; base: string; quote: string }
    }
  }
  for (const exchange in dexTickers) {
    const tickers = dexTickers[exchange].filter((t) => !!t)
    for (const ticker of tickers) {
      const symbol = `${ticker.baseReference}/${ticker.quoteReference}`
      if (!symbols[symbol]) {
        symbols[symbol] = {}
      }
      symbols[symbol][exchange] = {
        close: ticker.close,
        base: ticker.base,
        quote: ticker.quote,
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
    let lowestFee: number = 0
    let highestBid = 0
    let highestExchange: string
    let highestFee: number = 0
    const baseAddress = symbol.split('/')[0]
    const quoteAddress = symbol.split('/')[1]
    const base = Object.values(exchangeMap)[0].base
    const quote = Object.values(exchangeMap)[0].quote
    for (const exchange in exchangeMap) {
      const { close } = exchangeMap[exchange]
      if (close < lowestAsk) {
        lowestAsk = close
        lowestExchange = exchange
      }
      if (close > highestBid) {
        highestBid = close
        highestExchange = exchange
      }
    }
    const lowestAskWithFee = lowestAsk * (1 + lowestFee)
    const highestBidWithFee = highestBid * (1 - highestFee)
    if (
      ((highestBidWithFee - lowestAskWithFee) / lowestAskWithFee) * 100 >
        0.01 &&
      !!base &&
      !!quote
    ) {
      potentialArbitrages.push({
        symbol: `${base}/${quote}`,
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
        buyExchangeLink: exchangeLink(
          lowestExchange,
          baseAddress,
          quoteAddress,
          'buy'
        ),
        sellExchangeLink: exchangeLink(
          highestExchange,
          baseAddress,
          quoteAddress,
          'sell'
        ),
      })
    }
  }
  for (const potentialArbitrage of potentialArbitrages) {
    addDeal(potentialArbitrage, true)
  }
}

function exchangeLink(
  exchange: string,
  baseAddress: string,
  quoteAddress: string,
  buyOrSell: 'buy' | 'sell'
) {
  if (exchange === 'uniswap2') {
    return `https://app.uniswap.org/#/swap?use=v2&inputCurrency=${
      buyOrSell === 'buy' ? quoteAddress : baseAddress
    }&outputCurrency=${buyOrSell === 'buy' ? baseAddress : quoteAddress}`
  } else if (exchange === 'uniswap3') {
    return `https://app.uniswap.org/#/swap?use=v3&inputCurrency=${
      buyOrSell === 'buy' ? quoteAddress : baseAddress
    }&outputCurrency=${buyOrSell === 'buy' ? baseAddress : quoteAddress}`
  } else if (exchange === 'oneInch') {
    return `https://app.1inch.io/#/1/swap/${
      buyOrSell === 'buy' ? quoteAddress : baseAddress
    }/${buyOrSell === 'buy' ? baseAddress : quoteAddress}`
  } else if (exchange === 'sushiswap') {
    return `https://app.sushi.com/swap?inputCurrency=${
      buyOrSell === 'buy' ? quoteAddress : baseAddress
    }&outputCurrency=${buyOrSell === 'buy' ? baseAddress : quoteAddress}`
  } else if (exchange === 'honeyswap') {
    return 'https://app.honeyswap.org/#/swap'
  }
  return
}
