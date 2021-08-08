import * as ccxt from 'ccxt'

// Exchange objects
console.log('Initializing exchanges...')
export const exchangesMap = {} as { [key: string]: ccxt.Exchange }
for (const exchange of ccxt.exchanges.filter((exchange) =>
  [
    'bitfinex',
    'binance',
    'exmo',
    'kucoin',
    'kraken',
    'wavesexchange',
    'huobi',
    'coinbase',
    'bittrex',
    'ftx',
  ].includes(exchange)
)) {
  const exchangeObject = new ccxt[exchange]() as ccxt.Exchange
  if (exchangeObject.hasFetchTickers && exchangeObject.hasFetchCurrencies) {
    exchangesMap[exchange] = exchangeObject
  }
}
console.log(
  `${Object.keys(exchangesMap).length} Exchanges initialized: ${Object.keys(
    exchangesMap
  ).join(', ')}`
)

// Ticker fetcher
console.log('Starting ticker fetcher...')
export const tickers = {}
export const currencies = {}
const tickersRefreshLocks = {}
for (const exchange of Object.values(exchangesMap)) {
  const checkExchange = async () => {
    if (tickersRefreshLocks[exchange.id]) {
      return
    }
    tickersRefreshLocks[exchange.id] = true
    try {
      // Fetch tickers
      const fetchedTickers = await exchange.fetchTickers()
      const filteredTickers = {}
      for (const ticker of Object.values(fetchedTickers)) {
        if (ticker.ask && ticker.bid) {
          filteredTickers[ticker.symbol] = ticker
        }
      }
      tickers[exchange.id] = filteredTickers
      // Fetch currencies
      // currencies[exchange.id] = await exchange.fetchCurrencies()
    } catch (e) {
      console.error(`Could not refresh ${exchange.id} tickers`)
    } finally {
      tickersRefreshLocks[exchange.id] = false
    }
  }
  setInterval(checkExchange, 5 * 1000)
  checkExchange()
}
console.log(`Ticker fetcher started`)
