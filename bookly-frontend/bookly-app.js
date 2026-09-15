// Bookly Service Worker - Handles push notifications and background sync
const API_BASE_URL = 'https://api.bookly.example.com';

// Handle push notifications
self.addEventListener('push', (event) => {
  console.log('Push notification received:', event);

  if (!event.data) {
    console.log('No data in push notification');
    return;
  }

  let notificationData = {};
  try {
    notificationData = event.data.json();
  } catch (e) {
    notificationData = {
      title: 'Bookly',
      body: event.data.text(),
    };
  }

  const {
    type = 'default',
    title = 'Bookly',
    body = 'You have a new notification',
    icon = '/bookly-icon.png',
    badge = '/bookly-badge.png',
    data = {},
    tag = 'bookly-notification',
    actions = [],
  } = notificationData;

  // Build actions based on notification type
  let notificationActions = actions;
  if (type === 'follow_request') {
    notificationActions = [
      { action: 'accept', title: 'Accept', icon: '/accept-icon.png' },
      { action: 'reject', title: 'Reject', icon: '/reject-icon.png' },
    ];
  } else if (type === 'followed') {
    notificationActions = [
      { action: 'view_profile', title: 'View Profile', icon: '/profile-icon.png' },
    ];
  }

  const options = {
    body,
    icon,
    badge,
    tag,
    data: {
      type,
      ...data,
      timestamp: Date.now(),
    },
    actions: notificationActions,
    badge: badge,
    requireInteraction: type === 'follow_request', // Keep follow requests visible until acted upon
    vibrate: [200, 100, 200],
    sound: '/notification-sound.mp3',
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event.notification.tag, event.action);

  const notification = event.notification;
  const { type, userId, fromUserId } = notification.data;

  event.notification.close();

  // Handle action button clicks
  if (event.action === 'accept') {
    event.waitUntil(
      handleFollowRequestAction(fromUserId, 'accept')
        .then(() => notifyUser('Follow request accepted!'))
        .catch(err => console.error('Accept error:', err))
    );
  } else if (event.action === 'reject') {
    event.waitUntil(
      handleFollowRequestAction(fromUserId, 'reject')
        .then(() => notifyUser('Follow request rejected'))
        .catch(err => console.error('Reject error:', err))
    );
  } else if (event.action === 'view_profile' || type === 'followed') {
    // Open profile page
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then(clientList => {
          // Check if window already exists
          for (let client of clientList) {
            if (client.url === '/' && 'focus' in client) {
              client.focus();
              // Send message to load profile
              client.postMessage({
                type: 'LOAD_PROFILE',
                userId: fromUserId,
              });
              return;
            }
          }
          // Open new window if not found
          if (clients.openWindow) {
            return clients.openWindow(`/?profile=${fromUserId}`);
          }
        })
    );
  } else {
    // Default: open app
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then(clientList => {
          for (let client of clientList) {
            if (client.url === '/' && 'focus' in client) {
              return client.focus();
            }
          }
          if (clients.openWindow) {
            return clients.openWindow('/');
          }
        })
    );
  }
});

// Handle notification close
self.addEventListener('notificationclose', (event) => {
  console.log('Notification closed:', event.notification.tag);
  // Optional: track notification dismissals
  const { type, userId } = event.notification.data;
  // Could send analytics here
});

// Handle follow request accept/reject
async function handleFollowRequestAction(userId, action) {
  try {
    // Get token from IndexedDB or localStorage
    const token = await getAuthToken();

    const endpoint = action === 'accept'
      ? `/user/follow-request/${userId}/accept`
      : `/user/follow-request/${userId}/reject`;

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    console.log(`Follow request ${action} successful`);
    return response.json();
  } catch (error) {
    console.error('Error handling follow request action:', error);
    throw error;
  }
}

// Retrieve auth token from storage
async function getAuthToken() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('bookly');

    request.onerror = () => reject(request.error);
    request.onupgradeneeded = () => {
      // If DB doesn't exist, token won't be there
    };
    request.onsuccess = () => {
      const db = request.result;
      try {
        const tx = db.transaction('auth', 'readonly');
        const store = tx.objectStore('auth');
        const getReq = store.get('token');

        getReq.onsuccess = () => {
          resolve(getReq.result?.token || localStorage.getItem('booklyToken'));
        };
        getReq.onerror = () => {
          resolve(localStorage.getItem('booklyToken'));
        };
      } catch (e) {
        // Fall back to localStorage
        resolve(localStorage.getItem('booklyToken'));
      }
    };
  });
}

// Helper to notify user in background
function notifyUser(message) {
  return self.registration.showNotification('Bookly', {
    body: message,
    tag: 'bookly-toast',
    requireInteraction: false,
  });
}

// Handle background sync (for follow/unfollow when offline)
self.addEventListener('sync', (event) => {
  console.log('Background sync event:', event.tag);

  if (event.tag === 'bookly-follow-sync') {
    event.waitUntil(
      syncPendingFollows()
    );
  } else if (event.tag === 'bookly-post-sync') {
    event.waitUntil(
      syncPendingPosts()
    );
  }
});

async function syncPendingFollows() {
  try {
    const token = await getAuthToken();
    const pendingFollows = JSON.parse(localStorage.getItem('pendingFollows') || '[]');

    for (const follow of pendingFollows) {
      const response = await fetch(`${API_BASE_URL}/user/${follow.userId}/follow`, {
        method: follow.action === 'follow' ? 'POST' : 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        // Remove from pending
        const updated = pendingFollows.filter(f => f.userId !== follow.userId);
        localStorage.setItem('pendingFollows', JSON.stringify(updated));
      }
    }
  } catch (error) {
    console.error('Error syncing follows:', error);
  }
}

async function syncPendingPosts() {
  try {
    const token = await getAuthToken();
    const pendingPosts = JSON.parse(localStorage.getItem('pendingPosts') || '[]');

    for (const post of pendingPosts) {
      const formData = new FormData();
      formData.append('title', post.title);
      formData.append('description', post.description);
      if (post.imageData) {
        formData.append('image', post.imageData);
      }

      const response = await fetch(`${API_BASE_URL}/post`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        // Remove from pending
        const updated = pendingPosts.filter(p => p.id !== post.id);
        localStorage.setItem('pendingPosts', JSON.stringify(updated));
      }
    }
  } catch (error) {
    console.error('Error syncing posts:', error);
  }
}

// Handle messages from clients
self.addEventListener('message', (event) => {
  console.log('Service worker message:', event.data);

  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  } else if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: '1.0.0' });
  }
});

// Clean up old caches on activate
self.addEventListener('activate', (event) => {
  console.log('Service worker activated');

  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(cacheName => cacheName.startsWith('bookly-') && cacheName !== 'bookly-v1')
          .map(cacheName => caches.delete(cacheName))
      );
    })
  );
});

// Optional: Cache API requests for offline support
self.addEventListener('fetch', (event) => {
  // Only cache GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Don't cache non-same-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }

        return fetch(event.request).then(response => {
          // Don't cache if not successful
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          const responseToCache = response.clone();
          caches.open('bookly-v1').then(cache => {
            cache.put(event.request, responseToCache);
          });

          return response;
        });
      })
      .catch(() => {
        // Return offline page or cached response
        return new Response('Offline', {
          status: 503,
          statusText: 'Service Unavailable',
          headers: new Headers({
            'Content-Type': 'text/plain',
          }),
        });
      })
  );
});

// Log service worker installation
console.log('Bookly Service Worker loaded');