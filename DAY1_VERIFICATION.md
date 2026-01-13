# ✅ DAY 1: Verification Checklist

## 🚀 Quick Start Commands

```bash
# 1. Verify date-fns is installed
npm list date-fns

# 2. Start dev server
npm run dev

# 3. Open browser
# http://localhost:8080 (or port shown in terminal)
```

---

## 📋 Browser Console Checks

### Open DevTools (F12) and check:

1. **No Red Errors**
   - Console should show no red error messages
   - Look for any `ReferenceError`, `TypeError`, or `Cannot read property` errors

2. **BriefingContext Loading**
   - Should see logs like: `[BriefingContext] Initializing...`
   - Facilities should load without errors

3. **Route Navigation**
   - Navigate to `/revenue-integrity` → Should load RevenueIntegrity page
   - Navigate to `/liability-defense` → Should load LiabilityDefense page
   - No 404 errors in console

4. **ErrorBoundary Active**
   - If an error occurs, ErrorBoundary should catch it
   - Should show error UI instead of blank screen

---

## 🔍 Expected Console Output

### ✅ Good Signs:
```
[BriefingContext] Initializing canonical facilities...
[BriefingContext] Created 8 canonical facilities
Vite dev server running at http://localhost:8080
```

### ⚠️ Warnings (OK to ignore):
```
[Supabase] VITE_SUPABASE_URL is not set. Using mock service.
```
(This is expected if you haven't set up .env yet)

### ❌ Errors to Fix:
```
Error: useBriefingContext must be used within BriefingProvider
```
→ Means BriefingProvider is missing from App.tsx

```
Cannot find module 'date-fns'
```
→ Run: `npm install date-fns`

---

## 🧪 Route Testing

### Test These URLs:

1. **Home Page**
   - URL: `http://localhost:8080/`
   - Should show: Dashboard/Calibration Handshake

2. **Liability Defense (New Route)**
   - URL: `http://localhost:8080/liability-defense`
   - Should show: Liability Defense page with mitigation events

3. **Revenue Integrity (New Route)**
   - URL: `http://localhost:8080/revenue-integrity`
   - Should show: Revenue Integrity page with facilities

4. **Backward Compatible Routes**
   - URL: `http://localhost:8080/compliance` → Should redirect/load Liability Defense
   - URL: `http://localhost:8080/revenue` → Should redirect/load Revenue Integrity

---

## 📁 Project Structure Reference

```
src/
├── App.tsx                    ✅ Wraps in ErrorBoundary + BriefingProvider
├── context/
│   └── BriefingContext.tsx    ✅ Single Source of Truth
├── components/
│   ├── ErrorBoundary.tsx      ✅ Crash protection
│   ├── AmberStateFallback.tsx ✅ Degraded state fallback
│   └── AppSidebar.tsx         ✅ Navigation with new routes
├── pages/
│   ├── Dashboard.tsx
│   ├── LiabilityDefense.tsx   ✅ Uses BriefingContext
│   ├── RevenueIntegrity.tsx    ✅ Uses BriefingContext
│   └── ...
└── lib/
    └── supabase.ts            ✅ Real Supabase client
```

---

## 🐛 Troubleshooting

### Issue: "Cannot find module 'date-fns'"
**Fix:**
```bash
npm install date-fns
```

### Issue: "useBriefingContext must be used within BriefingProvider"
**Fix:**
- Check `src/App.tsx` - BriefingProvider should wrap BrowserRouter
- See current App.tsx structure below

### Issue: Routes not working
**Fix:**
- Check `src/App.tsx` - Routes should be inside BrowserRouter
- Verify route paths match sidebar navigation

### Issue: Blank page / White screen
**Fix:**
- Check browser console for errors
- Verify ErrorBoundary is catching errors
- Check if BriefingContext is loading facilities

---

## 📝 Current App.tsx Structure

```typescript
const App = () => (
  <ErrorBoundary>                    // ✅ Crash protection
    <QueryClientProvider>
      <BriefingProvider>              // ✅ Single Source of Truth
        <BrowserRouter>
          <Routes>
            <Route path="/" ... />
            <Route path="/liability-defense" ... />  // ✅ NEW
            <Route path="/revenue-integrity" ... /> // ✅ NEW
            <Route path="/compliance" ... />        // ✅ Backward compatible
            <Route path="/revenue" ... />            // ✅ Backward compatible
          </Routes>
        </BrowserRouter>
      </BriefingProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);
```

---

## ✅ Success Criteria

- [ ] Dev server starts without errors
- [ ] Browser console shows no red errors
- [ ] `/liability-defense` route loads correctly
- [ ] `/revenue-integrity` route loads correctly
- [ ] Sidebar navigation works
- [ ] BriefingContext loads facilities
- [ ] No crashes when navigating between pages

---

## 🎯 Next Steps (After Verification)

Once everything works:
1. **Day 1 Afternoon**: Database schema setup
2. **Day 2**: Integration testing
3. **Day 3-7**: Stabilization & bug fixes

---

**Status**: ✅ **READY FOR TESTING**

Start the dev server and verify all routes work!

