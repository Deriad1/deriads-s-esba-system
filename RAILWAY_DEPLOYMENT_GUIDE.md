# 🚂 Railway Deployment Guide

## ✅ Pre-Deployment Checklist - COMPLETED!

All preparation has been done:
- ✅ Super Admin account created (iamtrouble55@hotmail.com)
- ✅ Godmode functionality removed
- ✅ Production server.js created
- ✅ Railway configuration added
- ✅ Package.json updated with start script
- ✅ Dependencies moved to production

---

## 📋 What We Changed for Railway

### 1. Created `server.js`
A production Express server that:
- Serves all 27 API endpoints
- Handles static file serving from the `dist` folder
- Supports React Router for client-side routing

### 2. Created `railway.json`
Railway configuration file with:
- Build command: `npm install && npm run build`
- Start command: `node server.js`
- Auto-restart on failure

### 3. Updated `package.json`
- Added `"start": "node server.js"` script
- Moved `express` and `cors` to dependencies (needed in production)

---

## 🚀 Deployment Steps

### Step 1: Push Code to GitHub

First, let's commit and push your changes:

```bash
# Add all changes
git add .

# Commit with message
git commit -m "Prepare for Railway deployment - Beta testing ready"

# Push to GitHub
git push origin master
```

**If you don't have a GitHub repository yet:**

1. Go to https://github.com/new
2. Create a new repository (name it something like `deriad-esba-system`)
3. Follow GitHub's instructions to push your code

---

### Step 2: Sign Up for Railway

1. Go to https://railway.app
2. Click "Start a New Project"
3. Sign in with GitHub (recommended)

---

### Step 3: Deploy from GitHub

1. On Railway dashboard, click **"New Project"**
2. Select **"Deploy from GitHub repo"**
3. Choose your repository: `deriad-esba-system` (or whatever you named it)
4. Railway will automatically detect:
   - Node.js project
   - Build command from `railway.json`
   - Start command from `package.json`

5. Click **"Deploy"**

---

### Step 4: Add Environment Variables

After deployment starts, click on your project, then:

1. Go to **"Variables"** tab
2. Add these environment variables:

```
DATABASE_URL=your_neon_database_url_here
NODE_ENV=production
PORT=3000
```

**To get your DATABASE_URL:**
- Open your `.env` file
- Copy the `DATABASE_URL` value
- Paste it into Railway

3. Click **"Add Variable"** for each

---

### Step 5: Configure Domain

Railway provides a free domain:

1. Go to **"Settings"** tab
2. Under **"Domains"**, click **"Generate Domain"**
3. You'll get something like: `your-app.up.railway.app`
4. You can also add a custom domain if you have one

---

### Step 6: Verify Deployment

Once deployment completes (usually 2-5 minutes):

1. Click on the generated domain
2. You should see your app's login page
3. Login with super admin credentials:
   ```
   Email: iamtrouble55@hotmail.com
   Password: @218Eit1101399
   ```

4. Test the following:
   - ✅ Login works
   - ✅ Can access admin dashboard
   - ✅ Can open settings (school setup)
   - ✅ Can create new users

---

## 📊 Monitoring Your Deployment

### View Logs

1. In Railway dashboard, click on your project
2. Go to **"Deployments"** tab
3. Click on the active deployment
4. View real-time logs

### Check Build Status

- **Building**: App is being built
- **Deploying**: Build complete, deploying to server
- **Active**: Successfully deployed and running
- **Failed**: Check logs for errors

---

## 🔒 Security Checklist

After deployment:

- [ ] Change super admin password
- [ ] Add DATABASE_URL as environment variable (not in code)
- [ ] Verify `.env` is in `.gitignore`
- [ ] Test all API endpoints
- [ ] Enable Railway's SSL (automatic)

---

## 🆘 Troubleshooting

### Build Failed

**Check:**
1. Railway logs for error messages
2. Ensure `DATABASE_URL` is set correctly
3. Verify all dependencies are in `package.json`

**Solution:**
```bash
# Rebuild locally first
npm install
npm run build
npm start

# If local works, redeploy on Railway
```

### Can't Connect to Database

**Check:**
1. DATABASE_URL format is correct
2. Neon database is active and not paused
3. Railway can access external databases

**Solution:**
- Neon databases should work fine with Railway
- Check Neon dashboard for connection issues

### App Crashes on Start

**Check Railway logs:**
```
Error: Cannot find module 'express'
```

**Solution:**
- Ensure `express` and `cors` are in `dependencies`, not `devDependencies`
- Redeploy after fixing `package.json`

### API Routes Return 404

**Check:**
1. Server.js is properly importing API routes
2. Build completed successfully
3. `dist` folder exists

**Solution:**
```bash
# Rebuild app
npm run build

# Push changes
git add .
git commit -m "Fix API routes"
git push

# Railway will auto-deploy
```

---

## 💰 Railway Pricing

**Free Tier:**
- $5 credit/month (usually enough for small apps)
- No credit card required for trial
- Can add credit card for more usage

**Hobby Plan:**
- $5/month + usage
- Suitable for beta testing

**Pro Plan:**
- $20/month + usage
- For production

**For Beta Testing:**
- Free tier should be sufficient
- Monitor your usage in Railway dashboard

---

##📝 Post-Deployment Tasks

### Immediately:

1. ✅ Test login with super admin
2. ✅ Change super admin password
3. ✅ Configure school settings
4. ✅ Test all major features

### Within 24 Hours:

1. Create additional admin accounts
2. Add sample teachers
3. Add sample students
4. Test mark entry and reports
5. Verify analytics dashboard

### Before Beta Testers:

1. Create user accounts for testers
2. Document any known issues
3. Prepare user guide
4. Set up feedback collection

---

## 🎉 Your App is Ready for Beta Testing!

### Production URL:
`https://your-app.up.railway.app`

### Super Admin Login:
```
Email: iamtrouble55@hotmail.com
Password: @218Eit1101399
```

**Remember to change this password after first login!**

---

## 📞 Need Help?

- **Railway Docs**: https://docs.railway.app
- **Railway Discord**: https://discord.gg/railway
- **Your deployment files**:
  - `server.js` - Production server
  - `railway.json` - Railway configuration
  - `package.json` - Updated dependencies

---

**Good luck with your Railway deployment! 🚀**

The app is fully prepared and ready to deploy.
