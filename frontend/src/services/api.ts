import axios from 'axios';
import { Story, Scene, DifficultyLevel, AnimationStyle } from '../App';

// Create axios instance with default configuration
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3001/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Types for API requests and responses
export interface CreateStoryRequest {
  title: string;
  original_text: string;
  difficulty_level: DifficultyLevel;
  animation_style: AnimationStyle;
}

export interface UpdateStoryRequest {
  title?: string;
  original_text?: string;
  difficulty_level?: DifficultyLevel;
  animation_style?: AnimationStyle;
}

export interface GenerateAnimationRequest {
  text: string;
  keywords: string[];
  style: AnimationStyle;
  difficulty: DifficultyLevel;
}

export interface GenerateAnimationResponse {
  url: string;
  thumbnailUrl: string;
  duration: number;
  metadata: any;
}

export interface ExportVideoRequest {
  storyId: string;
  quality: 'low' | 'medium' | 'high';
  format: 'mp4' | 'webm';
  includeAudio: boolean;
}

export interface ExportPdfRequest {
  storyId: string;
  format: 'a4' | 'letter';
  includeThumbnails: boolean;
  layout: 'storyboard' | 'script';
}

// Story Management API
export const storyApi = {
  // Create a new story
  createStory: async (data: CreateStoryRequest): Promise<Story> => {
    const response = await api.post('/stories', data);
    return response.data.data;
  },

  // Get a story by ID
  getStory: async (id: string): Promise<Story & { scenes: Scene[] }> => {
    const response = await api.get(`/stories/${id}`);
    return response.data.data;
  },

  // Update a story
  updateStory: async (id: string, data: UpdateStoryRequest): Promise<Story> => {
    const response = await api.put(`/stories/${id}`, data);
    return response.data.data;
  },

  // Delete a story
  deleteStory: async (id: string): Promise<void> => {
    await api.delete(`/stories/${id}`);
  },

  // Get all stories for the current user
  getUserStories: async (userId?: string): Promise<Story[]> => {
    const url = userId ? `/stories/user/${userId}` : '/stories';
    const response = await api.get(url);
    return response.data.data;
  },

  // Duplicate a story
  duplicateStory: async (id: string, newTitle?: string): Promise<Story> => {
    const response = await api.post(`/stories/${id}/duplicate`, { newTitle });
    return response.data.data;
  },

  // Share a story
  shareStory: async (id: string, options: { expiresIn?: number; allowDownload?: boolean }): Promise<{ shareUrl: string }> => {
    const response = await api.post(`/stories/${id}/share`, options);
    return response.data.data;
  },

  // Get a shared story (public access)
  getSharedStory: async (shareId: string): Promise<Story & { scenes: Scene[] }> => {
    const response = await api.get(`/share/${shareId}`);
    return response.data.data;
  },
};

// Animation Generation API
export const animationApi = {
  // Generate animations from text
  generateAnimations: async (data: GenerateAnimationRequest): Promise<GenerateAnimationResponse> => {
    const response = await api.post('/animations/generate', data);
    return response.data.data;
  },

  // Generate AI images for specific concepts
  generateAiImages: async (concepts: string[], style: AnimationStyle): Promise<{ url: string; concept: string }[]> => {
    const response = await api.post('/animations/ai-generate', { concepts, style });
    return response.data.data;
  },

  // Get available pre-made animations
  getPremadeAnimations: async (): Promise<Array<{
    id: string;
    name: string;
    description: string;
    keywords: string[];
    thumbnailUrl: string;
    animationUrl: string;
    duration: number;
    category: string;
  }>> => {
    const response = await api.get('/animations/premade');
    return response.data.data;
  },

  // Check animation generation status
  getGenerationStatus: async (taskId: string): Promise<{
    status: 'pending' | 'processing' | 'completed' | 'failed';
    progress: number;
    result?: GenerateAnimationResponse;
    error?: string;
  }> => {
    const response = await api.get(`/animations/status/${taskId}`);
    return response.data.data;
  },
};

