"use client";

import { useState } from 'react';
import { DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, ArrowLeft, Check } from 'lucide-react';
import { Condominio } from '@/lib/api';

interface CondominioSelectorProps {
    condominios: Condominio[];
    onSelect: (condominio: Condominio) => void;
    isLoading: boolean;
    onBack: () => void;
}

export function CondominioSelector({ condominios, onSelect, isLoading, onBack }: CondominioSelectorProps) {
    const [selectedId, setSelectedId] = useState<number | null>(null);

    const handleConfirm = () => {
        const selected = condominios.find(c => c.id === selectedId);
        if (selected) {
            onSelect(selected);
        }
    };

    return (
        <>
            <DialogHeader>
                <DialogTitle>Selecione o Condomínio</DialogTitle>
                <DialogDescription>
                    Encontramos {condominios.length} condomínio(s). Selecione o desejado:
                </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4 max-h-[400px] overflow-y-auto">
                {condominios.map((condominio) => (
                    <Card
                        key={condominio.id}
                        className={`cursor-pointer transition-all hover:shadow-md ${selectedId === condominio.id
                            ? 'border-blue-500 border-2 bg-blue-50 dark:bg-blue-950'
                            : 'hover:border-gray-300'
                            }`}
                        onClick={() => setSelectedId(condominio.id)}
                    >
                        <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600">
                                        <Building2 className="h-5 w-5 text-white" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-base">
                                            {condominio.nome} {condominio.userCount !== undefined ? `(${condominio.userCount})` : ''}
                                        </CardTitle>
                                        <CardDescription className="text-sm">
                                            CNPJ: {condominio.cnpj}
                                        </CardDescription>
                                    </div>
                                </div>
                                {selectedId === condominio.id && (
                                    <div className="p-1 rounded-full bg-blue-500">
                                        <Check className="h-4 w-4 text-white" />
                                    </div>
                                )}
                            </div>
                        </CardHeader>
                    </Card>
                ))}
            </div>
            <div className="flex gap-2">
                <Button
                    variant="outline"
                    onClick={onBack}
                    disabled={isLoading}
                    className="flex-1"
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Voltar
                </Button>
                <Button
                    onClick={handleConfirm}
                    disabled={!selectedId || isLoading}
                    className="flex-1 bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800"
                >
                    {isLoading ? 'Gerando...' : 'Gerar Relatório'}
                </Button>
            </div>
        </>
    );
}
