# 🔌 How to Connect This Project to Supabase

## Step 1: Get Your Supabase Credentials

1. **Go to Supabase Dashboard:**
   - Visit: https://app.supabase.com
   - Sign in or create an account
   - Create a new project (or use existing)

2. **Get Your Credentials:**
   - Go to **Settings** → **API** in your Supabase project
   - Copy these values:
     - **Project URL** (e.g., `https://xxxxx.supabase.co`)
     - **anon/public key** (long string starting with `eyJ...`)

---

## Step 2: Create Environment File

Create a `.env` file in the project root:

```bash
# In project root directory
touch .env
```

Add your Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

**Example:**
```env
VITE_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYxNjIzOTAyMiwiZXhwIjoxOTMxODE1MDIyfQ.abc123def456...
```

---

## Step 3: Run Database Migrations

1. **Open Supabase SQL Editor:**
   - Go to your Supabase project
   - Click **SQL Editor** (left sidebar)
   - Click **New query**

2. **Run the migration:**
   - Copy contents of `supabase/migrations/20250112_create_liability_memos.sql`
   - Paste into SQL Editor
   - Click **Run**

   **Expected result:** `Success. No rows returned`

---

## Step 4: Verify Connection

### Option A: Run the Query Script

```bash
# Set environment variables (or they'll be read from .env if using dotenv)
VITE_SUPABASE_URL=your-url VITE_SUPABASE_ANON_KEY=your-key node scripts/query-facilities.js
```

### Option B: Start the Development Server

```bash
npm run dev
```

- Open browser: `http://localhost:8080`
- Check browser console for any connection errors
- If you see errors about Supabase, check your `.env` file

---

## Step 5: Test the Application

1. **Start dev server:**
   ```bash
   npm run dev
   ```

2. **Navigate to:**
   - Home: `http://localhost:8080`
   - Liability Defense: `http://localhost:8080/liability-defense`
   - Revenue Integrity: `http://localhost:8080/revenue-integrity`

3. **Test memo generation:**
   - Go to Liability Defense page
   - Click "Generate Memo"
   - Select a facility
   - Generate memo
   - Check Supabase table: `SELECT * FROM liability_memos;`

---

## Troubleshooting

### Issue: "VITE_SUPABASE_URL is not set"

**Solution:**
- Make sure `.env` file exists in project root
- Make sure variable names start with `VITE_`
- Restart dev server after creating/updating `.env`

### Issue: "401 Unauthorized" or "Invalid API key"

**Solution:**
- Double-check your `VITE_SUPABASE_ANON_KEY` (should be the **anon/public** key, not service role key)
- Make sure key starts with `eyJ...`
- Verify key hasn't expired or been rotated

### Issue: "Table does not exist"

**Solution:**
- Run the migration SQL in Supabase SQL Editor
- Check table exists: `SELECT * FROM information_schema.tables WHERE table_name = 'liability_memos';`

### Issue: "CORS errors"

**Solution:**
- Make sure you're using the correct Supabase project URL
- Check Supabase project settings for allowed origins

---

## Quick Start Checklist

- [ ] Created Supabase project
- [ ] Copied Project URL and anon key
- [ ] Created `.env` file with credentials
- [ ] Ran database migration
- [ ] Started dev server (`npm run dev`)
- [ ] Verified no console errors
- [ ] Tested memo generation

---

## Environment Variables Reference

| Variable | Description | Where to Find |
|----------|-------------|---------------|
| `VITE_SUPABASE_URL` | Your Supabase project URL | Settings → API → Project URL |
| `VITE_SUPABASE_ANON_KEY` | Public/anonymous API key | Settings → API → anon public key |

**Note:** The `VITE_` prefix is required for Vite to expose these variables to your frontend code.

---

## Next Steps After Connection

1. **Create Facilities Table** (if not exists)
2. **Populate Test Data** (optional)
3. **Test Memo Generation** from Liability Defense page
4. **Verify Data in Supabase** using SQL Editor

---

**Questions?** Check the Supabase docs: https://supabase.com/docs

