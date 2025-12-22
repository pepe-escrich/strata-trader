# 🚀 Deploy Now - Quick Guide

## Step 1: Deploy Backend to Render (5 min)

1. **Go to Render:** https://dashboard.render.com/
2. **Click:** "New +" → "Web Service"
3. **Connect:** Your GitHub repository
4. **Configure:**
   ```
   Name: strata-trader-api
   Root Directory: backend
   Build Command: npm install && npm run build
   Start Command: npm run start:prod
   Plan: Free
   ```

5. **Add Environment Variables:**
   ```
   NODE_ENV=production
   PORT=3000
   API_PREFIX=api
   BINGX_TESTNET=true
   ```

6. **Click:** "Create Web Service"
7. **Wait:** 5-10 minutes for build
8. **Copy URL:** `https://strata-trader-api-XXXX.onrender.com`

✅ **Verify:** Visit `https://your-api.onrender.com/api/health`

---

## Step 2: Deploy Frontend to Vercel (3 min)

1. **Update API URL:**
   Edit `frontend/src/environments/environment.production.ts`:
   ```typescript
   apiUrl: 'https://strata-trader-api-XXXX.onrender.com/api',
   ```

2. **Commit and Push:**
   ```bash
   git add frontend/src/environments/environment.production.ts
   git commit -m "chore: update production API URL"
   git push
   ```

3. **Go to Vercel:** https://vercel.com/new
4. **Click:** "Add New" → "Project"
5. **Import:** Your GitHub repository
6. **Configure:**
   ```
   Framework Preset: Angular
   Root Directory: frontend
   Build Command: npm run build
   Output Directory: dist/frontend/browser
   ```

7. **Click:** "Deploy"
8. **Wait:** 3-5 minutes
9. **Copy URL:** `https://strata-trader-XXXX.vercel.app`

✅ **Verify:** Open your Vercel URL and see the dashboard with live prices

---

## Step 3: Verify Everything Works

**Backend Health Check:**
```bash
curl https://your-api.onrender.com/api/health
```

Should return:
```json
{
  "status": "ok",
  "environment": "production",
  "version": "1.0.0"
}
```

**Frontend Check:**
1. Open: `https://your-app.vercel.app`
2. Should see: Market Overview dashboard
3. Should see: Live crypto prices updating
4. Console (F12): No CORS errors

---

## 🎉 That's it!

Your app is live at:
- **Backend:** `https://your-api.onrender.com/api`
- **Frontend:** `https://your-app.vercel.app`

## 📝 Save Your URLs

Write them down:
```
Backend:  ________________________________
Frontend: ________________________________
Date:     ________________________________
```

## 🔧 Troubleshooting

**Backend not responding?**
- Render Free tier sleeps after 15 min
- First request takes ~1 minute to wake up
- Just refresh and wait

**CORS errors?**
- Check API URL in environment.production.ts
- Must end with `/api`
- Example: `https://strata-trader-api-xxx.onrender.com/api`

**Need more help?**
- See full guide: [DEPLOYMENT.md](DEPLOYMENT.md)
- Use checklist: [.deployment-checklist.md](.deployment-checklist.md)

---

## 🔄 Future Deployments

Both Render and Vercel auto-deploy when you push to GitHub:

```bash
git add .
git commit -m "your changes"
git push
```

That's all! 🎊
