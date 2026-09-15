// BOOKLY API CONFIGURATION
const API_BASE_URL = 'http://localhost:8000';
/* =========================================================
   CONFIG — o'zingizga moslab o'zgartiring
   ========================================================= */
const CONFIG = {
  BASE_URL: 'http://localhost:8000',          // FastAPI manzili
  TOKEN_FIELD: 'token',                       // /auth/login javobida token qaysi maydonda
  USER_ID_FIELD: 'user_id',                   // /auth/login javobida user id maydoni (bo'lmasa null qoladi)
  authHeader: t => ({ Authorization: 'Bearer ' + t }),   // token_checker qanday o'qisa shunday qiling
};

/* ---------------- STATE ---------------- */
const S = {
  token: localStorage.getItem('token'),
  meId: localStorage.getItem('meId') ? Number(localStorage.getItem('meId')) : null,
  me: null,
  feed: [],
  likes: JSON.parse(localStorage.getItem('likes') || '{}'),   // {bookId:true}
  userCache: {},                                              // authorId -> {username,image_url}
};
const DEFAULT_AVATAR = 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="#dbdbdb"/><circle cx="50" cy="40" r="18" fill="#fff"/><path d="M18 88c4-20 20-28 32-28s28 8 32 28" fill="#fff"/></svg>');
const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
// backend "/uploads/x.jpg" ko'rinishida nisbiy yo'l qaytaradi -> BASE_URL qo'shamiz
const img = u => !u ? '' : (/^(https?:|data:|blob:)/.test(u) ? u : CONFIG.BASE_URL + (u.startsWith('/') ? '' : '/') + u);
const av = u => img(u) || DEFAULT_AVATAR;
const timeAgo = d => {
  if (!d) return '';
  const t = (Date.now() - new Date(d)) / 1000;
  if (t < 60) return 'hozir';
  if (t < 3600) return Math.floor(t / 60) + ' daqiqa';
  if (t < 86400) return Math.floor(t / 3600) + ' soat';
  return Math.floor(t / 86400) + ' kun';
};
function toast(m) { const t = $('#toast'); t.textContent = m; t.classList.add('show'); clearTimeout(t._t); t._t = setTimeout(() => t.classList.remove('show'), 2200); }

/* ---------------- API ---------------- */
async function api(path, { method = 'GET', body, json, query } = {}) {
  const url = new URL(CONFIG.BASE_URL + path);
  if (query) Object.entries(query).forEach(([k, v]) => v != null && url.searchParams.set(k, v));
  const headers = {};
  if (S.token) Object.assign(headers, CONFIG.authHeader(S.token));
  let b;
  if (json) { headers['Content-Type'] = 'application/json'; b = JSON.stringify(json); }
  else if (body) b = body;
  const r = await fetch(url, { method, headers, body: b });
  const text = await r.text();
  let data; try { data = JSON.parse(text); } catch { data = text; }
  const det = data && typeof data.detail === 'string' ? data.detail : '';
  // token_checker: 401 'not authenticate', 400 'token expired' / 'token deactivated'
  if (S.token && (r.status === 401 || /token (expired|deactivated)/i.test(det))) { doLogout(false); throw new Error('Sessiya tugadi, qayta kiring'); }
  if (!r.ok) {
    let d = data && data.detail;
    if (Array.isArray(d)) d = d.map(x => x.msg).join(', ');
    throw new Error(d || r.statusText || 'Xatolik');
  }
  return data;
}
const fd = obj => { const f = new FormData(); Object.entries(obj).forEach(([k, v]) => { if (v != null && v !== '') f.append(k, v); }); return f; };

/* ---------------- ENDPOINTS ---------------- */
const API = {
  // auth
  register: f => api('/auth/registration/', { method: 'POST', body: f }),
  login: (u, p) => api('/auth/login', { method: 'POST', body: fd({ username: u, password: p }) }),
  logout: () => api('/auth/logout', { method: 'POST' }),
  deleteAccount: () => api('/auth/delete-account', { method: 'DELETE' }),
  editInfo: f => api('/auth/EditInfo', { method: 'PUT', body: f }),
  changePassword: j => api('/auth/change-password', { method: 'PATCH', json: j }),
  // post
  createPost: f => api('/post/post', { method: 'POST', body: f }),
  deletePost: id => api(`/post/delete/${id}`, { method: 'DELETE' }),
  editPost: (id, f) => api(`/post/put/${id}`, { method: 'PUT', body: f }),
  feed: () => api('/post/see'),
  // review
  comment: (bookId, text) => api(`/review/comment/${bookId}`, { method: 'POST', json: { text } }),
  deleteComment: bookId => api(`/review/delete/${bookId}`, { method: 'DELETE' }),
  editComment: (commentId, bookId, text) => api(`/review/edit/${commentId}`, { method: 'PUT', json: { text }, query: { book_id: bookId } }),
  comments: bookId => api('/review/see/comments', { query: { book_id: bookId } }),
  like: id => api(`/review/like/${id}`, { method: 'POST' }),
  unlike: id => api(`/review/like/${id}`, { method: 'DELETE' }),
  likeCount: id => api(`/review/count/like/${id}`),
  // user
  me: () => api('/user/profile/me'),
  search: username => api('/user/search', { query: { username } }),
  follow: id => api('/user/follow', { method: 'POST', query: { following_id: id } }),
  unfollow: id => api('/user/unfollow', { method: 'DELETE', query: { following_id: id } }),
  toggleAccountType: () => api('/user/account-type/', { method: 'PATCH' }),
  profile: id => api(`/user/profile/${id}`),
  topFollowed: () => api('/user/top-followed'),
  followers: id => api(`/user/Followers/${id}/list`),
  followings: id => api(`/user/Followigs/${id}/list`),
  myFollowers: () => api('/user/Followers/me/list'),
  myFollowings: () => api('/user/Followings/me/list'),
  sessionsAll: () => api('/user/sessions/all'),
  sessionsCount: () => api('/user/sessions'),
  sessionOne: id => api(`/user/sessions/${id}`),
};

