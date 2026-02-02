import axios, { AxiosResponse, InternalAxiosRequestConfig } from "axios";
import type {
  User,
  LoginResponse,
  Facility,
  FacilitySearchParams,
  FacilityCreateData,
  FacilityUpdateData,
  FacilityRoomType,
  FacilityRoomTypeInput,
  Hospital,
  HospitalCreateData,
  Document,
  PlacementRequest,
  PlacementRequestCreateData,
  PlacementRequestUpdateData,
  MessageRoom,
  UnreadCounts,
} from "./types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem("token");
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
      const isLoginRequest = error.config?.url?.includes("/auth/login");
      const isOnLoginPage =
        typeof window !== "undefined" && window.location.pathname === "/login";

      if (!isLoginRequest && !isOnLoginPage) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (
    email: string,
    password: string
  ): Promise<AxiosResponse<LoginResponse>> =>
    api.post("/api/auth/login", { email, password }),
  logout: (): Promise<AxiosResponse<void>> => api.post("/api/auth/logout"),
  getCurrentUser: (): Promise<AxiosResponse<User>> => api.get("/api/auth/me"),
};

// Facility Image Input type
interface FacilityImageInput {
  image_url: string;
  image_type?: string;
  caption?: string;
}

// Facility API
export const facilityAPI = {
  create: (data: FacilityCreateData): Promise<AxiosResponse<Facility>> =>
    api.post("/api/facilities", data),
  list: (params?: FacilitySearchParams): Promise<AxiosResponse<Facility[]>> =>
    api.get("/api/facilities", { params }),
  getById: (id: number | string): Promise<AxiosResponse<Facility>> =>
    api.get(`/api/facilities/${id}`),
  update: (
    id: number | string,
    data: FacilityUpdateData
  ): Promise<AxiosResponse<Facility>> => api.put(`/api/facilities/${id}`, data),
  getMy: (): Promise<AxiosResponse<Facility>> => api.get("/api/facilities/me"),
  updateImages: (
    id: number | string,
    images: FacilityImageInput[]
  ): Promise<AxiosResponse<Facility>> =>
    api.put(`/api/facilities/${id}/images`, { images }),
  // Room types API
  getRoomTypes: (
    id: number | string
  ): Promise<AxiosResponse<FacilityRoomType[]>> =>
    api.get(`/api/facilities/${id}/room-types`),
  updateRoomTypes: (
    id: number | string,
    roomTypes: FacilityRoomTypeInput[]
  ): Promise<AxiosResponse<FacilityRoomType[]>> =>
    api.put(`/api/facilities/${id}/room-types`, { room_types: roomTypes }),
};

