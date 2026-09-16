/* =====================================================================
   Bookly — Instagram-style frontend for the FastAPI "books" backend
   Structure: CONFIG → state → api() → API → modals → auth → router → pages
   ===================================================================== */
'use strict';

/* ============================== CONFIG ============================== */
const CONFIG = {
  BASE_URL: 'http://localhost:8000',
  TOKEN_FIELD: 'token',        // field of the login response that holds the token
  USER_ID_FIELD: 'user_id',    // field of the login response that holds my user id
  STORAGE: {
    token: 'bookly_token',
    userId: 'bookly_user_id',
    liked: 'bookly_liked_',    // + userId
    pending: 'bookly_pending_', // + userId (yopiq akkauntlarga yuborilgan so'rovlar)
  },
  TOAST_MS: 3200,
};

/* ============================== ICONS =============================== */
const ICONS = {
  home: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9.005 16.545a2.997 2.997 0 0 1 2.997-2.997A2.997 2.997 0 0 1 15 16.545V22h7V11.543L12 2 2 11.543V22h7.005Z" fill="none" stroke="currentColor" stroke-linejoin="round" stroke-width="2"/></svg>',
  search: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 10.5A8.5 8.5 0 1 1 10.5 2a8.5 8.5 0 0 1 8.5 8.5Z" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/><line x1="16.511" x2="22" y1="16.511" y2="22" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/></svg>',
  plus: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12v3.45c0 2.849.698 4.005 1.606 4.944.94.909 2.098 1.608 4.946 1.608h6.896c2.848 0 4.006-.7 4.946-1.608C21.302 19.455 22 18.3 22 15.45V8.552c0-2.849-.698-4.006-1.606-4.945C19.454 2.7 18.296 2 15.448 2H8.552c-2.848 0-4.006.699-4.946 1.607C2.698 4.547 2 5.703 2 8.552Z" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/><line x1="6.545" x2="17.455" y1="12.001" y2="12.001" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/><line x1="12.003" x2="12.003" y1="6.545" y2="17.455" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/></svg>',
  settings: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.635" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/><path d="M14.232 3.656a1.269 1.269 0 0 1-.796-.66L12.93 2h-1.86l-.505.996a1.269 1.269 0 0 1-.796.66m-.001 17.687a1.269 1.269 0 0 1 .796.66l.505.996h1.862l.505-.996a1.269 1.269 0 0 1 .796-.66M3.656 9.768a1.269 1.269 0 0 1-.66.796L2 11.07v1.862l.996.505a1.269 1.269 0 0 1 .66.796m17.687-.001a1.269 1.269 0 0 1 .66-.796L22 12.93v-1.86l-.996-.505a1.269 1.269 0 0 1-.66-.796M7.678 4.522a1.269 1.269 0 0 1-1.03.096l-1.06-.348L4.27 5.587l.348 1.062a1.269 1.269 0 0 1-.096 1.03m11.8 11.799a1.269 1.269 0 0 1 1.03-.096l1.06.348 1.318-1.317-.348-1.062a1.269 1.269 0 0 1 .096-1.03m-14.956.001a1.269 1.269 0 0 1 .096 1.03l-.348 1.06 1.317 1.318 1.062-.348a1.269 1.269 0 0 1 1.03.096m11.799-11.8a1.269 1.269 0 0 1-.096-1.03l.348-1.06-1.317-1.318-1.062.348a1.269 1.269 0 0 1-1.03-.096" fill="none" stroke="currentColor" stroke-linejoin="round" stroke-width="2"/><circle cx="12" cy="12" r="3.5" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
  heart: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16.792 3.904A4.989 4.989 0 0 1 21.5 9.122c0 3.072-2.652 4.959-5.197 7.222-2.512 2.243-3.865 3.469-4.303 3.752-.477-.309-2.143-1.823-4.303-3.752C5.141 14.072 2.5 12.167 2.5 9.122a4.989 4.989 0 0 1 4.708-5.218 4.21 4.21 0 0 1 3.675 1.941c.84 1.175.98 1.763 1.12 1.763s.278-.588 1.11-1.766a4.17 4.17 0 0 1 3.679-1.938m0-2a6.04 6.04 0 0 0-4.797 2.127 6.052 6.052 0 0 0-4.787-2.127A6.985 6.985 0 0 0 .5 9.122c0 3.61 2.55 5.827 5.015 7.97.283.246.569.494.853.747l1.027.918a44.998 44.998 0 0 0 3.518 3.018 2 2 0 0 0 2.174 0 45.263 45.263 0 0 0 3.626-3.115l.922-.824c.293-.26.59-.519.885-.774 2.334-2.025 4.98-4.32 4.98-7.94a6.985 6.985 0 0 0-6.708-7.218Z" fill="currentColor"/></svg>',
  heartFilled: '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M34.6 3.1c-4.5 0-7.9 1.8-10.6 5.6-2.7-3.7-6.1-5.5-10.6-5.5C6 3.1 0 9.6 0 17.6c0 7.3 5.4 12 10.6 16.5.6.5 1.3 1.1 1.9 1.7l2.3 2c4.4 3.9 6.6 5.9 7.6 6.5.5.3 1.1.5 1.6.5s1.1-.2 1.6-.5c1-.6 2.8-2.2 7.8-6.8l2-1.8c.7-.6 1.3-1.2 2-1.7C42.7 29.6 48 25 48 17.6c0-8-6-14.5-13.4-14.5z" fill="currentColor"/></svg>',
  comment: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.656 17.008a9.993 9.993 0 1 0-3.59 3.615L22 22Z" fill="none" stroke="currentColor" stroke-linejoin="round" stroke-width="2"/></svg>',
  more: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="1.5" fill="currentColor"/><circle cx="6" cy="12" r="1.5" fill="currentColor"/><circle cx="18" cy="12" r="1.5" fill="currentColor"/></svg>',
  close: '<svg viewBox="0 0 24 24" aria-hidden="true"><polyline points="20.643 3.357 12 12 3.353 20.647" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="3"/><line x1="20.649" x2="3.354" y1="20.649" y2="3.354" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="3"/></svg>',
  lock: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="10" width="16" height="11" rx="2" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M8 10V7a4 4 0 0 1 8 0v3" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>',
  photo: '<svg viewBox="0 0 97.6 77.3" aria-hidden="true"><path d="M16.3 24h.3c2.8-.2 4.9-2.6 4.8-5.4-.2-2.8-2.6-4.9-5.4-4.8s-4.9 2.6-4.8 5.4c.1 2.7 2.4 4.8 5.1 4.8zm35.8 18.6l-8.3-11.8c-1.9-2.7-5.6-3.3-8.2-1.4l-6.7 4.8c-.4.3-.9.2-1.2-.2l-8.9-11.8c-1.9-2.5-5.6-2.9-8.1-1L5.5 25.5c-.2.1-.5.1-.7.1L.9 25.4c-.3 0-.5.2-.5.5v.2c.1 2.4 1.9 4.4 4.3 4.6h.3L5 30l.2.1 6.6 8.9c1.9 2.5 5.6 2.9 8.1 1l5.1-3.8c.4-.3.9-.2 1.2.2l8.4 11.9c1.9 2.7 5.6 3.3 8.2 1.4l7.4-5.3c.4-.3.9-.2 1.2.2l3.5 4.9c.3.4.9.3 1.2-.1l-.4-7.9zM73.6 40.4L58.4 58.9l-11.9-14.9c-1.6-2-4.6-2.3-6.6-.7L28.6 52l12.2 17.3c.2.3.6.3.8 0l7.8-9.6c.3-.3.7-.3 1 0l16.5 20.3c.3.3.7.3.9 0l19.6-30.2c.2-.3.1-.7-.1-.9l-6.3-6.2c-1.9-1.8-5.2-1.6-7.4 1.7z" fill="currentColor"/><path d="M84.7 18.4L58 16.9l-.2-3c-.3-5.7-5.2-10.1-11-9.8L12.9 6c-5.7.3-10.1 5.3-9.8 11L3 47v3.3c0 1.3.6 2.5 1.6 3.3l6.6 5.2 11.8 15.2c1.9 2.5 5.6 2.9 8.1 1L47 63.2c.4-.3.9-.2 1.2.2l8.6 11.4c1.9 2.5 5.6 2.9 8.1 1l26.7-19.7c2.5-1.9 3.1-5.5 1.3-8.1z" fill="none" stroke="currentColor" stroke-width="3"/></svg>',
  camera: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 8a3 3 0 0 1 3-3h2l1.5-2h7L17 5h2a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3Z" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="13" r="4" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>',
};
const DEFAULT_AVATAR = 'data:image/svg+xml;utf8,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><circle cx="48" cy="48" r="48" fill="#dbdbdb"/><circle cx="48" cy="38" r="17" fill="#fff"/><path d="M14 86c4-18 18-27 34-27s30 9 34 27a48 48 0 0 1-68 0z" fill="#fff"/></svg>'
);

/* ============================== STATE =============================== */
const state = {
  token: null,
  userId: null,
  me: null,                 // /user/profile/me
  users: new Map(),         // id -> { id, username, image_url, private, ... }
  userPromises: new Map(),  // id -> Promise
  liked: new Set(),         // post ids liked by me (localStorage)
  likeCounts: new Map(),    // post id -> count
  following: new Set(),     // usernames I follow (from /user/Followings/me/list)
  pending: new Set(),       // user ids I sent a follow request to (private accounts)
  posts: new Map(),         // post id -> post object (feed + profile grids)
  route: { path: '/', params: {}, query: {} },
  modals: [],               // stack of modal elements
};

/* ============================== HELPERS ============================= */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

