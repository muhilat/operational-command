# Domain Deployment Troubleshooting

## Issue: Works on localhost but not on domain

### Most Common Causes:

1. **Missing Environment Variables in Vercel** ⚠️ MOST LIKELY
2. **Build Errors** 
3. **SPA Routing Issues**
4. **CORS/Supabase Configuration**

---

## Step 1: Check Environment Variables in Vercel

### Required Variables:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### How to Add:
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add both variables for **Production**, **Preview**, and **Development**
3. **Redeploy** after adding variables

### Verify:
```bash
# Check if variables are set (in Vercel dashboard)
# They should show as "Encrypted" values
```

---

## Step 2: Check Vercel Build Logs

1. Go to Vercel Dashboard → Your Project → Deployments
2. Click on the latest deployment
3. Check **Build Logs** for errors

### Common Build Errors:
- ❌ "VITE_SUPABASE_URL is not defined"
- ❌ "Module not found"
- ❌ "Build failed"

---

## Step 3: Verify vercel.json Configuration

Your `vercel.json` should have:
```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

✅ This is already configured correctly!

---

## Step 4: Check Browser Console

1. Open your domain in browser
2. Open DevTools (F12) → Console tab
3. Look for errors:

### Common Console Errors:
- ❌ "Failed to fetch" → Supabase URL not set
- ❌ "Network error" → CORS issue
- ❌ "404 Not Found" → Routing issue

---

## Step 5: Test Supabase Connection

### In Browser Console (on your domain):
```javascript
// Check if environment variables are loaded
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('Supabase Key:', import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Set' : 'Missing');
```

### Expected Output:
```
Supabase URL: https://your-project.supabase.co
Supabase Key: Set
```

### If Missing:
→ Environment variables not set in Vercel

---

## Step 6: Verify DNS Configuration

1. Check DNS propagation: https://dnschecker.org
2. Enter your domain: `vrt3x.com`
3. Verify A/CNAME records point to Vercel

### Vercel DNS Records:
- **A Record**: `76.76.21.21` (or CNAME: `cname.vercel-dns.com`)
- **www CNAME**: `cname.vercel-dns.com`

---

## Step 7: Force Redeploy

After fixing environment variables:

1. Vercel Dashboard → Deployments
2. Click "..." on latest deployment
3. Click "Redeploy"
4. Wait for build to complete

---

## Quick Fix Checklist

- [ ] Environment variables set in Vercel (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
- [ ] Variables set for Production environment
- [ ] Redeployed after adding variables
- [ ] Build logs show no errors
- [ ] DNS records configured correctly
- [ ] Browser console shows no Supabase errors
- [ ] vercel.json has rewrites configured (✅ already done)

---

## Still Not Working?

1. **Check Vercel Function Logs**: Dashboard → Functions → View Logs
2. **Test Supabase directly**: Try accessing Supabase dashboard
3. **Check CORS settings**: Supabase → Settings → API → CORS origins
4. **Verify domain in Supabase**: Add your domain to allowed origins

---

## Contact Support

If still stuck:
- Vercel Support: https://vercel.com/support
- Check build logs for specific error messages
