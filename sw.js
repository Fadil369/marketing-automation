/**
 * BrainSAIT Service Worker
 * Provides offline functionality, caching, and background sync
 */

const CACHE_NAME = 'brainsait-v2.0.0';
const API_CACHE_NAME = 'brainsait-api-v2.0.0';
const STATIC_CACHE_NAME = 'brainsait-static-v2.0.0';

// Resources to cache immediately
const STATIC_RESOURCES = [
  '/',
  '/index-new.html',
  '/manifest.json',
  '/src/core/Application.js',
  '/src/core/EventBus.js',
  '/src/core/Router.js',
  '/src/core/StateManager.js',
  '/src/assets/styles/design-system.css',
  '/src/components/ui/UIComponents.js',
  // Add other critical resources
];

// API endpoints to cache
const API_ENDPOINTS = [
  '/api/health',
  '/api/config',
  '/api/user/profile'
];

// Network-first resources (always try network first)
const NETWORK_FIRST = [
  '/api/ai/',
  '/api/analytics/',
  '/api/platforms/',
  '/ws'
];

// Cache-first resources (try cache first, fallback to network)
const CACHE_FIRST = [
  '/src/',
  '/assets/',
  '/icons/',
  '/screenshots/'
];

/**
 * Install Event - Cache static resources
 */
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker installing...');
  
  event.waitUntil(
    Promise.all([
      // Cache static resources
      caches.open(STATIC_CACHE_NAME).then((cache) => {
        console.log('📦 Caching static resources');
        return cache.addAll(STATIC_RESOURCES);
      }),
      
      // Skip waiting to activate immediately
      self.skipWaiting()
    ])
  );
});

/**
 * Activate Event - Clean up old caches
 */
self.addEventListener('activate', (event) => {
  console.log('✅ Service Worker activating...');
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (!cacheName.includes('v2.0.0')) {
              console.log('🗑️ Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      
      // Claim all clients
      self.clients.claim()
    ])
  );
});

/**
 * Fetch Event - Handle all network requests
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests and chrome-extension requests
  if (request.method !== 'GET' || url.protocol !== 'https:' && url.protocol !== 'http:') {
    return;
  }
  
  // Handle different types of requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleAPIRequest(request));
  } else if (isStaticResource(url.pathname)) {
    event.respondWith(handleStaticRequest(request));
  } else if (isNetworkFirst(url.pathname)) {
    event.respondWith(handleNetworkFirst(request));
  } else {
    event.respondWith(handleCacheFirst(request));
  }
});

/**
 * Handle API requests with network-first strategy
 */
async function handleAPIRequest(request) {
  const url = new URL(request.url);
  
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(API_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
    
  } catch (error) {
    console.log('📡 Network failed, trying cache for:', url.pathname);
    
    // Fallback to cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline response for specific endpoints
    return createOfflineResponse(url.pathname);
  }
}

/**
 * Handle static resources with cache-first strategy
 */
async function handleStaticRequest(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
    
  } catch (error) {
    console.log('📦 Failed to fetch static resource:', request.url);
    return new Response('Resource not available offline', { status: 503 });
  }
}

/**
 * Handle network-first requests
 */
async function handleNetworkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    return networkResponse;
    
  } catch (error) {
    const cachedResponse = await caches.match(request);
    return cachedResponse || new Response('Offline', { status: 503 });
  }
}

/**
 * Handle cache-first requests
 */
async function handleCacheFirst(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    // Update cache in background
    fetch(request).then(response => {
      if (response.ok) {
        const cache = caches.open(CACHE_NAME);
        cache.then(c => c.put(request, response));
      }
    }).catch(() => {
      // Ignore network errors for background updates
    });
    
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
    
  } catch (error) {
    return new Response('Content not available offline', { status: 503 });
  }
}

/**
 * Check if resource is static
 */
