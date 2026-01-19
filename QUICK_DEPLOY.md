# 🎯 5-Minute Team Deployment

## Quick Commands

### 1. Deploy Backend (Railway)
```bash
# Go to https://railway.app
# Sign up → Create Project → Deploy from GitHub → Select this repo
# Railway will auto-deploy `server` folder
# Copy your backend URL: https://your-app-xyz.railway.app
```

### 2. Deploy Frontend (GitHub Pages)
```bash
# Update backend URL
export NEXT_PUBLIC_BACKEND_URL="https://your-app-xyz.railway.app"

# Deploy
chmod +x deploy-team.sh
./deploy-team.sh
```

### 3. Share with Team
```
Frontend URL: https://yourusername.github.io/planning-poker
Backend URL: https://your-app-xyz.railway.app

That's it! Everyone can now use it!
```

---

## What Your Team Gets

✅ **Instant Access** - Just click the link, no installation needed
✅ **Real-time Collaboration** - See votes update live
✅ **Zero Cost** - Completely free tier services
✅ **Full Features** - All Planning Poker functionality
✅ **Persistent Rooms** - Sessions stay active

---

## Team Access

Once deployed, share this link with your team:
```
https://yourusername.github.io/planning-poker
```

They can:
1. Enter their name
2. Create a new room OR join existing room
3. Vote on items
4. See results in real-time
5. Export history as JSON

---

## Monitoring

**Check Backend Status:**
- https://railway.app → Dashboard → Logs

**Check Frontend Deployment:**
- GitHub → Actions tab → Workflows

---

## Cost: $0/month ✨

- GitHub Pages: Free
- Railway: Free tier (includes $5/month credit)
- No credit card needed (Railway free tier included)
