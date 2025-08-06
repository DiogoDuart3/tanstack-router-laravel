// Service Worker for offline support with version control
const CACHE_NAME = 'laravel-app-v1';
const APP_VERSION = self.APP_VERSION || 'unknown';
const urlsToCache = [
  '/',
  '/todos-offline',
  '/manifest.json'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  console.log('SW Install: Version', APP_VERSION);
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache:', CACHE_NAME);
        return cache.addAll(urlsToCache);
      })
  );
  // Force activate immediately
  self.skipWaiting();
});

// Activate event - take control immediately
self.addEventListener('activate', (event) => {
  console.log('SW Activate: Version', APP_VERSION);
  event.waitUntil(
    (async () => {
      // Clean up old caches
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames
          .filter(cacheName => cacheName !== CACHE_NAME)
          .map(cacheName => {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          })
      );
      
      // Take control of all pages
      return self.clients.claim();
    })()
  );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  // Don't intercept these endpoints - let them go directly to network
  if (event.request.url.includes('/api/version') || 
      event.request.url.includes('/broadcasting/auth') ||
      event.request.url.includes('/sanctum/csrf-cookie')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      })
  );
});

// Background sync for queued actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync-todos') {
    event.waitUntil(doBackgroundSync());
  }
});

// Listen for messages from the main app thread
self.addEventListener('message', (event) => {
  console.log('SW received message:', event.data);
  
  if (event.data && event.data.type === 'SERVER_NOTIFICATION') {
    // Show system notification from server event
    const { title, body, tag, icon, data } = event.data.payload;
    
    self.registration.showNotification(title || 'Server Notification', {
      body: body,
      icon: icon || '/favicon.ico',
      badge: '/favicon.ico',
      tag: tag || 'server-notification',
      data: data,
      requireInteraction: false,
      silent: false,
      vibrate: [200, 100, 200],
    }).then(() => {
      // Send feedback to main app
      event.source.postMessage({
        type: 'SERVER_NOTIFICATION_RECEIVED',
        title: title || 'Server Notification'
      });
    });
  }
});

async function doBackgroundSync() {
  try {
    // Get queued actions from IndexedDB
    const syncQueue = JSON.parse(localStorage.getItem('sync-queue') || '[]');
    
    if (syncQueue.length === 0) return;

    console.log('Background sync: processing', syncQueue.length, 'actions');

    // Process each action
    for (const action of syncQueue) {
      try {
        await processAction(action);
      } catch (error) {
        console.error('Background sync failed for action:', action, error);
      }
    }

    // Notify the main app about sync completion
    self.clients.matchAll().then(clients => {
      clients.forEach(client => {
        client.postMessage({
          type: 'BACKGROUND_SYNC_COMPLETE'
        });
      });
    });

  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event.notification.tag);
  
  event.notification.close();
  
  // Handle different notification types
  let urlToOpen = '/';
  
  switch (event.notification.tag) {
    case 'welcome':
      urlToOpen = '/';
      break;
    case 'todo-reminder':
      urlToOpen = '/todos';
      break;
    case 'chat':
      urlToOpen = '/chat';
      break;
    case 'server-notification':
    case 'server-demo':
    case 'server-immediate':
      urlToOpen = '/notifications';
      break;
    default:
      urlToOpen = '/';
  }

  // Open the app or focus existing window
  event.waitUntil(
    self.clients.matchAll({ includeUncontrolled: true, type: 'window' })
      .then((clients) => {
        // Check if app is already open
        const existingClient = clients.find(client => 
          client.url.includes(self.location.origin)
        );
        
        if (existingClient) {
          // Focus existing window and navigate
          existingClient.focus();
          if (existingClient.url !== self.location.origin + urlToOpen) {
            existingClient.postMessage({
              type: 'NAVIGATE',
              url: urlToOpen
            });
          }
        } else {
          // Open new window
          return self.clients.openWindow(urlToOpen);
        }
      })
  );
});

// Push notification handler for background notifications
self.addEventListener('push', (event) => {
  console.log('SW Push: Received push notification', event);
  
  if (!event.data) {
    console.log('SW Push: No data in push event');
    return;
  }

  const data = event.data.json();
  console.log('SW Push: Notification data', data);

  const options = {
    body: data.body || 'You have a new notification',
    icon: data.icon || '/favicon.ico',
    badge: '/favicon.ico',
    tag: data.tag || 'background-notification',
    data: data.data || {},
    requireInteraction: data.requireInteraction || false,
    silent: false,
    vibrate: data.vibrate || [200, 100, 200],
    actions: data.actions || []
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'New Notification', options)
  );
});

// Notification close handler
self.addEventListener('notificationclose', (event) => {
  console.log('Notification closed:', event.notification.tag);
  
  // Track notification dismissal if needed
  event.waitUntil(
    self.clients.matchAll().then(clients => {
      clients.forEach(client => {
        client.postMessage({
          type: 'NOTIFICATION_DISMISSED',
          tag: event.notification.tag
        });
      });
    })
  );
});

async function processAction(action) {
  switch (action.type) {
    case 'create':
      const formData = new FormData();
      formData.append('text', action.data.text);
      if (action.data.image) {
        formData.append('image', action.data.image);
      }

      const response = await fetch('/todos/create-with-image', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to create todo');
      }
      break;

    case 'update':
      // Handle update actions
      break;

    case 'delete':
      // Handle delete actions
      break;
  }
}