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
  // Don't cache the version endpoint - always fetch fresh
  if (event.request.url.includes('/api/version')) {
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