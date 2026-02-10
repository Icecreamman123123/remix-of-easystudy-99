# Hosting Setup Guide for EasierStudying

This guide explains how to host your EasierStudying app and what to watch out for to ensure compatibility with common hosting platforms.

## ✅ What's Already Compatible

Your app is fully optimized for serverless hosting platforms:

- **Frontend Framework**: Vite + React (static build output)
- **Backend**: Supabase (external database/auth service)
- **Client-side Storage**: localStorage only (browser-based)
- **No Server-side Code Required**: All Node.js code is dev-only (Vite build, ESLint, testing)
- **No File System Writes**: All data persists to Supabase
- **No Long-running Processes**: All API calls are async to remote services
- **Environment Variables**: Properly configured with `VITE_` prefix for client-side access

## 🚀 Hosting Platforms

### Platform 1: Vercel (Recommended)
**Best for**: Easiest setup, best performance, free tier generous

**Steps:**
1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Prepare for hosting"
   git push origin main
   ```

2. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "Import Project"
   - Select your GitHub repo
   - Click "Import"

3. **Add Environment Variables**
   - In Vercel dashboard: Settings → Environment Variables
   - Add these three variables (from your `.env` file):
     - `VITE_SUPABASE_PROJECT_ID`
     - `VITE_SUPABASE_URL`
     - `VITE_SUPABASE_PUBLISHABLE_KEY`

4. **Deploy**
   - Click "Deploy"
   - Your app is live! Subsequent pushes to `main` auto-deploy

**Cost**: Free tier includes unlimited deployments and generous bandwidth

---

### Platform 2: Netlify
**Best for**: Great DX, free tier, custom domains

**Steps:**
1. **Push to GitHub** (same as Vercel)

2. **Connect to Netlify**
   - Go to [netlify.com](https://app.netlify.com)
   - Click "Add new site" → "Import an existing project"
   - Select GitHub and your repo
   - Click "Deploy site"

3. **Add Environment Variables**
   - In Netlify dashboard: Site settings → Build & deploy → Environment
   - Add the same three VITE_ variables
   - Trigger a redeploy

4. **Configure Redirects**
   - `netlify.toml` already included ✓
   - Handles SPA routing automatically

**Cost**: Free tier includes continuous deployment

---

### Platform 3: Railway
**Best for**: Simplicity, affordable, Docker-friendly

**Steps:**
1. **Push to GitHub**

2. **Connect to Railway**
   - Go to [railway.app](https://railway.app)
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your repo
   - Click "Deploy"

3. **Add Environment Variables**
   - In Railway dashboard: Go to Variables tab
   - Add the three VITE_ variables

4. **Set Build Command**
   - Variables tab: `RAILWAY_CMD` → `npm run build`
   - Publish directory: `dist`

**Cost**: ~$5-10/month depending on usage (includes free credits)

---

### Platform 4: Self-Hosted (DigitalOcean/Linode/AWS)
**Best for**: Maximum control, custom domain/SSL

**Minimal Setup (using Nginx):**

```bash
# 1. SSH into your server
ssh root@your-server-ip

# 2. Install Node.js & npm
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 3. Clone your repo
git clone https://github.com/yourusername/easierstudying.git
cd easierstudying

# 4. Install dependencies & build
npm install
npm run build

# 5. Install Nginx
sudo apt-get install -y nginx

# 6. Copy build output
sudo cp -r dist /var/www/html/easierstudying

# 7. Configure Nginx (in /etc/nginx/sites-enabled/default)
# - Point root to /var/www/html/easierstudying
# - Add SSL certificate (Let's Encrypt)
# - Restart: sudo systemctl restart nginx
```

**Cost**: ~$5-6/month for basic VPS

---

## ⚠️ Critical Security Notes

### 1. Environment Variables
- **NEVER** commit `.env` file to git
- `.gitignore` updated to exclude it
- Use `.env.example` as template for others
- Set variables in hosting platform's dashboard, NOT in code

### 2. Supabase Publishable Key
- The `VITE_SUPABASE_PUBLISHABLE_KEY` is safe to expose
- It can only perform operations allowed by RLS (Row Level Security) policies
- Your RLS policies protect the database
- Users can only access their own data

### 3. CORS Configuration
- Supabase automatically allows CORS requests
- No additional CORS setup needed
- Edge Functions inherit Supabase's CORS settings

---

## 🔄 Continuous Deployment Setup

All platforms above auto-deploy on git push:

```bash
# Make changes locally
git add .
git commit -m "Feature: add xyz"
git push origin main

