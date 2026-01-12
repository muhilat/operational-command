# RLS Security Test

This test verifies that Row Level Security (RLS) policies are working correctly in Supabase.

## Setup

1. Create a `.env` file in the project root with your Supabase credentials:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

2. Make sure the `mitigation_events` table exists and has RLS enabled (run the migration if needed).

## Running the Test

```bash
npm run test:rls
```

## What the Test Does

1. **Setup Phase** (using service role):
   - Creates User A in Organization A
   - Creates Facility A and a mitigation event for Facility A
   - Creates User B in Organization B
   - Creates Facility B and a mitigation event for Facility B

2. **Test Phase** (using client-side auth):
   - Signs in as User A
   - Attempts to query mitigation events for Facility B
   - **Expected Result**: Should return 0 records (RLS blocks access)

3. **Cleanup Phase**:
   - Deletes all test data

## Expected Output

### ✅ Test Passes (RLS Working):
```
🚀 Starting RLS Security Test
============================================================

📦 Step 1: Creating Organization A and User A
📝 Creating user: test-user-a-1234567890@tracelayer.test...
   ✓ User created with ID: abc-123-def-456
   ✓ Facility created: Facility A (fac-facility-a-1234567890)
   ✓ Mitigation event created: xyz-789-uvw-012

📦 Step 2: Creating Organization B and User B
📝 Creating user: test-user-b-1234567890@tracelayer.test...
   ✓ User created with ID: def-456-ghi-789
   ✓ Facility created: Facility B (fac-facility-b-1234567890)
   ✓ Mitigation event created: uvw-012-rst-345

📦 Step 3: Testing Row Level Security
🔒 Testing RLS: User A (test-user-a-...) accessing Facility B (Facility B)...
   ✓ Signed in as User A (abc-123-def-456)
   ✓ RLS working correctly: No data returned (0 events)

============================================================
✅ TEST PASSED: RLS is working correctly
   User A cannot access Facility B's data.

🧹 Cleaning up test data...
   ✓ Deleted mitigation events
   ✓ Deleted test users
```

### ❌ Test Fails (Security Breach):
```
❌ SECURITY BREACH: User A can see 1 event(s) from Facility B!
   Events returned: [ { id: 'uvw-012-rst-345', facility_id: 'fac-facility-b-...' } ]

============================================================
❌ TEST FAILED: RLS security breach detected!
   User A was able to access Facility B's data.
   This is a critical security issue.
```

## Troubleshooting

- **"Missing required environment variables"**: Create a `.env` file with your Supabase credentials
- **"Failed to create user"**: Check that your service role key has admin permissions
- **"Query error"**: Verify that the `mitigation_events` table exists and RLS is enabled
- **Test passes but shouldn't**: Check your RLS policies in Supabase dashboard




