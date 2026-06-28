require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { createClient } = require('@supabase/supabase-js');

// This script should be run in a Node.js environment with environment variables set.
// Example: `node -r dotenv/config scripts/update-linkedin-profile.js`
// It requires SUPABASE_URL, SUPABASE_SECRET_KEY, and APIFY_API_GET_PROFILE to be in your .env file.

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY;
const APIFY_API_URL = process.env.APIFY_API_GET_PROFILE;

const BUCKET_NAME = 'linkedin-profile';
const FILE_NAME = 'profile.json';

async function updateLinkedInProfile() {
    if (!SUPABASE_URL || !SUPABASE_SECRET_KEY || !APIFY_API_URL) {
        console.error('Error: Missing environment variables. Ensure SUPABASE_URL, SUPABASE_SECRET_KEY, and APIFY_API_GET_PROFILE are set.');
        process.exit(1);
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY);

    try {
        // 1. Fetch LinkedIn profile data from Apify
        console.log('Fetching LinkedIn profile from Apify...');
        const response = await fetch(APIFY_API_URL);
        if (!response.ok) {
            throw new Error(`Apify API request failed with status ${response.status}: ${await response.text()}`);
        }
        const profileData = await response.json();

        if (!profileData || !Array.isArray(profileData) || profileData.length === 0) {
            throw new Error('No profile data or invalid format received from Apify.');
        }

        const profile = profileData[0];

        // 2. Clear the Supabase bucket by removing existing files
        console.log(`Checking for existing files in bucket: ${BUCKET_NAME}...`);
        const { data: fileList, error: listError } = await supabase.storage.from(BUCKET_NAME).list();
        if (listError) {
            console.warn(`Could not list files in bucket (it might not exist, which is okay): ${listError.message}`);
        }

        if (fileList && fileList.length > 0) {
            const filesToRemove = fileList.map(file => file.name);
            console.log(`Attempting to remove ${filesToRemove.length} file(s)...`);
            const { error: removeError } = await supabase.storage.from(BUCKET_NAME).remove(filesToRemove);
            if (removeError) throw new Error(`Failed to remove files from bucket: ${removeError.message}`);
            console.log('Bucket cleared successfully.');
        } else {
            console.log('Bucket is empty or does not exist. No files to remove.');
        }

        // 3. Upload the new profile data
        console.log(`Uploading new profile data to ${BUCKET_NAME}/${FILE_NAME}...`);
        const { error: uploadError } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(FILE_NAME, JSON.stringify(profile, null, 2), {
                contentType: 'application/json;charset=UTF-8',
                upsert: true,
            });

        if (uploadError) throw new Error(`Failed to upload profile data: ${uploadError.message}`);

        console.log('✅ Successfully updated LinkedIn profile in Supabase Storage.');

    } catch (error) {
        console.error('❌ An error occurred during the update process:', error.message);
        process.exit(1);
    }
}

updateLinkedInProfile();