# Automatically deploys to hosting platform in 1-2 minutes
```

No manual deploy steps needed after initial setup!

---

## 🧪 Pre-Deployment Checklist

- [ ] `.env` file is in `.gitignore`
- [ ] `.env.example` has placeholder values
- [ ] No hardcoded URLs in code (all use environment variables)
- [ ] All API calls use VITE_SUPABASE_URL
- [ ] Database migrations applied to Supabase
- [ ] Supabase edge functions deployed
- [ ] Tested locally with `npm run build && npm run preview`
- [ ] Tested all features work with remote Supabase

---

## 🐛 Troubleshooting

**Build fails on hosting platform**
- Check Node version (18+ required)
- Ensure `npm run build` works locally
- Check all env variables are set

**App loads but shows blank page**
- Check browser console for errors (F12)
- Verify VITE_ variables are set on hosting platform
- Check Supabase connection is working

**Supabase connection fails**
- Verify VITE_SUPABASE_URL is correct
- Verify VITE_SUPABASE_PUBLISHABLE_KEY is correct
- Check Supabase status at status.supabase.com
- Verify RLS policies allow the operation

**Edge functions return 404**
- Ensure edge functions are deployed to Supabase
- Check function names match exactly
- Verify Authorization header is correct

---

## Lovable Hosting (lovable.dev)

If your project is managed or deployed via Lovable, follow these guidelines:

- Open your project on Lovable and go to the Project Settings or Environment/Secrets section.
- Add the same environment variables listed above:
   - `VITE_SUPABASE_PROJECT_ID`
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
- For server-only secrets (e.g., `SENDGRID_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`), store them in Lovable's secret manager and ensure they are not written into repository files.
- If Lovable provides a build configuration panel, set the build command to `npm run build` and the output directory to `dist`.
- Trigger a deployment via Lovable or push to GitHub (Lovable may auto-deploy repository updates).

### Email provider keys

- For sending invitation emails from the edge function, add your email provider key in the Supabase Function environment or Lovable secrets (do NOT expose in client build):
   - `SENDGRID_API_KEY` — SendGrid API key (preferred for this project)
   - `RESEND_API_KEY` — alternative provider

- Example: In Supabase dashboard → Functions → your function → Environment variables, add `SENDGRID_API_KEY`.

Notes:
- The edge function will attempt to use `SENDGRID_API_KEY` automatically; if unset the function will return an email preview instead of sending.
- Store these keys in Lovable or your hosting provider's secret manager and never commit them to the repository.

Notes:
- Do not paste secrets into code edited via Lovable; use the platform's secret management to avoid committing sensitive values.
- If you rely on Supabase edge functions, deploy them from the Supabase dashboard or CLI and configure their environment variables there.


## 📊 Typical Performance (after deployment)

- **First Load**: 2-5 seconds
- **Subsequent Loads**: <1 second (cached)
- **API Calls**: 100-500ms (Supabase latency)
- **Database Queries**: 10-100ms

---

## 🔗 Resources

- [Vercel Docs](https://vercel.com/docs)
- [Netlify Docs](https://docs.netlify.com)
- [Railway Docs](https://docs.railway.app)
- [Supabase Docs](https://supabase.com/docs)
- [Vite Build Documentation](https://vitejs.dev/guide/build.html)

---

## Next Steps

1. **Choose a platform** (Vercel recommended for easiest setup)
2. **Push to GitHub** if not already
3. **Connect your repo** to the platform
4. **Add environment variables** from this guide
5. **Deploy** and test your live app!

Questions? Check the troubleshooting section or contact your hosting provider's support.