/* ---------------- ICONS ---------------- */
const I = {
  heart: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 21s-7.5-4.6-9.5-9.2C1 7.9 3.5 4.5 7 4.5c2 0 3.6 1.2 5 3 1.4-1.8 3-3 5-3 3.5 0 6 3.4 4.5 7.3C19.5 16.4 12 21 12 21z"/></svg>`,
  cmt: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 21l1.9-5.4A8 8 0 1 1 21 12z"/></svg>`,
  photo: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="9" cy="9" r="2"/><path d="m21 16-5-5-9 9"/></svg>`,
  search: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>`,
  lock: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="48" height="48"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>`,
};

/* ---------------- MODALS ---------------- */
function openModal(html, cls = 'small') {
  const o = document.createElement('div');
  o.className = 'overlay';
  o.innerHTML = `<button class="close">&times;</button><div class="modal ${cls}">${html}</div>`;
  o.addEventListener('click', e => { if (e.target === o || e.target.classList.contains('close')) o.remove(); });
  $('#modals').appendChild(o);
  return o;
}
function confirmModal(text, okLabel = 'Ha', danger = true) {
  return new Promise(res => {
    const o = openModal(`<h3>${esc(text)}</h3><ul class="menu"><li class="${danger ? 'red' : ''}" data-a="ok">${esc(okLabel)}</li><li data-a="no">Bekor qilish</li></ul>`);
    o.querySelector('.modal').style.padding = '20px 0 0';
    o.querySelectorAll('li').forEach(li => li.onclick = () => { o.remove(); res(li.dataset.a === 'ok'); });
  });
}

/* ---------------- AUTH FLOW ---------------- */
function showAuth(register = false) {
  $('#auth').classList.remove('hidden'); $('#app').classList.add('hidden');
  $('#loginForm').classList.toggle('hidden', register);
  $('#regForm').classList.toggle('hidden', !register);
  $('#switchText').textContent = register ? 'Akkauntingiz bormi?' : "Akkauntingiz yo'qmi?";
  $('#switchBtn').textContent = register ? 'Kirish' : "Ro'yxatdan o'tish";
}
$('#switchBtn').onclick = () => showAuth($('#regForm').classList.contains('hidden'));
$('#regPreview').src = DEFAULT_AVATAR;
$('#regForm').file.onchange = e => { const f = e.target.files[0]; if (f) $('#regPreview').src = URL.createObjectURL(f); };

$('#loginForm').onsubmit = async e => {
  e.preventDefault(); const f = e.target; $('#loginErr').textContent = '';
  try {
    const r = await API.login(f.username.value.trim(), f.password.value);
    const tok = r[CONFIG.TOKEN_FIELD]; if (!tok) throw new Error(`Javobda "${CONFIG.TOKEN_FIELD}" maydoni yo'q — CONFIG.TOKEN_FIELD ni tekshiring`);
    S.token = tok; localStorage.setItem('token', tok);
    const uid = r[CONFIG.USER_ID_FIELD]; if (uid != null) { S.meId = Number(uid); localStorage.setItem('meId', uid); }
    f.reset(); boot();
  } catch (err) { $('#loginErr').textContent = err.message; }
};
$('#regForm').onsubmit = async e => {
  e.preventDefault(); const f = e.target; $('#regErr').textContent = '';
  if (f.password.value !== f.password2.value) return $('#regErr').textContent = 'Parollar mos emas';
  try {
    const body = fd({ username: f.username.value.trim(), email: f.email.value.trim(), bio: f.bio.value, password: f.password.value, password2: f.password2.value, file: f.file.files[0] });
    const u = await API.register(body);
    if (u && u.id != null) { S.meId = u.id; localStorage.setItem('meId', u.id); }
    toast("Ro'yxatdan o'tdingiz, endi kiring");
    $('#loginForm').username.value = f.username.value; f.reset(); $('#regPreview').src = DEFAULT_AVATAR; showAuth(false);
  } catch (err) { $('#regErr').textContent = err.message; }
};
async function doLogout(callApi = true) {
  if (callApi) { try { await API.logout(); } catch {} }
  S.token = null; S.me = null; S.meId = null; S.feed = [];
  localStorage.removeItem('token'); localStorage.removeItem('meId');
  location.hash = '#/'; showAuth(false);
}

