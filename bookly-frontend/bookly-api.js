// BOOKLY API CONFIGURATION
const API_BASE_URL = 'http://localhost:8000';

let authToken = localStorage.getItem('authToken');

const API = {
    // ===== AUTH ENDPOINTS =====

    register: async (username, email, bio, password, password2, file) => {
        try {
            const formData = new FormData();
            formData.append('username', username);
            formData.append('email', email);
            formData.append('bio', bio || '');
            formData.append('password', password);
            formData.append('password2', password2);
            if (file) formData.append('file', file);

            const response = await fetch(`${API_BASE_URL}/auth/registration/`, {
                method: 'POST',
                body: formData
            });
            return await response.json();
        } catch (error) {
            console.error('Register error:', error);
            throw error;
        }
    },

    login: async (username, password) => {
        try {
            const formData = new FormData();
            formData.append('username', username);
            formData.append('password', password);

            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                body: formData
            });
            const data = await response.json();
            if (data.token) {
                authToken = data.token;
                localStorage.setItem('authToken', authToken);
            }
            return data;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    },

    logout: async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/logout`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            authToken = null;
            localStorage.removeItem('authToken');
            return await response.json();
        } catch (error) {
            console.error('Logout error:', error);
            throw error;
        }
    },

    deleteAccount: async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/delete-account`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            authToken = null;
            localStorage.removeItem('authToken');
            return await response.json();
        } catch (error) {
            console.error('Delete account error:', error);
            throw error;
        }
    },

    editProfile: async (username, email, bio, file) => {
        try {
            const formData = new FormData();
            formData.append('username', username);
            formData.append('email', email);
            formData.append('bio', bio || '');
            if (file) formData.append('file', file);

            const response = await fetch(`${API_BASE_URL}/auth/EditInfo`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${authToken}` },
                body: formData
            });
            return await response.json();
        } catch (error) {
            console.error('Edit profile error:', error);
            throw error;
        }
    },

    changePassword: async (oldPassword, password, password2) => {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify({
                    old_password: oldPassword,
                    password: password,
                    password2: password2
                })
            });
            return await response.json();
        } catch (error) {
            console.error('Change password error:', error);
            throw error;
        }
    },

    // ===== USER ENDPOINTS =====

    getMyProfile: async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/user/profile/me`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            return await response.json();
        } catch (error) {
            console.error('Get my profile error:', error);
            throw error;
        }
    },

    getUserProfile: async (userId) => {
        try {
            const response = await fetch(`${API_BASE_URL}/user/profile/${userId}`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            return await response.json();
        } catch (error) {
            console.error('Get user profile error:', error);
            throw error;
        }
    },

    searchUser: async (username) => {
        try {
            const response = await fetch(`${API_BASE_URL}/user/search?username=${username}`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            return await response.json();
        } catch (error) {
            console.error('Search user error:', error);
            throw error;
        }
    },

    followUser: async (userId) => {
        try {
            const response = await fetch(`${API_BASE_URL}/user/follow?following_id=${userId}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            return await response.json();
        } catch (error) {
            console.error('Follow user error:', error);
            throw error;
        }
    },

    unfollowUser: async (userId) => {
        try {
            const response = await fetch(`${API_BASE_URL}/user/unfollow?following_id=${userId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            return await response.json();
        } catch (error) {
            console.error('Unfollow user error:', error);
            throw error;
        }
    },

    toggleAccountType: async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/user/account-type/`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            return await response.json();
        } catch (error) {
            console.error('Toggle account type error:', error);
            throw error;
        }
    },

    getTopFollowed: async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/user/top-followed`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            return await response.json();
        } catch (error) {
            console.error('Get top followed error:', error);
            throw error;
        }
    },

    getFollowersList: async (userId) => {
        try {
            const response = await fetch(`${API_BASE_URL}/user/Followers/${userId}/list`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            return await response.json();
        } catch (error) {
            console.error('Get followers list error:', error);
            throw error;
        }
    },

    getMyFollowersList: async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/user/Followers/me/list`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            return await response.json();
        } catch (error) {
            console.error('Get my followers list error:', error);
            throw error;
        }
    },

    // ===== POST ENDPOINTS =====

    createPost: async (title, description, file) => {
        try {
            const formData = new FormData();
            formData.append('title', title);
            formData.append('description', description);
            formData.append('file', file);

            const response = await fetch(`${API_BASE_URL}/post/post`, {
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

    deletePost: async (postId) => {
        try {
            const response = await fetch(`${API_BASE_URL}/post/delete/${postId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            return await response.json();
        } catch (error) {
            console.error('Delete post error:', error);
            throw error;
        }
    },

    editPost: async (postId, title, description, file) => {
        try {
            const formData = new FormData();
            formData.append('title', title);
            formData.append('description', description);
            formData.append('file', file);

            const response = await fetch(`${API_BASE_URL}/post/put/${postId}`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${authToken}` },
                body: formData
            });
            return await response.json();
        } catch (error) {
            console.error('Edit post error:', error);
            throw error;
        }
    },

    getFeed: async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/post/see`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            return await response.json();
        } catch (error) {
            console.error('Get feed error:', error);
            throw error;
        }
    },

    // ===== REVIEW ENDPOINTS =====

    addComment: async (bookId, text) => {
        try {
            const response = await fetch(`${API_BASE_URL}/review/comment/${bookId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify({ text: text })
            });
            return await response.json();
        } catch (error) {
            console.error('Add comment error:', error);
            throw error;
        }
    },

    deleteComment: async (bookId) => {
        try {
            const response = await fetch(`${API_BASE_URL}/review/delete/${bookId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            return await response.json();
        } catch (error) {
            console.error('Delete comment error:', error);
            throw error;
        }
    },

    editComment: async (commentId, text, bookId) => {
        try {
            const response = await fetch(`${API_BASE_URL}/review/edit/${commentId}?book_id=${bookId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify({ text: text })
            });
            return await response.json();
        } catch (error) {
            console.error('Edit comment error:', error);
            throw error;
        }
    },

    getComments: async (bookId) => {
        try {
            const response = await fetch(`${API_BASE_URL}/review/see/comments?book_id=${bookId}`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            return await response.json();
        } catch (error) {
            console.error('Get comments error:', error);
            throw error;
        }
    },

    likePost: async (bookId) => {
        try {
            const response = await fetch(`${API_BASE_URL}/review/like/${bookId}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            return await response.json();
        } catch (error) {
            console.error('Like post error:', error);
            throw error;
        }
    },

    unlikePost: async (bookId) => {
        try {
            const response = await fetch(`${API_BASE_URL}/review/like/${bookId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            return await response.json();
        } catch (error) {
            console.error('Unlike post error:', error);
            throw error;
        }
    },

    getLikeCount: async (bookId) => {
        try {
            const response = await fetch(`${API_BASE_URL}/review/count/like/${bookId}`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            return await response.json();
        } catch (error) {
            console.error('Get like count error:', error);
            throw error;
        }
    }
};