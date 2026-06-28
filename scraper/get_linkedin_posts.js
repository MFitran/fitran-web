require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { createClient } = require('@supabase/supabase-js');

// Constants
const APIFY_API_GET_LAST = process.env.APIFY_API_GET_LAST;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY; // Using SECRET_KEY to bypass RLS

if (!APIFY_API_GET_LAST || !SUPABASE_URL || !SUPABASE_SECRET_KEY) {
    console.error("Missing required environment variables.");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY);

async function downloadImageBuffer(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch image: ${res.statusText}`);
    const arrayBuffer = await res.arrayBuffer();
    return Buffer.from(arrayBuffer);
}

async function uploadImageToSupabase(buffer, filename) {
    const { data, error } = await supabase.storage
        .from('linkedin-images')
        .upload(filename, buffer, {
            contentType: 'image/jpeg',
            upsert: true
        });
    if (error) throw error;
    
    // Get public URL
    const { data: publicData } = supabase.storage
        .from('linkedin-images')
        .getPublicUrl(filename);
        
    return publicData.publicUrl;
}

async function main() {
    try {
        console.log("--- Starting LinkedIn Post Migration ---");

        // 1. Clear the Supabase bucket by removing existing files
        const imageBucketName = 'linkedin-images';
        console.log(`\nClearing bucket: ${imageBucketName}...`);
        const { data: fileList, error: listError } = await supabase.storage.from(imageBucketName).list();

        if (listError) {
            // If bucket doesn't exist, it's not an error for this script's purpose.
            if (!listError.message.includes('Bucket not found')) {
                throw new Error(`Could not list files in bucket: ${listError.message}`);
            }
            console.log(`Bucket ${imageBucketName} does not exist, skipping clear.`);
        }

        if (fileList && fileList.length > 0) {
            const filesToRemove = fileList.map(file => file.name);
            console.log(`Attempting to remove ${filesToRemove.length} file(s)...`);
            const { error: removeError } = await supabase.storage.from(imageBucketName).remove(filesToRemove);
            if (removeError) throw new Error(`Failed to remove files from bucket: ${removeError.message}`);
            console.log('Bucket cleared successfully.');
        } else {
            console.log('Bucket is empty. No files to remove.');
        }

        // 2. Clear the linkedin_posts table
        const tableName = 'linkedin_posts';
        console.log(`\nClearing table: ${tableName}...`);
        const { error: deleteError } = await supabase.from(tableName).delete().neq('post_id', 'dummy-id-to-delete-all'); // A filter is required for delete. This targets all rows.
        if (deleteError) throw new Error(`Failed to clear table ${tableName}: ${deleteError.message}`);
        console.log('Table cleared successfully.');

        console.log("\nFetching new LinkedIn posts from Apify...");
        const response = await fetch(APIFY_API_GET_LAST);
        if (!response.ok) throw new Error(`Failed to fetch from Apify: ${response.statusText}`);
        const posts = await response.json();
        
        console.log(`Fetched ${posts.length} posts. Processing...`);

        for (const post of posts) {
            const postId = post.id;
            console.log(`Processing post ${postId}...`);

            // Extract basic fields
            const postUrl = post.linkedinUrl;
            const content = post.content || '';
            const postedAt = post.postedAt && post.postedAt.date ? new Date(post.postedAt.date).toISOString() : null;
            const isRepost = !!post.repostedBy; // Check if the post has a 'repostedBy' object
            
            const likesCount = post.engagement?.likes || 0;
            const commentsCount = post.engagement?.comments || 0;
            const sharesCount = post.engagement?.shares || 0;

            // Extract images
            let rawImageUrls = [];
            if (post.postImages && post.postImages.length > 0) {
                rawImageUrls = post.postImages.map(img => img.url);
            } else if (post.document && post.document.coverPages && post.document.coverPages.length > 0) {
                rawImageUrls = post.document.coverPages[0].imageUrls || [];
            }
            
            const allImages = [];
            let firstImageUrl = null;

            // Upload images to Supabase
            for (let i = 0; i < rawImageUrls.length; i++) {
                try {
                    const imgUrl = rawImageUrls[i];
                    const filename = `${postId}_${i}.jpeg`;
                    const buffer = await downloadImageBuffer(imgUrl);
                    const publicUrl = await uploadImageToSupabase(buffer, filename);
                    
                    allImages.push(publicUrl);
                    if (i === 0) firstImageUrl = publicUrl;
                    console.log(`  Uploaded image ${i+1}/${rawImageUrls.length}`);
                } catch (err) {
                    console.error(`  Error uploading image ${i} for post ${postId}:`, err.message);
                }
            }

            // Prepare record for Supabase
            const record = {
                post_id: postId,
                post_url: postUrl,
                content: content,
                posted_at: postedAt,
                likes_count: likesCount,
                comments_count: commentsCount,
                shares_count: sharesCount,
                first_image_url: firstImageUrl,
                all_images: allImages,
                is_repost: isRepost,
                updated_at: new Date().toISOString()
            };
            
            // Note: id is primary identity, so we don't pass it and let Supabase generate it
            const { data, error } = await supabase
                .from('linkedin_posts')
                .upsert(record, { onConflict: 'post_id' });

            if (error) {
                console.error(`  Error upserting post ${postId}:`, error.message);
            } else {
                console.log(`  Successfully upserted post ${postId}`);
            }
        }
        console.log("\n--- Migration complete! ---");

    } catch (error) {
        console.error("An error occurred:", error);
    }
}

main();
