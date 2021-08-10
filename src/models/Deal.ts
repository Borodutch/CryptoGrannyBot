import { prop, getModelForClass } from '@typegoose/typegoose'

export class ExchangePrices {
  @prop({ required: true })
  name: string
  @prop()
  ask?: number
  @prop()
  bid?: number
  @prop()
  close?: number
}

export class Deal {
  @prop({ required: true, index: true })
  pair: string
  @prop({ required: true, index: true })
  buyExchange: string
  @prop({ required: true, index: true })
  sellExchange: string
  @prop({ required: true, index: true })
  lowestAsk: number
  @prop({ required: true, index: true })
  highestBid: number
  @prop({ required: true })
  lowestFee: number
  @prop({ required: true })
  highestFee: number
  @prop({ required: true, type: () => ExchangePrices })
  exchangePrices: ExchangePrices[]
  @prop({ required: true, default: false, index: true })
  sentToFreeChannel: boolean
  @prop({ required: true, default: false })
  isDex: boolean
}

export const DealModel = getModelForClass(Deal, {
  schemaOptions: { timestamps: true },
})
