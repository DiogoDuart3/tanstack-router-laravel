import { LucideIcon } from 'lucide-react';
import type { Config } from 'ziggy-js';

export interface Auth {
    user: User;
}

export interface BreadcrumbItem {
    title: string;
    href: string;
}

export interface NavGroup {
    title: string;
    items: NavItem[];
}

export interface NavItem {
    title: string;
    href: string;
    icon?: LucideIcon | null;
    isActive?: boolean;
}

export interface Todo {
    id: number;
    title: string;
    description?: string;
    completed: boolean;
    user_id: number;
    images?: string[];
    primary_image?: string;
    image_urls?: string[];
    primary_image_url?: string;
    created_at: string;
    updated_at: string;
}

export interface TodoWithPending extends Omit<Todo, 'user_id'> {
    user_id?: number;
    isPending?: boolean;
}

export interface SharedData {
    name: string;
    quote: { message: string; author: string };
    auth: Auth;
    ziggy: Config & { location: string };
    sidebarOpen: boolean;
    [key: string]: unknown;
}

export interface User {
    id: number;
    name: string;
    email: string;
    avatar?: string;
    email_verified_at: string | null;
    created_at: string;
    updated_at: string;
    [key: string]: unknown; // This allows for additional properties...
}

// API Response Types
export interface AuthResponse {
    user: User;
    token: string;
}

export interface TodosResponse {
    todos: Todo[];
}

export interface TodoResponse {
    todo: Todo;
}

export interface MessageResponse {
    message: string;
}

export interface ChatMessage {
    id: number;
    message: string;
    display_name: string;
    sent_at: string;
    is_own: boolean;
}

export interface ChatMessagesResponse {
    messages: ChatMessage[];
    has_more: boolean;
}

export interface ChatRecentResponse {
    messages: ChatMessage[];
}

export interface ChatMessageResponse {
    message: ChatMessage;
}

export interface TypingResponse {
    status: string;
}

export interface DashboardResponse {
    user: User;
    stats: {
        total_todos: number;
        completed_todos: number;
        pending_todos: number;
    };
    recent_activity: Array<{
        id: number;
        type: string;
        description: string;
        created_at: string;
    }>;
}

export interface RecentActivityItem {
    id: number;
    type: string;
    description: string;
    created_at: string;
}

export interface HealthResponse {
    status: string;
    timestamp: string;
    request_time_ms: number;
}

// Event Types
export interface MessageSentEvent {
    message: ChatMessage;
}

export interface UserTypingEvent {
    user: {
        display_name: string;
    };
    is_typing: boolean;
}

export interface AdminMessageSentEvent {
    message: ChatMessage;
}

export interface AdminUserTypingEvent {
    user: {
        display_name: string;
    };
    is_typing: boolean;
}

// Offline Queue Types
export interface QueuedTodo {
    id: string;
    data: {
        title: string;
        description?: string;
        images?: File[];
    };
    timestamp: number;
    retryCount: number;
}

export interface QueuedUpdate {
    id: string;
    todoId: string;
    data: {
        title: string;
        description?: string;
        completed?: boolean;
        images?: File[];
        remove_images?: string[];
    };
    timestamp: number;
    retryCount: number;
}

// Window augmentation for Pusher
declare global {
    interface Window {
        Pusher: typeof import('pusher-js');
    }
}
