const DEFAULT_AVATAR = 'images/coco.jpg';

let currentSlide = 0;
let profilesData = [];

async function loadCarousel() {
    const track = document.getElementById('carouselTrack');
    if (!track) return;

    // 1. Fetch ALL necessary fields including bio and age
    const { data: profiles, error } = await _supabase
        .from('profiles')
        .select('full_name, teaching_skill, avatar_url, school, bio, age');

    if (error || !profiles || profiles.length === 0) return;
    
    profilesData = profiles;
    const cloneCount = 3; 
    const combined = [...profiles.slice(-cloneCount), ...profiles, ...profiles.slice(0, cloneCount)];

    track.innerHTML = combined.map((user, index) => {
        const userImg = (user.avatar_url && user.avatar_url.trim() !== "") ? user.avatar_url : DEFAULT_AVATAR;
        
        return `
            <div class="carousel-item" data-index="${index}">
                <div class="avatar-container">
                    <img src="${userImg}" class="card-avatar" onerror="this.src='${DEFAULT_AVATAR}'"> 
                </div>
                <h3>${user.full_name || 'Anonymous'}</h3>
                <p class="user-bio">"${user.bio || 'Hello! Let\'s swap skills.'}"</p>
                <p><strong>Teaches:</strong> ${user.teaching_skill || 'Various'}</p>
                <div class="user-meta">
                    <span>${user.school || 'SwapWise'}</span> • 
                    <span>Age: ${user.age || '—'}</span>
                </div>
            </div>`;
    }).join('');

    currentSlide = cloneCount; 
    updateCarousel(false);
}

function moveCarousel(direction) {
    const cloneCount = Math.min(profilesData.length, 3);
    currentSlide += direction;
    updateCarousel(true);

    const track = document.getElementById('carouselTrack');
    track.addEventListener('transitionend', () => {
        if (currentSlide >= profilesData.length + cloneCount) {
            currentSlide = cloneCount;
            updateCarousel(false);
        }
        if (currentSlide < cloneCount) {
            currentSlide = profilesData.length + cloneCount - 1;
            updateCarousel(false);
        }
    }, { once: true });
}

function updateCarousel(withTransition) {
    const track = document.getElementById('carouselTrack');
    const cards = document.querySelectorAll('.carousel-item');
    if (!cards.length) return;

    // Calculate dynamic spacing for centering
    const cardStyle = window.getComputedStyle(cards[0]);
    const marginRight = parseFloat(cardStyle.marginRight);
    const marginLeft = parseFloat(cardStyle.marginLeft);
    const cardWidth = cards[0].offsetWidth + marginRight + marginLeft;
    
    // Viewport centering logic
    const offset = (window.innerWidth / 2) - (cardWidth / 2);

    track.style.transition = withTransition ? 'transform 0.6s cubic-bezier(0.23, 1, 0.32, 1)' : 'none';
    track.style.transform = `translateX(${-currentSlide * cardWidth + offset}px)`;

    // Apply Focus/Blur classes
    cards.forEach((card, idx) => {
        card.classList.toggle('active', idx === currentSlide);
    });
}

function updateProfileUI(user) {
    const avatarImg = document.getElementById('userAvatar');
    const editPreview = document.getElementById('editAvatarPreview');
    const headerImg = document.getElementById('headerAvatarImg');

    // Logic: Use stored URL, or the DEFAULT_AVATAR if null/empty
    const finalSrc = (user.avatar_url && user.avatar_url.trim() !== "") 
                     ? user.avatar_url 
                     : DEFAULT_AVATAR;

    if (avatarImg) avatarImg.src = finalSrc;
    if (editPreview) editPreview.src = finalSrc;
    if (headerImg) headerImg.src = finalSrc;
}