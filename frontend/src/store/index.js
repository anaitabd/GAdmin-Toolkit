import { create } from 'zustand';

const safeParseUser = () => {
    try {
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
        console.error('Failed to parse user data from localStorage:', error);
        localStorage.removeItem('user');
        return null;
    }
};

export const useAuthStore = create((set) => ({
    user: safeParseUser(),
    token: localStorage.getItem('token') || null,
    isAuthenticated: !!localStorage.getItem('token'),
    
    login: (user, token) => {
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('token', token);
        set({ user, token, isAuthenticated: true });
    },
    
    logout: () => {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        set({ user: null, token: null, isAuthenticated: false });
    }
}));

export const useUsersStore = create((set) => ({
    users: [],
    loading: false,
    error: null,
    
    setUsers: (users) => set({ users }),
    setLoading: (loading) => set({ loading }),
    setError: (error) => set({ error })
}));
