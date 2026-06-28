const fs = require('fs');
const path = require('path');

// Try loading dotenv if available
try {
    require('dotenv').config();
} catch (err) {
    console.warn('dotenv is not loaded. Proceeding with system environment variables.');
}

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Error: SUPABASE_URL or SUPABASE_KEY is missing from environment variables / .env file.');
    process.exit(1);
}

const config = {
    SUPABASE_URL: supabaseUrl,
    SUPABASE_KEY: supabaseKey
};

const outputPath = path.join(__dirname, 'supabase-config.json');
fs.writeFileSync(outputPath, JSON.stringify(config, null, 2));
console.log(`supabase-config.json successfully generated at ${outputPath}`);
