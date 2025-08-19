/**
 * Test Setup - Global test configuration and mocks
 * 
 * @author BrainSAIT Team
 */

import { vi, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';

// Global test environment setup
beforeAll(() => {
  // Mock console methods in tests
  global.console = {
    ...console,
    log: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    debug: vi.fn()
  };

  // Mock window.matchMedia
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn()
    }))
  });

  // Mock IntersectionObserver
  global.IntersectionObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
    root: null,
    rootMargin: '',
    thresholds: []
  }));

  // Mock ResizeObserver
  global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn()
  }));

  // Mock PerformanceObserver
  global.PerformanceObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn()
  }));

  // Mock localStorage
  const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn()
  };
  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock
  });

  // Mock sessionStorage
  const sessionStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn()
  };
  Object.defineProperty(window, 'sessionStorage', {
    value: sessionStorageMock
  });

  // Mock fetch
  global.fetch = vi.fn();

  // Mock WebSocket
  global.WebSocket = vi.fn().mockImplementation(() => ({
    send: vi.fn(),
    close: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    readyState: WebSocket.CONNECTING,
    url: '',
    protocol: ''
  }));
  
  // WebSocket constants
  global.WebSocket.CONNECTING = 0;
  global.WebSocket.OPEN = 1;
  global.WebSocket.CLOSING = 2;
  global.WebSocket.CLOSED = 3;

  // Mock requestAnimationFrame
  global.requestAnimationFrame = vi.fn().mockImplementation(cb => {
    return setTimeout(cb, 16);
  });
  global.cancelAnimationFrame = vi.fn().mockImplementation(id => {
    clearTimeout(id);
  });

  // Mock crypto
  Object.defineProperty(window, 'crypto', {
    value: {
      getRandomValues: vi.fn().mockImplementation(arr => {
        for (let i = 0; i < arr.length; i++) {
          arr[i] = Math.floor(Math.random() * 256);
        }
        return arr;
      }),
      subtle: {
        digest: vi.fn(),
        encrypt: vi.fn(),
        decrypt: vi.fn(),
        sign: vi.fn(),
        verify: vi.fn()
      }
    }
  });

  // Mock URL
  global.URL.createObjectURL = vi.fn(() => 'mock-object-url');
  global.URL.revokeObjectURL = vi.fn();

  // Mock Canvas API
  HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({
    fillRect: vi.fn(),
    clearRect: vi.fn(),
    getImageData: vi.fn(() => ({ data: new Array(4) })),
    putImageData: vi.fn(),
    createImageData: vi.fn(() => []),
    setTransform: vi.fn(),
    drawImage: vi.fn(),
    save: vi.fn(),
    fillText: vi.fn(),
    restore: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    closePath: vi.fn(),
    stroke: vi.fn(),
    translate: vi.fn(),
    scale: vi.fn(),
    rotate: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    measureText: vi.fn(() => ({ width: 0 })),
    transform: vi.fn(),
    rect: vi.fn(),
    clip: vi.fn()
  });

  // Mock File API
  global.File = vi.fn().mockImplementation((parts, name, options) => ({
    name,
    size: 0,
    type: options?.type || '',
    lastModified: Date.now(),
    slice: vi.fn()
  }));

  global.FileReader = vi.fn().mockImplementation(() => ({
    readAsText: vi.fn(),
    readAsDataURL: vi.fn(),
    readAsArrayBuffer: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    result: null,
    error: null,
    readyState: 0
  }));

  // Mock Blob
  global.Blob = vi.fn().mockImplementation((parts, options) => ({
    size: 0,
    type: options?.type || '',
    slice: vi.fn()
  }));
});

afterAll(() => {
  // Clean up global mocks
  vi.restoreAllMocks();
});

beforeEach(() => {
  // Reset mocks before each test
  vi.clearAllMocks();
  
  // Reset localStorage mock
  localStorage.clear.mockClear();
  localStorage.getItem.mockClear();
  localStorage.setItem.mockClear();
  localStorage.removeItem.mockClear();

  // Reset sessionStorage mock
  sessionStorage.clear.mockClear();
  sessionStorage.getItem.mockClear();
  sessionStorage.setItem.mockClear();
  sessionStorage.removeItem.mockClear();

  // Reset fetch mock
  fetch.mockClear();
  fetch.mockResolvedValue({
    ok: true,
    status: 200,
    statusText: 'OK',
    json: vi.fn().mockResolvedValue({}),
    text: vi.fn().mockResolvedValue(''),
    blob: vi.fn().mockResolvedValue(new Blob()),
    headers: new Map(),
    url: ''
  });
});

