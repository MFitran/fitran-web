document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const unloggedView = document.getElementById('auth-unlogged');
    const loggedView = document.getElementById('auth-logged');
    const authForm = document.getElementById('auth-form');
    const usernameInput = document.getElementById('auth-username');
    const passwordInput = document.getElementById('auth-password');
    const loginBtn = document.getElementById('auth-login-btn');
    const signupBtn = document.getElementById('auth-signup-btn');
    const authMessage = document.getElementById('auth-message');
    const logoutBtn = document.getElementById('auth-logout-btn');
    
    const profileUsername = document.getElementById('profile-username');
    const profileScore = document.getElementById('profile-score');

    // --- State ---
    let currentUser = null;
    let localSupabase = null;

    // --- Initialization ---
    function initAuth() {
        // If leaderboard.js already created a valid client instance, use it.
        // Otherwise, look for the global window.supabase object loaded via CDN script tag.
        if (typeof supabase !== 'undefined' && supabase.auth) {
            localSupabase = supabase;
        } else if (typeof window.supabase !== 'undefined' && window.supabase.createClient) {
            // Backup fallback config using your public settings
            const supabaseUrl = 'https://wwapndvliynmdeejtryz.supabase.co';
            const supabaseKey = 'sb_publishable_h2mFkHzvYdG9YJxh83FrRQ_w2KkTCtb';
            localSupabase = window.supabase.createClient(supabaseUrl, supabaseKey);
        }

        if (!localSupabase || !localSupabase.auth) {
            console.error('Supabase Auth client unavailable. Check your CDN script tag in <head>.');
            showAuthMessage('Authentication service unavailable.');
            return;
        }
        checkLoginSession();
    }

    // Run initialization
    setTimeout(initAuth, 150);

    // --- Functions ---
    async function checkLoginSession() {
        const { data: { session } } = await localSupabase.auth.getSession();

        if (session?.user) {
            // User is logged in. Fetch their profile.
            const { data: profileData, error } = await localSupabase
                .from('players')
                .select('*')
                .eq('id', session.user.id)
                .single();

            if (profileData) {
                currentUser = profileData;
                localStorage.setItem('fitran_player', JSON.stringify(currentUser));
                showLoggedView();
            } else {
                // Auth session exists but no profile. Log them out.
                console.error('User authenticated but no profile found. Logging out.');
                await localSupabase.auth.signOut();
                showUnloggedView();
            }
        } else {
            showUnloggedView();
        }
    }
    function showLoggedView() {
        if (unloggedView) unloggedView.style.display = 'none';
        if (loggedView) loggedView.style.display = 'block';
        if (profileUsername) profileUsername.textContent = currentUser.username;
        if (profileScore) profileScore.textContent = currentUser.score || 0;

        // Show a notice if the user is still using a dummy email.
        // NOTE: You need to add an element with id="profile-email-notice" to your HTML for this to appear.
        const emailNotice = document.getElementById('profile-email-notice');
        if (emailNotice && currentUser.email && currentUser.email.endsWith('@fitran.game')) {
            emailNotice.innerHTML = '<b>Note:</b> Use your own active email for password changes.';
            emailNotice.style.display = 'block';
        } else if (emailNotice) {
            emailNotice.style.display = 'none';
        }
    }

    function showUnloggedView() {
        if (unloggedView) unloggedView.style.display = 'block';
        if (loggedView) loggedView.style.display = 'none';
        if (authForm) authForm.reset();
        hideAuthMessage();
    }

    function showAuthMessage(msg, isError = true) {
        if (!authMessage) return;
        authMessage.textContent = msg;
        authMessage.style.color = isError ? '#ff6b6b' : '#4ade80';
        authMessage.style.display = 'block';
    }

    function hideAuthMessage() {
        if (authMessage) authMessage.style.display = 'none';
    }

    // --- Event Listeners ---
    
    // Prevent form submission on Enter key, as actions are handled by button clicks.
    if (authForm) {
        authForm.addEventListener('submit', (e) => e.preventDefault());
    }

    // Login
    if (loginBtn) {
        loginBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            const username = usernameInput.value.trim();
            const password = passwordInput.value.trim();

            if (!username || !password) {
                showAuthMessage('Username and password required.');
                return;
            }

            loginBtn.disabled = true;
            if (signupBtn) signupBtn.disabled = true;
            loginBtn.textContent = 'Logging in...';

            try {
                // Step 1: Find the user's email from their username in the public 'players' table.
                const { data: player, error: playerError } = await localSupabase
                    .from('players')
                    .select('email')
                    .eq('username', username)
                    .single();

                if (playerError && playerError.code !== 'PGRST116') { // PGRST116 is "No single row"
                    console.error('Login Step 1 Failed (check RLS policies):', playerError);
                    throw new Error('A server error occurred during login.');
                }

                if (!player) {
                    // This is a valid case of wrong username. Don't specify if username or password was wrong for security.
                    throw new Error('Invalid login credentials');
                }

                // Step 2: Use the retrieved email (dummy or real) to sign in with Supabase Auth.
                const { data: authData, error: authError } = await localSupabase.auth.signInWithPassword({
                    email: player.email,
                    password: password
                });

                if (authError) {
                    console.error('Login Step 2 Failed (Supabase Auth):', authError);
                    throw authError;
                }

                // After successful login, fetch the full associated profile
                const { data: profileData, error: profileError } = await localSupabase
                    .from('players')
                    .select('*')
                    .eq('id', authData.user.id)
                    .single();
                
                if (profileError) {
                    console.error('Login Step 3 Failed (Profile fetch):', profileError);
                    throw profileError;
                }

                currentUser = profileData;
                localStorage.setItem('fitran_player', JSON.stringify(currentUser));
                await localSupabase.from('players').update({ last_login: new Date().toISOString() }).eq('id', currentUser.id);
                showLoggedView();

            } catch (err) {
                if (err.message.includes('A server error occurred')) {
                    showAuthMessage(err.message);
                } else if (err.message.includes('Invalid login credentials')) {
                    showAuthMessage('Invalid username or password.');
                } else {
                    showAuthMessage(err.message || 'Invalid username or password.');
                }
                console.error(err);
            } finally {
                loginBtn.disabled = false;
                if (signupBtn) signupBtn.disabled = false;
                loginBtn.textContent = 'Login';
            }
        });
    }

    // Sign Up
    if (signupBtn) { // This button already has a click listener, which is correct.
        signupBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            const username = usernameInput.value.trim();
            const password = passwordInput.value.trim();

            if (!username || !password) {
                showAuthMessage('Username and password required for signup.');
                return;
            }

            signupBtn.disabled = true;
            if (loginBtn) loginBtn.disabled = true;
            signupBtn.textContent = 'Signing up...';

            try {
                // Step 1: Check if username is already taken
                const { data: existingPlayer, error: checkError } = await localSupabase
                    .from('players')
                    .select('username')
                    .eq('username', username)
                    .maybeSingle();

                if (checkError) throw checkError;
                if (existingPlayer) throw new Error('Username is already taken.');

                // Step 2: Create the user in Supabase Auth. Since you don't use email,
                // we create a "dummy" email from the username. This is required by Supabase
                // and allows it to handle password security.
                const dummyEmail = `${username}@fitran.game`;
                const { data: authData, error: authError } = await localSupabase.auth.signUp({
                    email: dummyEmail,
                    password: password,
                    options: {
                        data: {
                            display_name: username
                        }
                    }
                });

                if (authError) throw authError;
                if (!authData.user) throw new Error('Signup did not return a user.');

                // Step 3: Create the associated player profile, linking it via the auth user's ID
                const { data: profileData, error: profileError } = await localSupabase
                    .from('players')
                    .insert([{ 
                        id: authData.user.id,
                        username: username,
                        email: dummyEmail,
                        created_at: new Date().toISOString(),
                        last_login: new Date().toISOString()
                        // DO NOT store the password here. It's now handled by Supabase Auth.
                    }])
                    .select()
                    .single();

                if (profileError) {
                    console.error('CRITICAL: Auth user created but profile insertion failed.', profileError);
                    throw new Error('Could not create your profile. Please contact support.');
                }

                // Step 4: Update UI. Supabase handles the session automatically.
                currentUser = profileData;
                localStorage.setItem('fitran_player', JSON.stringify(currentUser));
                showLoggedView();
                showAuthMessage('Account created successfully!', false);

            } catch (err) {
                if (err.message.includes('already taken')) {
                    showAuthMessage('Username is already taken.');
                } else if (err.message.includes('Password should be at least 6 characters')) {
                    showAuthMessage('Password must be at least 6 characters long.');
                } else if (err.message.includes('User already registered')) {
                    showAuthMessage('This username may already be registered.');
                } else {
                    showAuthMessage(err.message || 'Error creating account. Try again.');
                }
                console.error(err);
            } finally {
                signupBtn.disabled = false;
                if (loginBtn) loginBtn.disabled = false;
                signupBtn.textContent = 'Sign Up';
            }
        });
    }

    // Logout
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            await localSupabase.auth.signOut();
            currentUser = null;
            localStorage.removeItem('fitran_player');
            showUnloggedView();
        });
    }
});