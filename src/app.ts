// Setup @/ aliases for modules
import 'module-alias/register'
// Config dotenv
import * as dotenv from 'dotenv'
dotenv.config({ path: `${__dirname}/../.env` })
// Dependencies
import { startBot } from '@/startBot'
import { startArbitrager } from '@/startArbitrager'
import { startAlertBot } from '@/startAlertBot'

startBot()
startAlertBot()
startArbitrager()
