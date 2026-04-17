"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import api from '@/lib/api';
import { toast } from 'sonner';

interface AuthContextType {
    token: string | null;
    userName: string | null;
    isAuthenticated: boolean;
    login: (token: string) => void;
    logout: () => void;
    isLoading: boolean;
}

function parseJwt(token: string) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    } catch (e) {
        return null;
    }
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [token, setToken] = useState<string | null>(null);
    const [userName, setUserName] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        const storedToken = localStorage.getItem('token');
        if (storedToken) {
            const decoded = parseJwt(storedToken);

            // Check if token is expired
            if (decoded && decoded.exp) {
                const currentTime = Date.now() / 1000;
                if (decoded.exp < currentTime) {
                    localStorage.removeItem('token');
                    setIsLoading(false);
                    return; // Will be redirected by the other useEffect
                }
            }

            setToken(storedToken);
            setUserName(decoded?.name || decoded?.email || 'Usuário Logado');
        }
        setIsLoading(false);
    }, []);

    useEffect(() => {
        // Protect routes
        if (!isLoading) {
            const isPublicRoute = pathname === '/login';
            if (!token && !isPublicRoute) {
                router.push('/login');
            } else if (token && isPublicRoute) {
                router.push('/dashboard');
            }
        }
    }, [token, isLoading, pathname, router]);


    const login = (newToken: string) => {
        localStorage.setItem('token', newToken);
        setToken(newToken);
        const decoded = parseJwt(newToken);
        setUserName(decoded?.name || decoded?.email || 'Usuário Logado');
        toast.success('Login realizado com sucesso!');
        router.push('/dashboard');
    };

    const logout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setUserName(null);
        toast.info('Você saiu do sistema.');
        router.push('/login');
    };

    return (
        <AuthContext.Provider value={{ token, userName, isAuthenticated: !!token, login, logout, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
