/**
 * Query Facilities from Supabase
 * 
 * Run this script to query the facilities table:
 * npx tsx scripts/query-facilities.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials!');
  console.error('Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function queryFacilities() {
  console.log('🔍 Querying facilities table...\n');

  try {
    const { data, error } = await supabase
      .from('facilities')
      .select('*')
      .limit(5);

    if (error) {
      console.error('❌ Error querying facilities:', error);
      return;
    }

    if (!data || data.length === 0) {
      console.log('⚠️  No facilities found in database');
      return;
    }

    console.log(`✅ Found ${data.length} facilities:\n`);
    console.log(JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('❌ Unexpected error:', err);
  }
}

queryFacilities();

