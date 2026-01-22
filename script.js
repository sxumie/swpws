// 1. INITIALIZATION 
const supabaseUrl = 'https://vegwfmtgrfllcfdoyqih.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZlZ3dmbXRncmZsbGNmZG95cWloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4OTU5MjYsImV4cCI6MjA4NDQ3MTkyNn0.xxU7UPtQAPJQbeyLF0cpUTU1dwUjUB-ohWRQF1D_MLo';
const _supabase = supabase.createClient(supabaseUrl, supabaseKey);

let currentUser = JSON.parse(localStorage.getItem('swapwiseUser')) || null;

const pages = {
    landing: document.getElementById('landing'),
    dashboard: document.getElementById('dashboard'),
    profile: document.getElementById('profile')
};

// 2. WINDOW LOAD
window.onload = () => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') document.body.classList.add('dark');
    
    // Check if we are logged in
    if (currentUser) {
        loadDashboard(currentUser);
        showDashboard(); // Ensure Hero and Dashboard show on load
    }
    loadCarousel();
};

// 3. NAVIGATION LOGIC (The Fix)
function hideAll() {
    Object.values(pages).forEach(p => { 
        if (p) p.classList.add('hidden'); 
    });
}

function showDashboard() {
    hideAll();
    // Show BOTH landing (Hero) and dashboard (Matches)
    if (pages.landing) pages.landing.classList.remove('hidden');
    if (pages.dashboard) pages.dashboard.classList.remove('hidden');
    renderMatches();
    // Trigger carousel update to fix centering
    setTimeout(() => updateCarousel(false), 50);
}