/* ---------------- BOOT / ROUTER ---------------- */
async function boot() {
  if (!S.token) return showAuth(false);
  try { S.me = await API.me(); } catch (e) { if (!S.token) return; toast(e.message); }
  $('#auth').classList.add('hidden'); $('#app').classList.remove('hidden');
  $('#navAvatar').src = av(S.me?.image_url);
  route();
}
window.addEventListener('hashchange', route);
async function route() {
  if (!S.token) return;
  const h = location.hash.replace(/^#/, '') || '/';
  document.querySelectorAll('.nav a').forEach(a => a.classList.toggle('active', a.dataset.route === h || (a.dataset.route === '/profile' && h.startsWith('/profile'))));
  const v = $('#view'); v.innerHTML = '<div class="spinner"></div>';
  try {
    if (h === '/') await pageFeed(v);
    else if (h === '/search') await pageSearch(v);
    else if (h === '/profile') await pageMyProfile(v);
    else if (h.startsWith('/user/')) await pageUser(v, h.split('/')[2]);
    else if (h === '/settings') await pageSettings(v);
    else v.innerHTML = '<div class="empty">Sahifa topilmadi</div>';
  } catch (e) { v.innerHTML = `<div class="empty">${esc(e.message)}</div>`; }
}
$('#navCreate').onclick = () => openCreate();

/* ---------------- AUTHOR CACHE ---------------- */
async function author(id) {
  if (id == null) return { username: 'noma\'lum', image_url: null };
  if (S.userCache[id]) return S.userCache[id];
  try {
    const p = await API.profile(id);
    S.userCache[id] = { username: p.username || `user ${id}`, image_url: p.image_url || null };
  } catch { S.userCache[id] = { username: `user ${id}`, image_url: null }; }
  return S.userCache[id];
}

/* =========================================================
   FEED
   ========================================================= */
async function pageFeed(v) {
  S.feed = (await API.feed()) || [];
  v.innerHTML = `<div class="feed-wrap"><div class="feed" id="feedList"></div><div class="aside" id="aside"></div></div>`;
  const list = $('#feedList');
  if (!S.feed.length) {
    list.innerHTML = `<div class="empty">${I.photo}<h3>Lenta bo'sh</h3><p>Odamlarni kuzating — ularning postlari shu yerda chiqadi.</p><br><a class="btn" href="#/search">Odamlarni topish</a></div>`;
  } else {
    for (const p of S.feed) list.appendChild(await postCard(p));
  }
  renderAside($('#aside'));
}

async function postCard(p) {
  const a = await author(p.author_id);
  const el = document.createElement('article'); el.className = 'post'; el.dataset.id = p.id;
  const mine = S.meId != null && p.author_id === S.meId;
  el.innerHTML = `
    <div class="post-head">
      <a href="#/user/${p.author_id}"><img class="avatar" width="32" height="32" src="${av(a.image_url)}"></a>
      <a href="#/user/${p.author_id}" class="name">${esc(a.username)}</a>
      <span class="muted">• ${timeAgo(p.created_at)}</span>
      <button class="dots" data-a="menu">•••</button>
    </div>
    <img class="post-img" src="${esc(img(p.image_url))}" data-a="open" alt="">
    <div class="post-actions">
      <button data-a="like" class="${S.likes[p.id] ? 'liked' : ''}">${I.heart}</button>
      <button data-a="open">${I.cmt}</button>
    </div>
    <div class="post-body">
      <div class="likes" data-lc>…</div>
      <div class="cap"><b>${esc(a.username)}</b>${esc(p.title)}</div>
      ${p.description ? `<div class="muted" style="margin-top:4px">${esc(p.description)}</div>` : ''}
      <button class="btn link vc" data-a="open">Izohlarni ko'rish</button>
    </div>`;
  refreshLikeCount(p.id, el.querySelector('[data-lc]'));
  el.addEventListener('click', e => {
    const b = e.target.closest('[data-a]'); if (!b) return;
    const a = b.dataset.a;
    if (a === 'open') openPost(p);
    if (a === 'like') toggleLike(p.id, el);
    if (a === 'menu') postMenu(p, mine);
  });
  return el;
}
async function refreshLikeCount(id, node) {
  try { const n = await API.likeCount(id); node.textContent = `${n} ta layk`; } catch { node.textContent = ''; }
}
async function toggleLike(id, ...roots) {
  const was = !!S.likes[id];
  try {
    if (was) await API.unlike(id); else await API.like(id);
    S.likes[id] = !was;
  } catch (e) {
    // holat nomuvofiq bo'lsa (masalan serverda allaqachon like bor) — teskarisini sinab ko'ramiz
    try { if (was) await API.like(id); else await API.unlike(id); S.likes[id] = !was; } catch { toast(e.message); return; }
  }
  if (!S.likes[id]) delete S.likes[id];
  localStorage.setItem('likes', JSON.stringify(S.likes));
  document.querySelectorAll(`[data-like="${id}"], .post[data-id="${id}"] [data-a="like"]`).forEach(b => b.classList.toggle('liked', !!S.likes[id]));
  document.querySelectorAll(`.post[data-id="${id}"] [data-lc], [data-lc="${id}"]`).forEach(n => refreshLikeCount(id, n));
}
function postMenu(p, mine) {
  const o = openModal(`<ul class="menu">
    ${mine || S.meId == null ? `<li data-a="edit">Tahrirlash</li><li class="red" data-a="del">O'chirish</li>` : ''}
    <li data-a="user">Muallif profiliga o'tish</li>
    <li data-a="copy">Rasm havolasini nusxalash</li>
    <li data-a="x">Bekor qilish</li></ul>`);
  o.querySelector('.modal').style.padding = '0';
  o.querySelectorAll('li').forEach(li => li.onclick = async () => {
    const a = li.dataset.a; o.remove();
    if (a === 'edit') openEditPost(p);
    if (a === 'user') location.hash = `#/user/${p.author_id}`;
    if (a === 'copy') { navigator.clipboard?.writeText(p.image_url); toast('Nusxalandi'); }
    if (a === 'del' && await confirmModal("Postni o'chirasizmi?", "O'chirish")) {
      try { await API.deletePost(p.id); toast("O'chirildi"); document.querySelectorAll('.overlay').forEach(x => x.remove()); route(); } catch (e) { toast(e.message); }
    }
  });
}

