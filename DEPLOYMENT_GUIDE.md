# VRT3X Deployment & Domain Setup Guide

## Quick Setup Options

### Option 1: Vercel (Recommended - Easiest)

Vercel is the easiest way to deploy your VRT3X app and connect your custom domain.

#### Step 1: Deploy to Vercel

1. **Go to [vercel.com](https://vercel.com)** and sign up/login with your GitHub account
2. **Click "Add New Project"**
3. **Import your repository**: `muhilat/operational-command`
4. **Configure project**:
   - Framework Preset: Vite
   - Root Directory: `./`
   - Build Command: `npm run build`
   - Output Directory: `dist`
5. **Click "Deploy"**

Vercel will automatically:
- Build your app
- Deploy it to a `*.vercel.app` URL
- Set up automatic deployments on every push to `main`

#### Step 2: Connect Your Custom Domain

1. **In Vercel Dashboard**, go to your project → **Settings** → **Domains**
2. **Add your domain** (e.g., `vrt3x.com` or `app.vrt3x.com`)
3. **Follow DNS instructions**:
   - Vercel will show you DNS records to add
   - Typically you need to add:
     - **A Record**: `@` → `76.76.21.21` (Vercel's IP)
     - **CNAME Record**: `www` → `cname.vercel-dns.com`

#### Step 3: Configure DNS at Your Domain Registrar

Go to your domain registrar (GoDaddy, Namecheap, Google Domains, etc.) and add:

**For root domain (vrt3x.com):**
```
Type: A
Name: @
Value: 76.76.21.21
TTL: 3600
```

**For www subdomain (www.vrt3x.com):**
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
TTL: 3600
```

**Wait 24-48 hours** for DNS propagation, then your domain will be live!

---

### Option 2: Netlify

#### Step 1: Deploy to Netlify

1. **Go to [netlify.com](https://netlify.com)** and sign up/login with GitHub
2. **Click "Add new site" → "Import an existing project"**
3. **Select your repository**: `muhilat/operational-command`
4. **Build settings**:
   - Build command: `npm run build`
   - Publish directory: `dist`
5. **Click "Deploy site"**

#### Step 2: Connect Domain

1. **Site settings** → **Domain management** → **Add custom domain**
2. **Add your domain**
3. **Follow Netlify's DNS instructions** (similar to Vercel)

---

### Option 3: GitHub Pages (Free but requires more setup)

#### Step 1: Update Vite Config

Add to `vite.config.ts`:
```typescript
export default defineConfig({
  base: '/operational-command/', // Your repo name
  // ... rest of config
});
```

#### Step 2: Create GitHub Actions Workflow

See `.github/workflows/deploy-pages.yml` (if created)

#### Step 3: Enable GitHub Pages

1. Go to **Repository Settings** → **Pages**
2. **Source**: GitHub Actions
3. Your site will be at: `https://muhilat.github.io/operational-command/`

---

## Environment Variables

If you need environment variables (e.g., Supabase keys):

### Vercel:
1. Project → **Settings** → **Environment Variables**
2. Add your variables
3. Redeploy

### Netlify:
1. Site → **Site settings** → **Environment variables**
2. Add your variables
3. Redeploy

---

## Custom Domain DNS Records Reference

### Common DNS Record Types:

**A Record** (points to IP address):
```
Type: A
Name: @ (or leave blank for root domain)
Value: [IP address from hosting provider]
TTL: 3600
```

**CNAME Record** (points to another domain):
```
Type: CNAME
Name: www (or subdomain)
Value: [hosting provider's CNAME]
TTL: 3600
```

**TXT Record** (for verification):
```
Type: TXT
Name: @
Value: [verification string from hosting provider]
TTL: 3600
```

---

## Troubleshooting

### Domain not working?
1. **Check DNS propagation**: Use [dnschecker.org](https://dnschecker.org)
2. **Wait 24-48 hours** for DNS changes to propagate globally
3. **Verify records** match hosting provider's requirements exactly
4. **Check SSL certificate**: Most providers auto-generate SSL (HTTPS)

### Build errors?
1. **Check build logs** in your hosting provider's dashboard
2. **Verify Node.js version** (should be 18+)
3. **Check for missing environment variables**

### Need help?
- **Vercel Docs**: https://vercel.com/docs
- **Netlify Docs**: https://docs.netlify.com
- **GitHub Pages Docs**: https://docs.github.com/pages

---

## Recommended: Vercel

**Why Vercel?**
- ✅ Zero-config deployment for Vite/React
- ✅ Automatic HTTPS/SSL
- ✅ Global CDN
- ✅ Free tier is generous
- ✅ Easy custom domain setup
- ✅ Automatic deployments on git push
- ✅ Preview deployments for PRs

**Get started**: https://vercel.com/new