function showAuth(type) {
    const authSection = document.getElementById('auth');
    const loginCard = document.getElementById('loginCard');
    const registerCard = document.getElementById('registerCard');

    if (type === 'close') {
        authSection.classList.add('hidden');
        return;
    }

    authSection.classList.remove('hidden');

    if (type === 'login') {
        loginCard.classList.remove('hidden');
        registerCard.classList.add('hidden');
    } else if (type === 'register') {
        registerCard.classList.remove('hidden');
        loginCard.classList.add('hidden');
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

    if(!email || !password) return alert("Please fill in all fields.");

    // 1. Authenticate with Supabase
    const { data, error } = await _supabase.auth.signInWithPassword({
        email: email,
        password: password,
    });

    if (error) return alert("Login Error: " + error.message);

    // 2. Fetch the user's profile data
    const { data: profile, error: pError } = await _supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

    if (profile) {
        // 3. Store the user data so landing.html can read it
        localStorage.setItem('swapwiseUser', JSON.stringify(profile));
        
        // 4. REDIRECT to the other file
        window.location.href = 'landing.html'; 
    } else {
        alert("Profile not found. Please ensure your account setup is complete.");
    }
}

async function logout() {
    if(confirm('Log out?')) {
        await _supabase.auth.signOut();
        localStorage.removeItem('swapwiseUser');
        window.location.href = 'index.html';
    }
}
window.addEventListener('resize', () => updateCarousel(false));

// 5. DASHBOARD & MATCHES
async function loadDashboard(user) {
    document.getElementById('userNameDisplay').innerText = user.full_name;
    document.getElementById('welcomeName').innerText = user.full_name;
    document.getElementById('userLinks').classList.remove('hidden');
    document.getElementById('headerAvatarImg').src = user.avatar_url || DEFAULT_AVATAR;
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
    document.getElementById('viewName').innerText = user.full_name || 'Anonymous';
    document.getElementById('viewBio').innerText = user.bio || 'No bio yet';
    document.getElementById('viewSkill').innerText = user.teaching_skill || '—';
    document.getElementById('viewAge').innerText = user.age || '—';
    document.getElementById('viewBirthday').innerText = user.birthday || '—';
    document.getElementById('viewSchool').innerText = user.school || '—';
    document.getElementById('userAvatar').src = user.avatar_url || DEFAULT_AVATAR;

    document.getElementById('profileView').classList.remove('hidden');
    document.getElementById('profileEdit').classList.add('hidden');
}

let selectedAvatarFile = null;

async function updateAvatar(event) {
    const file = event.target.files[0];
    if (!file) return;

    selectedAvatarFile = file; // Store the file to upload later

    // Show a preview to the user immediately
    const reader = new FileReader();
    reader.onload = (e) => {
        document.getElementById('editAvatarPreview').src = e.target.result;
    };
    reader.readAsDataURL(file);
}

async function saveProfile() {
  let finalAvatarUrl = currentUser.avatar_url;

  // 1. If a new photo was picked, upload it first
  if (selectedAvatarFile) {
      const fileExt = selectedAvatarFile.name.split('.').pop();
      const fileName = `${currentUser.id}-${Date.now()}.${fileExt}`;

      const { data, error: uploadError } = await _supabase.storage
          .from('avatars')
          .upload(fileName, selectedAvatarFile);

      if (uploadError) return alert("Photo upload failed: " + uploadError.message);

      const { data: { publicUrl } } = _supabase.storage
          .from('avatars')
          .getPublicUrl(fileName);
      
      finalAvatarUrl = publicUrl;
  }

  // 2. Prepare the full data object (Matches your new database columns)
  const updatedData = {
      full_name: document.getElementById('editName').value,
      bio: document.getElementById('editBio').value,
      teaching_skill: document.getElementById('editSkill').value,
      age: document.getElementById('editAge').value ? parseInt(document.getElementById('editAge').value) : null,
      birthday: document.getElementById('editBirthday').value || null,
      school: document.getElementById('editSchool').value || '',
      avatar_url: finalAvatarUrl
  };

  // 3. Update the 'profiles' table
  const { error } = await _supabase
      .from('profiles')
      .update(updatedData)
      .eq('id', currentUser.id);

  if (error) {
      alert("Save failed: " + error.message);
  } else {
      alert('Profile and Photo Saved!');
      currentUser = { ...currentUser, ...updatedData };
      localStorage.setItem('swapwiseUser', JSON.stringify(currentUser));
      selectedAvatarFile = null; // Clear the temporary file
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



async function updateAvatar(event) {
  const file = event.target.files[0];
  if (!file) return;

  // 1. Show a local preview immediately
  const reader = new FileReader();
  reader.onload = (e) => {
      document.getElementById('editAvatarPreview').src = e.target.result;
  };
  reader.readAsDataURL(file);

  // 2. Prepare for upload
  const fileExt = file.name.split('.').pop();
  const fileName = `${currentUser.id}-${Math.random()}.${fileExt}`;
  const filePath = `${fileName}`;

  // 3. Upload to Supabase Storage
  const { data, error: uploadError } = await _supabase.storage
      .from('avatars')
      .upload(filePath, file);

  if (uploadError) {
      return alert("Upload failed: " + uploadError.message);
  }

  // 4. Get the Public URL
  const { data: { publicUrl } } = _supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

  // 5. Store the URL in our temporary state
  // This will be saved to the database when the user clicks "Save Changes"
  currentUser.avatar_url = publicUrl;
}

function resetAvatarToDefault() {
  currentUser.avatar_url = DEFAULT_AVATAR;
  document.getElementById('editAvatarPreview').src = DEFAULT_AVATAR;
}

//inbox js

async function loadInbox() {
    const container = document.getElementById('inboxContainer');
    if (!container) return;

    // Fetch requests where the current user is the receiver
    const { data: requests, error } = await _supabase
        .from('swap_requests')
        .select(`
            id,
            status,
            sender_id,
            profiles:sender_id (full_name, teaching_skill, avatar_url)
        `)
        .eq('receiver_id', currentUser.id)
        .eq('status', 'pending');

    if (error) return console.error(error);

    if (requests.length === 0) {
        container.innerHTML = '<p>Your inbox is empty. Start matching!</p>';
        return;
    }

    container.innerHTML = requests.map(req => `
        <div class="notification-card">
            <img src="${req.profiles.avatar_url || DEFAULT_AVATAR}" class="nav-avatar">
            <div class="noti-info">
                <strong>${req.profiles.full_name}</strong> wants to swap skills!
                <p>They teach: ${req.profiles.teaching_skill}</p>
            </div>
            <div class="noti-actions">
                <button class="accept-btn" onclick="respondToRequest('${req.id}', 'accepted')">✔</button>
                <button class="decline-btn" onclick="respondToRequest('${req.id}', 'declined')">✘</button>
            </div>
        </div>
    `).join('');
}

async function sendRequest(receiverId) {
    if (!currentUser) return alert("Please log in to send requests!");

    const { error } = await _supabase
        .from('swap_requests')
        .insert([{ 
            sender_id: currentUser.id, 
            receiver_id: receiverId,
            status: 'pending'
        }]);

    if (error) {
        if (error.code === '23505') alert("You already sent a request to this person!");
        else alert("Error: " + error.message);
    } else {
        alert("Swap Request Sent! 🚀");
    }
}

async function checkNewNotifications() {
    if (!currentUser) return;

    const { count, error } = await _supabase
        .from('swap_requests')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', currentUser.id)
        .eq('status', 'pending');

    const notiBtn = document.querySelector('.noti-btn');
    if (count > 0 && notiBtn) {
        notiBtn.innerHTML = '🔔<span class="notification-badge"></span>';
    }
}