// src/lib/api.ts
import axios, { AxiosError, AxiosResponse } from 'axios';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 second timeout
});

// Enhanced error interface
export interface ApiError {
  message: string;
  status?: number;
  details?: any;
  code?: string;
}

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('resumeBuilder_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
      if (typeof config.headers?.delete === 'function') {
        config.headers.delete('Content-Type');
      } else {
        delete config.headers['Content-Type'];
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Enhanced response interceptor for comprehensive error handling
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error: AxiosError) => {
    const apiError: ApiError = {
      message: 'An unexpected error occurred',
      status: error.response?.status,
      details: error.response?.data,
    };

    if (error.response) {
      // Server responded with error status
      const data = error.response.data as any;
      apiError.message =
        data.message || `Server Error: ${error.response.status}`;
      apiError.code = data.code;

      const requestUrl = `${error.config?.baseURL || ''}${error.config?.url || ''}`;
      const isAuthAttempt = /\/auth\/(login|register)(?:\?|$)/.test(
        requestUrl
      );

      switch (error.response.status) {
        case 401:
          if (isAuthAttempt) {
            apiError.message =
              data.message || 'Invalid email or password. Please try again.';
            break;
          }
          // Session expired on a protected request — sign out and send to login
          localStorage.removeItem('resumeBuilder_token');
          localStorage.removeItem('resumeBuilder_user');
          if (
            typeof window !== 'undefined' &&
            !window.location.pathname.startsWith('/login')
          ) {
            window.location.href = '/login';
          }
          break;
        case 403:
          apiError.message =
            'Access denied. You do not have permission to perform this action.';
          break;
        case 404:
          apiError.message = 'The requested resource was not found.';
          break;
        case 410:
          apiError.message = 'This shared link has expired.';
          break;
        case 422:
          apiError.message = 'Validation error. Please check your input.';
          apiError.details = data.errors || data.details;
          break;
        case 500:
          apiError.message = 'Internal server error. Please try again later.';
          break;
        default:
          apiError.message =
            data.message ||
            `Error ${error.response.status}: ${error.response.statusText}`;
      }
    } else if (error.request) {
      // Network error
      apiError.message =
        'Network error. Please check your internet connection.';
    } else {
      // Other error
      apiError.message = error.message || 'An unexpected error occurred';
    }

    console.error('API Error:', apiError);
    return Promise.reject(apiError);
  }
);

// API functions
export const authAPI = {
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  register: async (name: string, email: string, password: string) => {
    const response = await api.post('/auth/register', {
      name,
      email,
      password,
    });
    return response.data;
  },

  getProfile: async () => {
    const response = await api.get('/auth/profile');
    return response.data;
  },

  updateProfile: async (profileData: any) => {
    const response = await api.put('/auth/profile', { profileData });
    return response.data;
  },
};

export const templatesAPI = {
  getAll: async () => {
    const response = await api.get('/templates');
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get(`/templates/${id}`);
    return response.data;
  },

  create: async (templateData: {
    name: string;
    preview?: string;
    html: string;
  }) => {
    const response = await api.post('/templates', templateData);
    return response.data;
  },
};

export const uploadedResumesAPI = {
  upload: async (
    file: File,
    label?: string,
    onUploadProgress?: (percent: number) => void
  ) => {
    const formData = new FormData();
    formData.append('file', file);
    if (label?.trim()) {
      formData.append('label', label.trim());
    }
    const response = await api.post('/uploaded-resumes', formData, {
      timeout: 120000,
      onUploadProgress: (event) => {
        if (!onUploadProgress || !event.total) return;
        onUploadProgress(Math.round((event.loaded / event.total) * 100));
      },
    });
    return response.data;
  },

  list: async (status?: string) => {
    const response = await api.get('/uploaded-resumes', {
      params: status ? { status } : undefined,
    });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get(`/uploaded-resumes/${id}`);
    return response.data;
  },

  getStatus: async (id: string) => {
    const response = await api.get(`/uploaded-resumes/${id}/status`);
    return response.data;
  },

  getData: async (id: string) => {
    const response = await api.get(`/uploaded-resumes/${id}/data`);
    return response.data;
  },

  download: async (id: string) => {
    const response = await api.get(`/uploaded-resumes/${id}/download`);
    return response.data;
  },

  updateLabel: async (id: string, label: string) => {
    const response = await api.put(`/uploaded-resumes/${id}`, { label });
    return response.data;
  },

  replaceFile: async (
    id: string,
    file: File,
    onUploadProgress?: (percent: number) => void
  ) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.put(`/uploaded-resumes/${id}/file`, formData, {
      timeout: 120000,
      onUploadProgress: (event) => {
        if (!onUploadProgress || !event.total) return;
        onUploadProgress(Math.round((event.loaded / event.total) * 100));
      },
    });
    return response.data;
  },

  reparse: async (id: string) => {
    const response = await api.post(`/uploaded-resumes/${id}/reparse`);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/uploaded-resumes/${id}`);
    return response.data;
  },
};

export const resumesAPI = {
  // Create resume
  create: async (resumeData: { templateId: string; data: any }) => {
    const response = await api.post('/resumes', resumeData);
    return response.data;
  },

  // Get all user resumes
  getUserResumes: async () => {
    const response = await api.get('/resumes/user');
    return response.data;
  },

  // Get specific resume
  getById: async (id: string) => {
    const response = await api.get(`/resumes/${id}`);
    return response.data;
  },

  // Update resume
  update: async (id: string, data: any) => {
    const response = await api.put(`/resumes/${id}`, { data });
    return response.data;
  },

  // Delete resume
  delete: async (id: string) => {
    const response = await api.delete(`/resumes/${id}`);
    return response.data;
  },

  // Download PDF
  download: async (id: string) => {
    const response = await api.get(`/resumes/${id}/download`, {
      responseType: 'blob',
    });
    return response.data;
  },

  // Preview PDF as base64
  preview: async (id: string) => {
    const response = await api.get(`/resumes/${id}/preview`);
    return response.data;
  },

  // Regenerate PDF
  regenerate: async (id: string) => {
    const response = await api.post(`/resumes/${id}/regenerate`);
    return response.data;
  },

  // Share resume
  share: async (id: string, expiresInDays?: number) => {
    const response = await api.post(`/resumes/${id}/share`, {
      expiresInDays: expiresInDays || 30,
    });
    return response.data;
  },

  // Unshare resume
  unshare: async (id: string) => {
    const response = await api.post(`/resumes/${id}/unshare`);
    return response.data;
  },

  // Get public resume (no auth required)
  getPublic: async (shareToken: string) => {
    const response = await api.get(`/resumes/public/${shareToken}`);
    return response.data;
  },

  // Download public resume (no auth required)
  downloadPublic: async (shareToken: string) => {
    const response = await api.get(`/resumes/public/${shareToken}/download`, {
      responseType: 'blob',
    });
    return response.data;
  },

  // Cleanup old PDFs (admin function)
  cleanup: async () => {
    const response = await api.post('/resumes/cleanup');
    return response.data;
  },
};

// Utility functions for file handling
export const fileUtils = {
  // Download blob as file
  downloadBlob: (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },

  // Open blob in new tab
  openBlob: (blob: Blob) => {
    const url = window.URL.createObjectURL(blob);
    window.open(url, '_blank');
    // Clean up after a delay
    setTimeout(() => {
      window.URL.revokeObjectURL(url);
    }, 1000);
  },

  // Convert base64 to blob
  base64ToBlob: (base64: string, mimeType: string = 'application/pdf') => {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
  },
};

export default api;