/* ---------------- POST MODAL (rasm + izohlar) ---------------- */
async function openPost(p) {
  const a = await author(p.author_id);
  const mine = S.meId != null && p.author_id === S.meId;
  const o = openModal(`
    <div class="left"><img src="${esc(img(p.image_url))}"></div>
    <div class="right">
      <div class="post-head">
        <a href="#/user/${p.author_id}"><img class="avatar" width="32" height="32" src="${av(a.image_url)}"></a>
        <a href="#/user/${p.author_id}" class="name">${esc(a.username)}</a>
        <button class="dots" data-a="menu">•••</button>
      </div>
      <div class="comments" id="cmts"><div class="spinner"></div></div>
      <div class="foot">
        <div class="post-actions">
          <button data-a="like" data-like="${p.id}" class="${S.likes[p.id] ? 'liked' : ''}">${I.heart}</button>
        </div>
        <div class="post-body">
          <div class="likes" data-lc="${p.id}">…</div>
          <div class="cap"><b>${esc(a.username)}</b>${esc(p.title)}</div>
          ${p.description ? `<div class="muted" style="margin-top:4px">${esc(p.description)}</div>` : ''}
          <div class="time">${timeAgo(p.created_at)} oldin</div>
        </div>
      </div>
      <form class="cform"><input placeholder="Izoh qo'shing…" autocomplete="off"><button type="submit" disabled>Yuborish</button></form>
    </div>`, 'pm');
  refreshLikeCount(p.id, o.querySelector('[data-lc]'));
  o.querySelector('[data-a="like"]').onclick = () => toggleLike(p.id);
  o.querySelector('[data-a="menu"]').onclick = () => postMenu(p, mine);
  const form = o.querySelector('.cform'), inp = form.querySelector('input'), btn = form.querySelector('button');
  inp.oninput = () => btn.disabled = !inp.value.trim();
  form.onsubmit = async e => {
    e.preventDefault(); const t = inp.value.trim(); if (!t) return;
    btn.disabled = true;
    try { await API.comment(p.id, t); inp.value = ''; loadComments(p, o); } catch (err) { toast(err.message); btn.disabled = false; }
  };
  loadComments(p, o);
}
async function loadComments(p, o) {
  const box = o.querySelector('#cmts');
  let list = [];
  try { list = (await API.comments(p.id)) || []; } catch (e) { box.innerHTML = `<div class="muted">${esc(e.message)}</div>`; return; }
  if (!list.length) { box.innerHTML = `<div class="empty" style="padding:30px 10px"><h3>Hali izoh yo'q</h3><p>Birinchi bo'lib izoh qoldiring.</p></div>`; return; }
  box.innerHTML = '';
  for (const c of list) {
    const a = await author(c.user_id);
    const mine = S.meId == null || c.user_id === S.meId;
    const d = document.createElement('div'); d.className = 'cmt';
    d.innerHTML = `<img class="avatar" src="${av(a.image_url)}">
      <div class="body"><div><b>${esc(a.username)}</b><span class="txt">${esc(c.text)}</span></div>
      <div class="meta"><span>${timeAgo(c.created_at)}</span>${mine ? `<button data-a="edit">Tahrirlash</button><button data-a="del">O'chirish</button>` : ''}</div></div>`;
    d.querySelector('[data-a="edit"]')?.addEventListener('click', () => {
      const cur = c.text;
      const m = openModal(`<h3>Izohni tahrirlash</h3><textarea id="ct">${esc(cur)}</textarea><div class="err" id="ce"></div><button class="btn" id="cs" style="margin-top:12px">Saqlash</button>`);
      m.querySelector('#cs').onclick = async () => {
        try { await API.editComment(c.id, p.id, m.querySelector('#ct').value.trim()); m.remove(); loadComments(p, o); } catch (e) { m.querySelector('#ce').textContent = e.message; }
      };
    });
    d.querySelector('[data-a="del"]')?.addEventListener('click', async () => {
      if (!await confirmModal("Izohni o'chirasizmi?", "O'chirish")) return;
      try { await API.deleteComment(p.id); loadComments(p, o); } catch (e) { toast(e.message); }
    });
    box.appendChild(d);
  }
}

