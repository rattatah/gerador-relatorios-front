"use client";

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, LogOut, Plus } from 'lucide-react';
import { ReportDialog } from '@/components/ReportDialog';

export default function DashboardPage() {
    const { logout } = useAuth();
    const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);

    const solutions = [
        {
            id: 'condominio-report',
            title: 'Relatório de Condomínio',
            description: 'Gere relatórios detalhados de moradores por condomínio',
            icon: FileText,
            gradient: 'from-orange-500 to-orange-600',
            onClick: () => setIsReportDialogOpen(true),
        },
        {
            id: 'future-1',
            title: 'Nova Solução',
            description: 'Em breve - Novas funcionalidades',
            icon: Plus,
            gradient: 'from-orange-400 to-orange-500',
            onClick: () => { },
            disabled: true,
        },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-orange-50 to-white dark:from-gray-950 dark:via-orange-950 dark:to-black">
            {/* Header */}
            <header className="border-b bg-white/80 backdrop-blur-md dark:bg-gray-900/80 sticky top-0 z-10">
                <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent">
                            APPIS Dashboard
                        </h1>
                        <p className="text-sm text-muted-foreground">Gerador de Relatórios</p>
                    </div>
                    <Button
                        variant="outline"
                        onClick={logout}
                        className="gap-2 hover:bg-red-50 hover:text-red-600 hover:border-red-300 dark:hover:bg-red-950"
                    >
                        <LogOut className="h-4 w-4" />
                        Sair
                    </Button>
                </div>
            </header>

            {/* Main Content */}
            <main className="container mx-auto px-4 py-8">
                <div className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <h2 className="text-3xl font-bold mb-2">Bem-vindo!</h2>
                    <p className="text-muted-foreground">
                        Selecione uma solução abaixo para começar
                    </p>
                </div>

                {/* Solutions Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {solutions.map((solution, index) => (
                        <Card
                            key={solution.id}
                            className={`group cursor-pointer transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 border-t-4 animate-in fade-in slide-in-from-bottom-8 ${solution.disabled
                                ? 'opacity-60 cursor-not-allowed'
                                : 'hover:border-t-8'
                                }`}
                            style={{
                                animationDelay: `${index * 100}ms`,
                                borderTopColor: solution.disabled ? '#ccc' : undefined,
                            }}
                            onClick={solution.disabled ? undefined : solution.onClick}
                        >
                            <CardHeader>
                                <div
                                    className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${solution.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg`}
                                >
                                    <solution.icon className="h-8 w-8 text-white" />
                                </div>
                                <CardTitle className="text-xl">{solution.title}</CardTitle>
                                <CardDescription className="text-base">
                                    {solution.description}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Button
                                    variant={solution.disabled ? 'outline' : 'default'}
                                    className={`w-full ${!solution.disabled &&
                                        'bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800'
                                        }`}
                                    disabled={solution.disabled}
                                >
                                    {solution.disabled ? 'Em Breve' : 'Acessar'}
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </main>

            {/* Report Dialog */}
            <ReportDialog
                open={isReportDialogOpen}
                onOpenChange={setIsReportDialogOpen}
            />
        </div>
    );
}
