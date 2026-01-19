# 🚀 Deploy Planning Poker for Your Team - FREE

## Quick Start (10 minutes)

### Step 1: Deploy Backend to Railway (FREE)

1. **Create Railway Account**
   - Go to https://railway.app
   - Sign up with GitHub
   - Connect to this repository

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub"
   - Choose `planning-poker` repository
   - Select `server` directory as root

3. **Configure Environment**
   - Railway will auto-detect Node.js
   - Set PORT = 8080
   - Save and deploy

4. **Get Backend URL**
   - Copy the deployed URL from Railway dashboard
   - Example: `https://planning-poker-backend-abc123.railway.app`

### Step 2: Deploy Frontend to GitHub Pages (FREE)

1. **Update Backend URL**
   - Edit `client/src/lib/socket.js`
   - Replace `localhost:8080` with your Railway URL:
   ```javascript
   const BACKEND_URL = 'https://your-railway-url.railway.app';
   ```

2. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Update backend URL for production"
   git push origin main
   ```

3. **Enable GitHub Pages**
   - Go to repo Settings → Pages
   - Set source to "GitHub Actions"
   - The workflow will automatically deploy

4. **Access Your App**
   - Frontend: `https://yourusername.github.io/planning-poker`
   - Share this URL with your team!

---

## Architecture

```
┌─────────────────────────────────────────┐
│  Your Team's Browsers                   │
│  (GitHub Pages Frontend)                │
└────────────────┬────────────────────────┘
                 │ WebSocket
                 ▼
         ┌──────────────────┐
         │ Railway Backend  │
         │ (Node.js Server) │
         └──────────────────┘
```

---

## Cost Breakdown

| Service | Tier | Cost |
|---------|------|------|
| GitHub Pages | Free | $0 |
| Railway | Eco | $0 (5GB credit/month) |
| **Total** | | **$0/month** |

---

## Testing Locally Before Deployment

```bash
# Terminal 1: Backend
cd server
npm install
PORT=8080 npm start

# Terminal 2: Frontend
cd client
npm install
npm run dev
# Visit http://localhost:3000
```

---

## Monitoring & Logs

### Railway Logs
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# View logs
railway logs
```

### GitHub Pages Deployment
- Check `.github/workflows/deploy-github-pages.yml` runs
- View logs in GitHub Actions tab

---

## Troubleshooting

### "Backend not responding"
- Check Railway dashboard - is the server running?
- Verify the URL in `client/src/lib/socket.js` is correct
- Check CORS settings in `server/index.js`

### "GitHub Pages not updating"
- Check GitHub Actions tab for workflow errors
- Ensure `.github/workflows/deploy-github-pages.yml` exists
- Make sure changes are pushed to `main` branch

### "Railway deployment failed"
- Check Railway logs for errors
- Ensure `server/Procfile` exists
- Verify `server/package.json` has correct start script

---

## Team Sharing

Once deployed, share the GitHub Pages URL with your team:

```
Planning Poker: https://yourusername.github.io/planning-poker
```

They just need to:
1. Click the link
2. Enter their name
3. Create or join a room
4. Start estimating!

---

## Next: Advanced (Optional)

- **Custom Domain**: Add to GitHub Pages settings
- **Monitoring**: Set up Railway alerts
- **Auto-scaling**: Railway handles automatically for consumption plan
- **Database**: Add MongoDB Atlas (free tier) for persistent history

---

## Support Links

- Railway Docs: https://docs.railway.app
- GitHub Pages Docs: https://pages.github.com
- This Repository: https://github.com/yourusername/planning-poker
