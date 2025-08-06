/**
 * Debug authentication and session information
 */

export class AuthDebugger {
    static logCurrentState() {
        console.group('🔍 Auth Debug Information');
        
        // Current URL info
        console.log('Current URL:', window.location.href);
        console.log('Origin:', window.location.origin);
        console.log('Host:', window.location.host);
        
        // CSRF Token
        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
        console.log('CSRF Token:', csrfToken ? 'Present' : 'Missing');
        
        // Cookies
        console.log('Document cookies:', document.cookie);
        
        // Check session/auth status
        this.checkAuthStatus();
        
        console.groupEnd();
    }
    
    static async checkAuthStatus() {
        try {
            // Check for auth token
            const token = localStorage.getItem('auth_token');
            console.log('Auth token in localStorage:', token ? 'Present' : 'Missing');
            
            const response = await fetch('/api/auth/user', {
                credentials: 'include',
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    ...(token && { Authorization: `Bearer ${token}` }),
                }
            });
            
            console.log('Auth check response status:', response.status);
            
            if (response.ok) {
                const user = await response.json();
                console.log('User authenticated:', user);
            } else {
                console.log('User not authenticated - response status:', response.status);
                if (response.status === 401) {
                    console.log('401 Unauthorized - token may be expired or invalid');
                }
            }
        } catch (error) {
            console.error('Auth check failed:', error);
        }
    }
    
    static async testBroadcastingAuth() {
        console.group('🔍 Testing Broadcasting Auth');
        
        try {
            const token = localStorage.getItem('auth_token');
            console.log('Using auth token for broadcasting:', token ? 'Present' : 'Missing');
            
            const response = await fetch('/broadcasting/auth', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    ...(token && { Authorization: `Bearer ${token}` }),
                },
                body: JSON.stringify({
                    socket_id: 'test.socket.id',
                    channel_name: 'private-notifications'
                })
            });
            
            console.log('Broadcasting auth response status:', response.status);
            console.log('Broadcasting auth response headers:', [...response.headers.entries()]);
            
            if (response.ok) {
                const data = await response.json();
                console.log('Broadcasting auth success:', data);
            } else {
                const errorText = await response.text();
                console.error('Broadcasting auth failed:', errorText);
            }
        } catch (error) {
            console.error('Broadcasting auth request failed:', error);
        }
        
        console.groupEnd();
    }
}

// Make available globally for testing
(window as any).debugAuth = AuthDebugger;