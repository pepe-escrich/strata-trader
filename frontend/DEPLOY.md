# Deploy to Vercel

## Quick Deploy (Recommended)

1. Install Vercel CLI (if not installed):
```bash
npm install -g vercel
```

2. Login to Vercel:
```bash
vercel login
```

3. Deploy from the frontend directory:
```bash
cd frontend
vercel --prod
```

## Deploy via GitHub (Alternative)

1. Push your code to GitHub
2. Go to https://vercel.com/new
3. Import your repository
4. Vercel will auto-detect the configuration from `vercel.json`
5. Click "Deploy"

## Configuration

The project is configured via `vercel.json`:
- **Build Command**: `npm install && npm run build -- --configuration=production`
- **Output Directory**: `dist/frontend/browser`
- **Framework**: Angular 21

## Environment Variables

The production API URL is already configured in:
- `src/environments/environment.production.ts`
- Points to: `https://strata-trader-api.onrender.com/api`

No additional environment variables are needed for Vercel.

## Post-Deploy

After deploying, your app will be available at:
- `https://your-project-name.vercel.app`

## Troubleshooting

If build fails:
1. Check build logs in Vercel dashboard
2. Verify Node.js version (should be 18.x or higher)
3. Clear cache and redeploy

For routing issues:
- The `vercel.json` rewrites configuration handles Angular routing
- All routes redirect to `index.html` for client-side routing
