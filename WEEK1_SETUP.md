# 🔥 WEEK 1: STABILIZATION - Setup Guide

## ✅ Current Status Check

### Files Already in Place:
- ✅ `src/context/BriefingContext.tsx` - Single Source of Truth
- ✅ `src/components/ErrorBoundary.tsx` - Error handling
- ✅ `src/components/AmberStateFallback.tsx` - Degraded state fallback
- ✅ `src/pages/RevenueIntegrity.tsx` - Revenue page
- ✅ `src/pages/LiabilityDefense.tsx` - Defense page
- ✅ `date-fns` - Already installed (v3.6.0)

### Files Created:
- ✅ `src/lib/supabase.ts` - Real Supabase client (ready for production)

---

## 📋 DAY 1 - MORNING: Setup Steps

### Step 1: Install Supabase Client (if not already installed)

```bash
cd ~/operational-command
npm install @supabase/supabase-js
```

### Step 2: Create Environment File

Create a `.env` file in the root directory:

```bash
# .env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

**How to get your Supabase credentials:**
1. Go to https://supabase.com
2. Create a new project (or use existing)
3. Go to Project Settings → API
4. Copy:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon/public key** → `VITE_SUPABASE_ANON_KEY`

### Step 3: Verify Setup

```bash
# Check if date-fns is installed
npm list date-fns

# Check if @supabase/supabase-js is installed
npm list @supabase/supabase-js

# Verify files exist
ls -la src/lib/supabase.ts
ls -la src/context/BriefingContext.tsx
ls -la src/components/ErrorBoundary.tsx
ls -la src/components/AmberStateFallback.tsx
```

### Step 4: Test the Setup

```bash
# Start dev server
npm run dev

# Open http://localhost:8080
# Check browser console for any errors
```

---

## 🔧 File Structure Verification

Your project should have this structure:

```
operational-command/
├── src/
│   ├── context/
│   │   └── BriefingContext.tsx          ✅ SSoT
│   ├── components/
│   │   ├── ErrorBoundary.tsx            ✅ Error handling
│   │   └── AmberStateFallback.tsx      ✅ Degraded states
│   ├── pages/
│   │   ├── RevenueIntegrity.tsx         ✅ Revenue page
│   │   └── LiabilityDefense.tsx         ✅ Defense page
│   └── lib/
│       ├── supabase.ts                  ✅ Real Supabase client
│       └── services/
│           └── supabase.ts              ⚠️ Mock service (will be replaced)
├── .env                                  ⚠️ Create this
└── package.json
```

---

## 🚨 Common Issues & Fixes

### Issue 1: "Cannot find module '@supabase/supabase-js'"
**Fix:**
```bash
npm install @supabase/supabase-js
```

### Issue 2: "VITE_SUPABASE_URL is not defined"
**Fix:**
1. Create `.env` file in root directory
2. Add your Supabase credentials
3. Restart dev server (`npm run dev`)

### Issue 3: "ErrorBoundary not found"
**Fix:**
- File already exists at `src/components/ErrorBoundary.tsx`
- Check import path: `import { ErrorBoundary } from '@/components/ErrorBoundary';`

### Issue 4: "AmberStateFallback not found"
**Fix:**
- File already exists at `src/components/AmberStateFallback.tsx`
- Check import path: `import { AmberStateFallback } from '@/components/AmberStateFallback';`

---

## 📝 Next Steps (After Setup)

1. **Test BriefingContext**: Verify facilities load correctly
2. **Test ErrorBoundary**: Verify error handling works
3. **Test AmberStateFallback**: Verify degraded states display
4. **Test Supabase Connection**: Verify database connection (if credentials set)

---

## ✅ Setup Checklist

- [ ] `@supabase/supabase-js` installed
- [ ] `.env` file created with Supabase credentials
- [ ] `src/lib/supabase.ts` exists
- [ ] `src/context/BriefingContext.tsx` exists
- [ ] `src/components/ErrorBoundary.tsx` exists
- [ ] `src/components/AmberStateFallback.tsx` exists
- [ ] `src/pages/RevenueIntegrity.tsx` exists
- [ ] `src/pages/LiabilityDefense.tsx` exists
- [ ] Dev server starts without errors
- [ ] Browser console shows no critical errors

---

## 🎯 Ready for Day 1 Afternoon?

Once all checkboxes are ✅, you're ready to proceed to:
- **DAY 1 - AFTERNOON**: Database Schema Setup
- **DAY 2**: Integration Testing
- **DAY 3-7**: Stabilization & Bug Fixes

---

**Status**: ✅ **SETUP COMPLETE** - All core files in place!

