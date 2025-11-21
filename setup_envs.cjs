#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 Fetching Supabase configuration...\n');

try {
  const statusOutput = execSync('supabase status', { encoding: 'utf-8' });
  console.log('Supabase Status:\n', statusOutput);

  // Extract values from supabase status output
  const urlMatch = statusOutput.match(/API URL\s*:\s*(http[^\s]+)/);
  const publishableKeyMatch = statusOutput.match(/Publishable key\s*:\s*(sb_[a-zA-Z0-9_-]+)/);
  const secretKeyMatch = statusOutput.match(/Secret key\s*:\s*(sb_[a-zA-Z0-9_-]+)/);

  const supabaseUrl = urlMatch ? urlMatch[1] : null;
  const anonKey = publishableKeyMatch ? publishableKeyMatch[1] : null;
  const serviceRoleKey = secretKeyMatch ? secretKeyMatch[1] : null;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error(
      '❌ Could not extract required keys from supabase status output.'
    );
    console.error('Make sure Supabase is running: supabase start');
    process.exit(1);
  }

  // Build .env.local content
  const envContent = `# Supabase Configuration (auto-generated)
SUPABASE_URL=${supabaseUrl}
SUPABASE_SERVICE_ROLE_KEY=${serviceRoleKey}
${anonKey ? `SUPABASE_ANON_KEY=${anonKey}` : ''}

# Webhook Configuration (optional)
SUPABASE_WEBHOOK_SECRET=your-secret-key
SAVE_WEBHOOK_EVENTS=true

# Frontend env vars (if needed)
VITE_SUPABASE_URL=${supabaseUrl}
${anonKey ? `VITE_SUPABASE_ANON_KEY=${anonKey}` : ''}
`;

  const envPath = path.join(__dirname, '.env.local');
  fs.writeFileSync(envPath, envContent);

  console.log('\n✅ Environment file created: .env.local\n');
  console.log('📝 Configuration:');
  console.log(`   SUPABASE_URL: ${supabaseUrl}`);
  console.log(`   SUPABASE_SERVICE_ROLE_KEY: ${serviceRoleKey.substring(0, 20)}...`);
  if (anonKey) console.log(`   SUPABASE_ANON_KEY: ${anonKey.substring(0, 20)}...`);
  console.log('\n⚠️  Update the following manually:');
  console.log('   - SUPABASE_WEBHOOK_SECRET (set a secure random value)');
} catch (error) {
  console.error('❌ Error:', error.message);
  console.error('\n💡 Make sure Supabase is running:');
  console.error('   supabase start');
  process.exit(1);
}
