const https = require('https');
const fs = require('fs');
const path = require('path');

const token = process.env.GITHUB_TOKEN;
if (!token) {
    console.error('Error: GITHUB_TOKEN environment variable is required.');
    process.exit(1);
}

const options = {
    hostname: 'api.github.com',
    path: '/user/repos?sort=updated&per_page=100&affiliation=owner,collaborator',
    method: 'GET',
    headers: {
        'User-Agent': 'Node.js Script',
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json'
    }
};

const req = https.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        if (res.statusCode !== 200) {
            console.error(`Error: Failed to fetch repos. Status: ${res.statusCode}`);
            console.error(data);
            process.exit(1);
        }

        try {
            const repos = JSON.parse(data);
            let csvContent = 'name,description,html_url,language,stargazers_count,updated_at\n';

            repos.forEach(repo => {
                const name = `"${(repo.name || '').replace(/"/g, '""')}"`;
                const description = `"${(repo.description || '').replace(/"/g, '""')}"`;
                const html_url = `"${(repo.html_url || '').replace(/"/g, '""')}"`;
                const language = `"${(repo.language || '').replace(/"/g, '""')}"`;
                const stargazers_count = repo.stargazers_count;
                const updated_at = `"${(repo.updated_at || '').replace(/"/g, '""')}"`;

                csvContent += `${name},${description},${html_url},${language},${stargazers_count},${updated_at}\n`;
            });

            const outputPath = path.join(__dirname, 'github_repos.csv');
            fs.writeFileSync(outputPath, csvContent, 'utf8');
            console.log(`Successfully wrote ${repos.length} repos to ${outputPath}`);
        } catch (e) {
            console.error('Error parsing JSON response', e);
        }
    });
});

req.on('error', (e) => {
    console.error(`Problem with request: ${e.message}`);
});

req.end();