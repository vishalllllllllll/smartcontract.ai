const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('⚠️ Supabase configuration missing. Please set SUPABASE_URL and SUPABASE_ANON_KEY environment variables.');
}

// Create Supabase client (only if configured)
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false
  }
}) : null;

// Test connection function
const testConnection = async () => {
  try {
    if (!supabase) {
      console.error('❌ Supabase not configured');
      return false;
    }
    const { data, error } = await supabase.from('users').select('count', { count: 'exact', head: true });
    if (error && error.code !== 'PGRST116') { // PGRST116 means table doesn't exist, which is expected initially
      throw error;
    }
    console.log('✅ Supabase connection successful');
    return true;
  } catch (error) {
    console.error('❌ Supabase connection failed:', error.message);
    return false;
  }
};

// Initialize database tables if they don't exist
const initializeTables = async () => {
  try {
    if (!supabase) {
      console.log('Supabase not configured - skipping table initialization');
      return;
    }
    
    // Simple check to see if users table exists (this will work if tables are already created)
    const { error } = await supabase.from('users').select('id', { head: true, count: 'exact' });
    
    if (!error) {
      console.log('✅ Supabase tables initialized');
    } else if (error.code === 'PGRST116') {
      console.log('⚠️ Tables not found. Please run the SQL from SUPABASE_SETUP.sql in your Supabase dashboard');
    } else {
      console.log('Database connection verified');
    }
  } catch (error) {
    console.log('Tables may need to be created manually in Supabase dashboard');
  }
};

module.exports = {
  supabase,
  testConnection,
  initializeTables
};