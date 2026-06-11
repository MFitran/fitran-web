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
    const profileEmail = document.getElementById('profile-email');
    const emailForm = document.getElementById('email-form');
    const emailMessage = document.getElementById('email-message');

    // --- State ---
    let currentUser = null;
    let localSupabase = null;

    // --- Initialization ---
    function initAuth() {
        // Use the client instance created in leaderboard.js, which uses config.js
        if (window.supabaseClient) {
            localSupabase = window.supabaseClient;
        } else {
            console.error('Supabase client not found. Make sure config.js and leaderboard.js are loaded before auth.js.');
            showAuthMessage('Authentication service unavailable.');
            return;
        }

        // Check for URL messages from other pages (e.g., password reset)
        const urlParams = new URLSearchParams(window.location.search);
        const message = urlParams.get('message');
        if (message === 'password-changed') {
            showAuthMessage('Your password has been changed successfully! Please log in.', false);
            // Clean the URL to prevent the message from showing on refresh
            window.history.replaceState({}, document.title, window.location.pathname);
        }

        if (!localSupabase || !localSupabase.auth) {
            console.error('Supabase Auth client is invalid. Check Supabase client initialization.');
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
            currentUser = session.user;
            localStorage.setItem('fitran_player', JSON.stringify(currentUser)); // Store auth.user data

            // Fetch score from leaderboard table
            const { data: leaderboardEntry, error: scoreError } = await localSupabase
                .from('leaderboard')
                .select('total_score')
                .eq('player_id', currentUser.id)
                .maybeSingle();

            if (scoreError) console.error('Error fetching user score:', scoreError);
            
            // Add score to currentUser object for display, default to 0 if not found
            currentUser.score = leaderboardEntry?.total_score || 0;

            // Update last_login in auth.users if needed, or remove this functionality
            // await localSupabase.auth.admin.updateUserById(currentUser.id, { user_metadata: { last_login: new Date().toISOString() } }); // Requires service_role key or Edge Function
            showLoggedView();
        } else {
            showUnloggedView();
        }
    }
    function showLoggedView() {
        if (unloggedView) unloggedView.style.display = 'none';
        if (loggedView) loggedView.style.display = 'block';
        if (profileUsername) profileUsername.textContent = currentUser.user_metadata?.username || 'N/A';
        if (profileScore) profileScore.textContent = currentUser.score || 0;
        if (profileEmail) profileEmail.value = currentUser.email || '';
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

    // Helper function for email form messages
    function showEmailMessage(msg, isError = false) {
        if (!emailMessage) return;
        emailMessage.textContent = msg;
        emailMessage.style.color = isError ? '#ff6b6b' : '#4ade80';
        emailMessage.style.display = 'block';
        setTimeout(() => { emailMessage.style.display = 'none'; }, 5000);
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
                // Step 1: Find the user's email from their username using RPC function.
                const { data: userEmail, error: playerError } = await localSupabase.rpc('get_email_by_username', { p_username: username });

                if (playerError) {
                    console.error('Login Step 1 Failed (check RLS policies):', playerError);
                    throw new Error('A server error occurred during login.');
                }

                if (!userEmail) {
                    // This is a valid case of wrong username. Don't specify if username or password was wrong for security.
                    throw new Error('Invalid login credentials');
                }

                // Step 2: Use the retrieved email (dummy or real) to sign in with Supabase Auth.
                const { data: authData, error: authError } = await localSupabase.auth.signInWithPassword({
                    email: userEmail,
                    password: password
                });

                if (authError) {
                    console.error('Login Step 2 Failed (Supabase Auth):', authError);
                    throw authError;
                }

                // After successful login, fetch the full associated profile
                currentUser = authData.user;
                localStorage.setItem('fitran_player', JSON.stringify(currentUser));

                // Fetch score from leaderboard table
                const { data: leaderboardEntry, error: scoreError } = await localSupabase
                    .from('leaderboard')
                    .select('total_score')
                    .eq('player_id', currentUser.id)
                    .maybeSingle();

                if (scoreError) console.error('Error fetching user score on login:', scoreError);
                currentUser.score = leaderboardEntry?.total_score || 0;

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
                const { data: usernameExists, error: checkError } = await localSupabase.rpc('username_exists', { p_username: username });

                if (checkError) {
                    console.error('Error checking username existence:', checkError);
                    throw new Error('Failed to check username availability.');
                }
                if (usernameExists) throw new Error('Username is already taken.');

                // Step 2: Create the user in Supabase Auth. Since you don't use email,
                // we create a "dummy" email from the username. This is required by Supabase
                // and allows it to handle password security.
                const dummyEmail = `${username}@fitran.game`;
                const { data: authData, error: authError } = await localSupabase.auth.signUp({
                    email: dummyEmail,
                    password: password,
                    options: {
                        data: {
                            username: username
                        }
                    }
                });

                if (authError) throw authError;
                if (!authData.user) throw new Error('Signup did not return a user.');

                // Step 3: Update UI. Supabase handles the session automatically.
                currentUser = authData.user;
                currentUser.score = 0; // New users start with 0 score

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

    // Update Email
    if (emailForm) {
        emailForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!currentUser || !localSupabase) return;

            const newEmail = profileEmail.value.trim();
            const submitBtn = emailForm.querySelector('button[type="submit"]');
            
            if (newEmail === currentUser.email) {
                showEmailMessage('This is already your current email.', true);
                return;
            }

            submitBtn.disabled = true;
            submitBtn.textContent = 'Saving...';

            try {
                // 1. Update the email in Supabase Auth (auth.users)
                const { data: authData, error: authError } = await localSupabase.auth.updateUser({
                    email: newEmail
                });
                if (authError) throw authError;

                // Update the local state instantly
                currentUser.email = newEmail;
                localStorage.setItem('fitran_player', JSON.stringify(currentUser));
                
                showEmailMessage('Email update initiated! Please check your NEW email inbox to confirm the change.', false);

            } catch (err) {
                let message = 'Failed to update email. Please try again.';
                if (err.message.includes('unique constraint')) {
                    message = 'This email address is already in use by another player.';
                }
                // Add specific error for Supabase Auth email already registered
                else if (err.message.includes('AuthApiError: Email already registered')) {
                    message = 'This email address is already registered.';
                }
                showEmailMessage(message, true);
                console.error(err);
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Save Email';
            }
        });
    }
});