# DeFi Intelligence Agent

> AI-powered DeFi/NFT research platform for monitoring profitable wallets, analyzing projects, and avoiding scams.

**🌐 Live App:** [maxj723.github.io/defi-research-agent](https://maxj723.github.io/defi-research-agent/)

![Status](https://img.shields.io/badge/Status-Production%20Ready-success)
![License](https://img.shields.io/badge/License-GPL--3.0-blue)
![Node](https://img.shields.io/badge/Node.js-18%2B-green)
![Platform](https://img.shields.io/badge/Platform-Cloudflare%20Workers-orange)

## 🎯 What Makes This Unique?

Unlike traditional crypto tools, this project combines:
- **AI-Powered Analysis**: Llama 3.3 70B with 20 specialized tools for natural language queries
- **Hybrid Architecture**: Shared frontend (GitHub Pages) + local backend (your machine) = zero deployment
- **Complete Privacy**: Your API keys and data never leave your computer
- **Real-Time Monitoring**: Cloudflare Workflows enable continuous wallet tracking with WebSocket alerts
- **Production-Ready**: Built on enterprise-grade Cloudflare infrastructure (Durable Objects, D1, Workers AI)
- **5-Minute Setup**: `git clone` → add API keys → `npm run dev` → you're analyzing DeFi projects

**Perfect for**: Crypto traders, researchers, developers, and anyone who wants AI-powered blockchain intelligence without sacrificing privacy or paying for infrastructure.

## 📑 Table of Contents

- [Features](#-features)
- [Quick Start](#-quick-start)
- [Complete Setup & Usage Guide](#-complete-setup--usage-guide)
- [System Requirements](#-system-requirements)
- [Use Cases](#-use-cases)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Contributing](#-contributing)
- [Security](#-security)
- [License](#-license)

## ✨ Features

- 🤖 **AI Chat Interface** - Natural language queries with Llama 3.3
- 👛 **Wallet Monitoring** - Track profitable traders in real-time
- 🔍 **Project Analysis** - Automated security & scam detection
- 🚨 **Live Alerts** - WebSocket notifications for wallet activity
- 📊 **Risk Scoring** - Multi-factor analysis (0-100 scale)
- 🎯 **Smart Tools** - 20 specialized agent tools

## 🚀 Quick Start

### For Users (5 Minutes)

```bash
# 1. Clone repository
git clone https://github.com/maxj723/defi-research-agent.git
cd defi-research-agent

# 2. Install dependencies
npm install

# 3. Set up API keys (free tier)
cp .dev.vars.example .dev.vars
# Edit .dev.vars with your API keys

# 4. Start local backend
npm run dev

# 5. Open the web app
# Visit: https://maxj723.github.io/defi-research-agent/
```

**That's it!** The frontend is hosted on GitHub Pages, your backend runs locally with your own API keys.

### Get API Keys (Free)

- **Etherscan**: [etherscan.io/apis](https://etherscan.io/apis)
- **CoinGecko**: [coingecko.com/en/api](https://www.coingecko.com/en/api)

Add them to your `.dev.vars` file - they never leave your machine!

## 📋 Complete Setup & Usage Guide

### Step 1: Prerequisites

Before you begin, make sure you have:
- **Node.js 18+** installed ([nodejs.org](https://nodejs.org/))
- **Git** installed ([git-scm.com](https://git-scm.com/))
- A terminal/command prompt
- A modern web browser (Chrome, Firefox, or Safari)

### Step 2: Clone the Repository

```bash
# Clone the repository
git clone https://github.com/maxj723/defi-research-agent.git

# Navigate into the project directory
cd defi-research-agent
```

### Step 3: Install Dependencies

```bash
# Install all required packages
npm install

# This will take 1-2 minutes
```

### Step 4: Get Your API Keys (Free)

You need two free API keys:

#### 4a. Get Etherscan API Key
1. Go to [etherscan.io/register](https://etherscan.io/register)
2. Create a free account (just email + password)
3. Verify your email
4. Go to [etherscan.io/myapikey](https://etherscan.io/myapikey)
5. Click "Add" to create a new API key
6. Copy the key (looks like: `ABC123XYZ456...`)

**Free tier limits:** 5 requests/second, 100,000 requests/day (plenty for personal use!)

#### 4b. Get CoinGecko API Key
1. Go to [coingecko.com/en/api](https://www.coingecko.com/en/api)
2. Click "Get Your Free API Key"
3. Sign up with email
4. Go to your dashboard
5. Copy your API key

**Free tier limits:** 10,000 requests/month (sufficient for testing)

#### 4c. Get Alchemy API Key (Optional but Recommended)
1. Go to [alchemy.com](https://www.alchemy.com/)
2. Sign up for free account
3. Create a new app (select Ethereum mainnet)
4. Copy the API key from your dashboard

**Free tier:** 300M compute units/month (very generous)

### Step 5: Configure Your API Keys

```bash
# Copy the example configuration file
cp .dev.vars.example .dev.vars

# Open .dev.vars in your text editor
# (Use nano, vim, VS Code, or any text editor)
nano .dev.vars
```

Edit the file to add your keys:

```bash
# .dev.vars file content
ETHERSCAN_API_KEY=your_etherscan_key_here
COINGECKO_API_KEY=your_coingecko_key_here
ALCHEMY_API_KEY=your_alchemy_key_here
```

**Important:**
- Replace `your_etherscan_key_here` with your actual Etherscan key
- Replace `your_coingecko_key_here` with your actual CoinGecko key
- Replace `your_alchemy_key_here` with your actual Alchemy key
- Save the file (Ctrl+O then Ctrl+X in nano)
- These keys NEVER leave your computer - they're only used locally!

### Step 6: Start the Backend

```bash
# Start the local backend server
npm run dev
```

You should see output like:
```
⎔ Starting local server...
[wrangler] Ready on http://localhost:8787
```

**Keep this terminal window open!** The backend must keep running while you use the app.

### Step 7: Open the Web App

Open your browser and go to:
```
https://maxj723.github.io/defi-research-agent/
```

You should see:
- ✅ A green "Connected" indicator in the top right
- The main dashboard with chat interface
- No error messages

If you see a red "Disconnected" banner:
- Make sure `npm run dev` is still running in your terminal
- Check that it says `localhost:8787` in the terminal output
- Try refreshing the browser page

### Step 8: Using the Agent

#### 8a. Chat with the AI

Click on the **Chat** tab and try these example queries:

**Wallet Analysis:**
```
Analyze wallet 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
```

**Project Research:**
```
Check if this contract is safe: 0x1f9840a85d5af5bf1d1762f925bdaddc4201f984
```

**Find Opportunities:**
```
Find profitable DeFi traders on Ethereum in the last 7 days
```

**Scam Detection:**
```
Is this token a scam: 0x... (paste any token contract address)
```

The AI will respond with detailed analysis, risk scores, and recommendations!

#### 8b. Monitor Wallets

Click on the **Wallets** tab:

1. Click "Add Wallet" button
2. Enter a wallet address (e.g., `0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb`)
3. Optionally set alert preferences:
   - Minimum transaction value ($1000)
   - Alert for new tokens (yes/no)
   - Alert for specific tokens
4. Click "Start Monitoring"

The agent will:
- Track all transactions from this wallet in real-time
- Analyze each transaction
- Send you alerts based on your preferences
- Show wallet profitability metrics

#### 8c. View Alerts

Click on the **Alerts** tab to see:
- Real-time notifications for wallet activity
- Token purchases and sales
- Risk warnings
- New opportunities

You can:
- Filter alerts (All / Unread)
- Mark alerts as read
- Click transaction links to view on Etherscan

#### 8d. Analyze Projects

Go to the **Chat** tab and ask:
```
Analyze the security of Uniswap: 0x1f9840a85d5af5bf1d1762f925bdaddc4201f984
```

The agent will provide:
- **Risk Score** (0-100): Overall safety rating
- **Contract Analysis**: Security vulnerabilities
- **Liquidity Check**: Is there enough liquidity?
- **Holder Analysis**: Centralization risks
- **Red Flags**: Specific warnings
- **Recommendation**: Buy, avoid, or research more

### Step 9: Daily Usage

Every time you want to use the agent:

1. **Open terminal** in the project folder
2. **Run:** `npm run dev`
3. **Open browser:** [maxj723.github.io/defi-research-agent](https://maxj723.github.io/defi-research-agent/)
4. **Use the app!**
5. When done, press `Ctrl+C` in terminal to stop the backend

That's it! Your backend runs locally, so you have complete control and privacy.

### Step 10: Updating the Agent

When there are new features or updates:

```bash
# Navigate to project folder
cd defi-research-agent

# Stop the backend (Ctrl+C if running)

# Pull the latest changes
git pull origin main

# Install any new dependencies
npm install

# Start the backend again
npm run dev
```

The frontend updates automatically since it's hosted on GitHub Pages!

## 💻 System Requirements

- **Node.js**: Version 18 or higher
- **RAM**: 2GB minimum, 4GB recommended
- **Disk Space**: 500MB for dependencies
- **Internet**: Required for blockchain data
- **Browser**: Chrome 90+, Firefox 88+, Safari 14+

## 💡 Use Cases

### 1. Copy Trading
Monitor profitable wallets and get instant alerts when they trade:
```
"Monitor wallet 0x... and alert me when they buy tokens over $1000"
```

### 2. Scam Detection
Analyze projects before investing:
```
"Check if this contract is safe: 0x..."
```
Agent returns detailed risk analysis with red flags.

### 3. Research
Find opportunities with AI:
```
"Find profitable DeFi traders on Ethereum this month"
```
Agent searches and ranks wallets by performance.

## 🏗️ Architecture

### Hybrid Local/Cloud Architecture

This project uses a unique **hybrid architecture** that combines the best of both worlds:

```
┌─────────────────────────────────────────────────┐
│   GitHub Pages (Shared Frontend)               │
│   https://maxj723.github.io/defi-research-agent │
│   - React 18 + TypeScript                      │
│   - Tailwind CSS + Vite                        │
│   - Always up-to-date                          │
│   - Zero deployment needed by users            │
└──────────────────┬──────────────────────────────┘
                   │
                   │ WebSocket + REST API
                   │ (CORS configured)
                   │
┌──────────────────▼──────────────────────────────┐
│   Local Backend (Cloudflare Workers Dev)       │
│   http://localhost:8787                         │
│   ┌─────────────────────────────────────────┐  │
│   │ AI Agent (Llama 3.3)                    │  │
│   │ - 20 specialized tools                  │  │
│   │ - Natural language processing           │  │
│   └─────────────────────────────────────────┘  │
│   ┌─────────────────────────────────────────┐  │
│   │ Durable Objects                         │  │
│   │ - Stateful WebSocket sessions           │  │
│   │ - Real-time alerts                      │  │
│   └─────────────────────────────────────────┘  │
│   ┌─────────────────────────────────────────┐  │
│   │ Workflows                               │  │
│   │ - Wallet monitoring (continuous)        │  │
│   │ - Transaction analysis                  │  │
│   └─────────────────────────────────────────┘  │
│   ┌─────────────────────────────────────────┐  │
│   │ D1 Database                             │  │
│   │ - 8 tables + indexes                    │  │
│   │ - Watched wallets, alerts, projects     │  │
│   └─────────────────────────────────────────┘  │
│   ┌─────────────────────────────────────────┐  │
│   │ Your API Keys (.dev.vars)               │  │
│   │ - ETHERSCAN_API_KEY                     │  │
│   │ - COINGECKO_API_KEY                     │  │
│   │ - ALCHEMY_API_KEY                       │  │
│   │ ✅ NEVER leaves your machine            │  │
│   └─────────────────────────────────────────┘  │
└──────────────────┬──────────────────────────────┘
                   │
                   │ External API calls
                   │ (using your local keys)
                   │
┌──────────────────▼──────────────────────────────┐
│   Blockchain APIs & Data Sources               │
│   - Etherscan (transaction data)               │
│   - CoinGecko (price feeds)                    │
│   - Alchemy (advanced queries)                 │
│   - DefiLlama (protocol data)                  │
└─────────────────────────────────────────────────┘
```

### Why This Architecture?

**Traditional approach (what we DIDN'T do):**
- Each user deploys their own frontend + backend to Cloudflare
- Requires: GitHub account, Cloudflare account, secrets management, D1 setup
- Complex deployment, per-user support needed

**Our hybrid approach (what we DID):**
- **ONE shared frontend** on GitHub Pages (always up-to-date)
- **Each user runs backend locally** with their own API keys
- Simple: `npm install` → `npm run dev` → open browser
- API keys stay secure on user's machine
- Free for all users, no deployment needed

**Key Benefits:**
- ✅ **5-minute setup** - Clone, add keys, run
- ✅ **One shared, always-updated frontend** - No per-user deployment
- ✅ **Complete privacy** - Your backend runs locally with your API keys
- ✅ **No infrastructure costs** - Free for all users
- ✅ **Easy updates** - Frontend updates automatically, backend via `git pull`
- ✅ **Full Cloudflare Workers features** - Durable Objects, Workflows, D1, Workers AI

### Optional: Deploy Backend 24/7

Advanced users can optionally deploy their backend to Cloudflare Workers for 24/7 monitoring:

```bash
# Create resources
wrangler d1 create defi-agent-db
wrangler vectorize create defi-agent-vectors --dimensions=768

# Set secrets
wrangler secret put ETHERSCAN_API_KEY
wrangler secret put COINGECKO_API_KEY

# Deploy
npm run deploy
```

Then update the backend URL in the frontend settings to your Workers URL. Cost: ~$5/month for always-on monitoring.

## 🎨 Screenshots

### Chat Interface
Natural language interaction with AI agent.

### Wallet Manager
Monitor profitable traders with real-time alerts.

### Project Analysis
Comprehensive risk scoring and scam detection.

## 🛠️ Tech Stack

### Backend (Cloudflare Workers)
- **Runtime**: Cloudflare Workers (V8 isolates, serverless)
- **AI**: Llama 3.3 70B via Workers AI (tool calling support)
- **Database**: D1 (SQLite-based, serverless SQL)
- **State**: Durable Objects (WebSocket sessions, real-time alerts)
- **Monitoring**: Cloudflare Workflows (long-running wallet monitors)
- **Framework**: Hono (lightweight web framework)
- **Agent SDK**: @cloudflare/agents (official Cloudflare SDK)
- **Language**: TypeScript 5.7+

### Frontend (React SPA)
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite 5.4+ (fast HMR, optimized builds)
- **Styling**: Tailwind CSS (utility-first CSS)
- **UI Components**: Custom components with Lucide React icons
- **Real-time**: WebSocket client (auto-reconnect, heartbeat)
- **Markdown**: react-markdown (AI response rendering)
- **Hosting**: GitHub Pages (free, CDN-backed)

### Blockchain Integrations
- **Etherscan API**: Transaction history, contract verification
- **CoinGecko API**: Token prices, market data
- **Alchemy API**: Advanced queries, NFT data
- **DefiLlama**: Protocol TVL, DeFi metrics

### Development Tools
- **Package Manager**: npm (with lock files)
- **Local Dev**: Wrangler 3.90+ (Cloudflare Workers CLI)
- **Type Checking**: TypeScript strict mode
- **Testing**: Vitest (unit tests for tools)
- **CI/CD**: GitHub Actions (automated frontend deployment)

## 🤝 Contributing

Contributions welcome! This project is:
- Well documented
- Fully typed
- Modular design
- Easy to extend

**Ideas:**
- NFT marketplace integrations
- Telegram/Discord bots
- Portfolio tracking
- Advanced charting
- Social features

## 🔒 Security

- API keys stored locally (`.dev.vars`)
- No shared backend infrastructure
- Data isolated per user
- CORS configured
- Input validation

## 📝 License

**GNU General Public License v3.0 (GPL-3.0)**

This project is licensed under the GNU General Public License v3.0 - See [LICENSE](./LICENSE) file for full details.

## 🌟 Show Your Support

If you find this project useful:
- ⭐ Star the repo on GitHub
- 🐛 Report bugs or request features via Issues
- 🤝 Contribute improvements via Pull Requests
- 📢 Share with others in the DeFi community