function esc(v) {
  if (v === null || v === undefined) return '';
  return String(v)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
function imgUrl(u) {
  if (!u) return DEFAULT_AVATAR;
  if (/^(https?:|data:|blob:)/i.test(u)) return u;
  return CONFIG.BASE_URL.replace(/\/$/, '') + (u.startsWith('/') ? u : '/' + u);
}
function postImg(u) {
  if (!u) return '';
  return imgUrl(u);
}
function avatarImg(u, cls = 'avatar-32') {
  return `<img class="avatar ${cls}" src="${esc(imgUrl(u))}" alt="">`;
}
function timeAgo(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const s = Math.max(0, Math.floor((Date.now() - d.getTime()) / 1000));
  if (s < 60) return 'hozir';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} daqiqa`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} soat`;
  const dd = Math.floor(h / 24);
  if (dd < 7) return `${dd} kun`;
  const w = Math.floor(dd / 7);
  if (w < 5) return `${w} hafta`;
  return d.toLocaleDateString('uz-UZ');
}
function fmtDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return String(iso);
  return d.toLocaleString('uz-UZ');
}
function isPrivateType(t) {
  return String(t || '').toUpperCase().includes('PRIVATE');
}
function isPublicProfile(p) {
  return !!p && Array.isArray(p.posts);
}
function spinner(cls = '') { return `<div class="spinner ${cls}"></div>`; }
function pluralLikes(n) { return `${n} ta yoqtirish`; }

/* toast */
function toast(msg, type = 'info') {
  const root = $('#toast-root');
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = msg;
  root.appendChild(el);
  setTimeout(() => el.remove(), CONFIG.TOAST_MS);
}

/* liked-state persistence */
function likedKey() { return CONFIG.STORAGE.liked + (state.userId || 'anon'); }
function loadLiked() {
  try {
    const arr = JSON.parse(localStorage.getItem(likedKey()) || '[]');
    state.liked = new Set(arr.map(String));
  } catch { state.liked = new Set(); }
}
function saveLiked() {
  try { localStorage.setItem(likedKey(), JSON.stringify([...state.liked])); } catch { /* ignore */ }
}
function setLiked(id, val) {
  if (val) state.liked.add(String(id)); else state.liked.delete(String(id));
  saveLiked();
}
function isLiked(id) { return state.liked.has(String(id)); }

/* pending follow-request persistence */
function pendingKey() { return CONFIG.STORAGE.pending + (state.userId || 'anon'); }
function loadPending() {
  try { state.pending = new Set(JSON.parse(localStorage.getItem(pendingKey()) || '[]').map(String)); }
  catch { state.pending = new Set(); }
}
function savePending() {
  try { localStorage.setItem(pendingKey(), JSON.stringify([...state.pending])); } catch { /* ignore */ }
}
function setPending(id, val) {
  if (val) state.pending.add(String(id)); else state.pending.delete(String(id));
  savePending();
}
function isPending(id) { return state.pending.has(String(id)); }

/* ============================== API CORE ============================ */
class ApiError extends Error {
  constructor(message, status, data) { super(message); this.status = status; this.data = data; }
}
function parseDetail(data) {
  if (!data) return '';
  if (typeof data === 'string') return data;
  const d = data.detail;
  if (typeof d === 'string') return d;
  if (Array.isArray(d)) {
    return d.map(x => {
      if (typeof x === 'string') return x;
      const loc = Array.isArray(x.loc) ? x.loc.filter(l => l !== 'body' && l !== 'query').join('.') : '';
      return (loc ? loc + ': ' : '') + (x.msg || JSON.stringify(x));
    }).join('\n');
  }
  if (d && typeof d === 'object') return d.msg || JSON.stringify(d);
  if (data.message) return data.message;
  return '';
}
function isTokenError(status, msg) {
  const m = String(msg || '').toLowerCase();
  if (status === 401 && m.includes('not authenticate')) return true;
  if (status === 400 && (m.includes('token expired') || m.includes('token deactivated'))) return true;
  return false;
}
function buildUrl(path, query) {
  let url = CONFIG.BASE_URL.replace(/\/$/, '') + path;
  if (query) {
    const qs = new URLSearchParams();
    Object.entries(query).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') qs.append(k, v);
    });
    const s = qs.toString();
    if (s) url += (url.includes('?') ? '&' : '?') + s;
  }
  return url;
}
function toFormData(obj) {
  if (obj instanceof FormData) return obj;
  const fd = new FormData();
  Object.entries(obj).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    if (v instanceof File) { if (v.size > 0 || v.name) fd.append(k, v); return; }
    fd.append(k, v);
  });
  return fd;
}
/**
 * api(path, { method, query, body (JSON), form (FormData/obj), auth })
 */
async function api(path, opts = {}) {
  const { method = 'GET', query, body, form, auth = true } = opts;
  const url = buildUrl(path, query);
  const headers = {};
  if (auth && state.token) headers['Authorization'] = 'Bearer ' + state.token;
  let payload;
  if (form) payload = toFormData(form);
  else if (body !== undefined) { headers['Content-Type'] = 'application/json'; payload = JSON.stringify(body); }

  let res;
  try {
    res = await fetch(url, { method, headers, body: payload });
  } catch (e) {
    throw new ApiError("Serverga ulanib bo'lmadi. Backend ishlayaptimi?", 0, null);
  }
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }

  if (!res.ok) {
    const msg = parseDetail(data) || `Xatolik (${res.status})`;
    if (auth && state.token && isTokenError(res.status, msg)) {
      forceLogout('Sessiya tugadi. Qayta kiring.');
    }
    throw new ApiError(msg, res.status, data);
  }
  return data;
}

/* ============================== API MAP ============================= */
const API = {
  // ---- auth
  register: (form) => api('/auth/registration/', { method: 'POST', form, auth: false }),
  login: (username, password) => api('/auth/login', { method: 'POST', form: { username, password }, auth: false }),
  logout: () => api('/auth/logout', { method: 'POST' }),
  deleteAccount: () => api('/auth/delete-account', { method: 'DELETE' }),
  editInfo: (form) => api('/auth/EditInfo', { method: 'PUT', form }),
  changePassword: (old_password, password, password2) =>
    api('/auth/change-password', { method: 'PATCH', body: { old_password, password, password2 } }),

  // ---- post
  createPost: (form) => api('/post/post', { method: 'POST', form }),
  updatePost: (id, form) => api(`/post/put/${id}`, { method: 'PUT', form }),
  deletePost: (id) => api(`/post/delete/${id}`, { method: 'DELETE' }),
  feed: () => api('/post/see'),

  // ---- review
  comments: (book_id) => api('/review/see/comments', { query: { book_id } }),
  addComment: (book_id, text) => api(`/review/comment/${book_id}`, { method: 'POST', body: { text } }),
  editComment: (comment_id, book_id, text) => api(`/review/edit/${comment_id}`, { method: 'PUT', query: { book_id }, body: { text } }),
  deleteMyComment: (book_id) => api(`/review/delete/${book_id}`, { method: 'DELETE' }),
  like: (book_id) => api(`/review/like/${book_id}`, { method: 'POST' }),
  unlike: (book_id) => api(`/review/like/${book_id}`, { method: 'DELETE' }),
  likeCount: (book_id) => api(`/review/count/like/${book_id}`),

  // ---- user
  me: () => api('/user/profile/me'),
  profile: (user_id) => api(`/user/profile/${user_id}`),
  search: (username) => api('/user/search', { query: { username } }),
  follow: (following_id) => api('/user/follow', { method: 'POST', query: { following_id } }),
  unfollow: (following_id) => api('/user/unfollow', { method: 'DELETE', query: { following_id } }),
  toggleAccountType: () => api('/user/account-type/', { method: 'PATCH' }),
  topFollowed: () => api('/user/top-followed'),
  followersOf: (user_id) => api(`/user/Followers/${user_id}/list`),
  followingsOf: (user_id) => api(`/user/Followigs/${user_id}/list`),   // typo is intentional (backend path)
  myFollowers: () => api('/user/Followers/me/list'),
  myFollowings: () => api('/user/Followings/me/list'),

  // ---- follow requests (yopiq akkaunt uchun)
  followRequests: () => api('/user/requested/following/list'),
  acceptRequest: (user_id) => api(`/user/request/accepting/${user_id}`, { method: 'PATCH' }),
  rejectRequest: (user_id) => api(`/user/request/rejecting/${user_id}`, { method: 'PATCH' }),

  sessionsAll: () => api('/user/sessions/all'),
  sessionsCount: () => api('/user/sessions'),
  sessionDetail: (token_id) => api(`/user/sessions/${token_id}`),
};

/* ========================= USER CACHE / FOLLOW ====================== */
function getUser(id) {
  const key = String(id);
  if (state.users.has(key)) return Promise.resolve(state.users.get(key));
  if (state.userPromises.has(key)) return state.userPromises.get(key);
  const p = API.profile(id)
    .then(u => {
      const rec = { id: key, ...u, private: !isPublicProfile(u) };
      state.users.set(key, rec);
      return rec;
    })
    .catch(() => {
      const rec = { id: key, username: `foydalanuvchi #${key}`, image_url: '', private: true, missing: true };
      state.users.set(key, rec);
      return rec;
    })
    .finally(() => state.userPromises.delete(key));
  state.userPromises.set(key, p);
  return p;
}
function invalidateUser(id) { state.users.delete(String(id)); }

