const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SECRET_KEY;
const leetcodeApiUrl = process.env.APIFY_API_GET_LEETCODE;

if (!supabaseUrl || !supabaseServiceKey || !leetcodeApiUrl) {
    console.error('One or more required environment variables are missing. Ensure SUPABASE_URL, SUPABASE_SECRET_KEY, and APIFY_API_GET_LEETCODE are set in your .env file.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fetchLeetCodeData() {
    try {
        console.log(`Fetching LeetCode data from Apify...`);
        const response = await fetch(leetcodeApiUrl);
        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`Failed to fetch from LeetCode API: ${response.status} ${response.statusText} - ${errorBody}`);
        }
        // Assuming the Apify actor returns the data in the exact format the frontend expects.
        const data = await response.json();
        console.log('Successfully fetched LeetCode data.');
        return data;
    } catch (error) {
        console.error('Error fetching LeetCode data:', error);
        return null;
    }
}

async function uploadToSupabase(data) {
    if (!data) {
        console.log('No data to upload.');
        return;
    }

    try {
        const fileName = 'leetcode-profile.json';
        const bucketName = 'leetcode-profile';
        const dataString = JSON.stringify(data, null, 2);

        console.log(`Uploading data to Supabase bucket '${bucketName}' as '${fileName}'...`);

        const { error } = await supabase
            .storage
            .from(bucketName)
            .upload(fileName, dataString, {
                cacheControl: '3600', // Cache for 1 hour
                upsert: true, // Overwrite if file exists
                contentType: 'application/json'
            });

        if (error) throw error;

        console.log('Successfully uploaded data to Supabase.');
    } catch (error) {
        console.error('Error uploading data to Supabase:', error);
    }
}

async function main() {
    const leetcodeData = await fetchLeetCodeData();
    await uploadToSupabase(leetcodeData);
}

main();
