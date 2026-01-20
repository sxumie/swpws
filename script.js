// 1. INITIALIZATION 
const supabaseUrl = 'https://vegwfmtgrfllcfdoyqih.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZlZ3dmbXRncmZsbGNmZG95cWloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4OTU5MjYsImV4cCI6MjA4NDQ3MTkyNn0.xxU7UPtQAPJQbeyLF0cpUTU1dwUjUB-ohWRQF1D_MLo';

// We use _supabase to avoid conflict with the global 'supabase' library object
const _supabase = supabase.createClient(supabaseUrl, supabaseKey);

const DEFAULT_AVATAR = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><g fill="%23fff"><circle cx="32" cy="20" r="10"/><path d="M8 54c0-10 10-18 24-18s24 8 24 18z"/></g></svg>';

// Global user state initialized from storage
let currentUser = JSON.parse(localStorage.getItem('swapwiseUser')) || null;

// UI Element Mapping - Updated to be safe for multiple pages
const pages = {
    landing: document.getElementById('landing'),
    auth: document.getElementById('auth'),
    dashboard: document.getElementById('dashboard'),
    profile: document.getElementById('profile')
};

// 2. WINDOW LOAD & THEME
window.onload = () => {
    document.addEventListener('click', function(e) {
        const menu = document.getElementById('profileMenu');
        const btn = document.querySelector('.profile-button');
        if (!menu || !btn) return;
        if (!menu.contains(e.target) && !btn.contains(e.target)) {
            menu.classList.add('hidden');
        }
    });

    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark');
    }
    
    // Auto-load UI if user is already logged in
    if (currentUser && (pages.dashboard || pages.landing)) {
        loadDashboard(currentUser);
    }
};

// 3. NAVIGATION LOGIC
function hideAll() {
    Object.values(pages).forEach(p => { 
        if (p) p.classList.add('hidden'); 
    });
}

function showLanding() {
    if (window.location.pathname.includes('landing.html')) {
        hideAll();
        if (pages.landing) pages.landing.classList.remove('hidden');
    } else {
        window.location.href = "landing.html";
    }
}

function showAuth(type) {
    hideAll();
    if (pages.auth) {
        pages.auth.classList.remove('hidden');
        document.getElementById('loginCard').classList.toggle('hidden', type !== 'login');
        document.getElementById('registerCard').classList.toggle('hidden', type !== 'register');
    } else {
        window.location.href = "index.html";
    }
}

function showDashboard() {
    if (!currentUser) return showAuth('login');
    hideAll();
    if (pages.dashboard) pages.dashboard.classList.remove('hidden');
    renderMatches();
}

function handleFindBuddy() {
    if (currentUser) {
        showDashboard();
    } else {
        showAuth('register');
    }
}

// 4. AUTHENTICATION
async function handleRegister() {
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPass').value;
    const name = document.getElementById('regName').value;
    const skill = document.getElementById('regSkill').value;

    const { data: authData, error: authError } = await _supabase.auth.signUp({
        email: email,
        password: password,
    });

    if (authError) return alert(authError.message);

    const userId = authData.user?.id;
    if (!userId) return alert("User ID not generated. Check email confirmation settings.");

    const { error: profileError } = await _supabase
        .from('profiles')
        .insert([{ 
            id: userId, 
            full_name: name,         
            teaching_skill: skill    
        }]);

    if (profileError) alert("Profile Error: " + profileError.message);
    else {
        alert("Account created! Please log in.");
        showAuth('login');
    }
}

async function handleLogin() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPass').value;

    const { data, error } = await _supabase.auth.signInWithPassword({
        email: email,
        password: password,
    });

    if (error) return alert("Login Error: " + error.message);

    const { data: profile, error: pError } = await _supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

    if (profile) {
        localStorage.setItem('swapwiseUser', JSON.stringify(profile));
        currentUser = profile;
        window.location.assign('landing.html');
    } else {
        alert("Profile not found in database.");
    }
}

