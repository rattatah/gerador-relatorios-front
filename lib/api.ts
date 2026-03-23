import axios, { InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL,
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    return config;
});

api.interceptors.response.use(
    (response: AxiosResponse) => {
        if (response.status === 401) {
            if (typeof window !== 'undefined') {
                localStorage.removeItem('token');
                window.location.href = '/login';
            }
            // Reject with an object that resembles an Axios error
            const error = new axios.AxiosError('Unauthorized');
            error.response = response;
            return Promise.reject(error);
        }
        return response;
    },
    (error: AxiosError) => {
        if (error.response?.status === 401) {
            if (typeof window !== 'undefined') {
                localStorage.removeItem('token');
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default api;

// Types for report generation
export interface Condominio {
    id: number;
    nome: string;
    cnpj: string;
    userCount?: number;
}

export interface SearchResponse {
    type: 'multiple';
    data: Condominio[];
}

export interface PDFResponse {
    type: 'pdf';
    buffer: Blob;
    filename: string;
}

// Report service functions
export const reportsService = {
    async searchCondominio(searchTerm: string): Promise<Condominio[]> {
        const response = await api.post('/reports/preview', { searchTerm, searchOnly: true }, {
            responseType: 'blob', // read as blob to detect content-type first
            validateStatus: (s) => s < 500,
        });

        const contentType = response.headers['content-type'] || '';
        if (contentType.includes('application/json')) {
            const text = await (response.data as Blob).text();
            const parsed = JSON.parse(text);
            return Array.isArray(parsed) ? parsed : [];
        }
        return [];
    },

    async generateReport(condominioId: number, userName?: string): Promise<{ blob: Blob; filename: string }> {
        const response = await api.post('/reports/preview', { condominioId, userName }, {
            responseType: 'blob',
        });

        // Extract filename from content-disposition header if available
        const contentDisposition = response.headers['content-disposition'];
        let filename = 'relatorio.pdf';

        if (contentDisposition) {
            const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(contentDisposition);
            if (matches != null && matches[1]) {
                filename = matches[1].replace(/['"]/g, '');
            }
        }

        return {
            blob: response.data,
            filename,
        };
    },

    async searchAndGenerate(searchTerm: string, userName?: string): Promise<{ blob: Blob; filename: string } | Condominio[]> {
        const response = await api.post('/reports/preview', { searchTerm, userName }, {
            responseType: 'blob',
            validateStatus: (status: number) => status < 500,
        });

        // Check if response is JSON (multiple results)
        const contentType = response.headers['content-type'];
        if (contentType && contentType.includes('application/json')) {
            // Convert blob back to JSON
            const text = await response.data.text();
            const data = JSON.parse(text);
            return data as Condominio[];
        }

        // Response is PDF
        const contentDisposition = response.headers['content-disposition'];
        let filename = 'relatorio.pdf';

        if (contentDisposition) {
            const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(contentDisposition);
            if (matches != null && matches[1]) {
                filename = matches[1].replace(/['"]/g, '');
            }
        }

        return {
            blob: response.data,
            filename,
        };
    },

    async generateRfBackupReport(params: {
        condominioId: number;
        nomeCondominio: string;
        dataInicio: string; // DD/MM/YYYY
        dataFim: string;    // DD/MM/YYYY
        horaInicio?: string;
        horaFim?: string;
        userName?: string;
    }): Promise<{ blob: Blob; filename: string }> {
        const response = await api.post('/reports/rf-backup', {
            condominioId: params.condominioId,
            nomeCondominio: params.nomeCondominio,
            dataInicio: params.dataInicio,
            dataFim: params.dataFim,
            horaInicio: params.horaInicio,
            horaFim: params.horaFim,
            userName: params.userName,
        }, {
            responseType: 'blob',
        });

        const sanitized = params.nomeCondominio.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
        return {
            blob: response.data,
            filename: `acesso_rf_${sanitized}.pdf`,
        };
    },
};
