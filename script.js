 const pages = {
      landing: document.getElementById('landing'),
      auth: document.getElementById('auth'),
      dashboard: document.getElementById('dashboard'),
      profile: document.getElementById('profile')
    };

    const matchesData = [
      { name: 'Alex Rivers', skill: 'Coding', rating: '4.9⭐' },
      { name: 'Maria Garcia', skill: 'Languages', rating: '4.8⭐' },
      { name: 'Sam Chen', skill: 'Math', rating: '4.7⭐' },
      { name: 'Jordan Smith', skill: 'Design', rating: '4.6⭐' },
      { name: 'Taylor Reed', skill: 'Coding', rating: '4.5⭐' }
    ];

    const DEFAULT_AVATAR = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><g fill="%23fff"><circle cx="32" cy="20" r="10"/><path d="M8 54c0-10 10-18 24-18s24 8 24 18z"/></g></svg>';

    let currentUser = null;

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
    };

    function hideAll() {
      Object.values(pages).forEach(p => p.classList.add('hidden'));
    }

    function showLanding() {
      hideAll();
      pages.landing.classList.remove('hidden');
      document.getElementById('userLinks').classList.add('hidden');
      document.getElementById('guestLinks').classList.remove('hidden');
    }

    function showAuth(type) {
      hideAll();
      pages.auth.classList.remove('hidden');
      document.getElementById('loginCard').classList.toggle('hidden', type !== 'login');
      document.getElementById('registerCard').classList.toggle('hidden', type !== 'register');
      const menu = document.getElementById('profileMenu');
      if (menu) menu.classList.add('hidden');
    }

    function handleLogin() {
      const name = document.getElementById('loginUser').value;
      if (!name) return alert('Enter username');
      
      const users = JSON.parse(localStorage.getItem('swapwiseUsers') || '{}');
      const user = users[name] || {
        name: name,
        skill: 'General',
        avatar: DEFAULT_AVATAR,
        age: '',
        school: '',
        bio: ''
      };
      
      currentUser = user;
      localStorage.setItem('swapwiseCurrentUser', name);
      loadDashboard(user);
    }

    function handleRegister() {
      const name = document.getElementById('regName').value;
      const skill = document.getElementById('regSkill').value;
      if (!name || !skill) return alert('Fill all fields');
      
      const user = {
        name: name,
        skill: skill,
        avatar: DEFAULT_AVATAR,
        age: '',
        school: '',
        bio: ''
      };
      
      const users = JSON.parse(localStorage.getItem('swapwiseUsers') || '{}');
      users[name] = user;
      localStorage.setItem('swapwiseUsers', JSON.stringify(users));
      localStorage.setItem('swapwiseCurrentUser', name);
      currentUser = user;
      loadDashboard(user);
    }

    function loadDashboard(user) {
      hideAll();
      pages.dashboard.classList.remove('hidden');
      document.getElementById('userNameDisplay').innerText = user.name;
      document.getElementById('guestLinks').classList.add('hidden');
      document.getElementById('userLinks').classList.remove('hidden');
      const headerImg = document.querySelector('.profile-button img');
      if (headerImg) headerImg.src = user.avatar || DEFAULT_AVATAR;
      renderMatches();
    }

    function renderMatches() {
      const container = document.getElementById('matchesContainer');
      container.innerHTML = '';
      matchesData.forEach(m => {
        container.innerHTML += `
          <div class="match">
            <h4>${m.name}</h4>
            <small>Teaches: ${m.skill}</small>
            <small>Rating: ${m.rating}</small>
            <button onclick="sendRequest('${m.name}', '${m.skill}')">Request Swap</button>
          </div>`;
      });
    }

    function search(q) {
      const term = q.toLowerCase();
      document.querySelectorAll('.match').forEach(card => {
        card.style.display = card.innerText.toLowerCase().includes(term) ? 'block' : 'none';
      });
    }

    function openProfile() {
      hideAll();
      pages.profile.classList.remove('hidden');
      
      const username = localStorage.getItem('swapwiseCurrentUser');
      const users = JSON.parse(localStorage.getItem('swapwiseUsers') || '{}');
      const user = users[username] || {};

      document.getElementById('viewName').innerText = user.name || '—';
      document.getElementById('viewBio').innerText = user.bio || 'No bio yet';
      document.getElementById('viewSkill').innerText = user.skill || '—';
      document.getElementById('viewAge').innerText = user.age || '—';
      document.getElementById('viewBirthday').innerText = user.birthday ? formatDate(user.birthday) : '—';
      document.getElementById('viewSchool').innerText = user.school || '—';
      document.getElementById('userAvatar').src = user.avatar || DEFAULT_AVATAR;

      document.getElementById('profileView').classList.remove('hidden');
      document.getElementById('profileEdit').classList.add('hidden');
    }

    function formatDate(dateStr) {
      if (!dateStr) return '—';
      const date = new Date(dateStr);
      const options = { year: 'numeric', month: 'long', day: 'numeric' };
      return date.toLocaleDateString('en-US', options);
    }

    function openProfileFromMenu() {
      const menu = document.getElementById('profileMenu');
      if (menu) menu.classList.add('hidden');
      openProfile();
    }

    function showEditProfile() {
      const username = localStorage.getItem('swapwiseCurrentUser');
      const users = JSON.parse(localStorage.getItem('swapwiseUsers') || '{}');
      const user = users[username] || {};
      
      document.getElementById('editName').value = user.name || '';
      document.getElementById('editBio').value = user.bio || '';
      document.getElementById('editSkill').value = user.skill || '';
      document.getElementById('editAge').value = user.age || '';
      document.getElementById('editBirthday').value = user.birthday || '';
      document.getElementById('editSchool').value = user.school || '';
      document.getElementById('editPassword').value = '';
      
      const editPreview = document.getElementById('editAvatarPreview');
      if (editPreview) editPreview.src = user.avatar || DEFAULT_AVATAR;

      document.getElementById('profileView').classList.add('hidden');
      document.getElementById('profileEdit').classList.remove('hidden');
    }

    function cancelEditProfile() {
      openProfile();
    }

    function saveProfile() {
      const bday = document.getElementById('editBirthday').value;
      if (bday) {
        const b = new Date(bday);
        const today = new Date();
        if (b > today) return alert('Birthday must be in the past');
      }

      const editPreview = document.getElementById('editAvatarPreview');
      const avatarSrc = editPreview ? editPreview.src : DEFAULT_AVATAR;

      const updated = {
        name: document.getElementById('editName').value,
        bio: document.getElementById('editBio').value,
        skill: document.getElementById('editSkill').value,
        age: document.getElementById('editAge').value,
        birthday: document.getElementById('editBirthday').value,
        school: document.getElementById('editSchool').value,
        avatar: avatarSrc
      };
      
      const pw = document.getElementById('editPassword').value;
      if (pw) updated.password = pw;
      
      const username = localStorage.getItem('swapwiseCurrentUser');
      const users = JSON.parse(localStorage.getItem('swapwiseUsers') || '{}');
      users[username] = updated;
      localStorage.setItem('swapwiseUsers', JSON.stringify(users));
      
      alert('Profile saved!');
      loadDashboard(updated);
      openProfile();
    }

    function toggleProfileMenu() {
      const menu = document.getElementById('profileMenu');
      if (!menu) return;
      menu.classList.toggle('hidden');
    }

    function updateAvatar(event) {
      const file = event.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = function() {
        const dataUrl = reader.result;
        const editPreview = document.getElementById('editAvatarPreview');
        if (editPreview) editPreview.src = dataUrl;
        const userAvatar = document.getElementById('userAvatar');
        if (userAvatar) userAvatar.src = dataUrl;
        const headerImg = document.querySelector('.profile-button img');
        if (headerImg) headerImg.src = dataUrl;
      };
      reader.readAsDataURL(file);
    }

    function resetAvatarToDefault() {
      const defaultSrc = DEFAULT_AVATAR;
      document.getElementById('userAvatar').src = defaultSrc;
      const headerImg = document.querySelector('.profile-button img');
      if (headerImg) headerImg.src = defaultSrc;
      const editPreview = document.getElementById('editAvatarPreview');
      if (editPreview) editPreview.src = defaultSrc;
    }

    function showDashboard() {
      const username = localStorage.getItem('swapwiseCurrentUser');
      const users = JSON.parse(localStorage.getItem('swapwiseUsers') || '{}');
      const user = users[username];
      loadDashboard(user);
    }

    function toggleTheme() {
      document.body.classList.toggle('dark');
      const isDark = document.body.classList.contains('dark');
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
    }

    function logout() {
      if(confirm('Log out of SwapWise?')) {
        localStorage.removeItem('swapwiseCurrentUser');
        location.reload();
      }
    }

    function handleFindBuddy() {
      const username = localStorage.getItem('swapwiseCurrentUser');
      if (username) {
        const users = JSON.parse(localStorage.getItem('swapwiseUsers') || '{}');
        loadDashboard(users[username]);
      } else {
        showAuth('register');
      }
    }

