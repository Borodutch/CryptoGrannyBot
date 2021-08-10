import * as mongoose from 'mongoose'

export async function startMongo(mongoUrl = process.env.MONGO) {
  try {
    await mongoose.connect(mongoUrl, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true,
      useFindAndModify: true,
    })
    console.log('Mongo launched')
  } catch (err) {
    console.error(`Mongo could not launch`, err.message || err)
  }
}

export * from './Deal'
export * from './User'