// Export and Sharing API
export const exportApi = {
  // Export story as video
  exportVideo: async (data: ExportVideoRequest): Promise<{
    downloadUrl: string;
    filename: string;
    size: number;
    duration: number;
  }> => {
    const response = await api.post('/export/video', data);
    return response.data.data;
  },

  // Export story as PDF
  exportPdf: async (data: ExportPdfRequest): Promise<{
    downloadUrl: string;
    filename: string;
    size: number;
  }> => {
    const response = await api.post('/export/pdf', data);
    return response.data.data;
  },

  // Get export status
  getExportStatus: async (taskId: string): Promise<{
    status: 'pending' | 'processing' | 'completed' | 'failed';
    progress: number;
    result?: any;
    error?: string;
  }> => {
    const response = await api.get(`/export/status/${taskId}`);
    return response.data.data;
  },

  // Create shareable link
  createShareableLink: async (storyId: string, options: {
    expiresIn?: number;
    password?: string;
    allowDownload?: boolean;
  }): Promise<{ shareUrl: string; shareId: string }> => {
    const response = await api.post('/share/create', { storyId, ...options });
    return response.data.data;
  },

  // Get sharing analytics
  getSharingAnalytics: async (shareId: string): Promise<{
    views: number;
    downloads: number;
    lastViewed: string;
    referrers: Array<{ source: string; count: number }>;
  }> => {
    const response = await api.get(`/share/${shareId}/analytics`);
    return response.data.data;
  },
};

// User Management API
export const userApi = {
  // Register new user
  register: async (data: {
    email: string;
    password: string;
    name: string;
    age_group?: DifficultyLevel;
  }): Promise<{ user: any; token: string }> => {
    const response = await api.post('/auth/register', data);
    return response.data.data;
  },

  // Login user
  login: async (email: string, password: string): Promise<{ user: any; token: string }> => {
    const response = await api.post('/auth/login', { email, password });
    return response.data.data;
  },

  // Get user profile
  getProfile: async (): Promise<any> => {
    const response = await api.get('/users/profile');
    return response.data.data;
  },

  // Update user profile
  updateProfile: async (data: {
    name?: string;
    age_group?: DifficultyLevel;
    preferences?: any;
  }): Promise<any> => {
    const response = await api.put('/users/profile', data);
    return response.data.data;
  },

  // Update user settings
  updateSettings: async (settings: {
    theme?: 'light' | 'dark';
    language?: string;
    notifications?: boolean;
    autoSave?: boolean;
  }): Promise<any> => {
    const response = await api.put('/users/settings', settings);
    return response.data.data;
  },

  // Get user statistics
  getStats: async (): Promise<{
    storiesCreated: number;
    animationsGenerated: number;
    totalViews: number;
    sharesCreated: number;
    exportCount: number;
    storageUsed: number;
  }> => {
    const response = await api.get('/users/stats');
    return response.data.data;
  },
};

// Utility functions
export const apiUtils = {
  // Handle API errors consistently
  handleError: (error: any): string => {
    if (error.response) {
      // Server responded with error status
      const message = error.response.data?.error || error.response.data?.message || 'Server error';
      return message;
    } else if (error.request) {
      // Request was made but no response received
      return 'Network error. Please check your connection.';
    } else {
      // Something else happened
      return error.message || 'An unexpected error occurred.';
    }
  },

  // Create a cancel token for long-running requests
  createCancelToken: () => {
    return axios.CancelToken.source();
  },

  // Check if request was cancelled
  isCancel: axios.isCancel,

  // Format file size for display
  formatFileSize: (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  // Format duration for display
  formatDuration: (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  },
};

// Main API object
export const api = {
  stories: storyApi,
  animations: animationApi,
  export: exportApi,
  users: userApi,
  utils: apiUtils,
};

export default api;