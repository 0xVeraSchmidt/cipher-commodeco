# Vercel Deployment Guide for Cipher Commodeco

## Step-by-Step Manual Deployment Instructions

### Prerequisites
- GitHub account with access to the repository
- Vercel account (free tier available)
- Domain name (optional, for custom domain)

### Step 1: Access Vercel Dashboard
1. Go to [vercel.com](https://vercel.com)
2. Sign in with your GitHub account
3. Click "New Project" on the dashboard

### Step 2: Import GitHub Repository
1. In the "Import Git Repository" section, search for `0xVeraSchmidt/cipher-commodeco`
2. Click "Import" next to the repository
3. Vercel will automatically detect it's a Vite project

### Step 3: Configure Project Settings
1. **Project Name**: `cipher-commodeco` (or your preferred name)
2. **Framework Preset**: Vite (should be auto-detected)
3. **Root Directory**: `./` (default)
4. **Build Command**: `npm run build` (default)
5. **Output Directory**: `dist` (default for Vite)
6. **Install Command**: `npm install` (default)

### Step 4: Set Environment Variables
In the "Environment Variables" section, add the following:

```
NEXT_PUBLIC_CHAIN_ID=11155111
NEXT_PUBLIC_RPC_URL=your_rpc_endpoint
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_wallet_connect_project_id
NEXT_PUBLIC_INFURA_API_KEY=your_infura_api_key
NEXT_PUBLIC_CONTRACT_ADDRESS=your_contract_address_here
```

**Important**: Replace all placeholder values with your actual configuration.

### Step 5: Configure Build Settings
1. **Node.js Version**: 18.x (recommended)
2. **Build Command**: `npm run build`
3. **Output Directory**: `dist`
4. **Install Command**: `npm install`

### Step 6: Deploy
1. Click "Deploy" button
2. Wait for the build process to complete (usually 2-3 minutes)
3. Your application will be available at the provided Vercel URL

### Step 7: Custom Domain (Optional)
1. Go to Project Settings → Domains
2. Add your custom domain
3. Configure DNS records as instructed by Vercel
4. Wait for SSL certificate to be issued

### Step 8: Configure Automatic Deployments
1. Go to Project Settings → Git
2. Ensure "Automatic Deployments" is enabled
3. Choose deployment branch (usually `main`)
4. Enable "Preview Deployments" for pull requests

### Step 9: Monitor and Optimize
1. Check the "Functions" tab for any serverless function logs
2. Monitor "Analytics" for performance metrics
3. Use "Speed Insights" to optimize loading times

## Environment Variables Reference

| Variable | Value | Description |
|----------|-------|-------------|
| `NEXT_PUBLIC_CHAIN_ID` | `11155111` | Sepolia testnet chain ID |
| `NEXT_PUBLIC_RPC_URL` | `https://sepolia.infura.io/v3/...` | RPC endpoint for blockchain |
| `NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID` | `2ec9743d0d0cd7fb94dee1a7e6d33475` | WalletConnect project ID |
| `NEXT_PUBLIC_INFURA_API_KEY` | `b18fb7e6ca7045ac83c41157ab93f990` | Infura API key |
| `NEXT_PUBLIC_CONTRACT_ADDRESS` | `0x...` | Deployed smart contract address |

## Troubleshooting

### Common Issues:
1. **Build Fails**: Check Node.js version (use 18.x)
2. **Environment Variables Not Working**: Ensure they start with `NEXT_PUBLIC_`
3. **Wallet Connection Issues**: Verify WalletConnect project ID
4. **Contract Interaction Fails**: Check contract address and RPC URL

### Performance Optimization:
1. Enable Vercel Analytics
2. Use Vercel Edge Functions for API routes
3. Configure CDN settings for static assets
4. Enable compression in Vercel settings

## Post-Deployment Checklist

- [ ] Application loads without errors
- [ ] Wallet connection works
- [ ] Environment variables are properly set
- [ ] Custom domain is configured (if applicable)
- [ ] SSL certificate is active
- [ ] Analytics are enabled
- [ ] Performance monitoring is set up

## Support

For deployment issues:
1. Check Vercel documentation
2. Review build logs in Vercel dashboard
3. Verify environment variables
4. Test locally with `npm run build` and `npm run preview`

## Security Notes

- Never commit `.env` files to version control
- Use Vercel's environment variable encryption
- Regularly rotate API keys
- Monitor for unauthorized access
- Enable Vercel's security features