/* ---------------- CREATE / EDIT POST ---------------- */
function postForm(title, p) {
  return `<div class="hdr"><span></span><span>${title}</span><button class="btn link" data-a="save">Ulashish</button></div>
    <div class="body">
      <div class="drop" id="drop">${I.photo}<p>Rasm tanlang</p><button class="btn sm" data-a="pick">Kompyuterdan tanlash</button><input type="file" accept="image/*" hidden><img id="prev" class="${p ? '' : 'hidden'}" src="${p ? esc(img(p.image_url)) : ''}"></div>
      <div class="form">
        <div class="me-row" style="margin:0"><img class="avatar" width="28" height="28" src="${av(S.me?.image_url)}"><b>${esc(S.me?.username || '')}</b></div>
        <input id="pt" placeholder="Sarlavha" value="${p ? esc(p.title) : ''}">
        <textarea id="pd" placeholder="Tavsif yozing…">${p ? esc(p.description) : ''}</textarea>
        <div class="err" id="pe"></div>
      </div>
    </div>`;
}
function wirePostForm(o, onSave) {
  const inp = o.querySelector('input[type=file]'), prev = o.querySelector('#prev'), drop = o.querySelector('#drop');
  o.querySelector('[data-a="pick"]').onclick = () => inp.click();
  drop.ondragover = e => e.preventDefault();
  drop.ondrop = e => { e.preventDefault(); if (e.dataTransfer.files[0]) { inp.files = e.dataTransfer.files; inp.onchange(); } };
  inp.onchange = () => { const f = inp.files[0]; if (f) { prev.src = URL.createObjectURL(f); prev.classList.remove('hidden'); } };
  o.querySelector('[data-a="save"]').onclick = async e => {
    const err = o.querySelector('#pe'); err.textContent = '';
    const title = o.querySelector('#pt').value.trim(), description = o.querySelector('#pd').value.trim(), file = inp.files[0];
    if (!title) return err.textContent = 'Sarlavha kerak';
    if (!description) return err.textContent = 'Tavsif kerak';
    if (!file) return err.textContent = 'Rasm tanlang (backend rasmni majburiy talab qiladi)';
    e.target.disabled = true;
    try { await onSave(fd({ title, description, file })); o.remove(); } catch (er) { err.textContent = er.message; e.target.disabled = false; }
  };
}
function openCreate() {
  const o = openModal(postForm('Yangi post', null), 'create');
  o.querySelector('.modal').style.padding = '0';
  wirePostForm(o, async f => { await API.createPost(f); toast('Post ulashildi'); if (location.hash === '#/profile' || location.hash === '#/' || !location.hash) route(); });
}
function openEditPost(p) {
  const o = openModal(postForm('Postni tahrirlash', p), 'create');
  o.querySelector('.modal').style.padding = '0';
  o.querySelector('[data-a="save"]').textContent = 'Saqlash';
  wirePostForm(o, async f => { await API.editPost(p.id, f); toast('Saqlandi'); document.querySelectorAll('.overlay').forEach(x => x.remove()); route(); });
}

/* ---------------- ASIDE (top followed) ---------------- */
async function renderAside(box) {
  if (!box) return;
  box.innerHTML = `<div class="me-row"><a href="#/profile"><img class="avatar" width="44" height="44" src="${av(S.me?.image_url)}"></a>
    <div class="info"><b>${esc(S.me?.username || '')}</b><br><span class="muted">${esc(S.me?.bio || '')}</span></div>
    <button class="btn link" style="margin-left:auto;font-size:12px" id="asideOut">Chiqish</button></div>
    <div class="sugg-title"><span>Eng ko'p kuzatiladiganlar</span><a href="#/search" style="color:var(--text);font-size:12px">Barchasi</a></div><div id="topList"></div>`;
  $('#asideOut').onclick = () => doLogout();
  try {
    const r = await API.topFollowed();
    $('#topList').innerHTML = (r.users || []).slice(0, 5).map(u => userRow({ id: u.user_id, username: u.username, image_url: u.image_url, sub: `${u.followers} kuzatuvchi` })).join('') || '<span class="muted">Hozircha yo\'q</span>';
    wireUserRows($('#topList'));
  } catch (e) { $('#topList').innerHTML = `<span class="muted">${esc(e.message)}</span>`; }
}
function userRow(u) {
  const link = u.id != null ? `#/user/${u.id}` : '#/search';
  const btn = u.id != null && u.id !== S.meId ? `<button class="btn link" style="font-size:12px" data-follow="${u.id}">Kuzatish</button>` : '';
  return `<div class="urow"><a href="${link}"><img class="avatar" width="44" height="44" src="${av(u.image_url)}"></a>
    <div class="info"><a href="${link}"><b>${esc(u.username)}</b></a><span>${esc(u.sub || '')}</span></div>${btn}</div>`;
}
function wireUserRows(root) {
  root.querySelectorAll('[data-follow]').forEach(b => b.onclick = async () => {
    const id = Number(b.dataset.follow);
    try {
      if (b.dataset.done) { await API.unfollow(id); delete b.dataset.done; b.textContent = 'Kuzatish'; }
      else { const r = await API.follow(id); b.dataset.done = 1; b.textContent = 'Kuzatilmoqda'; toast(r.messege || 'Kuzatildi'); }
    } catch (e) { toast(e.message); }
  });
}

