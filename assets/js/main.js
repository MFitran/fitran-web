document.addEventListener('DOMContentLoaded', () => {
    // Setup interval for home button animation
    const homeBtns = document.querySelectorAll('.home-btn-container');
    homeBtns.forEach(btn => {
        // Initial animation on first page open
        btn.classList.add('active-anim');
        setTimeout(() => {
            btn.classList.remove('active-anim');
        }, 3000); // 3 seconds

        // Recurring animation every 30 seconds
        setInterval(() => {
            btn.classList.add('active-anim');
            setTimeout(() => {
                btn.classList.remove('active-anim');
            }, 3000); // 3 seconds reveal duration
        }, 30000); // 30 seconds
    });

    fetch('assets/scrape_script/linkedin_posts.csv')
        .then(response => response.text())
        .then(csvText => {
            const rows = parseCSV(csvText);
            if (rows.length > 1) {
                renderLinkedInPosts(rows);
            }
        })
        .catch(err => {
            console.error("Error loading CSV:", err);
            const container = document.getElementById('linkedin-posts-container');
            if (container) container.innerHTML = '<div style="grid-column: span 1; text-align: center;">Failed to load updates.</div>';
        });
});

function parseCSV(text) {
    const rows = [];
    let inQuotes = false;
    let currentVal = '';
    let currentRow = [];
    
    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        if (char === '"') {
            if (inQuotes && text[i+1] === '"') { 
                currentVal += '"'; 
                i++; 
            } else { 
                inQuotes = !inQuotes; 
            }
        } else if (char === ',' && !inQuotes) {
            currentRow.push(currentVal);
            currentVal = '';
        } else if ((char === '\n' || char === '\r') && !inQuotes) {
            if (char === '\r' && text[i+1] === '\n') i++;
            currentRow.push(currentVal);
            rows.push(currentRow);
            currentRow = [];
            currentVal = '';
        } else { 
            currentVal += char; 
        }
    }
    if (currentVal || currentRow.length > 0) {
        currentRow.push(currentVal);
        rows.push(currentRow);
    }
    return rows;
}

function renderLinkedInPosts(rows) {
    const headers = rows[0].map(h => h.trim());
    
    // Attempt to locate indices dynamically based on apify linkedin scraper
    const findIndexByPriority = (exactMatches, partialMatch) => {
        for (const match of exactMatches) {
            const idx = headers.indexOf(match);
            if (idx !== -1) return idx;
        }
        if (partialMatch) {
            return headers.findIndex(h => h.includes(partialMatch));
        }
        return -1;
    };

    const urlIdx = findIndexByPriority(['url', 'linkedinUrl', 'socialContent/shareUrl']);
    const contentIdx = findIndexByPriority(['text', 'content', 'socialContent/text', 'article/description']);
    const typeIdx = findIndexByPriority(['type'], 'type');
    const likesIdx = findIndexByPriority(['engagement/likes'], 'likes');
    const commentsIdx = findIndexByPriority(['engagement/comments'], 'comments');
    const sharesIdx = findIndexByPriority(['engagement/shares'], 'shares');
    const dateIdx = findIndexByPriority(['postedAt/date', 'date'], 'date');

    const container = document.getElementById('linkedin-posts-container');
    if (!container) return;

    // Determine limit dynamically (default to 3, but allow 'all')
    const limitAttr = container.getAttribute('data-limit');
    const limit = limitAttr === 'all' ? rows.length : 3;

    container.innerHTML = ''; // clear loading text
    
    let count = 0;
    
    for (let i = 1; i < rows.length; i++) {
        if (count >= limit) break; 
        const row = rows[i];
        if (row.length < 10) continue;
        
        let url = row[urlIdx] || '';
        // Fallback for url if column shift
        if (!url || !url.startsWith('http')) {
            url = row.find(val => val && val.startsWith('https://www.linkedin.com/posts/')) || '';
            if (!url) continue;
        }

        const contentText = row[contentIdx] || '';
        let postType = row[typeIdx] || 'Post';
        if (postType) {
            postType = postType.replace(/^"|"$/g, '').trim();
            postType = postType.charAt(0).toUpperCase() + postType.slice(1);
        } else {
            postType = 'Post';
        }
        
        const likes = row[likesIdx] || '0';
        const comments = row[commentsIdx] || '0';
        const shares = row[sharesIdx] || '0';
        const postDate = dateIdx !== -1 && row[dateIdx] ? row[dateIdx].substring(0, 10) : '';

        // Extract ID to construct local image path based on Apify's logic
        let postIdMatch = url.match(/-(\d+)[^/]*$/);
        if (!postIdMatch) {
            postIdMatch = url.match(/ugcPost-(\d+)/);
        }
        const postId = postIdMatch ? postIdMatch[1] : '';
        const imgPath = postId ? `assets/scrape_script/linkedin_post_images/image_${postId}.jpeg` : 'assets/default_linkedin_post_image.jpeg';

        // Detect if content needs a read-more toggle (long character count or contains more than 3 lines)
        const isLongText = contentText.length > 150 || contentText.split('\n').length > 3;
        const readMoreHTML = isLongText ? `<button class="read-more-btn" onclick="toggleReadMore(this)">Read more</button>` : '';

        // Create the card element
        const card = document.createElement('div');
        card.className = 'box update-box';
        
        // Use exact DOM construction mirroring the requested styling format
        card.innerHTML = `
            <div class="post-label">${postType}</div>
            <img class="post-image" src="${imgPath}" alt="LinkedIn Post" onerror="this.onerror=null; this.src='assets/default_linkedin_post_image.jpeg';">
            <p class="post-desc">${escapeHTML(contentText)}</p>
            ${readMoreHTML}
            <div class="post-stats">
                <span>👍 ${likes}</span>
                <span>💬 ${comments}</span>
                <span>🔄 ${shares}</span>
                ${postDate ? `<span style="margin-left: auto;">📅 ${postDate}</span>` : ''}
            </div>
            <a href="${url}" target="_blank" class="post-btn">Go to LinkedIn Post</a>
        `;
        
        container.appendChild(card);
        count++;
    }
}

// Utility to prevent XSS and broken HTML from raw text
function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, 
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag] || tag)
    );
}

// Global function to toggle read more state on description elements
window.toggleReadMore = function(btn) {
    const desc = btn.previousElementSibling;
    if (desc.classList.contains('expanded')) {
        desc.classList.remove('expanded');
        btn.textContent = 'Read more';
    } else {
        desc.classList.add('expanded');
        btn.textContent = 'Show less';
    }
};
