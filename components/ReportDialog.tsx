"use client";

import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2, Search, FileText, Radio, Users, Phone, Calendar } from 'lucide-react';
import { reportsService, Condominio } from '@/lib/api';
import { toast } from 'sonner';
import { CondominioSelector } from './CondominioSelector';
import { sanitizeFilename } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { PDFPreview } from './PDFPreview';

interface ReportDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initialType?: ReportType;
}

type DialogStep = 'type-select' | 'search' | 'select' | 'rf-dates' | 'twilio-dates' | 'preview';
type ReportType = 'MORADORES' | 'ACESSO_RF_BACKUP' | 'CHAMADAS_TWILIO';

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
    const [twilioDateError, setTwilioDateError] = useState('');
    const { userName } = useAuth();

    const rfDataInicioRef = useRef<HTMLInputElement>(null);
    const rfDataFimRef = useRef<HTMLInputElement>(null);
    const twilioDataInicioRef = useRef<HTMLInputElement>(null);
    const twilioDataFimRef = useRef<HTMLInputElement>(null);

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
        setTwilioDateError('');
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
                // RF backup and Twilio: always needs a list to pick condominio then enter dates
                const candidates = await reportsService.searchCondominio(searchTerm);
                if (candidates.length === 0) {
                    toast.error('Nenhum condomínio encontrado');
                } else if (candidates.length === 1) {
                    setSelectedCondominio(candidates[0]);
                    setStep(reportType === 'CHAMADAS_TWILIO' ? 'twilio-dates' : 'rf-dates');
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

        if (reportType === 'CHAMADAS_TWILIO') {
            setStep('twilio-dates');
            return;
        }

        setIsLoading(true);
        try {
            const result = await reportsService.generateReport(condominio.id, userName || undefined);
            const sanitizedName = sanitizeFilename(condominio.nome);
            setPdfData({ ...result, filename: `relatorio_${sanitizedName}.pdf` });
            setStep('preview');
        } catch (error: any) {
            console.error('Error generating report:', error);
            const msg = error?.message || 'Erro ao gerar relatório';
            toast.error(msg);
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
            const msg = error?.message || 'Erro ao gerar relatório RF';
            toast.error(msg);
        } finally {
            setIsLoading(false);
        }
    };

    const parseDate = (str: string): Date | null => {
        const [d, m, y] = str.split('/');
        if (!d || !m || !y) return null;
        const date = new Date(`${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`);
        return isNaN(date.getTime()) ? null : date;
    };

    const handleGenerateTwilio = async () => {
        if (!selectedCondominio) return;
        setTwilioDateError('');

        const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;
        if (!dateRegex.test(dataInicio) || !dateRegex.test(dataFim)) {
            setTwilioDateError('Use o formato DD/MM/YYYY nas datas.');
            return;
        }

        const inicio = parseDate(dataInicio);
        const fim = parseDate(dataFim);

        if (!inicio || !fim) {
            setTwilioDateError('Datas inválidas.');
            return;
        }

        if (fim < inicio) {
            setTwilioDateError('A data fim não pode ser anterior à data início.');
            return;
        }

        const diffDays = Math.round((fim.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays > 15) {
            setTwilioDateError(`Intervalo máximo é de 15 dias. Você selecionou ${diffDays} dias.`);
            return;
        }

        setIsLoading(true);
        try {
            const result = await reportsService.generateTwilioReport({
                condominioId: selectedCondominio.id,
                nomeCondominio: selectedCondominio.nome,
                dataInicio,
                dataFim,
                userName: userName || undefined,
            });
            setPdfData(result);
            setStep('preview');
        } catch (error: any) {
            const msg = error?.message || 'Erro ao gerar relatório de chamadas Twilio';
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
                            <button
                                onClick={() => handleTypeSelect('CHAMADAS_TWILIO')}
                                className="flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-transparent bg-purple-50 hover:border-purple-500 hover:bg-purple-100 transition-all text-left cursor-pointer col-span-2"
                            >
                                <div className="p-3 rounded-full bg-gradient-to-br from-purple-500 to-purple-700">
                                    <Phone className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <p className="font-semibold text-sm text-gray-900">Relatório de Chamadas Twilio</p>
                                    <p className="text-xs text-gray-500 mt-1">Total de chamadas por dia (máx. 15 dias)</p>
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
                                {reportType === 'MORADORES' ? 'Gerar Relatório de Moradores' : reportType === 'ACESSO_RF_BACKUP' ? 'Acesso Controle RF (Backup)' : 'Relatório de Chamadas Twilio'}
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
                                    <div className="relative">
                                        <Input
                                            id="dataInicio"
                                            placeholder="DD/MM/YYYY"
                                            value={dataInicio}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                                let value = e.target.value.replace(/\D/g, '');
                                                if (value.length > 2) value = value.substring(0, 2) + '/' + value.substring(2);
                                                if (value.length > 5) value = value.substring(0, 5) + '/' + value.substring(5, 9);
                                                setDataInicio(value);
                                            }}
                                            disabled={isLoading}
                                            maxLength={10}
                                        />
                                        <button
                                            type="button"
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                                            onClick={() => rfDataInicioRef.current?.showPicker()}
                                            disabled={isLoading}
                                        >
                                            <Calendar className="h-4 w-4" />
                                        </button>
                                        <input
                                            type="date"
                                            ref={rfDataInicioRef}
                                            className="sr-only"
                                            onChange={(e) => {
                                                if (e.target.value) {
                                                    const [y, m, d] = e.target.value.split('-');
                                                    setDataInicio(`${d}/${m}/${y}`);
                                                }
                                            }}
                                        />
                                    </div>
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
                                    <div className="relative">
                                        <Input
                                            id="dataFim"
                                            placeholder="DD/MM/YYYY"
                                            value={dataFim}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                                let value = e.target.value.replace(/\D/g, '');
                                                if (value.length > 2) value = value.substring(0, 2) + '/' + value.substring(2);
                                                if (value.length > 5) value = value.substring(0, 5) + '/' + value.substring(5, 9);
                                                setDataFim(value);
                                            }}
                                            disabled={isLoading}
                                            maxLength={10}
                                        />
                                        <button
                                            type="button"
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                                            onClick={() => rfDataFimRef.current?.showPicker()}
                                            disabled={isLoading}
                                        >
                                            <Calendar className="h-4 w-4" />
                                        </button>
                                        <input
                                            type="date"
                                            ref={rfDataFimRef}
                                            className="sr-only"
                                            onChange={(e) => {
                                                if (e.target.value) {
                                                    const [y, m, d] = e.target.value.split('-');
                                                    setDataFim(`${d}/${m}/${y}`);
                                                }
                                            }}
                                        />
                                    </div>
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

                {/* Step (Twilio): Pick date range */}
                {step === 'twilio-dates' && selectedCondominio && (
                    <>
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <Phone className="h-5 w-5" />
                                Período do Relatório de Chamadas
                            </DialogTitle>
                            <DialogDescription>
                                Condomínio: <strong>{selectedCondominio.nome}</strong>
                                <br />
                                <span className="text-xs text-muted-foreground">Intervalo máximo: 15 dias</span>
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="twilioDataInicio">Data Início</Label>
                                    <div className="relative">
                                        <Input
                                            id="twilioDataInicio"
                                            placeholder="DD/MM/YYYY"
                                            value={dataInicio}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                                let value = e.target.value.replace(/\D/g, '');
                                                if (value.length > 2) {
                                                    value = value.substring(0, 2) + '/' + value.substring(2);
                                                }
                                                if (value.length > 5) {
                                                    value = value.substring(0, 5) + '/' + value.substring(5, 9);
                                                }
                                                setDataInicio(value);
                                                setTwilioDateError('');
                                            }}
                                            disabled={isLoading}
                                            maxLength={10}
                                        />
                                        <button
                                            type="button"
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                                            onClick={() => twilioDataInicioRef.current?.showPicker()}
                                            disabled={isLoading}
                                        >
                                            <Calendar className="h-4 w-4" />
                                        </button>
                                        <input
                                            type="date"
                                            ref={twilioDataInicioRef}
                                            className="sr-only"
                                            onChange={(e) => {
                                                if (e.target.value) {
                                                    const [y, m, d] = e.target.value.split('-');
                                                    setDataInicio(`${d}/${m}/${y}`);
                                                    setTwilioDateError('');
                                                }
                                            }}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="twilioDataFim">Data Fim</Label>
                                    <div className="relative">
                                        <Input
                                            id="twilioDataFim"
                                            placeholder="DD/MM/YYYY"
                                            value={dataFim}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                                let value = e.target.value.replace(/\D/g, '');
                                                if (value.length > 2) {
                                                    value = value.substring(0, 2) + '/' + value.substring(2);
                                                }
                                                if (value.length > 5) {
                                                    value = value.substring(0, 5) + '/' + value.substring(5, 9);
                                                }
                                                setDataFim(value);
                                                setTwilioDateError('');
                                            }}
                                            disabled={isLoading}
                                            maxLength={10}
                                        />
                                        <button
                                            type="button"
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                                            onClick={() => twilioDataFimRef.current?.showPicker()}
                                            disabled={isLoading}
                                        >
                                            <Calendar className="h-4 w-4" />
                                        </button>
                                        <input
                                            type="date"
                                            ref={twilioDataFimRef}
                                            className="sr-only"
                                            onChange={(e) => {
                                                if (e.target.value) {
                                                    const [y, m, d] = e.target.value.split('-');
                                                    setDataFim(`${d}/${m}/${y}`);
                                                    setTwilioDateError('');
                                                }
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                            {twilioDateError && (
                                <p className="text-sm text-red-600 font-medium">{twilioDateError}</p>
                            )}
                            <div className="flex gap-2">
                                <Button variant="outline" onClick={() => setStep('search')} disabled={isLoading} className="flex-1">
                                    Voltar
                                </Button>
                                <Button
                                    onClick={handleGenerateTwilio}
                                    disabled={isLoading || !dataInicio || !dataFim}
                                    className="flex-1 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
                                >
                                    {isLoading ? (
                                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Gerando...</>
                                    ) : (
                                        <><FileText className="mr-2 h-4 w-4" />Gerar Relatório</>  
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