afterEach(() => {
  // Clean up after each test
  document.body.innerHTML = '';
  document.head.innerHTML = '<meta charset="utf-8">';
  
  // Clear any timers
  vi.clearAllTimers();
});

// Test utilities
export const createMockEvent = (type, properties = {}) => {
  const event = new Event(type);
  Object.assign(event, properties);
  return event;
};

export const createMockElement = (tagName, attributes = {}) => {
  const element = document.createElement(tagName);
  Object.entries(attributes).forEach(([key, value]) => {
    element.setAttribute(key, value);
  });
  return element;
};

export const waitFor = (condition, timeout = 1000) => {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const check = () => {
      if (condition()) {
        resolve();
      } else if (Date.now() - startTime > timeout) {
        reject(new Error('Timeout waiting for condition'));
      } else {
        setTimeout(check, 10);
      }
    };
    check();
  });
};

export const mockApiResponse = (data, status = 200, statusText = 'OK') => {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText,
    json: vi.fn().mockResolvedValue(data),
    text: vi.fn().mockResolvedValue(JSON.stringify(data)),
    headers: new Map([['content-type', 'application/json']]),
    url: 'https://api.brainsait.io/test'
  };
};

export const mockServiceWorker = () => {
  Object.defineProperty(navigator, 'serviceWorker', {
    value: {
      register: vi.fn().mockResolvedValue({
        installing: null,
        waiting: null,
        active: null,
        scope: 'https://brainsait.io/',
        update: vi.fn(),
        unregister: vi.fn()
      }),
      ready: Promise.resolve({
        installing: null,
        waiting: null,
        active: null,
        scope: 'https://brainsait.io/'
      }),
      controller: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    }
  });
};

// Mock Chart.js
vi.mock('chart.js', () => ({
  Chart: vi.fn().mockImplementation(() => ({
    destroy: vi.fn(),
    update: vi.fn(),
    resize: vi.fn(),
    toBase64Image: vi.fn(() => 'data:image/png;base64,mock'),
    data: { labels: [], datasets: [] },
    options: {}
  })),
  registerables: []
}));

// Mock BrainSAIT specific APIs
export const mockBrainSAITAPI = () => {
  return {
    campaigns: {
      list: vi.fn().mockResolvedValue({ data: [], pagination: {} }),
      get: vi.fn().mockResolvedValue({ data: {} }),
      create: vi.fn().mockResolvedValue({ data: {} }),
      update: vi.fn().mockResolvedValue({ data: {} }),
      delete: vi.fn().mockResolvedValue({ message: 'Deleted' })
    },
    analytics: {
      query: vi.fn().mockResolvedValue({ data: [] }),
      metrics: vi.fn().mockResolvedValue({ data: {} })
    },
    ai: {
      generate: vi.fn().mockResolvedValue({ text: 'Generated content' }),
      optimize: vi.fn().mockResolvedValue({ optimized: 'Optimized content' })
    },
    platforms: {
      connect: vi.fn().mockResolvedValue({ success: true }),
      post: vi.fn().mockResolvedValue({ postId: 'post123' }),
      metrics: vi.fn().mockResolvedValue({ data: {} })
    }
  };
};

// Export test constants
export const TEST_CONSTANTS = {
  MOCK_USER: {
    id: 'test-user-123',
    email: 'test@brainsait.io',
    name: 'Test User',
    role: 'user',
    preferences: {
      language: 'en',
      theme: 'light'
    }
  },
  MOCK_CAMPAIGN: {
    id: 'test-campaign-123',
    name: 'Test Campaign',
    status: 'active',
    platforms: ['tiktok', 'instagram'],
    metrics: {
      impressions: 1000,
      clicks: 100,
      conversions: 10
    }
  },
  MOCK_API_RESPONSE: {
    success: true,
    data: {},
    message: 'Success',
    timestamp: '2024-01-01T00:00:00Z'
  }
};

console.log('🧪 Test environment initialized');