// Document API
export const documentAPI = {
  upload: (formData: FormData): Promise<AxiosResponse<Document>> =>
    api.post("/api/documents", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  list: (): Promise<AxiosResponse<Document[]>> => api.get("/api/documents"),
  getById: (id: number | string): Promise<AxiosResponse<Document>> =>
    api.get(`/api/documents/${id}`),
  download: (id: number | string): Promise<AxiosResponse<Blob>> =>
    api.get(`/api/documents/${id}/download`, {
      responseType: "blob",
    }),
  delete: (id: number | string): Promise<AxiosResponse<void>> =>
    api.delete(`/api/documents/${id}`),
};

// Admin API
export const adminAPI = {
  createHospital: (data: HospitalCreateData): Promise<AxiosResponse<Hospital>> =>
    api.post("/api/admin/hospitals", data),
  listHospitals: (): Promise<AxiosResponse<Hospital[]>> =>
    api.get("/api/admin/hospitals"),
  updateHospital: (
    id: number | string,
    data: Partial<HospitalCreateData>
  ): Promise<AxiosResponse<Hospital>> =>
    api.put(`/api/admin/hospitals/${id}`, data),
  deleteHospital: (id: number | string): Promise<AxiosResponse<void>> =>
    api.delete(`/api/admin/hospitals/${id}`),
  createFacility: (
    data: FacilityCreateData & { email: string; password: string }
  ): Promise<AxiosResponse<Facility>> => api.post("/api/admin/facilities", data),
  listFacilities: (): Promise<AxiosResponse<Facility[]>> =>
    api.get("/api/admin/facilities"),
  updateFacility: (
    id: number | string,
    data: FacilityUpdateData
  ): Promise<AxiosResponse<Facility>> =>
    api.put(`/api/admin/facilities/${id}`, data),
  deleteFacility: (id: number | string): Promise<AxiosResponse<void>> =>
    api.delete(`/api/admin/facilities/${id}`),
};

// Placement Request API
export const requestAPI = {
  create: (
    data: PlacementRequestCreateData
  ): Promise<AxiosResponse<PlacementRequest>> =>
    api.post("/api/requests", data),
  list: (): Promise<AxiosResponse<PlacementRequest[]>> =>
    api.get("/api/requests"),
  getById: (id: number | string): Promise<AxiosResponse<PlacementRequest>> =>
    api.get(`/api/requests/${id}`),
  update: (
    id: number | string,
    data: PlacementRequestUpdateData
  ): Promise<AxiosResponse<PlacementRequest>> =>
    api.put(`/api/requests/${id}`, data),
  cancel: (id: number | string): Promise<AxiosResponse<void>> =>
    api.delete(`/api/requests/${id}`),
  accept: (id: number | string): Promise<AxiosResponse<PlacementRequest>> =>
    api.post(`/api/requests/${id}/accept`),
  reject: (id: number | string): Promise<AxiosResponse<PlacementRequest>> =>
    api.post(`/api/requests/${id}/reject`),
  markAsRead: (id: number | string): Promise<AxiosResponse<void>> =>
    api.post(`/api/requests/${id}/read`),
  markAllAsRead: (): Promise<AxiosResponse<void>> =>
    api.post("/api/requests/read-all"),
};

// Message Room API
export const roomAPI = {
  list: (): Promise<AxiosResponse<MessageRoom[]>> => api.get("/api/rooms"),
  getById: (id: number | string): Promise<AxiosResponse<MessageRoom>> =>
    api.get(`/api/rooms/${id}`),
  sendMessage: (
    id: number | string,
    data: { message_text: string }
  ): Promise<AxiosResponse<{ id: number; message_text: string }>> =>
    api.post(`/api/rooms/${id}/messages`, data),
  uploadFile: (
    id: number | string,
    formData: FormData
  ): Promise<AxiosResponse<{ id: number; filename: string }>> =>
    api.post(`/api/rooms/${id}/files`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  downloadFile: (
    roomId: number | string,
    fileId: number | string
  ): Promise<AxiosResponse<Blob>> =>
    api.get(`/api/rooms/${roomId}/files/${fileId}`, {
      responseType: "blob",
    }),
  previewFile: (
    roomId: number | string,
    fileId: number | string
  ): Promise<AxiosResponse<Blob>> =>
    api.get(`/api/rooms/${roomId}/files/${fileId}/preview`, {
      responseType: "blob",
    }),
  getPreviewUrl: (roomId: number | string, fileId: number | string): string => {
    const token = localStorage.getItem("token");
    return `${API_BASE_URL}/api/rooms/${roomId}/files/${fileId}/preview?token=${token}`;
  },
  deleteFile: (
    roomId: number | string,
    fileId: number | string
  ): Promise<AxiosResponse<void>> =>
    api.delete(`/api/rooms/${roomId}/files/${fileId}`),
  accept: (id: number | string): Promise<AxiosResponse<MessageRoom>> =>
    api.post(`/api/rooms/${id}/accept`),
  reject: (id: number | string): Promise<AxiosResponse<MessageRoom>> =>
    api.post(`/api/rooms/${id}/reject`),
  complete: (id: number | string): Promise<AxiosResponse<MessageRoom>> =>
    api.post(`/api/rooms/${id}/complete`),
  cancelCompletion: (id: number | string): Promise<AxiosResponse<MessageRoom>> =>
    api.post(`/api/rooms/${id}/cancel-completion`),
  markAsRead: (id: number | string): Promise<AxiosResponse<void>> =>
    api.post(`/api/rooms/${id}/read`),
};

// Unread Counts API
export const unreadAPI = {
  getCounts: (): Promise<AxiosResponse<UnreadCounts>> => api.get("/api/unread"),
};

export default api;