function sendRequest(name, skill) {
  const inbox = JSON.parse(localStorage.getItem('swapwiseInbox')) || [];

  inbox.push({
    from: name,
    skill: skill,
    time: new Date().toLocaleString()
  });

  localStorage.setItem('swapwiseInbox', JSON.stringify(inbox));
  alert(`Swap request sent to ${name}!`);
}



function goToInbox() {
  window.location.href = "notification.html";
}

function goHome() {
  window.location.href = "index.html";
}


function renderInbox() {
  const container = document.getElementById('notifContainer');
  if (!container) return;

  const inbox = JSON.parse(localStorage.getItem('swapwiseInbox')) || [];
  container.innerHTML = '';

  if (inbox.length === 0) {
    container.innerHTML = '<p>No swap requests yet.</p>';
    return;
  }

  inbox.forEach((req, index) => {
    container.innerHTML += `
      <div class="notification">
        <h4>${req.from}</h4>
        <small>Wants to swap skill: ${req.skill}</small><br>
        <small>Sent: ${req.time}</small>

        <button class="accept" onclick="acceptRequest(${index})">Accept</button>
        <button class="decline" onclick="declineRequest(${index})">Decline</button>
      </div>
    `;
  });
}





function acceptRequest(index) {
  let inbox = JSON.parse(localStorage.getItem('swapwiseInbox')) || [];
  alert(`You accepted ${inbox[index].from}'s swap request`);
  inbox.splice(index, 1);
  localStorage.setItem('swapwiseInbox', JSON.stringify(inbox));
  renderInbox();
}

function declineRequest(index) {
  let inbox = JSON.parse(localStorage.getItem('swapwiseInbox')) || [];
  inbox.splice(index, 1);
  localStorage.setItem('swapwiseInbox', JSON.stringify(inbox));
  renderInbox();
}


console.log("script.js loaded");
