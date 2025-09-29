import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
} from "axios";
import { toastManager } from "./toast";

// API Response types
export interface ApiResponse<T = unknown> {
  status: number;
  message: string;
  success: boolean;
  type: string;
  data: T;
}

// API Error types
export interface ApiError {
  status: number;
  message: string;
  success: false;
  type: string;
  data?: unknown;
}

// Base API configuration
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";

// Create axios instance
const createApiInstance = (): AxiosInstance => {
  const instance = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
    withCredentials: true, // Send cookies for Better Auth session management
    headers: {
      "Content-Type": "application/json",
    },
  });

  // Response interceptor to handle common errors
  instance.interceptors.response.use(
    (response: AxiosResponse) => {
      return response;
    },
    (error: unknown) => {
      if (axios.isAxiosError(error) && error.response?.status) {
        const status = error.response.status;

        switch (status) {
          case 401:
            // Token expired or invalid, redirect to login
            window.location.href = "/login";
            break;
          case 403:
            // Access denied - insufficient permissions
            toastManager.showError("Access Denied", "Insufficient permissions");
            break;
          case 400:
            // Bad request - client error
            toastManager.showError("Bad Request", "Please check your input");
            break;
          default:
            // For other errors, show generic message if available
            if (error.response?.data?.message) {
              toastManager.showError("Error", error.response.data.message);
            }
            break;
        }
      }
      return Promise.reject(error);
    }
  );

  return instance;
};

// API instance
export const api = createApiInstance();

// Generic API methods
export class ApiClient {
  private instance: AxiosInstance;

  constructor(instance: AxiosInstance) {
    this.instance = instance;
  }

  // GET request
  async get<T = unknown>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    const response = await this.instance.get<ApiResponse<T>>(url, config);
    return response.data;
  }

  // POST request
  async post<T = unknown>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    const response = await this.instance.post<ApiResponse<T>>(
      url,
      data,
      config
    );
    return response.data;
  }

  // PUT request
  async put<T = unknown>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    const response = await this.instance.put<ApiResponse<T>>(url, data, config);
    return response.data;
  }

  // PATCH request
  async patch<T = unknown>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    const response = await this.instance.patch<ApiResponse<T>>(
      url,
      data,
      config
    );
    return response.data;
  }

  // DELETE request
  async delete<T = unknown>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    const response = await this.instance.delete<ApiResponse<T>>(url, config);
    return response.data;
  }

  // Upload file
  async upload<T = unknown>(
    url: string,
    file: File,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    const formData = new FormData();
    formData.append("file", file);

    const response = await this.instance.post<ApiResponse<T>>(url, formData, {
      ...config,
      headers: {
        ...config?.headers,
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  }
}

// Create API client instance
export const apiClient = new ApiClient(api);

// Specific API endpoints
export const apiEndpoints = {
  // Users
   users: {
     list: () => apiClient.get("/user"),
     get: (id: string) => apiClient.get(`/user/${id}`),
     create: (data: unknown) => apiClient.post("/user", data),
     update: (id: string, data: unknown) => apiClient.put(`/user/${id}`, data),
     delete: (id: string) => apiClient.delete(`/user/${id}`),
   },

  // Containers
  containers: {
    list: () => apiClient.get("/containers"),
    get: (id: string) => apiClient.get(`/containers/${id}`),
    create: (data: unknown) => apiClient.post("/containers", data),
    update: (id: string, data: unknown) =>
      apiClient.put(`/containers/${id}`, data),
    delete: (id: string) => apiClient.delete(`/containers/${id}`),
    start: (id: string) => apiClient.post(`/containers/${id}/start`),
    stop: (id: string) => apiClient.post(`/containers/${id}/stop`),
    restart: (id: string) => apiClient.post(`/containers/${id}/restart`),
    logs: (id: string, lines?: number) =>
      apiClient.get(`/containers/${id}/logs?lines=${lines || 100}`),
    migrate: (id: string, data: unknown) =>
      apiClient.post(`/containers/${id}/migrate`, data),
    getMigrationHistory: (id: string) =>
      apiClient.get(`/containers/${id}/migration-history`),
  },

  // Eggs
  eggs: {
    list: () => apiClient.get("/eggs"),
    get: (id: string) => apiClient.get(`/eggs/${id}`),
    create: (data: unknown) => apiClient.post("/eggs", data),
    update: (id: string, data: unknown) => apiClient.put(`/eggs/${id}`, data),
    delete: (id: string) => apiClient.delete(`/eggs/${id}`),
  },

  // Nodes
  nodes: {
    list: () => apiClient.get("/nodes"),
    get: (id: string) => apiClient.get(`/nodes/${id}`),
    create: (data: unknown) => apiClient.post("/nodes", data),
    update: (id: string, data: unknown) => apiClient.put(`/nodes/${id}`, data),
    delete: (id: string) => apiClient.delete(`/nodes/${id}`),
  },

  // Clusters
  clusters: {
    list: () => apiClient.get("/clusters"),
    get: (id: string) => apiClient.get(`/clusters/${id}`),
    create: (data: unknown) => apiClient.post("/clusters", data),
    update: (id: string, data: unknown) =>
      apiClient.put(`/clusters/${id}`, data),
    delete: (id: string) => apiClient.delete(`/clusters/${id}`),
  },

  // Roles
  roles: {
    list: () => apiClient.get("/roles"),
    get: (id: string) => apiClient.get(`/roles/${id}`),
    create: (data: unknown) => apiClient.post("/roles", data),
    update: (id: string, data: unknown) => apiClient.put(`/roles/${id}`, data),
    delete: (id: string) => apiClient.delete(`/roles/${id}`),
  },
};

// Utility functions
export const isApiError = (error: unknown): error is ApiError => {
  return (
    error !== null &&
    typeof error === "object" &&
    "status" in error &&
    "success" in error &&
    (error as ApiError).success === false
  );
};

export const handleApiError = (error: unknown): string => {
  if (isApiError(error)) {
    return error.message;
  }
  if (
    error &&
    typeof error === "object" &&
    "response" in error &&
    error.response &&
    typeof error.response === "object" &&
    "data" in error.response &&
    error.response.data &&
    typeof error.response.data === "object" &&
    "message" in error.response.data
  ) {
    return (error.response.data as { message: string }).message;
  }
  return "An unexpected error occurred";
};

export default api;