async function logout() {
    if(confirm('Log out of SwapWise?')) {
        await _supabase.auth.signOut();
        localStorage.removeItem('swapwiseUser'); 
        currentUser = null;
        window.location.assign('index.html'); 
    }
}

// 5. DASHBOARD & MATCHES
function loadDashboard(user) {
    const nameDisplay = document.getElementById('userNameDisplay');
    const welcomeName = document.getElementById('welcomeName');
    if (nameDisplay) nameDisplay.innerText = user.full_name;
    if (welcomeName) welcomeName.innerText = user.full_name;

    const userLinks = document.getElementById('userLinks');
    const guestLinks = document.getElementById('guestLinks');
    if (userLinks) userLinks.classList.remove('hidden');
    if (guestLinks) guestLinks.classList.add('hidden');

    renderMatches();
}

async function renderMatches() {
    const container = document.getElementById('matchesContainer');
    if (!container) return;
    container.innerHTML = '<p>Searching for buddies...</p>';

    const { data: profiles, error } = await _supabase.from('profiles').select('*');
    if (error) return console.error(error);

    container.innerHTML = '';
    profiles.forEach(user => {
        if (currentUser && user.id === currentUser.id) return;
        container.innerHTML += `
            <div class="match">
                <h4>${user.full_name}</h4>
                <small>Teaches: ${user.teaching_skill || 'Various Skills'}</small>
                <button onclick="sendRequest('${user.id}')">Request Swap</button>
            </div>`;
    });
}

// 6. PROFILE LOGIC
function openProfile() {
    hideAll();
    if (pages.profile) pages.profile.classList.remove('hidden');
    
    const user = currentUser || {};
    const viewName = document.getElementById('viewName');
    if (viewName) viewName.innerText = user.full_name || '—';
    
    document.getElementById('viewBio').innerText = user.bio || 'No bio yet';
    document.getElementById('viewSkill').innerText = user.teaching_skill || '—';
    document.getElementById('userAvatar').src = user.avatar_url || DEFAULT_AVATAR;

    document.getElementById('profileView').classList.remove('hidden');
    document.getElementById('profileEdit').classList.add('hidden');
}

async function saveProfile() {
    const updated = {
        full_name: document.getElementById('editName').value,
        bio: document.getElementById('editBio').value,
        teaching_skill: document.getElementById('editSkill').value,
    };

    const { error } = await _supabase
        .from('profiles')
        .update(updated)
        .eq('id', currentUser.id);

    if (error) alert(error.message);
    else {
        alert('Profile Updated!');
        currentUser = { ...currentUser, ...updated };
        localStorage.setItem('swapwiseUser', JSON.stringify(currentUser));
        openProfile();
    }
}

// 7. UTILITIES & MISSING FUNCTIONS
function search(query) {
    const term = query.toLowerCase();
    const matches = document.querySelectorAll('.match');
    matches.forEach(m => {
        m.style.display = m.innerText.toLowerCase().includes(term) ? 'block' : 'none';
    });
}

function openProfileFromMenu() {
    const menu = document.getElementById('profileMenu');
    if (menu) menu.classList.add('hidden');
    openProfile();
}

function cancelEditProfile() {
    document.getElementById('profileEdit').classList.add('hidden');
    document.getElementById('profileView').classList.remove('hidden');
}

function showEditProfile() {
    document.getElementById('editName').value = currentUser.full_name || '';
    document.getElementById('editBio').value = currentUser.bio || '';
    document.getElementById('editSkill').value = currentUser.teaching_skill || '';
    document.getElementById('profileView').classList.add('hidden');
    document.getElementById('profileEdit').classList.remove('hidden');
}

function toggleTheme() {
    document.body.classList.toggle('dark');
    localStorage.setItem('theme', document.body.classList.contains('dark') ? 'dark' : 'light');
}

function toggleProfileMenu() {
    document.getElementById('profileMenu')?.classList.toggle('hidden');
}

function goToInbox() { window.location.href = "notification.html"; }
function goHome() { window.location.href = "landing.html"; }