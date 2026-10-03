# Ali Md mini bot

An advanced, multi-functional WhatsApp automation bot built on top of Node.js, designed to run seamlessly with multiple options including Heroku, Docker, and local servers.

[![Deploy to Heroku](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/babaralis180588-lang/ali-md-loader)

## 🚀 Features

- Multi-Device Support: Powered by robust underlying socket connections.
- Docker Support: Completely configured `Dockerfile` ready for deployment.
- One-Click Deploy: Fast setup with preloaded configurations from `app.json` on Heroku.
- Extensible: Modular command handler with straightforward plugins structure.
- Auto Update: Bot files `ali-files` repo se start par load hoti hain, repo update karte hi bot update ho jata hai.

## ⚡ Heroku Deployment

Deploy your application directly to Heroku with one simple click of the button below:

[![Deploy to Heroku](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/babaralis180588-lang/ali-md-loader)

### Deployment Steps

1. Click the Deploy to Heroku button above.
2. Log in to your Heroku account (or sign up if you don't have one).
3. Set a unique app name and select your region.
4. Fill in the required config vars: `GITHUB_TOKEN` (token with read access to the `ali-files` repo) and `MONGODB_URI` (refer to `app.json` for all options).
5. Click Deploy App and watch the logs build successfully!

## 📦 Local Installation

To run the application on your local machine:

```bash
# Clone the repository
git clone https://github.com/babaralis180588-lang/ali-md-loader.git

# Navigate into the project folder
cd ali-md-loader

# Install dependencies
npm install

# Set your token and database, then start
export GITHUB_TOKEN=your_token
export MONGODB_URI=your_mongodb_uri
npm start
```

## 🐳 Docker

```bash
docker build -t ali-md-mini-bot .
docker run -d -e GITHUB_TOKEN=your_token -e MONGODB_URI=your_mongodb_uri -p 8000:8000 ali-md-mini-bot
```

---

Power by Ali Md mini bot