async function refreshFollowing() {
  try {
    const list = await API.myFollowings();
    state.following = new Set((Array.isArray(list) ? list : []).map(u => u.username));
  } catch { /* keep old */ }
}
function amFollowing(username) { return state.following.has(username); }
function followBtnHtml(userId, username, extra = '', isPrivateAcc = false) {
  if (!userId || String(userId) === String(state.userId)) return '';
  const f = amFollowing(username);
  const waiting = isPending(userId) && !amFollowingAccepted(username);
  let label = 'Kuzatish', action = 'follow', cls = '';
  if (waiting) { label = "So'rov yuborilgan"; action = 'unfollow'; cls = 'btn-outline'; }
  else if (f) { label = "Kuzatishni to'xtatish"; action = 'unfollow'; cls = 'btn-secondary'; }
  return `<button class="btn ${cls} ${extra}" data-action="${action}" data-user-id="${esc(userId)}" data-username="${esc(username)}" data-private="${isPrivateAcc ? '1' : ''}">${label}</button>`;
}
/* The backend's followings list includes REQUESTED rows, so a name there is not
   proof of acceptance; a locally tracked pending request wins over it. */
function amFollowingAccepted(username) { return false; }

/* ============================== MODALS ============================== */
function openModal({ html, cls = '', onClose = null, closeBtn = true }) {
  const root = $('#modal-root');
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  backdrop.innerHTML = `
    ${closeBtn ? `<button class="modal-close" type="button" data-action="modal-close" aria-label="Yopish">${ICONS.close}</button>` : ''}
    <div class="modal ${cls}" role="dialog" aria-modal="true">${html}</div>`;
  backdrop.addEventListener('click', (e) => { if (e.target === backdrop) closeModal(backdrop); });
  backdrop._onClose = onClose;
  root.appendChild(backdrop);
  state.modals.push(backdrop);
  document.body.style.overflow = 'hidden';
  return backdrop;
}
function closeModal(el) {
  const target = el || state.modals[state.modals.length - 1];
  if (!target) return;
  state.modals = state.modals.filter(m => m !== target);
  if (typeof target._onClose === 'function') target._onClose();
  target.remove();
  if (!state.modals.length) document.body.style.overflow = '';
}
function closeAllModals() { while (state.modals.length) closeModal(); }

/** Instagram-style vertical menu. items: [{label, value, danger, primary}] → resolves value or null */
function menuDialog({ title = '', text = '', items = [], cancelLabel = 'Bekor qilish' }) {
  return new Promise(resolve => {
    let done = false;
    const html = `
      ${title ? `<div class="menu-title">${esc(title)}</div>` : ''}
      ${text ? `<div class="menu-text">${esc(text)}</div>` : ''}
      ${items.map(it => `<button type="button" class="menu-item ${it.danger ? 'danger' : ''} ${it.primary ? 'primary' : ''}" data-menu-value="${esc(it.value)}">${esc(it.label)}</button>`).join('')}
      <button type="button" class="menu-item" data-menu-value="__cancel">${esc(cancelLabel)}</button>`;
    const m = openModal({ html, cls: 'menu-modal', closeBtn: false, onClose: () => { if (!done) { done = true; resolve(null); } } });
    m.addEventListener('click', (e) => {
      const b = e.target.closest('[data-menu-value]');
      if (!b) return;
      const v = b.dataset.menuValue;
      done = true;
      closeModal(m);
      resolve(v === '__cancel' ? null : v);
    });
  });
}
function confirmDialog(title, text, okLabel = 'Tasdiqlash', danger = true) {
  return menuDialog({ title, text, items: [{ label: okLabel, value: 'ok', danger, primary: !danger }] }).then(v => v === 'ok');
}
function infoModal(title, bodyHtml) {
  return openModal({ html: `<div class="modal-head">${esc(title)}</div><div class="modal-body">${bodyHtml}</div>`, cls: 'list-modal' });
}

/* ============================== AUTH FLOW =========================== */
function saveSession(token, userId) {
  state.token = token; state.userId = userId;
  try {
    localStorage.setItem(CONFIG.STORAGE.token, token);
    localStorage.setItem(CONFIG.STORAGE.userId, String(userId));
  } catch { /* ignore */ }
}
function clearSession() {
  state.token = null; state.userId = null; state.me = null;
  state.users.clear(); state.following.clear(); state.pending.clear(); state.posts.clear(); state.likeCounts.clear();
  try {
    localStorage.removeItem(CONFIG.STORAGE.token);
    localStorage.removeItem(CONFIG.STORAGE.userId);
  } catch { /* ignore */ }
}
function forceLogout(msg) {
  const had = !!state.token;
  clearSession();
  closeAllModals();
  showAuth();
  if (had && msg) toast(msg, 'error');
}
async function doLogout() {
  try { await API.logout(); } catch { /* still log out locally */ }
  clearSession();
  closeAllModals();
  showAuth();
  toast('Chiqildi');
}

function showAuth(mode = 'login') {
  $('#layout').hidden = true;
  const s = $('#auth-screen');
  s.hidden = false;
  renderAuth(mode);
}
function showApp() {
  $('#auth-screen').hidden = true;
  $('#layout').hidden = false;
}

