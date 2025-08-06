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
  
  // Handle simulated push test
  if (event.data && event.data.type === 'TEST_PUSH_SIMULATION') {
    console.log('🧪 SW: Simulating push notification', event.data.data);
    const { title, body, tag } = event.data.data;
    
    self.registration.showNotification(title, {
      body: body,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: tag,
      requireInteraction: false,
      silent: false,
      vibrate: [200, 100, 200],
    }).then(() => {
      console.log('✅ SW: Simulated push notification shown');
    }).catch((error) => {
      console.error('❌ SW: Simulated push notification failed:', error);
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

console.log('🚀 Service Worker: Push event listener registered');

// Push notification handler for background notifications
self.addEventListener('push', (event) => {
  console.log('🔔 SW Push: PUSH EVENT RECEIVED!', event);
  console.log('🔔 SW Push: Event data exists:', !!event.data);
  console.log('🔔 SW Push: Event type:', event.type);
  console.log('🔔 SW Push: Timestamp:', new Date().toISOString());
  
  if (!event.data) {
    console.log('❌ SW Push: No data in push event, showing fallback notification');
    event.waitUntil(
      self.registration.showNotification('New Notification', {
        body: 'You have a new notification',
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: 'fallback-notification',
        requireInteraction: false,
        silent: false,
        vibrate: [200, 100, 200]
      })
    );
    return;
  }

  let data;
  try {
    data = event.data.json();
    console.log('✅ SW Push: Parsed notification data:', data);
  } catch (error) {
    console.error('❌ SW Push: Failed to parse push data:', error);
    console.log('Raw push data:', event.data.text());
    event.waitUntil(
      self.registration.showNotification('New Notification', {
        body: 'You have a new notification (parse error)',
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: 'parse-error-notification',
        requireInteraction: false,
        silent: false,
        vibrate: [200, 100, 200]
      })
    );
    return;
  }

  // Create simplified options object to avoid conflicts
  const options = {
    body: data.body || 'You have a new notification',
    icon: data.icon || '/favicon.ico',
    badge: '/favicon.ico',
    tag: data.tag || 'background-notification',
    requireInteraction: false, // Set to false for now to see if this was causing issues
    silent: false
  };

  // Only add vibrate if not silent (to avoid silent:false + vibrate conflict)
  if (!data.silent) {
    options.vibrate = data.vibrate || [200, 100, 200];
  }

  console.log('🚀 SW Push: Showing notification with options:', options);
  console.log('🚀 SW Push: Service worker state:', self.serviceWorker?.state || 'unknown');
  console.log('🚀 SW Push: Registration ready:', !!self.registration);
  
  // Add more specific error handling
  event.waitUntil(
    (async () => {
      try {
        console.log('🔥 SW Push: About to show notification...');
        
        // Show the actual notification
        await self.registration.showNotification(data.title || 'New Notification', options);
        console.log('✅ SW Push: Notification displayed successfully');
        
      } catch (error) {
        console.error('❌ SW Push: Failed to show notification:', error);
        console.error('❌ SW Push: Error details:', {
          name: error.name,
          message: error.message,
          stack: error.stack
        });
        
        // Try a minimal fallback notification
        try {
          console.log('🔄 SW Push: Trying minimal fallback notification...');
          await self.registration.showNotification('Push Test', {
            body: 'Fallback notification - original failed',
            tag: 'fallback-' + Date.now()
          });
          console.log('✅ SW Push: Fallback notification shown');
        } catch (fallbackError) {
          console.error('❌ SW Push: Even fallback notification failed:', fallbackError);
        }
      }
    })()
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