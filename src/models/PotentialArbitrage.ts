import { ExchangePrices } from '@/models/Deal'

export interface PotentialArbitrage {
  symbol: string
  lowestAsk: number
  lowestExchange: string
  lowestFee: number
  highestBid: number
  highestExchange: string
  highestFee: number
  exchangePrices: ExchangePrices[]
}
