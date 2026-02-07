import React, { createContext, useState, useContext, useEffect } from 'react';
import { toast } from 'react-toastify';
import apiClient from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check if token exists in localStorage
        const token = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (token && storedUser) {
            setUser(JSON.parse(storedUser));
            // Set default header
            apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        }
        setLoading(false);
    }, []);

    const login = async (username, password) => {
        try {
            const response = await apiClient.post('/auth/login', { username, password });
            const { token, user } = response;

            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));
            apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;

            setUser(user);
            toast.success(`Bem-vindo, ${user.username}!`);
            return true;
        } catch (err) {
            console.error(err);
            toast.error('Login falhou. Verifique suas credenciais.');
            return false;
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        delete apiClient.defaults.headers.common['Authorization'];
        setUser(null);
        toast.info('Logout realizado.');
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