/* =========================================================
   SEARCH
   ========================================================= */
async function pageSearch(v) {
  v.innerHTML = `<div style="max-width:600px;margin:0 auto">
    <form class="searchbar" id="sf">${I.search}<input id="sq" placeholder="Foydalanuvchi nomini yozing va Enter bosing" autocomplete="off"></form>
    <div id="sres"></div>
    <h3 style="margin-top:30px">Mashhur akkauntlar</h3><div id="top"></div></div>`;
  $('#sq').focus();
  $('#sf').onsubmit = async e => {
    e.preventDefault(); const q = $('#sq').value.trim(); if (!q) return;
    const box = $('#sres'); box.innerHTML = '<div class="spinner"></div>';
    try {
      const u = await API.search(q);
      const id = u.id ?? u.user_id ?? null;
      const priv = !u.image_url && !u.posts;   // PrivateUserResponse da rasm/postlar yo'q
      box.innerHTML = `<div class="card" style="padding:16px">
        <div class="urow" style="padding:0">
          <img class="avatar" width="56" height="56" src="${av(u.image_url)}">
          <div class="info"><b style="font-size:16px">${esc(u.username)}</b><span>${priv ? 'Yopiq akkaunt' : esc(u.bio || u.email || '')}</span></div>
          ${id != null ? `<button class="btn sm" data-follow="${id}">Kuzatish</button><a class="btn sm gray" href="#/user/${id}">Profil</a>` : ''}
        </div>
        <div class="stats" style="margin:14px 0 0;gap:24px"><span><b>${u.count_posts ?? 0}</b> post</span><span><b>${u.follower_count ?? 0}</b> kuzatuvchi</span><span><b>${u.following_count ?? 0}</b> kuzatmoqda</span></div>
        ${id == null ? `<p class="muted" style="margin-top:12px">⚠ /user/search javobida <code>id</code> yo'q — "Kuzatish" va "Profil" uchun backend javobiga <code>id</code> qo'shing.</p>` : ''}
        ${Array.isArray(u.posts) && u.posts.length ? `<div class="grid" style="margin-top:16px;border:none;padding:0">${u.posts.map(p => `<div class="cell" data-t="${esc(p.title)}"><img src="${esc(img(p.image_url))}" data-pid="${p.id}"></div>`).join('')}</div>` : ''}
      </div>`;
      wireUserRows(box);
      box.querySelectorAll('img[data-pid]').forEach(img => img.onclick = () => { const p = u.posts.find(x => String(x.id) === img.dataset.pid); openPost({ ...p, author_id: p.author_id ?? id }); });
    } catch (e) { box.innerHTML = `<div class="empty">${esc(e.message)}</div>`; }
  };
  try {
    const r = await API.topFollowed();
    $('#top').innerHTML = (r.users || []).map(u => userRow({ id: u.user_id, username: u.username, image_url: u.image_url, sub: `#${u.rank} • ${u.followers} kuzatuvchi` })).join('') || '<span class="muted">Hozircha yo\'q</span>';
    wireUserRows($('#top'));
  } catch (e) { $('#top').innerHTML = `<span class="muted">${esc(e.message)}</span>`; }
}

/* =========================================================
   PROFILE (mening)
   ========================================================= */
