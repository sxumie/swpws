// 1. INITIALIZATION 
// Replace these with your actual keys from the Supabase Dashboard
const supabaseUrl = 'https://vegwfmtgrfllcfdoyqih.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZlZ3dmbXRncmZsbGNmZG95cWloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4OTU5MjYsImV4cCI6MjA4NDQ3MTkyNn0.xxU7UPtQAPJQbeyLF0cpUTU1dwUjUB-ohWRQF1D_MLo';
const _supabase = supabase.createClient(supabaseUrl, supabaseKey);

const DEFAULT_AVATAR = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><g fill="%23fff"><circle cx="32" cy="20" r="10"/><path d="M8 54c0-10 10-18 24-18s24 8 24 18z"/></g></svg>';

let currentUser = null;

// UI Element Mapping
const pages = {
  landing: document.getElementById('landing'),
  auth: document.getElementById('auth'),
  dashboard: document.getElementById('dashboard'),
  profile: document.getElementById('profile')
};

// 2. WINDOW LOAD & THEME
window.onload = () => {
    // Handle clicks outside profile menu to close it
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
};

// 3. NAVIGATION LOGIC
function hideAll() {
  Object.values(pages).forEach(p => { 
      if (p && p.classList) { // Added safety check
          p.classList.add('hidden'); 
      }
  });
}

function showLanding() {
    hideAll();
    pages.landing.classList.remove('hidden');
}

function showAuth(type) {
    hideAll();
    pages.auth.classList.remove('hidden');
    document.getElementById('loginCard').classList.toggle('hidden', type !== 'login');
    document.getElementById('registerCard').classList.toggle('hidden', type !== 'register');
}

function showDashboard() {
    if (!currentUser) return showAuth('login');
    hideAll();
    pages.dashboard.classList.remove('hidden');
    renderMatches();
}

function handleFindBuddy() {
    if (currentUser) {
        showDashboard();
    } else {
        showAuth('register');
    }
}

function openProfileFromMenu() {
  const menu = document.getElementById('profileMenu');
  if (menu) menu.classList.add('hidden');
  openProfile();
}

// 4. AUTHENTICATION (SUPABASE)
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

    const { error: profileError } = await _supabase
        .from('profiles')
        .insert([{ 
            id: authData.user.id, 
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

  if (error) return alert(error.message);

  // Fetch the profile from your 'profiles' table
  const { data: profile } = await _supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

  if (profile) {
      // This is what landing.html looks for!
      localStorage.setItem('swapwiseUser', JSON.stringify(profile));
      window.location.assign('landing.html'); 
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
  hideAll();
  
  // Only show dashboard if it exists on the current page
  if (pages.dashboard) {
      pages.dashboard.classList.remove('hidden');
  }

  const nameDisplay = document.getElementById('userNameDisplay');
  if (nameDisplay) nameDisplay.innerText = user.full_name;

  // Ensure the navigation links for logged-in users are visible
  const userLinks = document.getElementById('userLinks');
  if (userLinks) userLinks.classList.remove('hidden');

  const guestLinks = document.getElementById('guestLinks');
  if (guestLinks) guestLinks.classList.add('hidden');

  renderMatches();
}

async function renderMatches() {
    const container = document.getElementById('matchesContainer');
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
    pages.profile.classList.remove('hidden');
    
    const user = currentUser || {};
    document.getElementById('viewName').innerText = user.full_name || '—';
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
        openProfile();
    }
}

// 7. SWAP REQUESTS
async function sendRequest(receiverId) {
    const { data: { user } } = await _supabase.auth.getUser();
    
    const { error } = await _supabase
        .from('swap_requests')
        .insert([{ sender_id: user.id, receiver_id: receiverId }]);

    if (error) alert("Error: " + error.message);
    else alert("Request sent to the cloud!");
}

// Utility Functions
function toggleTheme() {
    document.body.classList.toggle('dark');
    localStorage.setItem('theme', document.body.classList.contains('dark') ? 'dark' : 'light');
}

function toggleProfileMenu() {
    document.getElementById('profileMenu')?.classList.toggle('hidden');
}

function goToInbox() { window.location.href = "notification.html"; }
function showEditProfile() {
    document.getElementById('editName').value = currentUser.full_name || '';
    document.getElementById('editBio').value = currentUser.bio || '';
    document.getElementById('editSkill').value = currentUser.teaching_skill || '';
    document.getElementById('profileView').classList.add('hidden');
    document.getElementById('profileEdit').classList.remove('hidden');
}

function goHome(){
  window.location.href="landing.html"
}