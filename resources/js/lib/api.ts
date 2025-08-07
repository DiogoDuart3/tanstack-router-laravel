import { QueryClient } from '@tanstack/react-query';
import type {
    AuthResponse,
    ChatMessageResponse,
    ChatMessagesResponse,
    ChatRecentResponse,
    DashboardResponse,
    HealthResponse,
    MessageResponse,
    Todo,
    TodoResponse,
    TodosResponse,
    TypingResponse,
    User,
} from '../types';

const API_BASE_URL = '/api';

// Define public routes that should not redirect on 401
const PUBLIC_ROUTES = ['/', '/chat', '/auth/login', '/auth/register', '/health', '/install-pwa'];

// Create a centralized fetch function with auth handling
async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = localStorage.getItem('auth_token');

    const config: RequestInit = {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
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
            // Only redirect if we're not on a public route
            const currentPath = window.location.pathname;
            const isPublicRoute = PUBLIC_ROUTES.includes(currentPath);
            
            if (!isPublicRoute && !currentPath.includes('/auth/login')) {
                window.location.href = '/auth/login';
            }
            throw new Error('Unauthorized');
        }

        const errorData = await response.json().catch(() => ({ message: 'An error occurred' }));
        throw new Error(errorData.message || `HTTP ${response.status}`);
    }

    return response.json();
}

// Form data request function for file uploads
async function apiRequestFormData<T>(endpoint: string, data: Record<string, unknown>): Promise<T> {
    const token = localStorage.getItem('auth_token');

    const formData = new FormData();

    // Add regular form fields
    Object.keys(data).forEach((key) => {
        if (key === 'images') {
            // Handle multiple images
            if (Array.isArray(data[key])) {
                (data[key] as File[]).forEach((file: File) => {
                    formData.append('images[]', file);
                });
            }
        } else if (key === 'remove_images') {
            // Handle image removal
            if (Array.isArray(data[key])) {
                (data[key] as string[]).forEach((imagePath: string) => {
                    formData.append('remove_images[]', imagePath);
                });
            }
        } else if (data[key] !== undefined && data[key] !== null) {
            // Handle boolean values properly
            if (typeof data[key] === 'boolean') {
                formData.append(key, (data[key] as boolean) ? '1' : '0');
            } else {
                formData.append(key, (data[key] as string | number).toString());
            }
        }
    });

    const config: RequestInit = {
        method: (data.method as string) || 'POST',
        headers: {
            Accept: 'application/json',
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
            // Only redirect if we're not on a public route
            const currentPath = window.location.pathname;
            const isPublicRoute = PUBLIC_ROUTES.includes(currentPath);
            
            if (!isPublicRoute && !currentPath.includes('/auth/login')) {
                window.location.href = '/auth/login';
            }
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
        apiRequest<AuthResponse>('/auth/register', {
            method: 'POST',
            body: JSON.stringify(data),
        }),

    login: (data: { email: string; password: string }) =>
        apiRequest<AuthResponse>('/auth/login', {
            method: 'POST',
            body: JSON.stringify(data),
        }),

    logout: () =>
        apiRequest<MessageResponse>('/auth/logout', {
            method: 'POST',
        }),

    getUser: () => apiRequest<{ user: User }>('/auth/user'),
};

// Todos API
export const todosApi = {
    getAll: () => apiRequest<TodosResponse>('/todos'),

    create: (data: { title: string; description?: string; completed?: boolean; images?: File[] }) => {
        if (data.images && data.images.length > 0) {
            return apiRequestFormData<TodoResponse>('/todos', {
                method: 'POST',
                title: data.title,
                description: data.description || '',
                completed: data.completed || false,
                images: data.images,
            });
        } else {
            return apiRequest<TodoResponse>('/todos', {
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
            return apiRequestFormData<TodoResponse>(`/todos/${id}`, {
                method: 'PUT',
                title: data.title,
                description: data.description || '',
                completed: data.completed || false,
                images: data.images || [],
                remove_images: data.remove_images || [],
            });
        } else {
            return apiRequest<TodoResponse>(`/todos/${id}`, {
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
        apiRequest<MessageResponse>(`/todos/${id}`, {
            method: 'DELETE',
        }),

    sync: (todos: Todo[]) =>
        apiRequest<{ synced_todos: Todo[]; all_todos: Todo[] }>('/todos/sync', {
            method: 'POST',
            body: JSON.stringify({ todos }),
        }),
};

// Dashboard API
export const dashboardApi = {
    getData: () => apiRequest<DashboardResponse>('/dashboard'),
};

// Profile API
export const profileApi = {
    get: () => apiRequest<{ user: User }>('/profile'),

    update: (data: { name: string; email: string; password?: string; password_confirmation?: string }) =>
        apiRequest<{ user: User }>('/profile', {
            method: 'PUT',
            body: JSON.stringify(data),
        }),
};

// Chat API
export const chatApi = {
    getMessages: (params?: { limit?: number; before_id?: number }) =>
        apiRequest<ChatMessagesResponse>(
            '/chat' + (params ? '?' + new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)])).toString() : ''),
        ),

    getRecent: () => apiRequest<ChatRecentResponse>('/chat/recent'),

    sendMessage: (data: { message: string; username?: string }) =>
        apiRequest<ChatMessageResponse>('/chat', {
            method: 'POST',
            body: JSON.stringify(data),
        }),

    sendTyping: (data: { is_typing: boolean; username?: string }) =>
        apiRequest<TypingResponse>('/chat/typing', {
            method: 'POST',
            body: JSON.stringify(data),
        }),
};

// Admin Chat API
export const adminChatApi = {
    getMessages: (params?: { limit?: number; before_id?: number }) =>
        apiRequest<ChatMessagesResponse>(
            '/admin/chat' + (params ? '?' + new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)])).toString() : ''),
        ),

    getRecent: () => apiRequest<ChatRecentResponse>('/admin/chat/recent'),

    sendMessage: (data: { message: string }) =>
        apiRequest<ChatMessageResponse>('/admin/chat', {
            method: 'POST',
            body: JSON.stringify(data),
        }),

    sendTyping: (data: { is_typing: boolean }) =>
        apiRequest<TypingResponse>('/admin/chat/typing', {
            method: 'POST',
            body: JSON.stringify(data),
        }),
};