function isStaticResource(pathname) {
  return CACHE_FIRST.some(pattern => pathname.startsWith(pattern)) ||
         pathname.endsWith('.js') ||
         pathname.endsWith('.css') ||
         pathname.endsWith('.png') ||
         pathname.endsWith('.jpg') ||
         pathname.endsWith('.jpeg') ||
         pathname.endsWith('.svg') ||
         pathname.endsWith('.woff2');
}

/**
 * Check if resource should use network-first strategy
 */
function isNetworkFirst(pathname) {
  return NETWORK_FIRST.some(pattern => pathname.startsWith(pattern));
}

/**
 * Create offline response for specific endpoints
 */
function createOfflineResponse(pathname) {
  const offlineData = {
    '/api/health': {
      status: 'offline',
      message: 'Service Worker active, but network unavailable',
      timestamp: new Date().toISOString()
    },
    '/api/config': {
      app: {
        name: 'BrainSAIT Marketing Platform',
        version: '2.0.0',
        mode: 'offline'
      }
    },
    '/api/user/profile': {
      error: 'Profile data not available offline',
      code: 'OFFLINE_MODE'
    }
  };
  
  const data = offlineData[pathname] || {
    error: 'Data not available offline',
    code: 'OFFLINE_MODE'
  };
  
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'X-Served-By': 'ServiceWorker'
    }
  });
}

/**
 * Background Sync Event
 */
self.addEventListener('sync', (event) => {
  console.log('🔄 Background sync triggered:', event.tag);
  
  if (event.tag === 'ai-content-sync') {
    event.waitUntil(syncAIContent());
  } else if (event.tag === 'analytics-sync') {
    event.waitUntil(syncAnalytics());
  } else if (event.tag === 'platform-data-sync') {
    event.waitUntil(syncPlatformData());
  }
});

/**
 * Sync AI content when back online
 */
async function syncAIContent() {
  try {
    // Get pending AI generation requests from IndexedDB
    const pendingRequests = await getPendingAIRequests();
    
    for (const request of pendingRequests) {
      try {
        const response = await fetch('/api/ai/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(request.data)
        });
        
        if (response.ok) {
          await removePendingRequest(request.id);
          
          // Notify clients of success
          self.clients.matchAll().then(clients => {
            clients.forEach(client => {
              client.postMessage({
                type: 'ai-content-synced',
                data: { requestId: request.id, success: true }
              });
            });
          });
        }
      } catch (error) {
        console.log('Failed to sync AI request:', request.id, error);
      }
    }
  } catch (error) {
    console.log('Background sync failed:', error);
  }
}

/**
 * Sync analytics data
 */
async function syncAnalytics() {
  try {
    const pendingEvents = await getPendingAnalyticsEvents();
    
    if (pendingEvents.length > 0) {
      const response = await fetch('/api/analytics/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events: pendingEvents })
      });
      
      if (response.ok) {
        await clearPendingAnalyticsEvents();
      }
    }
  } catch (error) {
    console.log('Analytics sync failed:', error);
  }
}

/**
 * Sync platform data
 */
async function syncPlatformData() {
  try {
    // Sync scheduled posts
    const scheduledPosts = await getPendingScheduledPosts();
    
    for (const post of scheduledPosts) {
      try {
        const response = await fetch('/api/platforms/schedule', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(post)
        });
        
        if (response.ok) {
          await removeScheduledPost(post.id);
        }
      } catch (error) {
        console.log('Failed to sync scheduled post:', post.id, error);
      }
    }
  } catch (error) {
    console.log('Platform data sync failed:', error);
  }
}

/**
 * Push Event - Handle push notifications
 */
