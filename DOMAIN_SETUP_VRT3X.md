# VRT3X.com Domain Setup Guide

## Quick Setup for vrt3x.com

Your domain `vrt3x.com` is currently showing an "under construction" page. Follow these steps to connect your VRT3X application.

---

## Step 1: Deploy to Vercel

### Option A: Via Vercel Dashboard (Easiest)

1. **Go to [vercel.com](https://vercel.com)** and sign up/login with GitHub
2. **Click "Add New Project"**
3. **Import Repository**: Select `muhilat/operational-command`
4. **Project Settings**:
   - Framework Preset: **Vite** (auto-detected)
   - Root Directory: `./`
   - Build Command: `npm run build` (auto-filled)
   - Output Directory: `dist` (auto-filled)
5. **Click "Deploy"**

Your app will deploy to: `https://operational-command-xxxxx.vercel.app`

### Option B: Via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Deploy to production
vercel --prod
```

---

## Step 2: Connect vrt3x.com Domain

### In Vercel Dashboard:

1. **Go to your project** → **Settings** → **Domains**
2. **Click "Add Domain"**
3. **Enter**: `vrt3x.com`
4. **Click "Add"**

Vercel will show you DNS records to add.

---

## Step 3: Configure DNS Records

Go to your domain registrar (where you bought vrt3x.com) and add these DNS records:

### For Root Domain (vrt3x.com):

**A Record:**
```
Type: A
Name: @ (or leave blank, or "vrt3x.com")
Value: 76.76.21.21
TTL: 3600 (or Auto)
```

**OR use CNAME (if your registrar supports it):**
```
Type: CNAME
Name: @
Value: cname.vercel-dns.com
TTL: 3600
```

### For www Subdomain (www.vrt3x.com):

**CNAME Record:**
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
TTL: 3600
```

### Vercel Verification (if required):

Vercel may provide a **TXT record** for verification:
```
Type: TXT
Name: @
Value: [vercel-provided-verification-string]
TTL: 3600
```

---

## Step 4: Wait for DNS Propagation

1. **DNS changes take 5 minutes to 48 hours** to propagate globally
2. **Check status**: Visit [dnschecker.org](https://dnschecker.org) and search for `vrt3x.com`
3. **Vercel will automatically**:
   - Issue SSL certificate (HTTPS)
   - Show status in dashboard when ready

---

## Step 5: Verify Domain Connection

Once DNS propagates:

1. **Visit**: https://vrt3x.com
2. **You should see**: Your VRT3X Operational Integrity Platform
3. **Check HTTPS**: Should automatically redirect to HTTPS

---

## Common Domain Registrars - Where to Add DNS

### GoDaddy:
1. Go to **My Products** → **DNS** → **Manage DNS**
2. Click **Add** to add new records
3. Enter the values from Step 3

### Namecheap:
1. Go to **Domain List** → Click **Manage** next to vrt3x.com
2. Go to **Advanced DNS** tab
3. Click **Add New Record**

### Google Domains:
1. Go to **DNS** section
2. Click **Custom records**
3. Add the records from Step 3

### Cloudflare:
1. Go to your domain → **DNS** → **Records**
2. Click **Add record**
3. Enter the values from Step 3

---

## Troubleshooting

### Domain still shows "under construction"?
- **Wait longer**: DNS can take up to 48 hours
- **Check DNS propagation**: Use [dnschecker.org](https://dnschecker.org)
- **Verify records**: Make sure A/CNAME records match exactly
- **Clear browser cache**: Try incognito mode

### SSL Certificate Issues?
- Vercel automatically issues SSL certificates
- Wait 5-10 minutes after DNS propagation
- Check Vercel dashboard for certificate status

### 404 Errors?
- Make sure `vercel.json` has the rewrite rule (already included)
- Check that build completed successfully
- Verify `dist` folder contains `index.html`

### Need to Update DNS?
- Changes at registrar can take 24-48 hours
- Use [whatsmydns.net](https://www.whatsmydns.net) to check global propagation

---

## Alternative: Use Cloudflare (Advanced)

If you want faster DNS and additional features:

1. **Sign up for Cloudflare** (free)
2. **Add your domain** to Cloudflare
3. **Change nameservers** at your registrar to Cloudflare's
4. **Add DNS records** in Cloudflare pointing to Vercel
5. **Enable Cloudflare proxy** (orange cloud) for CDN benefits

---

## Current Status

- ✅ Deployment configuration ready
- ✅ Vercel config file created
- ✅ GitHub Actions workflow ready
- ⏳ **Next**: Deploy to Vercel and add DNS records

---

## Quick Reference

**Vercel Dashboard**: https://vercel.com/dashboard  
**Your Repository**: https://github.com/muhilat/operational-command  
**DNS Checker**: https://dnschecker.org  
**Domain**: vrt3x.com

Once deployed, your VRT3X platform will be live at **https://vrt3x.com** 🚀