// Health check
export const healthApi = {
    check: () => apiRequest<HealthResponse>('/health'),
};

// Notification API
export const notificationApi = {
    sendDemo: (data?: { title?: string; message?: string; type?: string; icon?: string }) =>
        apiRequest<{
            success: boolean;
            message: string;
            queued_at: string;
            will_send_at: string;
            notification_data: {
                title: string;
                message: string;
                type: string;
                icon: string;
            };
        }>('/notifications/demo', {
            method: 'POST',
            body: JSON.stringify(data || {}),
        }),

    sendImmediate: (data?: { title?: string; message?: string; type?: string; icon?: string }) =>
        apiRequest<{
            success: boolean;
            message: string;
            sent_at: string;
            notification_data: {
                title: string;
                message: string;
                type: string;
                icon: string;
            };
        }>('/notifications/immediate', {
            method: 'POST',
            body: JSON.stringify(data || {}),
        }),

    getNotifications: (limit?: number) =>
        apiRequest<{
            success: boolean;
            notifications: Array<{
                id: string;
                type: string;
                data: any;
                read_at: string | null;
                created_at: string;
            }>;
            count: number;
        }>('/notifications' + (limit ? `?limit=${limit}` : '')),
};

// Push notification API
export const pushApi = {
    getVapidKey: () =>
        apiRequest<{ vapid_public_key: string }>('/push/vapid-key'),

    subscribe: (subscription: { endpoint: string; keys: { p256dh: string; auth: string } }) =>
        apiRequest<{ success: boolean; message: string }>('/push/subscribe', {
            method: 'POST',
            body: JSON.stringify(subscription),
        }),

    unsubscribe: () =>
        apiRequest<{ success: boolean; message: string }>('/push/unsubscribe', {
            method: 'POST',
        }),

    test: () =>
        apiRequest<{
            success: boolean;
            message: string;
            subscription_count: number;
            results: Array<{
                subscription_id: number;
                success: boolean;
                reason: string | null;
            }>;
        }>('/push/test', {
            method: 'POST',
        }),
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
            refetchOnWindowFocus: false,
            refetchOnReconnect: false,
        },
    },
});
