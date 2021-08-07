# [CryptoGrannyBot](https://t.me/CryptoGrannyBot) code

Crypto arbitrage alert bot.

# Installation and local launch

1. Clone this repo: `git clone https://github.com/Borodutch/CryptoGrannyBot`
2. Launch the [mongo database](https://www.mongodb.com/) locally
3. Create `.env` with the environment variables listed below
4. Run `yarn` in the root folder
5. Run `yarn develop`

And you should be good to go! Feel free to fork and submit pull requests. Thanks!

# Environment variables

- `TOKEN` — Telegram bot token
- `MONGO`— URL of the mongo database

Also, please, consider looking at `.env.sample`.

# Continuous integration

Any commit pushed to master gets deployed to [@CryptoGrannyBot](https://t.me/CryptoGrannyBot) via [CI Ninja](https://github.com/backmeupplz/ci-ninja).

# License

MIT — use for any purpose. Would be great if you could leave a note about the original developers. Thanks!
