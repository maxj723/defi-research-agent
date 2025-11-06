# DeFi Intelligence Agent - Frontend

A modern, responsive web interface for the DeFi Intelligence Agent. Connect to your own deployed backend and start monitoring profitable wallets, analyzing projects, and avoiding scams.

## Features

- 💬 **Interactive Chat Interface** - Natural language interaction with AI agent
- 👛 **Wallet Management** - Monitor profitable traders with real-time alerts
- 🔔 **Alert System** - Real-time notifications via WebSocket
- 📊 **Dashboard** - Overview of monitored wallets and activity
- ⚙️ **Easy Setup** - Connect to your own backend in minutes

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Run Development Server

```bash
npm run dev
```

The app will open at `http://localhost:3000`

### 3. Configure Backend

On first launch, you'll see a setup wizard. Enter your Cloudflare Worker URL:

```
https://your-agent.your-subdomain.workers.dev
```

## Deployment to GitHub Pages

### Option 1: Automatic Deployment (Recommended)

1. **Update `vite.config.ts`** with your repo name:
```typescript
base: '/your-repo-name/'  // e.g., '/cf_ai_defiresearch/'
```

2. **Push to GitHub**:
```bash
git add .
git commit -m "Add frontend"
git push
```

3. **Enable GitHub Pages**:
   - Go to your repo Settings → Pages
   - Source: "GitHub Actions"
   - The workflow will automatically deploy on push to main

4. **Access your app**:
```
https://your-username.github.io/your-repo-name/
```

### Option 2: Manual Deployment

```bash
npm run build
npm run deploy
```

## Configuration

### Backend URL

Set your Cloudflare Worker URL in the Settings page (⚙️ icon).

Example:
```
https://defi-intelligence-agent.your-subdomain.workers.dev
```

### User ID

Automatically generated unique ID for tracking your data. Found in Settings.

## Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── AlertsPanel.tsx      # Alerts list and management
│   │   ├── ChatInterface.tsx    # AI chat interface
│   │   ├── Dashboard.tsx        # Statistics dashboard
│   │   ├── SettingsModal.tsx    # App settings
│   │   ├── SetupWizard.tsx      # First-time setup
│   │   └── WalletManager.tsx    # Wallet monitoring
│   ├── hooks/
│   │   └── useWebSocket.ts      # WebSocket connection
│   ├── api.ts                   # Backend API client
│   ├── config.ts                # App configuration
│   ├── types.ts                 # TypeScript types
│   ├── App.tsx                  # Main app component
│   └── main.tsx                 # Entry point
├── .github/
│   └── workflows/
│       └── deploy.yml           # Auto-deployment
└── package.json
```

## Features in Detail

### Chat Interface

Natural language interaction with the agent:
- "Find profitable wallets on Ethereum"
- "Analyze this contract: 0x..."
- "What are the top opportunities this week?"

The agent automatically selects and calls appropriate tools.

### Wallet Manager

- Add wallets to monitor by address
- Set alert preferences (min trade size, alert types)
- View profit history and statistics
- Remove wallets

### Alerts Panel

- Real-time alerts from monitored wallets
- Filter by unread/all
- Mark as read individually or in bulk
- View transaction details on Etherscan

### Dashboard

- Overview of monitored wallets
- Total alerts and unread count
- Combined profit from all wallets
- Quick actions

## Development

### Build for Production

```bash
npm run build
```

Output will be in `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

### Type Checking

```bash
npm run type-check
```

## Customization

### Theming

Colors are defined in `tailwind.config.js`:

```javascript
colors: {
  primary: '#00d4ff',    // Cyan
  secondary: '#00ff88',   // Green
  dark: '#0a0a0a',       // Background
  card: '#1a1a1a',       // Card background
}
```

### Branding

Update `index.html` and `App.tsx` to customize:
- App title
- Meta description
- Header logo

## Troubleshooting

### "Connection failed" on setup

- Verify your Worker is deployed: `wrangler deployments list`
- Check the URL has no trailing slash
- Ensure CORS is enabled in your Worker

### WebSocket not connecting

- Confirm backend URL in Settings
- Check browser console for errors
- Verify Worker supports WebSocket upgrade

### GitHub Pages 404

- Ensure `base` in `vite.config.ts` matches repo name
- Check GitHub Pages is enabled in repo settings
- Wait 1-2 minutes after deployment

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

## License

MIT

## Support

- GitHub Issues: Report bugs and request features
- Documentation: See main repo README
- Backend Setup: See QUICKSTART.md in root