function renderAuth(mode) {
  const s = $('#auth-screen');
  const isLogin = mode === 'login';
  s.innerHTML = `
    <div class="auth-box">
      <div class="auth-card">
        <span class="logo">Bookly</span>
        ${isLogin ? `
          <form data-form="login" novalidate>
            <input class="input" name="username" placeholder="Foydalanuvchi nomi" autocomplete="username" required>
            <input class="input" name="password" type="password" placeholder="Parol" autocomplete="current-password" required>
            <div class="error-text" data-error></div>
            <button class="btn btn-block" type="submit">Kirish</button>
          </form>
        ` : `
          <p class="auth-tagline">Do'stlaringizning kitoblarini ko'rish uchun ro'yxatdan o'ting.</p>
          <form data-form="register" novalidate>
            <div class="avatar-picker">
              <img class="avatar" src="${DEFAULT_AVATAR}" alt="" data-preview-target="reg-avatar">
              <label>
                <input type="file" name="file" accept="image/*" data-preview="reg-avatar">
                <span class="btn-link">Rasm tanlash</span>
              </label>
            </div>
            <input class="input" name="username" placeholder="Foydalanuvchi nomi" autocomplete="username" required>
            <input class="input" name="email" type="email" placeholder="Email" autocomplete="email" required>
            <input class="input" name="bio" placeholder="Bio (ixtiyoriy)">
            <input class="input" name="password" type="password" placeholder="Parol" autocomplete="new-password" required>
            <input class="input" name="password2" type="password" placeholder="Parolni tasdiqlang" autocomplete="new-password" required>
            <div class="error-text" data-error></div>
            <button class="btn btn-block" type="submit">Ro'yxatdan o'tish</button>
          </form>
        `}
      </div>
      <div class="auth-switch">
        ${isLogin
          ? `Hisobingiz yo'qmi? <button class="btn-link" type="button" data-action="auth-switch" data-mode="register">Ro'yxatdan o'tish</button>`
          : `Hisobingiz bormi? <button class="btn-link" type="button" data-action="auth-switch" data-mode="login">Kirish</button>`}
      </div>
      <div class="auth-footer">© ${new Date().getFullYear()} Bookly</div>
    </div>`;
}

async function handleLogin(form) {
  const err = $('[data-error]', form);
  const btn = $('button[type=submit]', form);
  err.textContent = '';
  const username = form.username.value.trim();
  const password = form.password.value;
  if (!username || !password) { err.textContent = 'Foydalanuvchi nomi va parolni kiriting.'; return; }
  btn.disabled = true;
  try {
    const tok = await API.login(username, password);
    const token = tok && tok[CONFIG.TOKEN_FIELD];
    const userId = tok && tok[CONFIG.USER_ID_FIELD];
    if (!token) throw new ApiError(`Javobda "${CONFIG.TOKEN_FIELD}" maydoni topilmadi.`, 0, tok);
    saveSession(token, userId);
    await bootApp();
    toast(`Xush kelibsiz, ${username}!`);
  } catch (e) {
    err.textContent = e.message;
  } finally { btn.disabled = false; }
}
async function handleRegister(form) {
  const err = $('[data-error]', form);
  const btn = $('button[type=submit]', form);
  err.textContent = '';
  const fd = new FormData();
  const username = form.username.value.trim();
  const email = form.email.value.trim();
  const bio = form.bio.value.trim();
  const password = form.password.value;
  const password2 = form.password2.value;
  if (!username || !email || !password || !password2) { err.textContent = "Barcha majburiy maydonlarni to'ldiring."; return; }
  if (password !== password2) { err.textContent = 'Parollar mos kelmadi.'; return; }
  fd.append('username', username);
  fd.append('email', email);
  if (bio) fd.append('bio', bio);
  fd.append('password', password);
  fd.append('password2', password2);
  const file = form.file.files[0];
  if (file) fd.append('file', file);
  btn.disabled = true;
  try {
    await API.register(fd);
    toast("Ro'yxatdan o'tdingiz! Endi kiring.");
    renderAuth('login');
    const lf = $('form[data-form=login]');
    if (lf) lf.username.value = username;
  } catch (e) {
    err.textContent = e.message;
  } finally { btn.disabled = false; }
}

/* boot after we have a token */
async function bootApp() {
  loadLiked();
  loadPending();
  try {
    state.me = await API.me();
  } catch (e) {
    if (state.token) { forceLogout(e.status ? 'Sessiya yaroqsiz. Qayta kiring.' : e.message); }
    return;
  }
  showApp();
  updateSidebar();
  refreshFollowing();
  router();
}
async function reloadMe() {
  try { state.me = await API.me(); updateSidebar(); } catch { /* ignore */ }
}
function updateSidebar() {
  const av = $('#nav-avatar');
  if (av) av.src = imgUrl(state.me && state.me.image_url);
}

/* ============================== ROUTER ============================== */
function parseHash() {
  let h = location.hash.replace(/^#/, '') || '/';
  if (!h.startsWith('/')) h = '/' + h;
  const [path, qs] = h.split('?');
  const query = {};
  if (qs) new URLSearchParams(qs).forEach((v, k) => { query[k] = v; });
  const params = {};
  let name = 'feed';
  if (path === '/' || path === '') name = 'feed';
  else if (path === '/search') name = 'search';
  else if (path === '/profile') name = 'profile';
  else if (path === '/settings') name = 'settings';
  else {
    const m = path.match(/^\/user\/([^/]+)\/?$/);
    if (m) { name = 'user'; params.id = decodeURIComponent(m[1]); }
    else name = 'notfound';
  }
  return { name, path, params, query };
}
function navigate(hash) { location.hash = hash; }

function setActiveNav(path) {
  $$('.nav-item[data-route]').forEach(a => {
    const r = a.dataset.route;
    const active = r === '/' ? path === '/' : path === r;
    a.classList.toggle('active', active);
  });
}

async function router() {
  if (!state.token) { showAuth(); return; }
  if (!state.me) { await bootApp(); return; }
  closeAllModals();
  const route = parseHash();
  state.route = route;
  setActiveNav(route.path);
  const page = $('#page');
  page.scrollTop = 0; window.scrollTo(0, 0);
  const pages = { feed: renderFeed, search: renderSearch, profile: renderMyProfile, user: renderUserPage, settings: renderSettings };
  const fn = pages[route.name];
  if (!fn) { page.innerHTML = `<div class="empty"><h3>Sahifa topilmadi</h3><p><a class="btn-link" href="#/">Bosh sahifaga</a></p></div>`; return; }
  try {
    await fn(route);
  } catch (e) {
    if (state.token) page.innerHTML = `<div class="empty"><h3>Xatolik</h3><p>${esc(e.message)}</p></div>`;
  }
}

/* ============================== POST CARD =========================== */
function likeBtnHtml(id, extraCls = '') {
  const liked = isLiked(id);
  return `<button class="icon-btn like-btn ${liked ? 'liked' : ''} ${extraCls}" type="button" data-action="like" aria-label="Yoqtirish">${liked ? ICONS.heartFilled : ICONS.heart}</button>`;
}
function likeCountText(id) {
  const n = state.likeCounts.get(String(id));
  return n === undefined ? '…' : pluralLikes(n);
}
function postCardHtml(post, author) {
  const aid = post.author_id;
  const name = author ? author.username : `#${aid}`;
  return `
    <article class="post" data-post-id="${esc(post.id)}" data-author-id="${esc(aid)}">
      <header class="post-head">
        <a href="#/user/${esc(aid)}">${avatarImg(author && author.image_url, 'avatar-32')}</a>
        <div class="post-head-text">
          <a class="username" href="#/user/${esc(aid)}">${esc(name)}</a>
          <span class="dot">•</span>
          <span class="time" title="${esc(fmtDate(post.created_at))}">${esc(timeAgo(post.created_at))}</span>
        </div>
        <button class="icon-btn" type="button" data-action="post-menu" aria-label="Ko'proq">${ICONS.more}</button>
      </header>
      <div class="post-img-wrap" data-action="open-post">
        <img class="post-img" src="${esc(postImg(post.image_url))}" alt="${esc(post.title)}" loading="lazy">
      </div>
      <div class="post-actions">
        ${likeBtnHtml(post.id)}
        <button class="icon-btn" type="button" data-action="open-post" aria-label="Izohlar">${ICONS.comment}</button>
      </div>
      <div class="post-likes" data-like-count>${esc(likeCountText(post.id))}</div>
      <div class="post-caption"><a class="username" href="#/user/${esc(aid)}">${esc(name)}</a> ${esc(post.title)}</div>
      ${post.description ? `<div class="post-desc">${esc(post.description)}</div>` : ''}
      <button class="link-muted" type="button" data-action="open-post">Izohlarni ko'rish</button>
    </article>`;
}
async function loadLikeCount(id) {
  try {
    const n = await API.likeCount(id);
    const num = typeof n === 'number' ? n : (n && (n.count ?? n.likes)) ?? Number(n) ?? 0;
    state.likeCounts.set(String(id), Number.isFinite(Number(num)) ? Number(num) : 0);
  } catch { state.likeCounts.set(String(id), 0); }
  return state.likeCounts.get(String(id));
}
function refreshLikeUI(id) {
  const liked = isLiked(id);
  $$(`[data-post-id="${CSS.escape(String(id))}"]`).forEach(card => {
    $$('.like-btn', card).forEach(b => {
      b.classList.toggle('liked', liked);
      b.innerHTML = liked ? ICONS.heartFilled : ICONS.heart;
      b.classList.remove('like-anim'); void b.offsetWidth; b.classList.add('like-anim');
    });
    $$('[data-like-count]', card).forEach(el => { el.textContent = likeCountText(id); });
  });
}
async function toggleLike(id) {
  const wasLiked = isLiked(id);
  // optimistic
  setLiked(id, !wasLiked);
  const cur = state.likeCounts.get(String(id));
  if (cur !== undefined) state.likeCounts.set(String(id), Math.max(0, cur + (wasLiked ? -1 : 1)));
  refreshLikeUI(id);
  try {
    if (wasLiked) await API.unlike(id); else await API.like(id);
  } catch (e1) {
    // local state was out of sync with the server → try the opposite action once
    try {
      if (wasLiked) { await API.like(id); setLiked(id, true); }
      else { await API.unlike(id); setLiked(id, false); }
    } catch (e2) {
      setLiked(id, wasLiked);
      toast(e1.message || 'Xatolik', 'error');
    }
  }
  await loadLikeCount(id);
  refreshLikeUI(id);
}

/* post "•••" menu */
async function openPostMenu(id) {
  const post = state.posts.get(String(id));
  if (!post) return;
  const mine = String(post.author_id) === String(state.userId);
  const items = [];
  if (mine) {
    items.push({ label: "O'chirish", value: 'delete', danger: true });
    items.push({ label: 'Tahrirlash', value: 'edit' });
  }
  items.push({ label: 'Muallif sahifasiga o\'tish', value: 'author' });
  items.push({ label: 'Rasm havolasini nusxalash', value: 'copy' });
  const v = await menuDialog({ items });
  if (v === 'delete') {
    const ok = await confirmDialog("Postni o'chirasizmi?", "Bu amalni ortga qaytarib bo'lmaydi.", "O'chirish");
    if (!ok) return;
    try {
      await API.deletePost(id);
      state.posts.delete(String(id));
      toast("Post o'chirildi");
      closeAllModals();
      router();
      reloadMe();
    } catch (e) { toast(e.message, 'error'); }
  } else if (v === 'edit') {
    openPostEditor(post);
  } else if (v === 'author') {
    closeAllModals();
    navigate(`#/user/${post.author_id}`);
  } else if (v === 'copy') {
    const url = postImg(post.image_url);
    try { await navigator.clipboard.writeText(url); toast('Havola nusxalandi'); }
    catch { window.prompt('Havola:', url); }
  }
}

