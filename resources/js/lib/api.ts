import { QueryClient } from '@tanstack/react-query';

const API_BASE_URL = '/api';

// Create a centralized fetch function with auth handling
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('auth_token');
  
  const config: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  };

  // Add CSRF token for state-changing operations
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(options.method || 'GET')) {
    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
    if (csrfToken) {
      (config.headers as Record<string, string>)['X-CSRF-TOKEN'] = csrfToken;
    }
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
      throw new Error('Unauthorized');
    }
    
    const errorData = await response.json().catch(() => ({ message: 'An error occurred' }));
    throw new Error(errorData.message || `HTTP ${response.status}`);
  }

  return response.json();
}

// Auth API
export const authApi = {
  register: (data: { name: string; email: string; password: string; password_confirmation: string }) =>
    apiRequest<{ user: any; token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  login: (data: { email: string; password: string }) =>
    apiRequest<{ user: any; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  logout: () =>
    apiRequest<{ message: string }>('/auth/logout', {
      method: 'POST',
    }),

  getUser: () =>
    apiRequest<{ user: any }>('/auth/user'),
};

// Todos API
export const todosApi = {
  getAll: () =>
    apiRequest<{ todos: any[] }>('/todos'),

  create: (data: { title: string; description?: string; completed?: boolean }) =>
    apiRequest<{ todo: any }>('/todos', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: { title: string; description?: string; completed?: boolean }) =>
    apiRequest<{ todo: any }>(`/todos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    apiRequest<{ message: string }>(`/todos/${id}`, {
      method: 'DELETE',
    }),

  sync: (todos: any[]) =>
    apiRequest<{ synced_todos: any[]; all_todos: any[] }>('/todos/sync', {
      method: 'POST',
      body: JSON.stringify({ todos }),
    }),
};

// Dashboard API
export const dashboardApi = {
  getData: () =>
    apiRequest<{ user: any; stats: any; recent_activity: any[] }>('/dashboard'),
};

// Profile API
export const profileApi = {
  get: () =>
    apiRequest<{ user: any }>('/profile'),

  update: (data: { name: string; email: string; password?: string; password_confirmation?: string }) =>
    apiRequest<{ user: any }>('/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
};

// Health check
export const healthApi = {
  check: () =>
    apiRequest<{ status: string; timestamp: string }>('/health'),
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: (failureCount, error) => {
        // Don't retry on 401 errors
        if (error instanceof Error && error.message === 'Unauthorized') {
          return false;
        }
        return failureCount < 2;
      },
    },
  },
});