"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Loader2, Lock, Mail } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { toast } from 'sonner';

const loginSchema = z.object({
    email: z.string().email('Digite um e-mail válido'),
    password: z.string().min(6, 'A senha deve ter no mínimo 6 caracteres'),
});

type LoginFormInputs = z.infer<typeof loginSchema>;

export default function LoginPage() {
    const { login } = useAuth();
    const [isLoading, setIsLoading] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginFormInputs>({
        resolver: zodResolver(loginSchema),
    });

    const onSubmit = async (data: LoginFormInputs) => {
        setIsLoading(true);
        try {
            const response = await api.post('/auth/signin', data);
            const { accessToken } = response.data;
            login(accessToken);
        } catch (error) {
            console.error(error);
            let message = 'Erro ao realizar login. Verifique suas credenciais.';
            import('axios').then(axios => {
                if (axios.default.isAxiosError(error) && error.response?.data?.message) {
                    message = error.response.data.message;
                }
                toast.error(message);
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
            <div className="w-full max-w-md animate-in fade-in zoom-in duration-500">
                <Card className="shadow-xl border-t-4 border-t-primary">
                    <CardHeader className="space-y-1 text-center">
                        <CardTitle className="text-2xl font-bold tracking-tight">Acesso ao Sistema</CardTitle>
                        <CardDescription>
                            Digite seu e-mail e senha para entrar
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">E-mail</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="seu@email.com"
                                        className="pl-10"
                                        {...register('email')}
                                    />
                                </div>
                                {errors.email && (
                                    <p className="text-sm text-destructive">{errors.email.message}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password">Senha</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="password"
                                        type="password"
                                        placeholder="******"
                                        className="pl-10"
                                        {...register('password')}
                                    />
                                </div>
                                {errors.password && (
                                    <p className="text-sm text-destructive">{errors.password.message}</p>
                                )}
                            </div>
                            <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Entrando...
                                    </>
                                ) : (
                                    'Entrar'
                                )}
                            </Button>
                        </form>
                    </CardContent>
                    <CardFooter className="flex justify-center">
                        <p className="text-xs text-muted-foreground">
                            APPIS &copy; {new Date().getFullYear()}
                        </p>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}
