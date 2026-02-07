"use client";

import { useEffect, useState } from 'react';
import { DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, X, FileText, Loader2 } from 'lucide-react';

interface PDFPreviewProps {
    pdfBlob: Blob;
    filename: string;
    onDownload: () => void;
    onClose: () => void;
}

export function PDFPreview({ pdfBlob, filename, onDownload, onClose }: PDFPreviewProps) {
    const [pdfUrl, setPdfUrl] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const url = URL.createObjectURL(pdfBlob);
        setPdfUrl(url);

        // Simulate loading for better UX
        setTimeout(() => setIsLoading(false), 500);

        return () => {
            URL.revokeObjectURL(url);
        };
    }, [pdfBlob]);

    return (
        <>
            <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Pré-visualização do Relatório
                </DialogTitle>
                <DialogDescription>
                    {filename}
                </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
                {/* PDF Viewer */}
                <div className="relative w-full h-[500px] border rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                    {isLoading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-gray-900/80 z-10">
                            <div className="text-center">
                                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-blue-600" />
                                <p className="text-sm text-muted-foreground">Carregando PDF...</p>
                            </div>
                        </div>
                    )}
                    {pdfUrl && (
                        <iframe
                            src={pdfUrl}
                            className="w-full h-full"
                            title="PDF Preview"
                            onLoad={() => setIsLoading(false)}
                        />
                    )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        className="flex-1"
                    >
                        <X className="mr-2 h-4 w-4" />
                        Fechar
                    </Button>
                    <Button
                        onClick={onDownload}
                        className="flex-1 bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800"
                    >
                        <Download className="mr-2 h-4 w-4" />
                        Baixar PDF
                    </Button>
                </div>

                {/* Info Text */}
                <p className="text-xs text-center text-muted-foreground">
                    O arquivo será salvo como: <span className="font-mono font-semibold">{filename}</span>
                </p>
            </div>
        </>
    );
}
