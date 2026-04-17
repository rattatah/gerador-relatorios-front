"use client";

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, LogOut } from 'lucide-react';
import { ReportDialog } from '@/components/ReportDialog';

export default function DashboardPage() {
    const { logout, userName } = useAuth();
    const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);

    const solutions = [
        {
            id: 'report-generator',
            title: 'Gerador de Relatórios',
            description: 'Selecione e gere relatórios de Moradores ou Acesso Controle RF',
            icon: FileText,
            gradient: 'from-orange-500 to-orange-600',
            onClick: () => setIsReportDialogOpen(true),
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
                    <h2 className="text-3xl font-bold mb-2">Bem-vindo, {userName}!</h2>
                    <p className="text-muted-foreground">
                        Selecione uma solução abaixo para começar
                    </p>
                </div>

                {/* Solutions Grid */}
                <div className="flex justify-center md:justify-start">
                    {solutions.map((solution, index) => (
                        <Card
                            key={solution.id}
                            className="group cursor-pointer transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 border-t-4 hover:border-t-8 animate-in fade-in slide-in-from-bottom-8 max-w-md w-full"
                            style={{
                                animationDelay: `${index * 100}ms`,
                            }}
                            onClick={solution.onClick}
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
                                    variant="default"
                                    className="w-full bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800"
                                >
                                    Acessar
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
