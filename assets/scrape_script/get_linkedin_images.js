const fs = require('fs');
const path = require('path');

function parseCSV(text) {
    let result = [];
    let currentRow = [];
    let startValue = 0;
    let inQuotes = false;
    for (let i = 0; i < text.length; i++) {
        if (text[i] === '"') {
            inQuotes = !inQuotes;
        } else if (text[i] === ',' && !inQuotes) {
            currentRow.push(text.substring(startValue, i).replace(/^"|"$/g, '').replace(/""/g, '"'));
            startValue = i + 1;
        } else if ((text[i] === '\n' || text[i] === '\r') && !inQuotes) {
            if (text[i] === '\r' && text[i+1] === '\n') {
                currentRow.push(text.substring(startValue, i).replace(/^"|"$/g, '').replace(/""/g, '"'));
                result.push(currentRow);
                currentRow = [];
                startValue = i + 2;
                i++;
            } else {
                currentRow.push(text.substring(startValue, i).replace(/^"|"$/g, '').replace(/""/g, '"'));
                result.push(currentRow);
                currentRow = [];
                startValue = i + 1;
            }
        }
    }
    if (startValue < text.length && currentRow.length > 0) {
        currentRow.push(text.substring(startValue).replace(/^"|"$/g, '').replace(/""/g, '"'));
        result.push(currentRow);
    }
    return result;
}

async function downloadImage(url, dest) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch image: ${response.statusText}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        fs.writeFileSync(dest, buffer);
    } catch (err) {
        console.error(`Error downloading ${url}:`, err.message);
        throw err;
    }
}

async function main() {
    const csvPath = path.join(__dirname, 'linkedin_posts.csv');
    const imagesDir = path.join(__dirname, 'linkedin_post_images');
    const defaultImagePath = path.join(__dirname, '../default_linkedin_post_image.jpeg');

    // 1. Empty folder linkedin_post_images
    if (fs.existsSync(imagesDir)) {
        fs.rmSync(imagesDir, { recursive: true, force: true });
    }
    fs.mkdirSync(imagesDir, { recursive: true });

    if (!fs.existsSync(csvPath)) {
        console.error("CSV file not found:", csvPath);
        return;
    }

    const content = fs.readFileSync(csvPath, 'utf-8');
    const rows = parseCSV(content);

    if (rows.length < 2) {
        console.error("No data found in CSV");
        return;
    }

    const header = rows[0];
    const idIndex = header.indexOf('id');
    const imageIndex = header.indexOf('postImages/0/url');
    const docImageIndex = header.indexOf('document/coverPages/0/imageUrls/0');

    if (idIndex === -1) {
        console.error("Could not find 'id' column in CSV");
        return;
    }

    console.log(`Processing ${rows.length - 1} posts...`);

    // Process sequentially to not overwhelm connections, but we could do it in parallel
    for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (row.length <= idIndex) continue;

        const postId = row[idIndex];
        if (!postId) continue;

        let imageUrl = imageIndex !== -1 ? row[imageIndex] : '';
        if (!imageUrl && docImageIndex !== -1) {
            imageUrl = row[docImageIndex]; // Fallback to doc image
        }

        const ext = '.jpeg'; // Enforce .jpeg or could be extracted from URL if it had one
        const filename = `image_${postId}${ext}`;
        const destPath = path.join(imagesDir, filename);

        if (imageUrl) {
            console.log(`Downloading image for post ${postId}...`);
            try {
                await downloadImage(imageUrl, destPath);
            } catch (err) {
                console.log(`Fallback to default image for post ${postId} due to error`);
                fs.copyFileSync(defaultImagePath, destPath);
            }
        } else {
            console.log(`No image found for post ${postId}, using default image.`);
            fs.copyFileSync(defaultImagePath, destPath);
        }
    }

    console.log("Finished downloading images.");
}

main();