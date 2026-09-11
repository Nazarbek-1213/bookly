// BOOKLY API CONFIGURATION
// Siz o'z endpointlarni shu yerga qo'yasiz!

const API_BASE_URL = 'http://127.0.0.1:8000'; // Backend URL
let authToken = localStorage.getItem('authToken'); // Token saqlash

// ===== AUTH ENDPOINTS =====
const API = {
    // REGISTER
    register: async (name, username, email, password) => {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, username, email, password })
            });
            return await response.json();
        } catch (error) {
            console.error('Register error:', error);
            throw error;
        }
    },

    // LOGIN
    login: async (username, password) => {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await response.json();
            if (data.access_token) {
                authToken = data.access_token;
                localStorage.setItem('authToken', authToken);
            }
            return data;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    },

    // LOGOUT
    logout: () => {
        authToken = null;
        localStorage.removeItem('authToken');
    },

    // ===== POST ENDPOINTS =====
    // BARCHA POSTLARNI OLISH
    getPosts: async (page = 1, limit = 10) => {
        try {
            const response = await fetch(`${API_BASE_URL}/posts?page=${page}&limit=${limit}`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            return await response.json();
        } catch (error) {
            console.error('Get posts error:', error);
            throw error;
        }
    },

    // POST YARATISH
    createPost: async (title, description, image = null) => {
        try {
            const formData = new FormData();
            formData.append('title', title);
            formData.append('description', description);
            if (image) formData.append('image', image);

            const response = await fetch(`${API_BASE_URL}/posts/create`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${authToken}` },
                body: formData
            });
            return await response.json();
        } catch (error) {
            console.error('Create post error:', error);
            throw error;
        }
    },

    // POST LIKE QILISH
    likePost: async (postId) => {
        try {
            const response = await fetch(`${API_BASE_URL}/posts/${postId}/like`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            return await response.json();
        } catch (error) {
            console.error('Like post error:', error);
            throw error;
        }
    },

    // POST UNLIKE QILISH
    unlikePost: async (postId) => {
        try {
            const response = await fetch(`${API_BASE_URL}/posts/${postId}/unlike`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            return await response.json();
        } catch (error) {
            console.error('Unlike post error:', error);
            throw error;
        }
    },

    // ===== COMMENT ENDPOINTS =====
    // SHARH QILISH
    addComment: async (postId, text) => {
        try {
            const response = await fetch(`${API_BASE_URL}/posts/${postId}/comment`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify({ text })
            });
            return await response.json();
        } catch (error) {
            console.error('Add comment error:', error);
            throw error;
        }
    },

    // POST SHARHLARI
    getComments: async (postId) => {
        try {
            const response = await fetch(`${API_BASE_URL}/posts/${postId}/comments`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            return await response.json();
        } catch (error) {
            console.error('Get comments error:', error);
            throw error;
        }
    },

    // ===== USER ENDPOINTS =====
    // FOYDALANUVCHI PROFILI
    getUserProfile: async (userId) => {
        try {
            const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            return await response.json();
        } catch (error) {
            console.error('Get user profile error:', error);
            throw error;
        }
    },

    // CURRENT USER
    getCurrentUser: async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/users/me`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            return await response.json();
        } catch (error) {
            console.error('Get current user error:', error);
            throw error;
        }
    },

    // ===== FOLLOW ENDPOINTS =====
    // FOLLOW QILISH
    followUser: async (userId) => {
        try {
            const response = await fetch(`${API_BASE_URL}/users/${userId}/follow`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            return await response.json();
        } catch (error) {
            console.error('Follow user error:', error);
            throw error;
        }
    },

    // UNFOLLOW QILISH
    unfollowUser: async (userId) => {
        try {
            const response = await fetch(`${API_BASE_URL}/users/${userId}/unfollow`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            return await response.json();
        } catch (error) {
            console.error('Unfollow user error:', error);
            throw error;
        }
    },

    // FOLLOWING RO'YXATI
    getFollowing: async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/users/following`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            return await response.json();
        } catch (error) {
            console.error('Get following error:', error);
            throw error;
        }
    },

    // ===== RECOMMENDATIONS =====
    getRecommendations: async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/users/recommendations`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            return await response.json();
        } catch (error) {
            console.error('Get recommendations error:', error);
            throw error;
        }
    },

    // ===== SEARCH =====
    searchPosts: async (query) => {
        try {
            const response = await fetch(`${API_BASE_URL}/posts/search?q=${query}`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            return await response.json();
        } catch (error) {
            console.error('Search error:', error);
            throw error;
        }
    },

    searchUsers: async (query) => {
        try {
            const response = await fetch(`${API_BASE_URL}/users/search?q=${query}`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            return await response.json();
        } catch (error) {
            console.error('Search users error:', error);
            throw error;
        }
    }
};