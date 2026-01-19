import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

// Auth API
export const authAPI = {
  login: (email, password) => api.post("/api/auth/login", { email, password }),
  logout: () => api.post("/api/auth/logout"),
  getCurrentUser: () => api.get("/api/auth/me"),
};

// Facility API
export const facilityAPI = {
  create: (data) => api.post("/api/facilities", data),
  list: (params) => api.get("/api/facilities", { params }),
  getById: (id) => api.get(`/api/facilities/${id}`),
  update: (id, data) => api.put(`/api/facilities/${id}`, data),
  getMy: () => api.get("/api/facilities/me"),
};

// Document API
export const documentAPI = {
  upload: (formData) =>
    api.post("/api/documents", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  list: () => api.get("/api/documents"),
  getById: (id) => api.get(`/api/documents/${id}`),
  download: (id) =>
    api.get(`/api/documents/${id}/download`, {
      responseType: "blob",
    }),
};

// Admin API
export const adminAPI = {
  createHospital: (data) => api.post("/api/admin/hospitals", data),
  listHospitals: () => api.get("/api/admin/hospitals"),
  updateHospital: (id, data) => api.put(`/api/admin/hospitals/${id}`, data),
  deleteHospital: (id) => api.delete(`/api/admin/hospitals/${id}`),
  createFacility: (data) => api.post("/api/admin/facilities", data),
  listFacilities: () => api.get("/api/admin/facilities"),
  updateFacility: (id, data) => api.put(`/api/admin/facilities/${id}`, data),
  deleteFacility: (id) => api.delete(`/api/admin/facilities/${id}`),
};

export default api;