self.addEventListener('push', (event) => {
  if (!event.data) return;
  
  const data = event.data.json();
  console.log('📨 Push notification received:', data);
  
  const options = {
    body: data.body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    image: data.image,
    data: data.data,
    actions: data.actions || [
      {
        action: 'view',
        title: 'View',
        icon: '/icons/action-view.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
        icon: '/icons/action-dismiss.png'
      }
    ],
    tag: data.tag || 'brainsait-notification',
    renotify: true,
    silent: false,
    vibrate: [200, 100, 200]
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

/**
 * Notification Click Event
 */
self.addEventListener('notificationclick', (event) => {
  console.log('📱 Notification clicked:', event.notification.tag);
  
  event.notification.close();
  
  if (event.action === 'dismiss') {
    return;
  }
  
  const data = event.notification.data || {};
  let url = data.url || '/';
  
  if (event.action === 'view' && data.viewUrl) {
    url = data.viewUrl;
  }
  
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      // Check if there's already a window open
      for (const client of clientList) {
        if (client.url === url && 'focus' in client) {
          return client.focus();
        }
      }
      
      // Open new window
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

/**
 * Message Event - Handle messages from clients
 */
self.addEventListener('message', (event) => {
  console.log('📬 Message received:', event.data);
  
  const { type, data } = event.data;
  
  switch (type) {
    case 'cache-ai-request':
      cacheAIRequest(data);
      break;
    case 'cache-analytics-event':
      cacheAnalyticsEvent(data);
      break;
    case 'cache-scheduled-post':
      cacheScheduledPost(data);
      break;
    case 'get-cache-status':
      getCacheStatus().then(status => {
        event.ports[0].postMessage(status);
      });
      break;
  }
});

/**
 * IndexedDB helpers for offline storage
 */
async function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('brainsait-offline', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      // AI requests store
      if (!db.objectStoreNames.contains('ai-requests')) {
        db.createObjectStore('ai-requests', { keyPath: 'id' });
      }
      
      // Analytics events store
      if (!db.objectStoreNames.contains('analytics-events')) {
        db.createObjectStore('analytics-events', { keyPath: 'id' });
      }
      
      // Scheduled posts store
      if (!db.objectStoreNames.contains('scheduled-posts')) {
        db.createObjectStore('scheduled-posts', { keyPath: 'id' });
      }
    };
  });
}

async function cacheAIRequest(data) {
  const db = await openDB();
  const tx = db.transaction(['ai-requests'], 'readwrite');
  await tx.objectStore('ai-requests').add({
    id: Date.now(),
    data,
    timestamp: new Date().toISOString()
  });
}

async function getPendingAIRequests() {
  const db = await openDB();
  const tx = db.transaction(['ai-requests'], 'readonly');
  return await tx.objectStore('ai-requests').getAll();
}

async function removePendingRequest(id) {
  const db = await openDB();
  const tx = db.transaction(['ai-requests'], 'readwrite');
  await tx.objectStore('ai-requests').delete(id);
}

async function cacheAnalyticsEvent(data) {
  const db = await openDB();
  const tx = db.transaction(['analytics-events'], 'readwrite');
  await tx.objectStore('analytics-events').add({
    id: Date.now(),
    ...data,
    timestamp: new Date().toISOString()
  });
}

async function getPendingAnalyticsEvents() {
  const db = await openDB();
  const tx = db.transaction(['analytics-events'], 'readonly');
  return await tx.objectStore('analytics-events').getAll();
}

async function clearPendingAnalyticsEvents() {
  const db = await openDB();
  const tx = db.transaction(['analytics-events'], 'readwrite');
  await tx.objectStore('analytics-events').clear();
}

async function cacheScheduledPost(data) {
  const db = await openDB();
  const tx = db.transaction(['scheduled-posts'], 'readwrite');
  await tx.objectStore('scheduled-posts').add({
    id: Date.now(),
    ...data,
    timestamp: new Date().toISOString()
  });
}

async function getPendingScheduledPosts() {
  const db = await openDB();
  const tx = db.transaction(['scheduled-posts'], 'readonly');
  return await tx.objectStore('scheduled-posts').getAll();
}

async function removeScheduledPost(id) {
  const db = await openDB();
  const tx = db.transaction(['scheduled-posts'], 'readwrite');
  await tx.objectStore('scheduled-posts').delete(id);
}

async function getCacheStatus() {
  const cacheNames = await caches.keys();
  const status = {};
  
  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    status[cacheName] = keys.length;
  }
  
  return status;
}

console.log('🚀 BrainSAIT Service Worker loaded and ready!');