"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import api from '@/lib/api';
import { toast } from 'sonner';

interface AuthContextType {
    token: string | null;
    isAuthenticated: boolean;
    login: (token: string) => void;
    logout: () => void;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        const storedToken = localStorage.getItem('token');
        if (storedToken) {
            setToken(storedToken);
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
        toast.success('Login realizado com sucesso!');
        router.push('/dashboard');
    };

    const logout = () => {
        localStorage.removeItem('token');
        setToken(null);
        toast.info('Você saiu do sistema.');
        router.push('/login');
    };

    return (
        <AuthContext.Provider value={{ token, isAuthenticated: !!token, login, logout, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
