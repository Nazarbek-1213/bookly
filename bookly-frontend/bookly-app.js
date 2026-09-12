// BOOKLY FRONTEND - MAIN APPLICATION

let currentUser = null;
let currentPostId = null;

// ===== PAGE TOGGLE =====
function togglePage(pageName) {
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
    document.getElementById(pageName).classList.add('active');
}

// ===== AUTHENTICATION =====

// LOGIN FORM
document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    const errorDiv = document.getElementById('loginError');

    try {
        const data = await API.login(username, password);

        if (data.token) {
            currentUser = data;
            document.getElementById('currentUserAvatar').textContent = username[0].toUpperCase();
            togglePage('homePage');
            await loadHome();
            document.getElementById('loginForm').reset();
        } else {
            errorDiv.textContent = data.detail || 'Login xatosi';
            errorDiv.style.display = 'block';
        }
    } catch (error) {
        errorDiv.textContent = 'Server bilan bog\'lanish xatosi';
        errorDiv.style.display = 'block';
    }
});

// REGISTER FORM
document.getElementById('registerForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('regName').value;
    const username = document.getElementById('regUsername').value;
    const email = document.getElementById('regEmail').value;
    const bio = document.getElementById('regBio').value;
    const password = document.getElementById('regPassword').value;
    const password2 = document.getElementById('regPassword2').value;
    const file = document.getElementById('regFile').files[0];
    const errorDiv = document.getElementById('registerError');

    if (password !== password2) {
        errorDiv.textContent = 'Parollar bir xil bo\'lishi kerak!';
        errorDiv.style.display = 'block';
        return;
    }

    try {
        const data = await API.register(username, email, bio, password, password2, file);

        if (data.id || data.user_id) {
            errorDiv.textContent = '✅ Ro\'yxatdan muvaffaqiyat o\'tdingiz! Endi kirish qiling.';
            errorDiv.style.color = 'var(--success)';
            errorDiv.style.display = 'block';
            document.getElementById('registerForm').reset();
            setTimeout(() => togglePage('loginPage'), 2000);
        } else {
            errorDiv.textContent = data.detail || 'Ro\'yxatdan o\'tishda xato';
            errorDiv.style.display = 'block';
        }
    } catch (error) {
        errorDiv.textContent = 'Server bilan bog\'lanish xatosi';
        errorDiv.style.display = 'block';
    }
});

// LOGOUT
function setupLogoutButtons() {
    const logoutButtons = document.querySelectorAll('#logoutBtn, #logoutBtn2');
    logoutButtons.forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.preventDefault();
            try {
                await API.logout();
                currentUser = null;
                togglePage('loginPage');
                document.getElementById('loginForm').reset();
            } catch (error) {
                console.error('Logout error:', error);
            }
        });
    });
}

// ===== HOME PAGE LOAD =====
async function loadHome() {
    setupLogoutButtons();
    await loadFeed();
    await loadMyFollowing();
    await loadRecommendations();
}

// ===== LOAD FEED =====
async function loadFeed() {
    try {
        const data = await API.getFeed();
        const posts = data || [];
        const feedContainer = document.getElementById('feedContainer');
        feedContainer.innerHTML = '';

        if (!posts || posts.length === 0) {
            feedContainer.innerHTML = '<p style="text-align: center; color: var(--text-gray);">Hali postlar yo\'q</p>';
            return;
        }

        posts.forEach(post => {
            const postElement = createPostCard(post);
            feedContainer.appendChild(postElement);
        });
    } catch (error) {
        console.error('Error loading feed:', error);
    }
}