async function pageMyProfile(v) {
  S.me = await API.me();
  $('#navAvatar').src = av(S.me.image_url);
  const m = S.me;
  v.innerHTML = `
    <div class="prof-head">
      <img class="avatar" src="${av(m.image_url)}">
      <div class="prof-info">
        <div class="top"><h1>${esc(m.username)}</h1>
          <span class="chip ${m.account_type && String(m.account_type).toLowerCase().includes('private') ? '' : 'on'}">${m.account_type && String(m.account_type).toLowerCase().includes('private') ? 'Yopiq' : 'Ochiq'}</span>
          <a class="btn gray sm" href="#/settings">Profilni tahrirlash</a>
          <button class="btn gray sm" id="newPost">Yangi post</button></div>
        <div class="stats"><span><b>${m.post_count ?? 0}</b> post</span>
          <button data-l="followers"><b>${m.follower_count ?? 0}</b> kuzatuvchi</button>
          <button data-l="followings"><b>${m.following_count ?? 0}</b> kuzatmoqda</button></div>
        <div class="prof-bio">${esc(m.bio || '')}</div>
      </div>
    </div>
    <div class="tabs"><button class="active">POSTLAR</button></div>
    <div id="myGrid"></div>`;
  $('#newPost').onclick = openCreate;
  v.querySelector('[data-l="followers"]').onclick = () => listModal('Kuzatuvchilar', API.myFollowers);
  v.querySelector('[data-l="followings"]').onclick = () => listModal('Kuzatilayotganlar', API.myFollowings);
  const g = $('#myGrid');
  if (S.meId == null) {
    g.innerHTML = `<div class="empty">${I.photo}<p>Postlaringizni ko'rsatish uchun user id kerak.<br>Login javobida <code>${esc(CONFIG.USER_ID_FIELD)}</code> maydoni yo'q — CONFIG.USER_ID_FIELD ni tekshiring.</p></div>`;
    return;
  }
  try {
    const p = await API.profile(S.meId);
    renderGrid(g, p.posts || [], S.meId);
  } catch (e) { g.innerHTML = `<div class="empty">${esc(e.message)}</div>`; }
}
function renderGrid(g, posts, authorId) {
  if (!posts.length) return g.innerHTML = `<div class="empty">${I.photo}<h3>Hali post yo'q</h3></div>`;
  g.innerHTML = `<div class="grid">${posts.map(p => `<div class="cell" data-t="${esc(p.title)}"><img src="${esc(img(p.image_url))}" data-pid="${p.id}"></div>`).join('')}</div>`;
  g.querySelectorAll('img').forEach(img => img.onclick = () => { const p = posts.find(x => String(x.id) === img.dataset.pid); openPost({ ...p, author_id: p.author_id ?? authorId }); });
}
async function listModal(title, fn) {
  const o = openModal(`<div class="hdr">${esc(title)}</div><div class="items"><div class="spinner"></div></div>`, 'list-modal');
  o.querySelector('.modal').style.padding = '0';
  try {
    const list = (await fn()) || [];
    o.querySelector('.items').innerHTML = list.length ? list.map(u => userRow(u)).join('') : '<div class="empty" style="padding:30px">Hech kim yo\'q</div>';
  } catch (e) { o.querySelector('.items').innerHTML = `<div class="empty">${esc(e.message)}</div>`; }
}

/* =========================================================
   USER PROFILE (boshqa)
   ========================================================= */
async function pageUser(v, id) {
  if (S.meId != null && Number(id) === S.meId) return pageMyProfile(v);
  const u = await API.profile(id);
  if (!u) throw new Error('Foydalanuvchi topilmadi');
  const priv = !('image_url' in u) && !('posts' in u);
  v.innerHTML = `
    <div class="prof-head">
      <img class="avatar" src="${av(u.image_url)}">
      <div class="prof-info">
        <div class="top"><h1>${esc(u.username)}</h1>
          <button class="btn sm" id="fBtn">Kuzatish</button><button class="btn gray sm" id="uBtn">Kuzatishni to'xtatish</button></div>
        <div class="stats"><span><b>${u.count_posts ?? 0}</b> post</span>
          <button data-l="followers"><b>${u.follower_count ?? 0}</b> kuzatuvchi</button>
          <button data-l="followings"><b>${u.following_count ?? 0}</b> kuzatmoqda</button></div>
        <div class="prof-bio">${esc(u.bio || '')}</div>
      </div>
    </div>
    <div class="tabs"><button class="active">POSTLAR</button></div>
    <div id="uGrid"></div>`;
  $('#fBtn').onclick = async () => { try { const r = await API.follow(id); toast(r.messege || 'Kuzatildi'); route(); } catch (e) { toast(e.message); } };
  $('#uBtn').onclick = async () => { try { await API.unfollow(id); toast('Kuzatish to\'xtatildi'); route(); } catch (e) { toast(e.message); } };
  v.querySelector('[data-l="followers"]').onclick = () => listModal('Kuzatuvchilar', () => API.followers(id));
  v.querySelector('[data-l="followings"]').onclick = () => listModal('Kuzatilayotganlar', () => API.followings(id));
  const g = $('#uGrid');
  if (priv) g.innerHTML = `<div class="lock">${I.lock}<h3>Bu akkaunt yopiq</h3><p>Postlarni ko'rish uchun kuzating.</p></div>`;
  else renderGrid(g, u.posts || [], Number(id));
}

/* =========================================================
   SETTINGS
   ========================================================= */
