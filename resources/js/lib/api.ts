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

// Form data request function for file uploads
async function apiRequestFormData<T>(
  endpoint: string,
  data: Record<string, any>
): Promise<T> {
  const token = localStorage.getItem('auth_token');
  
  const formData = new FormData();
  
  // Add regular form fields
  Object.keys(data).forEach(key => {
    if (key === 'images') {
      // Handle multiple images
      if (Array.isArray(data[key])) {
        data[key].forEach((file: File) => {
          formData.append('images[]', file);
        });
      }
    } else if (key === 'remove_images') {
      // Handle image removal
      if (Array.isArray(data[key])) {
        data[key].forEach((imagePath: string) => {
          formData.append('remove_images[]', imagePath);
        });
      }
    } else if (data[key] !== undefined && data[key] !== null) {
      // Handle boolean values properly
      if (typeof data[key] === 'boolean') {
        formData.append(key, data[key] ? '1' : '0');
      } else {
        formData.append(key, data[key].toString());
      }
    }
  });

  const config: RequestInit = {
    method: data.method || 'POST',
    headers: {
      'Accept': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: formData,
  };

  // Add CSRF token for state-changing operations
  const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
  if (csrfToken) {
    (config.headers as Record<string, string>)['X-CSRF-TOKEN'] = csrfToken;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem('auth_token');
      window.location.href = '/auth/login';
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

  create: (data: { title: string; description?: string; completed?: boolean; images?: File[] }) => {
    if (data.images && data.images.length > 0) {
      return apiRequestFormData<{ todo: any }>('/todos', {
        method: 'POST',
        title: data.title,
        description: data.description || '',
        completed: data.completed || false,
        images: data.images,
      });
    } else {
      return apiRequest<{ todo: any }>('/todos', {
        method: 'POST',
        body: JSON.stringify({
          title: data.title,
          description: data.description,
          completed: data.completed,
        }),
      });
    }
  },

  update: (id: string, data: { title: string; description?: string; completed?: boolean; images?: File[]; remove_images?: string[] }) => {
    if ((data.images && data.images.length > 0) || (data.remove_images && data.remove_images.length > 0)) {
      return apiRequestFormData<{ todo: any }>(`/todos/${id}`, {
        method: 'PUT',
        title: data.title,
        description: data.description || '',
        completed: data.completed || false,
        images: data.images || [],
        remove_images: data.remove_images || [],
      });
    } else {
      return apiRequest<{ todo: any }>(`/todos/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          title: data.title,
          description: data.description,
          completed: data.completed,
        }),
      });
    }
  },

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

// Chat API
export const chatApi = {
  getMessages: (params?: { limit?: number; before_id?: number }) =>
    apiRequest<{ messages: any[]; has_more: boolean }>('/chat' + (params ? '?' + new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)])).toString() : '')),

  getRecent: () =>
    apiRequest<{ messages: any[] }>('/chat/recent'),

  sendMessage: (data: { message: string; username?: string }) =>
    apiRequest<{ message: any }>('/chat', {
      method: 'POST',
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