/* ============================== POST MODAL ========================== */
async function openPostModal(id) {
  const post = state.posts.get(String(id));
  if (!post) { toast('Post topilmadi', 'error'); return; }
  const author = await getUser(post.author_id);
  const html = `
    <div class="pm-img"><img src="${esc(postImg(post.image_url))}" alt="${esc(post.title)}"></div>
    <div class="pm-side" data-post-id="${esc(post.id)}">
      <div class="pm-head">
        <a href="#/user/${esc(post.author_id)}">${avatarImg(author.image_url, 'avatar-32')}</a>
        <a class="username" href="#/user/${esc(post.author_id)}">${esc(author.username)}</a>
        <button class="icon-btn" type="button" data-action="post-menu" aria-label="Ko'proq">${ICONS.more}</button>
      </div>
      <div class="pm-comments" data-comments>${spinner()}</div>
      <div class="pm-footer">
        <div class="pm-actions">
          ${likeBtnHtml(post.id)}
          <button class="icon-btn" type="button" data-action="focus-comment" aria-label="Izoh">${ICONS.comment}</button>
        </div>
        <div class="pm-likes" data-like-count>${esc(likeCountText(post.id))}</div>
        <div class="pm-time" title="${esc(fmtDate(post.created_at))}">${esc(timeAgo(post.created_at))} oldin</div>
      </div>
      <form class="comment-form" data-form="comment" data-post-id="${esc(post.id)}">
        <input name="text" placeholder="Izoh qo'shing…" autocomplete="off" maxlength="1000">
        <button class="btn-link" type="submit" disabled>Yuborish</button>
      </form>
    </div>`;
  const m = openModal({ html, cls: 'post-modal' });
  const input = $('input[name=text]', m);
  input.addEventListener('input', () => { $('button[type=submit]', input.form).disabled = !input.value.trim(); });
  if (state.likeCounts.get(String(post.id)) === undefined) loadLikeCount(post.id).then(() => refreshLikeUI(post.id));
  await loadComments(m, post, author);
}
async function loadComments(modal, post, author) {
  const box = $('[data-comments]', modal);
  if (!box) return;
  let list = [];
  try { list = await API.comments(post.id); } catch (e) { box.innerHTML = `<div class="error-text">${esc(e.message)}</div>`; return; }
  if (!Array.isArray(list)) list = [];
  list.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  const users = await Promise.all(list.map(c => getUser(c.user_id)));
  const caption = `
    <div class="comment caption">
      ${avatarImg(author.image_url, 'avatar-32')}
      <div class="comment-body">
        <div class="comment-text"><a class="username" href="#/user/${esc(post.author_id)}">${esc(author.username)}</a> <strong>${esc(post.title)}</strong>${post.description ? '\n' + esc(post.description) : ''}</div>
        <div class="comment-meta"><span>${esc(timeAgo(post.created_at))}</span></div>
      </div>
    </div>`;
  const rows = list.map((c, i) => {
    const u = users[i];
    const mine = String(c.user_id) === String(state.userId);
    return `
      <div class="comment" data-comment-id="${esc(c.id)}" data-comment-user="${esc(c.user_id)}">
        <a href="#/user/${esc(c.user_id)}">${avatarImg(u.image_url, 'avatar-32')}</a>
        <div class="comment-body">
          <div class="comment-text"><a class="username" href="#/user/${esc(c.user_id)}">${esc(u.username)}</a> <span data-comment-text>${esc(c.text)}</span></div>
          <div class="comment-meta">
            <span>${esc(timeAgo(c.created_at))}</span>
            ${mine ? `<button type="button" data-action="comment-edit">Tahrirlash</button><button type="button" data-action="comment-delete">O'chirish</button>` : ''}
          </div>
        </div>
      </div>`;
  }).join('');
  box.innerHTML = caption + (rows || `<div class="no-comments"><h4>Hali izohlar yo'q.</h4><div>Birinchi bo'lib izoh qoldiring.</div></div>`);
  box.scrollTop = box.scrollHeight;
}
function currentPostModal() {
  return state.modals.slice().reverse().find(m => $('.post-modal', m)) || null;
}
async function reloadCurrentComments() {
  const m = currentPostModal();
  if (!m) return;
  const side = $('.pm-side', m);
  const post = state.posts.get(side.dataset.postId);
  if (!post) return;
  const author = await getUser(post.author_id);
  await loadComments(m, post, author);
}
async function submitComment(form) {
  const postId = form.dataset.postId;
  const input = form.text;
  const text = input.value.trim();
  if (!text) return;
  const btn = $('button[type=submit]', form);
  btn.disabled = true;
  try {
    await API.addComment(postId, text);
    input.value = '';
    await reloadCurrentComments();
  } catch (e) { toast(e.message, 'error'); btn.disabled = false; }
}
function startCommentEdit(commentEl) {
  const textEl = $('[data-comment-text]', commentEl);
  if (!textEl || $('form', commentEl)) return;
  const old = textEl.textContent;
  const form = document.createElement('form');
  form.className = 'comment-edit-form';
  form.dataset.form = 'comment-edit';
  form.dataset.commentId = commentEl.dataset.commentId;
  form.innerHTML = `<input class="input" name="text" value="${esc(old)}" maxlength="1000"><button class="btn btn-sm" type="submit">Saqlash</button><button class="btn btn-sm btn-secondary" type="button" data-action="comment-edit-cancel">Bekor</button>`;
  textEl.hidden = true;
  textEl.parentElement.appendChild(form);
  form._old = old;
  form.text.focus();
}
async function submitCommentEdit(form) {
  const commentId = form.dataset.commentId;
  const side = form.closest('.pm-side');
  const postId = side ? side.dataset.postId : null;
  const text = form.text.value.trim();
  if (!text) return;
  try {
    await API.editComment(commentId, postId, text);
    toast('Izoh yangilandi');
    await reloadCurrentComments();
  } catch (e) { toast(e.message, 'error'); }
}
async function deleteMyComment(commentEl) {
  const side = commentEl.closest('.pm-side');
  const postId = side ? side.dataset.postId : null;
  const v = await menuDialog({ items: [{ label: "O'chirish", value: 'ok', danger: true }] });
  if (v !== 'ok') return;
  try {
    await API.deleteMyComment(postId);
    toast("Izoh o'chirildi");
    await reloadCurrentComments();
  } catch (e) { toast(e.message, 'error'); }
}

/* ======================= CREATE / EDIT POST MODAL =================== */
function openPostEditor(post = null) {
  const editing = !!post;
  const html = `
    <div class="modal-head">${editing ? 'Postni tahrirlash' : 'Yangi post yaratish'}</div>
    <form data-form="post-editor" ${editing ? `data-post-id="${esc(post.id)}"` : ''}>
      <div class="editor-body">
        <label class="dropzone" data-dropzone>
          <input type="file" name="file" accept="image/*" data-preview="post-preview">
          <img class="preview" data-preview-target="post-preview" alt="" hidden>
          ${ICONS.photo}
          <p>Rasmni shu yerga tashlang</p>
          <span class="btn btn-sm" role="button">Kompyuterdan tanlash</span>
          ${editing ? `<span class="hint">Tahrirlashda yangi rasm tanlash majburiy</span>` : ''}
        </label>
        <div class="editor-side">
          <div class="me-line">${avatarImg(state.me && state.me.image_url, 'avatar-32')}<span class="username">${esc(state.me && state.me.username)}</span></div>
          <div class="field"><label>Sarlavha</label><input class="input" name="title" placeholder="Kitob nomi" maxlength="200" required value="${esc(editing ? post.title : '')}"></div>
          <div class="field"><label>Tavsif</label><textarea class="input" name="description" placeholder="Tavsif yozing…" maxlength="2000">${esc(editing ? post.description : '')}</textarea></div>
          <div class="error-text" data-error></div>
          <div class="form-actions">
            <button class="btn btn-secondary" type="button" data-action="modal-close">Bekor qilish</button>
            <button class="btn" type="submit">${editing ? 'Saqlash' : 'Ulashish'}</button>
          </div>
        </div>
      </div>
    </form>`;
  const m = openModal({ html, cls: 'editor-modal' });
  const dz = $('[data-dropzone]', m);
  const fileInput = $('input[type=file]', dz);
  ['dragenter', 'dragover'].forEach(ev => dz.addEventListener(ev, e => { e.preventDefault(); dz.classList.add('dragover'); }));
  ['dragleave', 'drop'].forEach(ev => dz.addEventListener(ev, e => { e.preventDefault(); dz.classList.remove('dragover'); }));
  dz.addEventListener('drop', e => {
    const f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
    if (!f) return;
    if (!f.type.startsWith('image/')) { toast('Faqat rasm fayllari', 'error'); return; }
    const dt = new DataTransfer(); dt.items.add(f);
    fileInput.files = dt.files;
    showPreview(fileInput);
  });
}
function showPreview(input) {
  const key = input.dataset.preview;
  const target = $(`[data-preview-target="${CSS.escape(key)}"]`);
  const f = input.files && input.files[0];
  if (!target) return;
  if (!f) { return; }
  if (!f.type.startsWith('image/')) { toast('Faqat rasm fayllari', 'error'); input.value = ''; return; }
  const url = URL.createObjectURL(f);
  target.src = url;
  target.hidden = false;
}
async function submitPostEditor(form) {
  const err = $('[data-error]', form);
  const btn = $('button[type=submit]', form);
  err.textContent = '';
  const title = form.title.value.trim();
  const description = form.description.value.trim();
  const file = form.file.files[0];
  if (!title) { err.textContent = 'Sarlavha kiriting.'; return; }
  if (!file) { err.textContent = 'Rasm tanlash majburiy.'; return; }
  const fd = new FormData();
  fd.append('title', title);
  fd.append('description', description);
  fd.append('file', file);
  btn.disabled = true;
  try {
    const editingId = form.dataset.postId;
    if (editingId) {
      const p = await API.updatePost(editingId, fd);
      if (p && p.id) state.posts.set(String(p.id), p);
      toast('Post yangilandi');
    } else {
      await API.createPost(fd);
      toast('Post ulashildi');
    }
    closeAllModals();
    reloadMe();
    if (state.route.name === 'feed' && !editingId) navigate('#/profile'); else router();
  } catch (e) { err.textContent = e.message; btn.disabled = false; }
}

/* ============================== FEED PAGE =========================== */
async function renderFeed() {
  const page = $('#page');
  page.innerHTML = `
    <div class="home">
      <div class="feed" data-feed>${spinner()}</div>
      <aside class="right-col" data-right>${rightColHtml()}</aside>
    </div>`;
  loadTopFollowed($('[data-top]', page), 'right');

  const feedEl = $('[data-feed]', page);
  let posts = [];
  try { posts = await API.feed(); } catch (e) { feedEl.innerHTML = `<div class="error-text">${esc(e.message)}</div>`; return; }
  if (!Array.isArray(posts)) posts = [];
  posts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  posts.forEach(p => { if (p.id !== undefined && p.id !== null) state.posts.set(String(p.id), p); });
  if (!posts.length) {
    feedEl.innerHTML = `
      <div class="empty">
        <div class="empty-icon">${ICONS.photo}</div>
        <h3>Lentangiz bo'sh</h3>
        <p>Kuzatayotgan foydalanuvchilaringiz postlari shu yerda chiqadi.</p>
        <a class="btn" href="#/search">Foydalanuvchilarni qidirish</a>
      </div>`;
    return;
  }
  const authors = await Promise.all(posts.map(p => getUser(p.author_id)));
  await Promise.all(posts.map(p => state.likeCounts.has(String(p.id)) ? null : loadLikeCount(p.id)));
  if (state.route.name !== 'feed') return;
  feedEl.innerHTML = posts.map((p, i) => postCardHtml(p, authors[i])).join('');
}
function rightColHtml() {
  const me = state.me || {};
  return `
    <div class="me-card">
      <a href="#/profile">${avatarImg(me.image_url, 'avatar-44')}</a>
      <div class="me-info">
        <div><a class="username" href="#/profile">${esc(me.username)}</a></div>
        <div class="muted small">${esc(me.bio || '')}</div>
      </div>
      <button class="btn-link" type="button" data-action="logout">Chiqish</button>
    </div>
    <div class="right-title"><span>Eng ko'p kuzatiladiganlar</span></div>
    <div data-top>${spinner('sm')}</div>
    <div class="auth-footer" style="text-align:left;margin-top:20px">© ${new Date().getFullYear()} BOOKLY</div>`;
}
function topUserRowHtml(u, variant) {
  const id = u.user_id;
  const isMe = String(id) === String(state.userId);
  return `
    <div class="${variant === 'right' ? 'suggest-row' : 'popular-row'}">
      <span class="rank-badge">${esc(u.rank)}</span>
      <a href="#/user/${esc(id)}">${avatarImg(u.image_url, 'avatar-44')}</a>
      <div class="suggest-info">
        <a class="username" href="#/user/${esc(id)}">${esc(u.username)}</a>
        <span class="muted">${esc(u.followers)} kuzatuvchi</span>
      </div>
      ${isMe ? `<span class="chip chip-gray">Siz</span>` : followBtnHtml(id, u.username, 'btn-sm')}
    </div>`;
}
async function loadTopFollowed(container, variant) {
  if (!container) return;
  try {
    const data = await API.topFollowed();
    const users = Array.isArray(data) ? data : (data && data.users) || [];
    if (!users.length) { container.innerHTML = `<div class="muted small">Hozircha ma'lumot yo'q.</div>`; return; }
    container.innerHTML = users.map(u => topUserRowHtml(u, variant)).join('');
    container.dataset.variant = variant;
  } catch (e) { container.innerHTML = `<div class="error-text">${esc(e.message)}</div>`; }
}
function rerenderTopLists() {
  $$('[data-top]').forEach(c => loadTopFollowed(c, c.dataset.variant || 'right'));
}

/* ============================== SEARCH PAGE ========================= */
async function renderSearch(route) {
  const page = $('#page');
  const q = route.query.username || '';
  page.innerHTML = `
    <div class="search-page">
      <form class="search-bar" data-form="search">
        <div class="search-input-wrap">${ICONS.search}<input class="search-input" name="username" placeholder="Foydalanuvchi nomini kiriting va Enter bosing" value="${esc(q)}" autocomplete="off"></div>
        <button class="btn" type="submit">Qidirish</button>
      </form>
      <div data-result></div>
      <div class="section-title">Mashhur akkauntlar</div>
      <div data-top>${spinner()}</div>
    </div>`;
  loadTopFollowed($('[data-top]', page), 'list');
  if (q) doSearch(q);
  else $('.search-input', page).focus();
}
async function doSearch(username) {
  const box = $('[data-result]');
  if (!box) return;
  box.innerHTML = spinner();
  let u;
  try { u = await API.search(username); }
  catch (e) { box.innerHTML = `<div class="empty"><h3>Topilmadi</h3><p>${esc(e.message)}</p></div>`; return; }
  if (!u || typeof u !== 'object') { box.innerHTML = `<div class="empty"><h3>Topilmadi</h3></div>`; return; }
  const id = u.id ?? u.user_id ?? null;
  const pub = isPublicProfile(u);
  const isMe = id !== null ? String(id) === String(state.userId) : (u.username === (state.me && state.me.username));
  const posts = pub ? u.posts : [];
  posts.forEach(p => { if (p.id !== undefined && p.id !== null) state.posts.set(String(p.id), p); });
  if (id !== null && pub) state.users.set(String(id), { id: String(id), ...u, private: false });
  box.innerHTML = `
    <div class="result-card">
      <div class="result-head">
        ${pub ? avatarImg(u.image_url, 'avatar-77') : `<div class="profile-lock" style="width:77px;height:77px">${ICONS.lock}</div>`}
        <div class="result-body">
          <div class="result-name">
            <span class="username">${esc(u.username)}</span>
            <span class="chip ${pub ? 'chip-green' : 'chip-gray'}">${pub ? 'Ochiq' : 'Yopiq akkaunt'}</span>
          </div>
          <div class="result-stats">
            <span><b>${esc(u.count_posts ?? posts.length ?? 0)}</b> post</span>
            <span><b>${esc(u.follower_count ?? 0)}</b> kuzatuvchi</span>
            <span><b>${esc(u.following_count ?? 0)}</b> kuzatmoqda</span>
          </div>
          ${pub && u.bio ? `<div class="result-bio">${esc(u.bio)}</div>` : ''}
          ${pub && u.email ? `<div class="profile-email">${esc(u.email)}</div>` : ''}
          <div class="result-actions">
            ${isMe ? `<a class="btn btn-secondary" href="#/profile">Mening profilim</a>` : ''}
            ${!isMe && id !== null ? followBtnHtml(id, u.username, '', !pub) : ''}
            ${!isMe && id !== null ? `<a class="btn btn-secondary" href="#/user/${esc(id)}">Profil</a>` : ''}
          </div>
          ${!isMe && id === null ? `<div class="warn-box">Qidiruv natijasida foydalanuvchi ID si yo'q, shuning uchun kuzatish va profil tugmalari ko'rsatilmaydi.</div>` : ''}
        </div>
      </div>
      ${pub ? (posts.length ? `<div class="grid result-grid" data-grid-owner="${esc(id ?? '')}">${posts.map(gridCellHtml).join('')}</div>` : `<div class="muted text-center mt-16">Hali postlar yo'q.</div>`)
            : `<div class="private-block mt-16"><div class="lock">${ICONS.lock}</div><h3>Bu akkaunt yopiq</h3><p>Postlarni ko'rish uchun kuzating.</p></div>`}
    </div>`;
  // the search response may not carry author_id on posts → patch with the id if known
  if (id !== null) posts.forEach(p => { if (p.author_id === undefined) { p.author_id = id; if (p.id !== undefined && p.id !== null) state.posts.set(String(p.id), p); } });
}

/* ============================== PROFILE PAGES ======================= */
function gridCellHtml(p) {
  const hasId = p.id !== undefined && p.id !== null;
  return `
    <div class="grid-cell" ${hasId ? `data-post-id="${esc(p.id)}" data-action="open-post"` : 'title="Backend bu post uchun id qaytarmadi"'}>
      <img src="${esc(postImg(p.image_url))}" alt="${esc(p.title)}" loading="lazy">
      <div class="grid-overlay">${esc(p.title)}</div>
    </div>`;
}
/** Merge post lists: prefer entries that carry an id; match id-less entries by image_url. */
function mergePosts(withIds, plain) {
  const a = Array.isArray(withIds) ? withIds : [];
  const b = Array.isArray(plain) ? plain : [];
  if (a.length) return a.slice();
  return b.slice();
}
function profileHtml({ id, isMe, username, image_url, bio, email, postCount, followers, followings, isPrivateAccount, publicView, posts, accountType }) {
  const statBtn = (action, count, label) => `<button class="stat" type="button" data-action="${action}" data-user-id="${esc(id)}"><b>${esc(count ?? 0)}</b> ${label}</button>`;
  return `
    <div class="profile">
      <header class="profile-head">
        <div class="profile-avatar-col">
          ${publicView ? avatarImg(image_url, 'avatar-150') : `<div class="profile-lock" title="Yopiq akkaunt">${ICONS.lock}</div>`}
        </div>
        <div class="profile-body">
          <div class="profile-row">
            <span class="username">${esc(username)}</span>
            ${isMe ? `<span class="chip ${isPrivateType(accountType) ? 'chip-gray' : 'chip-green'}">${isPrivateType(accountType) ? 'Yopiq' : 'Ochiq'}</span>` : (publicView ? '' : `<span class="chip chip-gray">Yopiq akkaunt</span>`)}
            ${isMe
              ? `<a class="btn btn-secondary" href="#/settings">Profilni tahrirlash</a><button class="btn btn-secondary" type="button" data-action="open-create">Yangi post</button><button class="btn btn-secondary" type="button" data-action="requests-open">So'rovlar</button>`
              : followBtnHtml(id, username, '', !publicView)}
          </div>
          <div class="profile-stats">
            <span class="stat"><b>${esc(postCount ?? 0)}</b> post</span>
            ${statBtn('followers-list', followers, 'kuzatuvchi')}
            ${statBtn('following-list', followings, 'kuzatmoqda')}
          </div>
          ${bio ? `<div class="profile-bio">${esc(bio)}</div>` : ''}
          ${email ? `<div class="profile-email">${esc(email)}</div>` : ''}
        </div>
      </header>
      <div class="profile-tabs"><span class="profile-tab">${ICONS.photo.replace('viewBox', 'width="12" height="12" viewBox')} Postlar</span></div>
      ${publicView
        ? (posts.length ? `<div class="grid">${posts.map(gridCellHtml).join('')}</div>`
                        : `<div class="empty"><div class="empty-icon">${ICONS.camera}</div><h3>Hali postlar yo'q</h3>${isMe ? `<p><button class="btn-link" type="button" data-action="open-create">Birinchi postingizni ulashing</button></p>` : ''}</div>`)
        : `<div class="private-block"><div class="lock">${ICONS.lock}</div><h3>Bu akkaunt yopiq</h3><p>Postlarni ko'rish uchun kuzating.</p></div>`}
    </div>`;
}

async function renderMyProfile() {
  const page = $('#page');
  page.innerHTML = spinner();
  const [me, full] = await Promise.all([
    API.me(),
    API.profile(state.userId).catch(() => null),
  ]);
  state.me = me; updateSidebar();
  // Posts may come from /user/profile/{id} (with ids) or from /user/profile/me (may lack ids)
  const posts = mergePosts(full && full.posts, me.posts);
  posts.forEach(p => {
    if (p.author_id === undefined) p.author_id = state.userId;
    if (p.id !== undefined && p.id !== null) state.posts.set(String(p.id), p);
  });
  const missingIds = posts.length > 0 && posts.every(p => p.id === undefined || p.id === null);
  state.users.set(String(state.userId), { id: String(state.userId), ...(full || {}), username: me.username, image_url: me.image_url, private: !full || !isPublicProfile(full) });
  posts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  if (state.route.name !== 'profile') return;
  page.innerHTML = profileHtml({
    id: state.userId, isMe: true,
    username: me.username, image_url: me.image_url, bio: me.bio, email: full && full.email,
    postCount: me.post_count ?? (full && full.count_posts) ?? posts.length,
    followers: me.follower_count, followings: me.following_count,
    publicView: true, posts, accountType: me.account_type,
  });
  if (missingIds) {
    const grid = $('.profile .grid', page);
    if (grid) grid.insertAdjacentHTML('beforebegin', `<p class="hint text-center" style="margin:8px 0 12px">Backend postlar uchun <b>id</b> qaytarmayapti, shuning uchun postni ochish, like va o'chirish bu yerda ishlamaydi.</p>`);
  } else if (full && !isPublicProfile(full) && !posts.length) {
    const grid = $('.profile .empty', page);
    if (grid) grid.insertAdjacentHTML('beforeend', `<p class="hint">Akkauntingiz yopiq bo'lgani uchun server postlar ro'yxatini qaytarmadi.</p>`);
  }
}

async function renderUserPage(route) {
  const id = route.params.id;
  if (String(id) === String(state.userId)) { navigate('#/profile'); return; }
  const page = $('#page');
  page.innerHTML = spinner();
  let u;
  try { u = await API.profile(id); }
  catch (e) { page.innerHTML = `<div class="empty"><h3>Foydalanuvchi topilmadi</h3><p>${esc(e.message)}</p><a class="btn-link" href="#/search">Qidiruvga</a></div>`; return; }
  const pub = isPublicProfile(u);
  state.users.set(String(id), { id: String(id), ...u, private: !pub });
  const posts = pub ? u.posts.slice() : [];
  posts.forEach(p => { if (p.author_id === undefined) p.author_id = id; if (p.id !== undefined && p.id !== null) state.posts.set(String(p.id), p); });
  posts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  if (state.route.name !== 'user') return;
  page.innerHTML = profileHtml({
    id, isMe: false,
    username: u.username, image_url: u.image_url, bio: u.bio, email: u.email,
    postCount: u.count_posts ?? posts.length,
    followers: u.follower_count, followings: u.following_count,
    publicView: pub, posts,
  });
}

/* follower / following list modals */
async function openListModal(kind, userId) {
  const isMe = String(userId) === String(state.userId);
  const title = kind === 'followers' ? 'Kuzatuvchilar' : 'Kuzatilayotganlar';
  const m = openModal({ html: `<div class="modal-head">${title}</div><div class="modal-body" data-list>${spinner()}</div>`, cls: 'list-modal' });
  const box = $('[data-list]', m);
  try {
    let list;
    if (kind === 'followers') list = isMe ? await API.myFollowers() : await API.followersOf(userId);
    else list = isMe ? await API.myFollowings() : await API.followingsOf(userId);
    if (!Array.isArray(list)) list = [];
    if (!list.length) { box.innerHTML = `<div class="no-comments"><h4>Ro'yxat bo'sh</h4></div>`; return; }
    box.innerHTML = list.map(u => `
      <div class="list-row">
        ${avatarImg(u.image_url, 'avatar-44')}
        <span class="username">${esc(u.username)}</span>
        <button class="btn btn-secondary btn-sm" type="button" data-action="search-user" data-username="${esc(u.username)}">Qidirish</button>
      </div>`).join('');
  } catch (e) { box.innerHTML = `<div class="error-text">${esc(e.message)}</div>`; }
}

/* ---------- follow requests (yopiq akkaunt) ---------- */
function requestRowHtml(u) {
  const img = u.image_url || u.image || '';
  return `
    <div class="list-row" data-request-user="${esc(u.id)}">
      <a href="#/user/${esc(u.id)}">${avatarImg(img, 'avatar-44')}</a>
      <span class="username">${esc(u.username)}</span>
      <button class="btn btn-sm" type="button" data-action="request-accept" data-user-id="${esc(u.id)}" data-username="${esc(u.username)}">Qabul qilish</button>
      <button class="btn btn-sm btn-secondary" type="button" data-action="request-reject" data-user-id="${esc(u.id)}" data-username="${esc(u.username)}">Rad etish</button>
    </div>`;
}
async function loadRequestsInto(box) {
  if (!box) return 0;
  box.innerHTML = spinner();
  try {
    const list = await API.followRequests();
    const arr = Array.isArray(list) ? list : [];
    if (!arr.length) { box.innerHTML = `<div class="no-comments"><h4>So'rovlar yo'q</h4><div>Yangi kuzatish so'rovlari shu yerda chiqadi.</div></div>`; return 0; }
    box.innerHTML = arr.map(requestRowHtml).join('');
    return arr.length;
  } catch (e) { box.innerHTML = `<div class="error-text">${esc(e.message)}</div>`; return 0; }
}
function openRequestsModal() {
  const m = openModal({ html: `<div class="modal-head">Kuzatish so'rovlari</div><div class="modal-body" data-requests>${spinner()}</div>`, cls: 'list-modal' });
  loadRequestsInto($('[data-requests]', m));
}
async function answerRequest(userId, username, accept, el) {
  try {
    if (accept) await API.acceptRequest(userId); else await API.rejectRequest(userId);
    toast(accept ? `${username} qabul qilindi` : `${username} rad etildi`);
    // reload only the list the button belongs to (settings card or modal)
    const box = (el && el.closest('[data-requests]')) || $('[data-requests]');
    if (box) await loadRequestsInto(box);
    invalidateUser(state.userId);
    if (state.route.name === 'profile') reloadMe();
  } catch (e) { toast(e.message, 'error'); }
}

/* follow / unfollow */
async function doFollow(id, username, follow, isPrivateAcc = false) {
  try {
    if (follow) {
      await API.follow(id);
      if (isPrivateAcc) { setPending(id, true); toast("Kuzatish so'rovi yuborildi"); }
      else { setPending(id, false); toast(`${username} kuzatilmoqda`); }
    } else {
      await API.unfollow(id);
      setPending(id, false);
      toast(`${username} kuzatuvi to'xtatildi`);
    }
    await refreshFollowing();
    invalidateUser(id);
    // re-render the current page so counts and buttons update
    if (['user', 'search', 'profile', 'feed'].includes(state.route.name)) {
      if (state.route.name === 'feed') { $$('[data-top]').forEach(c => loadTopFollowed(c, 'right')); }
      else if (state.route.name === 'search') { const q = $('.search-input'); if (q && q.value.trim()) doSearch(q.value.trim()); rerenderTopLists(); }
      else router();
    }
  } catch (e) { toast(e.message, 'error'); }
}

/* ============================== SETTINGS PAGE ======================= */
async function renderSettings() {
  const page = $('#page');
  page.innerHTML = spinner();
  const [me, full] = await Promise.all([API.me(), API.profile(state.userId).catch(() => null)]);
  state.me = me; updateSidebar();
  if (state.route.name !== 'settings') return;
  const priv = isPrivateType(me.account_type);
  page.innerHTML = `
    <div class="settings">
      <h1>Sozlamalar</h1>

      <section class="card">
        <h2 class="card-title">Profilni tahrirlash</h2>
        <form data-form="edit-profile" novalidate>
          <div class="avatar-picker">
            <img class="avatar" src="${esc(imgUrl(me.image_url))}" alt="" data-preview-target="edit-avatar">
            <label><input type="file" name="file" accept="image/*" data-preview="edit-avatar"><span class="btn-link">Rasmni o'zgartirish</span></label>
          </div>
          <div class="field"><label>Foydalanuvchi nomi</label><input class="input" name="username" value="${esc(me.username)}" required></div>
          <div class="field"><label>Email</label><input class="input" name="email" type="email" value="${esc((full && full.email) || '')}" placeholder="email@misol.uz" required></div>
          <div class="field"><label>Bio</label><textarea class="input" name="bio" maxlength="500">${esc(me.bio || '')}</textarea></div>
          <div class="error-text" data-error></div>
          <div class="form-actions"><button class="btn" type="submit">Saqlash</button></div>
        </form>
      </section>

      <section class="card">
        <h2 class="card-title">Parolni o'zgartirish</h2>
        <form data-form="change-password" novalidate>
          <div class="field"><label>Joriy parol</label><input class="input" name="old_password" type="password" autocomplete="current-password" required></div>
          <div class="field"><label>Yangi parol</label><input class="input" name="password" type="password" autocomplete="new-password" required></div>
          <div class="field"><label>Yangi parolni tasdiqlang</label><input class="input" name="password2" type="password" autocomplete="new-password" required></div>
          <div class="error-text" data-error></div>
          <div class="form-actions"><button class="btn" type="submit">Parolni yangilash</button></div>
        </form>
      </section>

      <section class="card">
        <h2 class="card-title">Akkaunt maxfiyligi</h2>
        <div class="settings-row">
          <div>
            <div class="bold">Yopiq akkaunt</div>
            <div class="hint">Yopiq bo'lsa, postlaringiz va rasmingiz faqat kuzatuvchilarga ko'rinadi. Hozir: <b data-privacy-label>${priv ? 'Yopiq' : 'Ochiq'}</b></div>
          </div>
          <button class="switch ${priv ? 'on' : ''}" type="button" role="switch" aria-checked="${priv}" data-action="toggle-privacy" aria-label="Yopiq akkaunt"></button>
        </div>
      </section>

      <section class="card">
        <div class="settings-row" style="margin-bottom:8px">
          <h2 class="card-title" style="margin:0">Kuzatish so'rovlari</h2>
          <button class="btn btn-secondary btn-sm" type="button" data-action="requests-refresh">Yangilash</button>
        </div>
        <p class="card-sub">Yopiq akkauntda sizni kuzatmoqchi bo'lganlar shu yerda chiqadi.</p>
        <div data-requests>${spinner()}</div>
      </section>

      <section class="card">
        <div class="settings-row" style="margin-bottom:8px">
          <h2 class="card-title" style="margin:0">Faol sessiyalar <span class="chip chip-blue" data-session-count>…</span></h2>
          <button class="btn btn-secondary btn-sm" type="button" data-action="refresh-sessions">Yangilash</button>
        </div>
        <div data-sessions>${spinner()}</div>
      </section>

      <section class="card">
        <h2 class="card-title">Chiqish</h2>
        <p class="card-sub">Joriy qurilmadagi sessiyani tugatadi.</p>
        <button class="btn btn-secondary" type="button" data-action="logout">Chiqish</button>
      </section>

      <section class="card danger-zone">
        <h2 class="card-title" style="color:var(--red)">Akkauntni o'chirish</h2>
        <p class="card-sub">Akkaunt, postlar va izohlar butunlay o'chiriladi. Bu amalni ortga qaytarib bo'lmaydi.</p>
        <button class="btn btn-danger" type="button" data-action="delete-account">Akkauntni o'chirish</button>
      </section>
    </div>`;
  loadSessions();
  loadRequestsInto($('[data-requests]'));
}
async function loadSessions() {
  const box = $('[data-sessions]');
  const cnt = $('[data-session-count]');
  if (!box) return;
  box.innerHTML = spinner();
  try {
    const [list, count] = await Promise.all([API.sessionsAll(), API.sessionsCount().catch(() => null)]);
    const arr = Array.isArray(list) ? list : [];
    if (cnt) cnt.textContent = count !== null && count !== undefined ? String(typeof count === 'object' ? (count.count ?? count.sessions ?? '') : count) : String(arr.length);
    if (!arr.length) { box.innerHTML = `<div class="muted">Sessiyalar yo'q.</div>`; return; }
    box.innerHTML = arr.map(s => {
      const current = s.token && state.token && s.token === state.token;
      return `
        <div class="session-row">
          <div class="session-info">
            <div class="dev">${esc(s.device_info || 'Noma\'lum qurilma')}</div>
            <div class="meta">IP: ${esc(s.ip_address || '—')} · ${esc(fmtDate(s.created_at))}${s.expires_at ? ` · tugaydi: ${esc(fmtDate(s.expires_at))}` : ''}</div>
            <div class="session-chips">
              <span class="chip ${s.is_active ? 'chip-green' : 'chip-red'}">${s.is_active ? 'Faol' : 'Nofaol'}</span>
              ${current ? `<span class="chip chip-blue">Joriy</span>` : ''}
            </div>
          </div>
          <button class="btn btn-secondary btn-sm" type="button" data-action="session-detail" data-token-id="${esc(s.id)}">Batafsil</button>
        </div>`;
    }).join('');
  } catch (e) { box.innerHTML = `<div class="error-text">${esc(e.message)}</div>`; }
}
async function submitEditProfile(form) {
  const err = $('[data-error]', form); const btn = $('button[type=submit]', form);
  err.textContent = '';
  const username = form.username.value.trim();
  const email = form.email.value.trim();
  const bio = form.bio.value.trim();
  if (!username || !email) { err.textContent = 'Foydalanuvchi nomi va email majburiy.'; return; }
  const fd = new FormData();
  fd.append('username', username); fd.append('email', email); fd.append('bio', bio);
  const f = form.file.files[0]; if (f) fd.append('file', f);
  btn.disabled = true;
  try {
    await API.editInfo(fd);
    toast('Profil yangilandi');
    invalidateUser(state.userId);
    await reloadMe();
    router();
  } catch (e) { err.textContent = e.message; btn.disabled = false; }
}
async function submitChangePassword(form) {
  const err = $('[data-error]', form); const btn = $('button[type=submit]', form);
  err.textContent = '';
  const o = form.old_password.value, p = form.password.value, p2 = form.password2.value;
  if (!o || !p || !p2) { err.textContent = "Barcha maydonlarni to'ldiring."; return; }
  if (p !== p2) { err.textContent = 'Yangi parollar mos kelmadi.'; return; }
  if (p === o) { err.textContent = 'Yangi parol eskisidan farq qilishi kerak.'; return; }
  btn.disabled = true;
  try {
    await API.changePassword(o, p, p2);
    toast("Parol o'zgartirildi");
    form.reset();
  } catch (e) { err.textContent = e.message; }
  finally { btn.disabled = false; }
}
async function togglePrivacy(btn) {
  btn.disabled = true;
  try {
    await API.toggleAccountType();
    await reloadMe();
    const priv = isPrivateType(state.me && state.me.account_type);
    btn.classList.toggle('on', priv);
    btn.setAttribute('aria-checked', String(priv));
    const lbl = $('[data-privacy-label]'); if (lbl) lbl.textContent = priv ? 'Yopiq' : 'Ochiq';
    invalidateUser(state.userId);
    toast(priv ? 'Akkaunt yopiq qilindi' : 'Akkaunt ochiq qilindi');
  } catch (e) { toast(e.message, 'error'); }
  finally { btn.disabled = false; }
}
async function showSessionDetail(tokenId) {
  const m = infoModal('Sessiya tafsilotlari', spinner());
  try {
    const info = await API.sessionDetail(tokenId);
    const text = typeof info === 'string' ? info : (info && (info.device_info || JSON.stringify(info, null, 2))) || '—';
    $('.modal-body', m).innerHTML = `<div class="hint mb-16">Sessiya ID: ${esc(tokenId)}</div><div class="detail-text">${esc(text)}</div>`;
  } catch (e) { $('.modal-body', m).innerHTML = `<div class="error-text">${esc(e.message)}</div>`; }
}
async function deleteAccount() {
  const ok = await confirmDialog("Akkauntni o'chirasizmi?", "Barcha ma'lumotlaringiz butunlay o'chiriladi. Bu amalni ortga qaytarib bo'lmaydi.", "Ha, o'chirish");
  if (!ok) return;
  const ok2 = await menuDialog({ title: 'Oxirgi tasdiq', text: "Rostdan ham akkauntni o'chirmoqchimisiz?", items: [{ label: "Akkauntni butunlay o'chirish", value: 'ok', danger: true }] });
  if (ok2 !== 'ok') return;
  try {
    await API.deleteAccount();
    clearSession();
    closeAllModals();
    showAuth();
    toast("Akkaunt o'chirildi");
  } catch (e) { toast(e.message, 'error'); }
}

/* ============================== EVENT WIRING ======================== */
const actions = {
  'auth-switch': (el) => renderAuth(el.dataset.mode),
  'modal-close': (el) => closeModal(el.closest('.modal-backdrop')),
  'open-create': () => openPostEditor(),
  'logout': () => doLogout(),
  'like': (el) => { const c = el.closest('[data-post-id]'); if (c) toggleLike(c.dataset.postId); },
  'open-post': (el) => { const c = el.closest('[data-post-id]'); if (c) openPostModal(c.dataset.postId); },
  'post-menu': (el) => { const c = el.closest('[data-post-id]'); if (c) openPostMenu(c.dataset.postId); },
  'focus-comment': (el) => { const f = $('input[name=text]', el.closest('.pm-side')); if (f) f.focus(); },
  'comment-edit': (el) => startCommentEdit(el.closest('.comment')),
  'comment-edit-cancel': (el) => { const c = el.closest('.comment'); const t = $('[data-comment-text]', c); if (t) t.hidden = false; el.closest('form').remove(); },
  'comment-delete': (el) => deleteMyComment(el.closest('.comment')),
  'follow': (el) => doFollow(el.dataset.userId, el.dataset.username, true, el.dataset.private === '1'),
  'unfollow': (el) => doFollow(el.dataset.userId, el.dataset.username, false, el.dataset.private === '1'),
  'requests-open': () => openRequestsModal(),
  'requests-refresh': () => loadRequestsInto($('[data-requests]')),
  'request-accept': (el) => answerRequest(el.dataset.userId, el.dataset.username, true, el),
  'request-reject': (el) => answerRequest(el.dataset.userId, el.dataset.username, false, el),
  'followers-list': (el) => openListModal('followers', el.dataset.userId),
  'following-list': (el) => openListModal('following', el.dataset.userId),
  'search-user': (el) => { closeAllModals(); navigate(`#/search?username=${encodeURIComponent(el.dataset.username)}`); if (state.route.name === 'search') doSearch(el.dataset.username); },
  'toggle-privacy': (el) => togglePrivacy(el),
  'refresh-sessions': () => loadSessions(),
  'session-detail': (el) => showSessionDetail(el.dataset.tokenId),
  'delete-account': () => deleteAccount(),
};
const forms = {
  'login': handleLogin,
  'register': handleRegister,
  'comment': submitComment,
  'comment-edit': submitCommentEdit,
  'post-editor': submitPostEditor,
  'edit-profile': submitEditProfile,
  'change-password': submitChangePassword,
  'search': (form) => {
    const v = form.username.value.trim();
    if (!v) return;
    const target = `#/search?username=${encodeURIComponent(v)}`;
    if (location.hash === target) doSearch(v); else { history.replaceState(null, '', target); doSearch(v); }
  },
};

document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-action]');
  if (!el) return;
  const fn = actions[el.dataset.action];
  if (!fn) return;
  e.preventDefault();
  fn(el, e);
});
document.addEventListener('submit', (e) => {
  const form = e.target.closest('form[data-form]');
  if (!form) return;
  e.preventDefault();
  const fn = forms[form.dataset.form];
  if (fn) fn(form);
});
document.addEventListener('change', (e) => {
  const input = e.target;
  if (input.matches && input.matches('input[type=file][data-preview]')) showPreview(input);
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && state.modals.length) closeModal();
});
window.addEventListener('hashchange', router);

/* ============================== INIT ================================ */
function init() {
  $$('[data-icon]').forEach(el => { el.innerHTML = ICONS[el.dataset.icon] || ''; });
  try {
    state.token = localStorage.getItem(CONFIG.STORAGE.token);
    state.userId = localStorage.getItem(CONFIG.STORAGE.userId);
  } catch { /* ignore */ }
  if (state.token) bootApp(); else showAuth();
}
document.addEventListener('DOMContentLoaded', init);