// CREATE POST CARD
function createPostCard(post) {
    const card = document.createElement('div');
    card.className = 'post-card';

    const createdDate = new Date(post.created_at);
    const timeAgo = getTimeAgo(createdDate);

    card.innerHTML = `
        <div class="post-header">
            <div class="post-user">
                <div class="user-avatar">${post.author?.username?.[0]?.toUpperCase() || 'U'}</div>
                <div class="post-user-info">
                    <div class="post-username">${post.author?.username || 'Unknown'}</div>
                    <div class="post-time">${timeAgo}</div>
                </div>
            </div>
        </div>
        <div class="post-image">${post.image_url ? `<img src="${API.API_BASE_URL}${post.image_url}">` : '📖'}</div>
        <div class="post-content">
            <div class="post-title">${post.title}</div>
            <div class="post-description">${post.description}</div>
            <div class="post-actions">
                <button class="action-btn" onclick="toggleLike(${post.id})">
                    ❤️ <span class="like-count">${post.likes_count || 0}</span>
                </button>
                <button class="action-btn" onclick="openPostModal(${post.id})">
                    💬 <span class="comment-count">${post.comments_count || 0}</span>
                </button>
            </div>
        </div>
    `;

    return card;
}

// TIME AGO HELPER
function getTimeAgo(date) {
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);

    if (seconds < 60) return `${seconds} sekund oldin`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} minut oldin`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} soat oldin`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days} kun oldin`;
    return date.toLocaleDateString('uz-UZ');
}

// ===== LIKE TOGGLE =====
async function toggleLike(postId) {
    try {
        await API.likePost(postId);
        await loadFeed();
    } catch (error) {
        console.error('Error toggling like:', error);
        // Agar already liked bo'lsa, unlike qilish
        try {
            await API.unlikePost(postId);
            await loadFeed();
        } catch (err) {
            console.error('Error unliking:', err);
        }
    }
}

// ===== PUBLISH POST =====
document.getElementById('publishBtn')?.addEventListener('click', async () => {
    const title = document.getElementById('postTitle').value;
    const description = document.getElementById('postDescription').value;
    const imageFile = document.getElementById('postImage').files[0];

    if (!title || !description) {
        alert('Sarlavha va tavsifni to\'ldiring!');
        return;
    }

    if (!imageFile) {
        alert('Rasm yuklang!');
        return;
    }

    try {
        await API.createPost(title, description, imageFile);
        document.getElementById('postTitle').value = '';
        document.getElementById('postDescription').value = '';
        document.getElementById('postImage').value = '';
        await loadFeed();
        alert('✅ Post yuborildi!');
    } catch (error) {
        alert('❌ Xato: ' + error.message);
    }
});

// ===== LOAD MY FOLLOWING =====
async function loadMyFollowing() {
    try {
        const data = await API.getMyFollowersList();
        const followingList = document.getElementById('followingList');
        followingList.innerHTML = '';

        if (!data || !data.followers) {
            followingList.innerHTML = '<p style="color: var(--text-gray); font-size: 12px;">Following yo\'q</p>';
            return;
        }

        // Agarda object bo'lsa va 'followers' key bor
        const followers = Array.isArray(data) ? data : (data.followers || []);

        followers.slice(0, 6).forEach(user => {
            const userElement = document.createElement('div');
            userElement.className = 'following-item';
            userElement.innerHTML = `
                <div class="user-avatar">${user.username?.[0]?.toUpperCase() || 'U'}</div>
                <div class="following-info">
                    <div class="following-name">${user.name || user.username}</div>
                    <div class="following-status">🟢 Online</div>
                </div>
            `;
            followingList.appendChild(userElement);
        });
    } catch (error) {
        console.error('Error loading following:', error);
    }
}

// ===== LOAD RECOMMENDATIONS =====
async function loadRecommendations() {
    try {
        const data = await API.getTopFollowed();
        const recommendations = data.users || [];
        const recList = document.getElementById('recommendationsList');
        recList.innerHTML = '';

        recommendations.slice(0, 5).forEach(user => {
            const recElement = document.createElement('div');
            recElement.className = 'recommendation-item';
            recElement.innerHTML = `
                <div class="user-avatar">${user.username?.[0]?.toUpperCase() || 'U'}</div>
                <div class="rec-info">
                    <div class="rec-name">${user.username}</div>
                    <div class="rec-username">👥 ${user.followers} followers</div>
                </div>
                <button class="rec-btn" onclick="toggleFollow(${user.user_id}, this)">Follow</button>
            `;
            recList.appendChild(recElement);
        });
    } catch (error) {
        console.error('Error loading recommendations:', error);
    }
}

// ===== FOLLOW TOGGLE =====
async function toggleFollow(userId, button) {
    try {
        if (button.textContent === 'Follow') {
            await API.followUser(userId);
            button.textContent = 'Following';
            button.classList.add('following');
        } else {
            await API.unfollowUser(userId);
            button.textContent = 'Follow';
            button.classList.remove('following');
        }
    } catch (error) {
        console.error('Error toggling follow:', error);
    }
}

// ===== POST MODAL =====
async function openPostModal(postId) {
    currentPostId = postId;
    const modal = document.getElementById('postModal');
    const modalContent = document.getElementById('modalPostContent');
    const modalComments = document.getElementById('modalComments');

    try {
        const feed = await API.getFeed();
        const post = feed.find(p => p.id === postId);

        if (post) {
            const timeAgo = getTimeAgo(new Date(post.created_at));
            modalContent.innerHTML = `
                <div class="post-header">
                    <div class="post-user">
                        <div class="user-avatar">${post.author?.username?.[0]?.toUpperCase() || 'U'}</div>
                        <div class="post-user-info">
                            <div class="post-username">${post.author?.username}</div>
                            <div class="post-time">${timeAgo}</div>
                        </div>
                    </div>
                </div>
                <div class="post-image">${post.image_url ? `<img src="${API.API_BASE_URL}${post.image_url}">` : '📖'}</div>
                <div class="post-content">
                    <div class="post-title">${post.title}</div>
                    <div class="post-description">${post.description}</div>
                    <div class="post-actions">
                        <button class="action-btn" onclick="toggleLike(${post.id})">❤️ ${post.likes_count || 0}</button>
                        <button class="action-btn">💬 ${post.comments_count || 0}</button>
                    </div>
                </div>
            `;
        }

        const commentsData = await API.getComments(postId);
        const comments = Array.isArray(commentsData) ? commentsData : (commentsData.comments || []);
        modalComments.innerHTML = '<h3>💬 Sharhlar</h3>';

        comments.forEach(comment => {
            const commentEl = document.createElement('div');
            commentEl.className = 'comment-item';
            const commentDate = new Date(comment.created_at);
            const commentTime = getTimeAgo(commentDate);
            commentEl.innerHTML = `
                <div class="comment-user">${comment.user?.username || 'Unknown'}</div>
                <div class="comment-text">${comment.text}</div>
                <div class="comment-time">${commentTime}</div>
            `;
            modalComments.appendChild(commentEl);
        });
    } catch (error) {
        console.error('Error loading post:', error);
    }

    modal.style.display = 'flex';
}

// CLOSE MODAL
document.querySelectorAll('.modal-close').forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.target.closest('.modal').style.display = 'none';
    });
});

document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
        if (e.target.id && e.target.id.includes('Modal')) {
            e.target.style.display = 'none';
        }
    });
});

// ADD COMMENT
document.getElementById('submitCommentBtn')?.addEventListener('click', async () => {
    const text = document.getElementById('commentInput').value;

    if (!text.trim()) {
        alert('Sharh yozing!');
        return;
    }

    try {
        await API.addComment(currentPostId, text);
        document.getElementById('commentInput').value = '';
        await openPostModal(currentPostId);
    } catch (error) {
        alert('❌ Xato: ' + error.message);
    }
});

// ===== PROFILE PAGE =====

async function loadProfile() {
    setupLogoutButtons();
    try {
        const profile = await API.getMyProfile();
        const username = profile.username || 'User';

        document.getElementById('profileAvatar').textContent = username[0].toUpperCase();
        document.getElementById('profileUsername').textContent = username;
        document.getElementById('profileBio').textContent = profile.bio || 'Bio yo\'q';
        document.getElementById('profilePosts').textContent = profile.post_count || 0;
        document.getElementById('profileFollowers').textContent = profile.follower_count || 0;
        document.getElementById('profileFollowing').textContent = profile.following_count || 0;

        // Load my posts
        const feed = await API.getFeed();
        const myPosts = feed.filter(post => post.author?.username === username);

        const myPostsContainer = document.getElementById('myPostsContainer');
        myPostsContainer.innerHTML = '';

        if (myPosts.length === 0) {
            myPostsContainer.innerHTML = '<p style="text-align: center; color: var(--text-gray);">Hali postlar yo\'q</p>';
        } else {
            myPosts.forEach(post => {
                const postCard = createPostCard(post);
                myPostsContainer.appendChild(postCard);
            });
        }
    } catch (error) {
        console.error('Error loading profile:', error);
    }
}

// Edit Profile Modal
document.getElementById('editProfileBtn')?.addEventListener('click', async () => {
    try {
        const profile = await API.getMyProfile();
        document.getElementById('editUsername').value = profile.username;
        document.getElementById('editEmail').value = profile.email || '';
        document.getElementById('editBio').value = profile.bio || '';
        document.getElementById('editModal').style.display = 'flex';
    } catch (error) {
        console.error('Error loading profile:', error);
    }
});

// Edit Profile Form
document.getElementById('editProfileForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
        const username = document.getElementById('editUsername').value;
        const email = document.getElementById('editEmail').value;
        const bio = document.getElementById('editBio').value;
        const file = document.getElementById('editFile').files[0];

        await API.editProfile(username, email, bio, file);
        document.getElementById('editModal').style.display = 'none';
        await loadProfile();
        alert('✅ Profil yangilandi!');
    } catch (error) {
        alert('❌ Xato: ' + error.message);
    }
});

// Change Password Modal
document.getElementById('changePasswordBtn')?.addEventListener('click', () => {
    document.getElementById('passwordModal').style.display = 'flex';
});

// Change Password Form
document.getElementById('changePasswordForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
        const oldPassword = document.getElementById('oldPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const newPassword2 = document.getElementById('newPassword2').value;

        if (newPassword !== newPassword2) {
            alert('Yangi parollar bir xil bo\'lishi kerak!');
            return;
        }

        await API.changePassword(oldPassword, newPassword, newPassword2);
        document.getElementById('passwordModal').style.display = 'none';
        alert('✅ Parol o\'zgartirildi!');
    } catch (error) {
        alert('❌ Xato: ' + error.message);
    }
});

// Toggle Account Type
document.getElementById('toggleAccountBtn')?.addEventListener('click', async () => {
    try {
        await API.toggleAccountType();
        await loadProfile();
        alert('✅ Akkaunt turi o\'zgartirildi!');
    } catch (error) {
        alert('❌ Xato: ' + error.message);
    }
});

// Load Top Users Page
async function loadTopUsers() {
    setupLogoutButtons();
    togglePage('homePage');
    try {
        const data = await API.getTopFollowed();
        const topUsers = data.users || [];
        const feedContainer = document.getElementById('feedContainer');
        feedContainer.innerHTML = '<h2>🔥 Eng mashhur userlar</h2>';

        topUsers.forEach(user => {
            const userCard = document.createElement('div');
            userCard.className = 'recommendation-item';
            userCard.style.marginBottom = '12px';
            userCard.innerHTML = `
                <div class="user-avatar">${user.username?.[0]?.toUpperCase() || 'U'}</div>
                <div class="rec-info">
                    <div class="rec-name">${user.username}</div>
                    <div class="rec-username">👥 ${user.followers} followers</div>
                </div>
                <button class="rec-btn" onclick="toggleFollow(${user.user_id}, this)">Follow</button>
            `;
            feedContainer.appendChild(userCard);
        });
    } catch (error) {
        console.error('Error loading top users:', error);
    }
}

// Profile page toggle handler
document.addEventListener('DOMContentLoaded', () => {
    const observer = new MutationObserver(() => {
        const profilePage = document.getElementById('profilePage');
        if (profilePage && profilePage.classList.contains('active')) {
            loadProfile();
        }
    });

    observer.observe(document.body, { attributes: true, subtree: true });
});

console.log('✅ Bookly Frontend loaded!');