/**
 * Query Facilities from Supabase (Node.js version)
 * 
 * Run this script to query the facilities table:
 * node scripts/query-facilities.js
 * 
 * Or with environment variables:
 * VITE_SUPABASE_URL=your-url VITE_SUPABASE_ANON_KEY=your-key node scripts/query-facilities.js
 */

// Simple Node.js version that works without TypeScript
const https = require('https');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials!');
  console.error('Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
  console.error('\nExample:');
  console.error('  VITE_SUPABASE_URL=https://xxx.supabase.co VITE_SUPABASE_ANON_KEY=xxx node scripts/query-facilities.js');
  process.exit(1);
}

// Extract project ID from URL
const projectId = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
if (!projectId) {
  console.error('❌ Invalid Supabase URL format');
  process.exit(1);
}

const apiUrl = `${supabaseUrl}/rest/v1/facilities?select=*&limit=5`;

const options = {
  headers: {
    'apikey': supabaseKey,
    'Authorization': `Bearer ${supabaseKey}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
  }
};

console.log('🔍 Querying facilities table...\n');

https.get(apiUrl, options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    if (res.statusCode !== 200) {
      console.error(`❌ Error: ${res.statusCode}`);
      console.error(data);
      return;
    }

    try {
      const facilities = JSON.parse(data);
      if (facilities.length === 0) {
        console.log('⚠️  No facilities found in database');
        return;
      }

      console.log(`✅ Found ${facilities.length} facilities:\n`);
      console.log(JSON.stringify(facilities, null, 2));
    } catch (err) {
      console.error('❌ Error parsing response:', err);
      console.error('Raw response:', data);
    }
  });
}).on('error', (err) => {
  console.error('❌ Request error:', err);
});

