"use client";

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2, Search, FileText, Radio, Users } from 'lucide-react';
import { reportsService, Condominio } from '@/lib/api';
import { toast } from 'sonner';
import { CondominioSelector } from './CondominioSelector';
import { useAuth } from '@/contexts/AuthContext';
import { PDFPreview } from './PDFPreview';

interface ReportDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initialType?: ReportType;
}

type DialogStep = 'type-select' | 'search' | 'select' | 'rf-dates' | 'preview';
type ReportType = 'MORADORES' | 'ACESSO_RF_BACKUP';

export function ReportDialog({ open, onOpenChange, initialType }: ReportDialogProps) {
    const [step, setStep] = useState<DialogStep>(initialType ? 'search' : 'type-select');
    const [reportType, setReportType] = useState<ReportType>(initialType ?? 'MORADORES');
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [condominios, setCondominios] = useState<Condominio[]>([]);
    const [selectedCondominio, setSelectedCondominio] = useState<Condominio | null>(null);
    const [pdfData, setPdfData] = useState<{ blob: Blob; filename: string } | null>(null);
    const [dataInicio, setDataInicio] = useState('');
    const [dataFim, setDataFim] = useState('');
    const [horaInicio, setHoraInicio] = useState('00:00');
    const [horaFim, setHoraFim] = useState('23:59');
    const { userName } = useAuth();

    const resetState = () => {
        setStep(initialType ? 'search' : 'type-select');
        setReportType(initialType ?? 'MORADORES');
        setSearchTerm('');
        setCondominios([]);
        setSelectedCondominio(null);
        setPdfData(null);
        setDataInicio('');
        setDataFim('');
        setHoraInicio('00:00');
        setHoraFim('23:59');
    };

    const handleClose = () => {
        onOpenChange(false);
        setTimeout(resetState, 200);
    };

    const handleTypeSelect = (type: ReportType) => {
        setReportType(type);
        setStep('search');
    };

    const handleSearch = async () => {
        if (!searchTerm.trim()) {
            toast.error('Por favor, digite um nome ou CNPJ');
            return;
        }

        setIsLoading(true);
        try {
            if (reportType === 'MORADORES') {
                const result = await reportsService.searchAndGenerate(searchTerm, userName || undefined);
                if (Array.isArray(result)) {
                    if (result.length === 0) {
                        toast.error('Nenhum condomínio encontrado');
                    } else {
                        setCondominios(result);
                        setStep('select');
                    }
                } else {
                    setPdfData(result);
                    setStep('preview');
                }
            } else {
                // RF backup: always needs a list to pick condominio then enter dates
                const candidates = await reportsService.searchCondominio(searchTerm);
                if (candidates.length === 0) {
                    toast.error('Nenhum condomínio encontrado');
                } else if (candidates.length === 1) {
                    setSelectedCondominio(candidates[0]);
                    setStep('rf-dates');
                } else {
                    setCondominios(candidates);
                    setStep('select');
                }
            }
        } catch (error) {
            console.error('Error searching condominio:', error);
            toast.error('Erro ao buscar condomínio');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSelectCondominio = async (condominio: Condominio) => {
        setSelectedCondominio(condominio);

        if (reportType === 'ACESSO_RF_BACKUP') {
            setStep('rf-dates');
            return;
        }

        setIsLoading(true);
        try {
            const result = await reportsService.generateReport(condominio.id, userName || undefined);
            const sanitizedName = condominio.nome.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
            setPdfData({ ...result, filename: `relatorio_${sanitizedName}.pdf` });
            setStep('preview');
        } catch (error) {
            console.error('Error generating report:', error);
            toast.error('Erro ao gerar relatório');
        } finally {
            setIsLoading(false);
        }
    };

    const handleGenerateRfBackup = async () => {
        if (!selectedCondominio) return;

        const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;
        if (!dateRegex.test(dataInicio) || !dateRegex.test(dataFim)) {
            toast.error('Use o formato DD/MM/YYYY nas datas.');
            return;
        }

        setIsLoading(true);
        try {
            const result = await reportsService.generateRfBackupReport({
                condominioId: selectedCondominio.id,
                nomeCondominio: selectedCondominio.nome,
                dataInicio,
                dataFim,
                horaInicio,
                horaFim,
                userName: userName || undefined,
            });
            setPdfData(result);
            setStep('preview');
        } catch (error: any) {
            const msg = error?.response?.data?.message || error?.message || 'Erro ao gerar relatório RF';
            toast.error(msg);
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

                {/* Step 0: Choose report type */}
                {step === 'type-select' && (
                    <>
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <FileText className="h-5 w-5" />
                                Selecione o Tipo de Relatório
                            </DialogTitle>
                            <DialogDescription>
                                Qual relatório você deseja gerar?
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid grid-cols-2 gap-4 py-4">
                            <button
                                onClick={() => handleTypeSelect('MORADORES')}
                                className="flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-transparent bg-orange-50 hover:border-orange-500 hover:bg-orange-100 transition-all text-left cursor-pointer"
                            >
                                <div className="p-3 rounded-full bg-gradient-to-br from-orange-500 to-orange-600">
                                    <Users className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <p className="font-semibold text-sm text-gray-900">Moradores Cadastrados</p>
                                    <p className="text-xs text-gray-500 mt-1">Lista completa de moradores por unidade</p>
                                </div>
                            </button>
                            <button
                                onClick={() => handleTypeSelect('ACESSO_RF_BACKUP')}
                                className="flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-transparent bg-blue-50 hover:border-blue-500 hover:bg-blue-100 transition-all text-left cursor-pointer"
                            >
                                <div className="p-3 rounded-full bg-gradient-to-br from-blue-500 to-blue-600">
                                    <Radio className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <p className="font-semibold text-sm text-gray-900">Acesso Controle RF</p>
                                    <p className="text-xs text-gray-500 mt-1">Histórico de acessos por backup CSV</p>
                                </div>
                            </button>
                        </div>
                    </>
                )}

                {/* Step 1: Search condomínio */}
                {step === 'search' && (
                    <>
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <FileText className="h-5 w-5" />
                                {reportType === 'MORADORES' ? 'Gerar Relatório de Moradores' : 'Acesso Controle RF (Backup)'}
                            </DialogTitle>
                            <DialogDescription>
                                Digite o nome ou CNPJ do condomínio
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
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                                        onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && handleSearch()}
                                        disabled={isLoading}
                                    />
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" onClick={() => setStep('type-select')} className="flex-1">
                                    Voltar
                                </Button>
                                <Button
                                    onClick={handleSearch}
                                    disabled={isLoading}
                                    className="flex-1 bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800"
                                >
                                    {isLoading ? (
                                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Buscando...</>
                                    ) : (
                                        <><Search className="mr-2 h-4 w-4" />Buscar</>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </>
                )}

                {/* Step 2: Select from multiple condominios */}
                {step === 'select' && (
                    <CondominioSelector
                        condominios={condominios}
                        onSelect={handleSelectCondominio}
                        isLoading={isLoading}
                        onBack={() => setStep('search')}
                    />
                )}

                {/* Step 3 (RF only): Pick date range */}
                {step === 'rf-dates' && selectedCondominio && (
                    <>
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <Radio className="h-5 w-5" />
                                Período do Relatório
                            </DialogTitle>
                            <DialogDescription>
                                Condomínio: <strong>{selectedCondominio.nome}</strong>
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="dataInicio">Data Início</Label>
                                    <Input
                                        id="dataInicio"
                                        placeholder="DD/MM/YYYY"
                                        value={dataInicio}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDataInicio(e.target.value)}
                                        disabled={isLoading}
                                        maxLength={10}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="horaInicio">Hora Início</Label>
                                    <Input
                                        id="horaInicio"
                                        type="time"
                                        value={horaInicio}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setHoraInicio(e.target.value)}
                                        disabled={isLoading}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="dataFim">Data Fim</Label>
                                    <Input
                                        id="dataFim"
                                        placeholder="DD/MM/YYYY"
                                        value={dataFim}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDataFim(e.target.value)}
                                        disabled={isLoading}
                                        maxLength={10}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="horaFim">Hora Fim</Label>
                                    <Input
                                        id="horaFim"
                                        type="time"
                                        value={horaFim}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setHoraFim(e.target.value)}
                                        disabled={isLoading}
                                    />
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" onClick={() => setStep('search')} disabled={isLoading} className="flex-1">
                                    Voltar
                                </Button>
                                <Button
                                    onClick={handleGenerateRfBackup}
                                    disabled={isLoading || !dataInicio || !dataFim}
                                    className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                                >
                                    {isLoading ? (
                                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Gerando...</>
                                    ) : (
                                        <><FileText className="mr-2 h-4 w-4" />Gerar Relatório RF</>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </>
                )}

                {/* Final step: PDF Preview */}
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
