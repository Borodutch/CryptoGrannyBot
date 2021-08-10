import { prop, getModelForClass } from '@typegoose/typegoose'

export enum SubscriptionStatus {
  inactive = 'inactive',
  active = 'active',
  lifetime = 'lifetime',
}

export class User {
  @prop({ required: true, index: true, unique: true })
  id: number

  @prop({ required: true, default: 'en' })
  language: string

  @prop()
  subscriptionId: string
  @prop({ enum: SubscriptionStatus, default: SubscriptionStatus.inactive })
  subscriptionStatus: SubscriptionStatus
}

// Get User model
export const UserModel = getModelForClass(User, {
  schemaOptions: { timestamps: true },
})

// Get or create user
export async function findUser(id: number) {
  let user = await UserModel.findOne({ id })
  if (!user) {
    // Try/catch is used to avoid race conditions
    try {
      user = await new UserModel({ id }).save()
    } catch (err) {
      user = await UserModel.findOne({ id })
    }
  }
  return user
}
