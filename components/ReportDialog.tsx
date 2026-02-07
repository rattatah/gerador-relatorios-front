"use client";

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2, Search, FileText } from 'lucide-react';
import { reportsService, Condominio } from '@/lib/api';
import { toast } from 'sonner';
import { CondominioSelector } from './CondominioSelector';
import { PDFPreview } from './PDFPreview';

interface ReportDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

type DialogStep = 'search' | 'select' | 'preview';

export function ReportDialog({ open, onOpenChange }: ReportDialogProps) {
    const [step, setStep] = useState<DialogStep>('search');
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [condominios, setCondominios] = useState<Condominio[]>([]);
    const [selectedCondominio, setSelectedCondominio] = useState<Condominio | null>(null);
    const [pdfData, setPdfData] = useState<{ blob: Blob; filename: string } | null>(null);

    const handleClose = () => {
        onOpenChange(false);
        // Reset state after dialog closes
        setTimeout(() => {
            setStep('search');
            setSearchTerm('');
            setCondominios([]);
            setSelectedCondominio(null);
            setPdfData(null);
        }, 200);
    };

    const handleSearch = async () => {
        if (!searchTerm.trim()) {
            toast.error('Por favor, digite um nome ou CNPJ');
            return;
        }

        setIsLoading(true);
        try {
            const result = await reportsService.searchAndGenerate(searchTerm);

            if (Array.isArray(result)) {
                // Multiple results - show selection
                if (result.length === 0) {
                    toast.error('Nenhum condomínio encontrado');
                } else {
                    setCondominios(result);
                    setStep('select');
                }
            } else {
                // Single result - show PDF directly
                setPdfData(result);
                setStep('preview');
            }
        } catch (error: any) {
            console.error('Error searching condominio:', error);
            const message = error.response?.data?.message || 'Erro ao buscar condomínio';
            toast.error(message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSelectCondominio = async (condominio: Condominio) => {
        setSelectedCondominio(condominio);
        setIsLoading(true);
        try {
            const result = await reportsService.generateReport(condominio.id);

            // Update filename with condominio name
            const sanitizedName = condominio.nome.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
            const customFilename = `relatorio_${sanitizedName}.pdf`;

            setPdfData({ ...result, filename: customFilename });
            setStep('preview');
        } catch (error: any) {
            console.error('Error generating report:', error);
            const message = error.response?.data?.message || 'Erro ao gerar relatório';
            toast.error(message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDownload = () => {
        if (!pdfData) return;

        const url = URL.createObjectURL(pdfData.blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = pdfData.filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success('Download iniciado!');
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[600px]">
                {step === 'search' && (
                    <>
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <FileText className="h-5 w-5" />
                                Gerar Relatório de Condomínio
                            </DialogTitle>
                            <DialogDescription>
                                Digite o nome ou CNPJ do condomínio para gerar o relatório
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="search">Nome ou CNPJ do Condomínio</Label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="search"
                                        placeholder="Ex: Edifício Central ou 12.345.678/0001-90"
                                        className="pl-10"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                        disabled={isLoading}
                                    />
                                </div>
                            </div>
                            <Button
                                onClick={handleSearch}
                                disabled={isLoading}
                                className="w-full bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Buscando...
                                    </>
                                ) : (
                                    <>
                                        <Search className="mr-2 h-4 w-4" />
                                        Buscar e Gerar
                                    </>
                                )}
                            </Button>
                        </div>
                    </>
                )}

                {step === 'select' && (
                    <CondominioSelector
                        condominios={condominios}
                        onSelect={handleSelectCondominio}
                        isLoading={isLoading}
                        onBack={() => setStep('search')}
                    />
                )}

                {step === 'preview' && pdfData && (
                    <PDFPreview
                        pdfBlob={pdfData.blob}
                        filename={pdfData.filename}
                        onDownload={handleDownload}
                        onClose={handleClose}
                    />
                )}
            </DialogContent>
        </Dialog>
    );
}
