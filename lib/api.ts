import axios from 'axios';

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL,
});

api.interceptors.request.use((config) => {
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
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
        const response = await api.post('/reports/preview', { searchTerm }, {
            responseType: 'json',
        });

        // If response is JSON with multiple results
        if (response.data && Array.isArray(response.data)) {
            return response.data;
        }

        // If single result or direct PDF, return empty to trigger PDF flow
        return [];
    },

    async generateReport(condominioId: number): Promise<{ blob: Blob; filename: string }> {
        const response = await api.post('/reports/preview', { condominioId }, {
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

    async searchAndGenerate(searchTerm: string): Promise<{ blob: Blob; filename: string } | Condominio[]> {
        const response = await api.post('/reports/preview', { searchTerm }, {
            responseType: 'blob',
            validateStatus: (status) => status < 500,
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
};
