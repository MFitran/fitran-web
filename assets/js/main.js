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

    const container = document.getElementById('linkedin-posts-container');
    if (container) {
        fetchAndRenderSupabasePosts(container);
    }
});

window.fetchEnvConfig = async function() {
    return {
        SUPABASE_URL: "https://wwapndvliynmdeejtryz.supabase.co",
        SUPABASE_KEY: "sb_publishable_h2mFkHzvYdG9YJxh83FrRQ_w2KkTCtb"
    };
}

window.getSupabaseClient = async function() {
    if (window.supabaseClient) return window.supabaseClient;
    if (!window.supabase) return null;

    const envConfig = await window.fetchEnvConfig();
    if (!envConfig || !envConfig.SUPABASE_URL || !envConfig.SUPABASE_KEY) {
        return null;
    }

    window.supabaseClient = window.supabase.createClient(envConfig.SUPABASE_URL, envConfig.SUPABASE_KEY);
    return window.supabaseClient;
}

async function fetchAndRenderSupabasePosts(container) {
    const client = await window.getSupabaseClient();
    
    if (!client) {
        console.error("Supabase client or configuration not found.");
        container.innerHTML = '<div style="text-align: center; width: 100%; grid-column: 1 / -1; color: red;">Error loading updates.</div>';
        return;
    }

    // Determine limit dynamically (default to 3, but allow 'all')
    const limitAttr = container.getAttribute('data-limit');
    const limit = limitAttr === 'all' ? 100 : (parseInt(limitAttr) || 3);

    try {
        const { data: posts, error } = await client
            .from('linkedin_posts')
            .select('*')
            .order('posted_at', { ascending: false })
            .limit(limit);

        if (error) throw error;

        container.innerHTML = ''; // clear loading text

        if (!posts || posts.length === 0) {
            container.innerHTML = '<div style="text-align: center; width: 100%; grid-column: 1 / -1; color: #666;">No updates found.</div>';
            return;
        }

        posts.forEach(post => {
            const card = document.createElement('div');
            card.className = 'box update-box';
            
            // Limit content length for preview
            const textContent = post.content || '';
            const previewLength = 150;
            let contentHtml = '';

            // Escape HTML and format newlines to <br> safely
            const escapeHTML = str => str.replace(/[&<>'"]/g, 
                tag => ({
                    '&': '&amp;',
                    '<': '&lt;',
                    '>': '&gt;',
                    "'": '&#39;',
                    '"': '&quot;'
                }[tag])
            );
            const safeText = escapeHTML(textContent);

            if (safeText.length > previewLength) {
                const fullText = safeText.replace(/\n/g, '<br>');
                contentHtml = `<div class="post-text-content">${fullText}</div><button class="read-more-btn">Read more</button>`;
            } else {
                contentHtml = `<div>${safeText.replace(/\n/g, '<br>')}</div>`;
            }

            const dateStr = post.posted_at ? new Date(post.posted_at).toLocaleDateString() : 'N/A';
            const imageUrl = post.first_image_url || 'assets/default_linkedin_post_image.jpeg';
            const labelText = post.is_repost ? 'Repost' : 'Post';

            card.innerHTML = `
                <div class="post-label">${labelText}</div>
                <img class="post-image" src="${imageUrl}" alt="LinkedIn Post Image" onerror="this.onerror=null; this.src='assets/default_linkedin_post_image.jpeg';">
                <div class="post-desc">${contentHtml}</div>
                <div class="post-stats">
                    <span>👍 ${post.likes_count || 0}</span>
                    <span>💬 ${post.comments_count || 0}</span>
                    <span>🔄 ${post.shares_count || 0}</span>
                    <span style="margin-left: auto;">📅 ${dateStr}</span>
                </div>
                <a href="${post.post_url || '#'}" target="_blank" class="post-btn">View on LinkedIn</a>
            `;

            // Add event listener for 'Read more' toggle
            const readMoreLink = card.querySelector('.read-more-btn');
            if (readMoreLink) {
                readMoreLink.addEventListener('click', (e) => {
                    e.preventDefault();
                    const textContent = card.querySelector('.post-text-content');
                    const isExpanded = textContent.classList.contains('expanded');
                    
                    if (isExpanded) {
                        textContent.classList.remove('expanded');
                        readMoreLink.textContent = 'Read more';
                    } else {
                        textContent.classList.add('expanded');
                        readMoreLink.textContent = 'Read less';
                    }

                    // Force the card to adapt its height to the new content
                    card.style.height = 'auto';
                });
            }
            
            container.appendChild(card);
        });

    } catch (err) {
        console.error("Error fetching posts from Supabase:", err.message);
        container.innerHTML = '<div style="text-align: center; width: 100%; grid-column: 1 / -1; color: red;">Error loading updates. Please try again later.</div>';
    }
}
