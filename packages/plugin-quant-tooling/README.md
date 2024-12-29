# @elizaos/plugin-quant-tooling

A quantitative analysis plugin for Eliza OS that provides market analysis, social sentiment tracking, and opportunity detection.

## Features

- Market data analysis using DEXScreener
- Social sentiment analysis through organic X (Twitter) monitoring
- Influencer tracking and signal detection
- Opportunity scoring and reporting
- Discord integration for automated reports

## Installation

```bash
pnpm add @elizaos/plugin-quant-tooling
```

## Configuration

### 1. Environment Variables

Copy the `.env.example` file to `.env` in your project root:

```bash
cp packages/plugin-quant-tooling/.env.example .env
```

### 2. X (Twitter) Account Setup

This plugin uses an organic monitoring approach where your character operates as a regular X user:

1. Create a new X account for your character
2. Follow the influencers you want to track
3. Configure the account credentials in `.env`:
```
X_ACCOUNT_USERNAME=your_bot_username
X_ACCOUNT_PASSWORD=your_bot_password
X_ACCOUNT_EMAIL=your_bot_email
```

Benefits of this approach:
- No expensive API costs
- Natural rate limits
- Real-time feed monitoring
- Authentic engagement capabilities

### 3. Influencer List Configuration

Configure tracked influencers in your `.env` file using the format:
```
TRACKED_INFLUENCERS=handle:weight:minEngagement:topics
```

Example:
```
TRACKED_INFLUENCERS=elonmusk:0.8:1000:crypto|blockchain|web3,VitalikButerin:1.0:500:ethereum|defi|scaling
```

Parameters:
- `handle`: X username without @
- `weight`: Importance of their signals (0-1)
- `minEngagement`: Minimum engagement threshold
- `topics`: Pipe-separated list of relevant topics

The character will:
1. Follow these accounts automatically
2. Monitor their posts in real-time
3. Process relevant content based on topics
4. Calculate signal strength based on engagement

### 4. Character Personality

Configure your character's identity:
```
CHARACTER_NAME=CryptoAnalyst
CHARACTER_BIO=Quantitative analyst tracking crypto markets and providing insights
CHARACTER_AVATAR=path/to/avatar.jpg
```

This helps your character maintain a consistent presence across platforms.

### 5. Analysis Settings

Adjust the analysis parameters in `.env`:
```
DEFAULT_SYMBOLS=BTC,ETH    # Default symbols to track
MIN_LIQUIDITY=100000      # Minimum liquidity in USD
MIN_SOCIAL_SCORE=50       # Minimum social score
ANALYSIS_INTERVAL=3600    # Analysis interval (seconds)
```

### 6. Discord Integration (Optional)

To enable Discord reporting:
1. Create a Discord bot and get its token
2. Add the bot to your server
3. Configure Discord settings in `.env`:
```
DISCORD_ENABLED=true
DISCORD_CHANNEL_ID=your_channel_id
DISCORD_REPORT_INTERVAL=14400
```

## Usage

1. Register the plugin in your character configuration:

```json
{
  "plugins": ["@elizaos/plugin-quant-tooling"],
  "settings": {
    "x_account": {
      "username": "your_bot_username",
      "password": "your_bot_password",
      "email": "your_bot_email"
    }
  }
}
```

2. Available commands:
```
/analyze [symbol]           # Analyze market conditions
/detect-opportunities      # Find new opportunities
/track-influencers        # Show influencer mentions
/list-tracked-projects    # Show currently tracked projects
```

## Security Notes

1. Always use a dedicated account for your character
2. Store credentials securely using environment variables
3. Follow X's terms of service and automation guidelines
4. Respect rate limits and engagement rules

## Development

See [DEVELOPMENT.md](./docs/DEVELOPMENT.md) for development guidelines and contribution instructions.