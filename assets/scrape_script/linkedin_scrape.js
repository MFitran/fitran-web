// A modern JavaScript script to fetch data from the Apify API using Node.js.

const { writeFile } = require('fs/promises');
const path = require('path');

async function fetchLatestApifyData() {
    // 1. Get the API Token from environment variables for security.
    const apiToken = process.env.APIFY_API_TOKEN;
    if (!apiToken) {
        console.error("Error: APIFY_API_TOKEN environment variable not set.");
        process.exit(1);
    }

    try {
        // 2. Dynamically fetch the ID of the latest actor run.
        // We limit it to 1 and sort descending to get the most recent run.
        console.log("Fetching the latest actor run ID...");
        const runsUrl = `https://api.apify.com/v2/actor-runs?token=${apiToken}&desc=true&limit=1`;
        const runsResponse = await fetch(runsUrl);
        if (!runsResponse.ok) {
            throw new Error(`Failed to fetch runs list: ${runsResponse.status} ${runsResponse.statusText}`);
        }
        const runsData = await runsResponse.json();

        if (!runsData.data?.items?.length) {
            throw new Error("No actor runs were found for your account.");
        }

        const latestRun = runsData.data.items[0];
        const { id: runId, actId: actorId, status } = latestRun;

        console.log(`Found latest run ID: ${runId} (from actor ${actorId})`);

        // 3. Check if the run succeeded before trying to download its data.
        if (status !== 'SUCCEEDED') {
            console.warn(`\n⚠️  Warning: The latest run '${runId}' did not succeed. Its status is '${status}'.`);
            console.warn(`-> Check the run in the Apify Console: https://console.apify.com/actors/runs/${runId}`);
            return;
        }

        // 4. Construct the URL to get the dataset items in CSV format.
        const datasetUrl = `https://api.apify.com/v2/actor-runs/${runId}/dataset/items?token=${apiToken}&format=csv&clean=true`;

        console.log(`Fetching dataset for run ID: ${runId}...`);
        const response = await fetch(datasetUrl);

        if (!response.ok) {
            throw new Error(`API request for dataset failed with status: ${response.status} ${response.statusText}`);
        }

        // 5. Get the CSV data and check if it's empty.
        let csvData = await response.text();
        const lines = csvData.trim().split('\n');
        if (!csvData.trim() || lines.length <= 1) {
            console.warn(`\n⚠️  Warning: The dataset for run ID '${runId}' is empty or contains no data rows.`);
            console.warn(`-> Check the run in the Apify Console: https://console.apify.com/actors/runs/${runId}`);
            return; 
        }

        // Edit the "Type" column to "repost" if "Reposted At" column contains a value
        const rows = [];
        let inQuotes = false;
        let currentVal = '';
        let currentRow = [];
        for (let i = 0; i < csvData.length; i++) {
            const char = csvData[i];
            if (char === '"') {
                if (inQuotes && csvData[i+1] === '"') { currentVal += '"'; i++; }
                else { inQuotes = !inQuotes; }
            } else if (char === ',' && !inQuotes) {
                currentRow.push(currentVal);
                currentVal = '';
            } else if ((char === '\n' || char === '\r') && !inQuotes) {
                if (char === '\r' && csvData[i+1] === '\n') i++;
                currentRow.push(currentVal);
                rows.push(currentRow);
                currentRow = [];
                currentVal = '';
            } else { currentVal += char; }
        }
        if (currentVal || currentRow.length > 0) {
            currentRow.push(currentVal);
            rows.push(currentRow);
        }

        if (rows.length > 1) {
            const headers = rows[0];
            const repostIdx = headers.findIndex(h => h.startsWith('repostedAt/'));
            const typeIdx = headers.indexOf('type');

            if (repostIdx !== -1 && typeIdx !== -1) {
                for (let i = 1; i < rows.length; i++) {
                    if (rows[i].length <= repostIdx) continue;
                    const isRepost = rows[i][repostIdx] && rows[i][repostIdx].trim() !== '';
                    if (isRepost) {
                        rows[i][typeIdx] = 'repost';
                    }
                }
            }

            // Sort by posted date/timestamp descending
            const timeIdx = headers.indexOf('postedAt/timestamp');
            const dateIdx = headers.indexOf('postedAt/date');
            
            if (timeIdx !== -1 || dateIdx !== -1) {
                const dataRows = rows.slice(1);
                dataRows.sort((a, b) => {
                    let aTime = 0;
                    let bTime = 0;
                    
                    if (timeIdx !== -1 && a[timeIdx]) {
                        aTime = parseInt(a[timeIdx], 10);
                    } else if (dateIdx !== -1 && a[dateIdx]) {
                        aTime = new Date(a[dateIdx]).getTime();
                    }
                    
                    if (timeIdx !== -1 && b[timeIdx]) {
                        bTime = parseInt(b[timeIdx], 10);
                    } else if (dateIdx !== -1 && b[dateIdx]) {
                        bTime = new Date(b[dateIdx]).getTime();
                    }
                    
                    // Fallback in case of NaN
                    if (isNaN(aTime)) aTime = 0;
                    if (isNaN(bTime)) bTime = 0;
                    
                    return bTime - aTime;
                });
                rows.splice(1, rows.length - 1, ...dataRows);
            }
                
            // Re-serialize CSV
            csvData = rows.map(row => 
                row.map(val => {
                    if (val === undefined || val === null) val = '';
                    if (val.includes('"') || val.includes(',') || val.includes('\n') || val.includes('\r')) {
                        return '"' + val.replace(/"/g, '""') + '"';
                    }
                    return val;
                }).join(',')
            ).join('\n') + '\n';
        }

        // 6. Define the output path and write the data to a .csv file in your project root.
        const outputPath = path.join(process.cwd(), 'assets/scrape_script/linkedin_posts.csv');
        await writeFile(outputPath, csvData);
        console.log(`✅ Success! Data saved to ${outputPath}`);

    } catch (error) {
        console.error("An error occurred:", error.message);
        process.exit(1);
    }
}

// Run the main function.
fetchLatestApifyData();