async function pageSettings(v) {
  S.me = S.me || await API.me();
  const m = S.me;
  const isPriv = m.account_type && String(m.account_type).toLowerCase().includes('private');
  v.innerHTML = `<div class="settings">
    <h2>Sozlamalar</h2>

    <div class="card"><h3>Profilni tahrirlash</h3>
      <form id="editForm">
        <div class="me-row"><img id="editPrev" class="avatar" width="56" height="56" src="${av(m.image_url)}">
          <div><b>${esc(m.username)}</b><br><label style="color:var(--blue);font-weight:600;cursor:pointer">Rasmni o'zgartirish<input name="file" type="file" accept="image/*" hidden></label></div></div>
        <div class="frow"><label>Foydalanuvchi nomi</label><input name="username" value="${esc(m.username)}" required></div>
        <div class="frow"><label>Email</label><input name="email" type="email" value="${esc(m.email || '')}" required placeholder="email@misol.uz"></div>
        <div class="frow"><label>Bio</label><textarea name="bio">${esc(m.bio || '')}</textarea></div>
        <p class="muted" style="font-size:12px;margin-bottom:10px">Eslatma: backend rasm yuborilmasa image_url ni yangilaydi — har safar rasmni ham tanlang.</p>
        <button class="btn" type="submit">Saqlash</button><div class="err" id="editErr"></div>
      </form></div>

    <div class="card"><h3>Parolni o'zgartirish</h3>
      <form id="pwForm">
        <div class="frow"><label>Eski parol</label><input name="old_password" type="password" required></div>
        <div class="frow"><label>Yangi parol</label><input name="password" type="password" required></div>
        <div class="frow"><label>Yangi parolni takrorlang</label><input name="password2" type="password" required></div>
        <button class="btn" type="submit">O'zgartirish</button><div class="err" id="pwErr"></div>
      </form></div>

    <div class="card"><h3>Akkaunt maxfiyligi</h3>
      <div class="row"><span>Hozir: <span class="chip ${isPriv ? '' : 'on'}">${isPriv ? 'Yopiq' : 'Ochiq'}</span></span>
        <button class="btn gray sm" id="typeBtn">${isPriv ? 'Ochiq qilish' : 'Yopiq qilish'}</button></div>
      <p class="muted" style="margin-top:8px;font-size:12px">Yopiq akkauntda postlaringizni faqat qabul qilingan kuzatuvchilar ko'radi.</p></div>

    <div class="card"><h3>Faol sessiyalar <span class="chip" id="sessCount"></span></h3><div id="sessList"><div class="spinner"></div></div></div>

    <div class="card"><h3>Akkaunt</h3>
      <div class="row"><button class="btn gray" id="outBtn">Chiqish</button><button class="btn danger" id="delBtn">Akkauntni o'chirish</button></div></div>
  </div>`;

  const ef = $('#editForm');
  ef.file.onchange = () => { const f = ef.file.files[0]; if (f) $('#editPrev').src = URL.createObjectURL(f); };
  ef.onsubmit = async e => {
    e.preventDefault(); $('#editErr').textContent = '';
    try {
      const u = await API.editInfo(fd({ username: ef.username.value.trim(), email: ef.email.value.trim(), bio: ef.bio.value, file: ef.file.files[0] }));
      S.me = null; toast('Saqlandi'); route();
    } catch (er) { $('#editErr').textContent = er.message; }
  };
  const pf = $('#pwForm');
  pf.onsubmit = async e => {
    e.preventDefault(); $('#pwErr').textContent = '';
    if (pf.password.value !== pf.password2.value) return $('#pwErr').textContent = 'Parollar mos emas';
    try { await API.changePassword({ old_password: pf.old_password.value, password: pf.password.value, password2: pf.password2.value }); pf.reset(); toast("Parol o'zgartirildi"); }
    catch (er) { $('#pwErr').textContent = er.message; }
  };
  $('#typeBtn').onclick = async () => { try { await API.toggleAccountType(); S.me = null; toast("Maxfiylik o'zgartirildi"); route(); } catch (e) { toast(e.message); } };
  $('#outBtn').onclick = () => doLogout();
  $('#delBtn').onclick = async () => {
    if (!await confirmModal("Akkaunt butunlay o'chiriladi. Davom etasizmi?", "O'chirish")) return;
    try { await API.deleteAccount(); toast("Akkaunt o'chirildi"); doLogout(false); } catch (e) { toast(e.message); }
  };
  try {
    const [all, cnt] = await Promise.all([API.sessionsAll(), API.sessionsCount().catch(() => null)]);
    $('#sessCount').textContent = cnt != null ? cnt : (all || []).length;
    $('#sessList').innerHTML = (all || []).map(s => `<div class="sess">
      <div class="dev" title="${esc(s.device_info)}">${esc(s.device_info || 'Noma\'lum qurilma')}</div>
      <span class="muted">${esc(s.ip_address || '')}</span>
      <span class="chip ${s.is_active !== false ? 'on' : ''}">${s.is_active !== false ? 'faol' : 'yopilgan'}</span>
      ${s.token && s.token === S.token ? '<span class="chip on">bu qurilma</span>' : ''}
      <button class="btn link" style="font-size:12px" data-sid="${esc(s.id)}">Batafsil</button></div>`).join('') || '<span class="muted">Sessiya yo\'q</span>';
    $('#sessList').querySelectorAll('[data-sid]').forEach(b => b.onclick = async () => { try { const d = await API.sessionOne(b.dataset.sid); openModal(`<h3>Qurilma</h3><p style="word-break:break-all">${esc(d)}</p>`); } catch (e) { toast(e.message); } });
  } catch (e) { $('#sessList').innerHTML = `<span class="muted">${esc(e.message)}</span>`; }
}

/* ---------------- START ---------------- */
boot();