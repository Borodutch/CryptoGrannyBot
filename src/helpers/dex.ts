import * as exchanges from '@coinranking/exchanges'

export const dexTickers = {}

const exchangesMap = {
  uniswap2: new exchanges.Uniswap2(),
  uniswap3: new exchanges.Uniswap3(),
  oneInch: new exchanges['1inch'](),
  sushiswap: new exchanges.Sushiswap(),
  honeyswap: new exchanges.Honeyswap(),
}

// Ticker fetcher
console.log('Starting decentralized ticker fetcher...')
const tickersRefreshLocks = {}
for (const exchangeName in exchangesMap) {
  const exchange = exchangesMap[exchangeName]
  const checkExchange = async () => {
    if (tickersRefreshLocks[exchangeName]) {
      return
    }
    tickersRefreshLocks[exchangeName] = true
    try {
      // Fetch tickers
      const fetchedTickers = await exchange.fetchTickers()
      dexTickers[exchangeName] = fetchedTickers
    } catch (e) {
      console.error(`Could not refresh ${exchangeName} tickers`)
    } finally {
      tickersRefreshLocks[exchangeName] = false
    }
  }
  setInterval(checkExchange, 5 * 1000)
  checkExchange()
}
console.log(`Decentralized ticker fetcher started`)
