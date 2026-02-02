// User types
export interface User {
  id: number;
  email: string;
  role: "hospital" | "facility" | "admin";
  is_active: boolean;
}

export interface LoginResponse {
  token: string;
  user: User;
}

// Facility types
export interface Facility {
  id: number;
  user_id: number;
  name: string;
  email?: string;
  address?: string;
  phone?: string;
  facility_type?: string;
  bed_capacity?: number;
  available_beds: number;
  acceptance_conditions?: string;
  acceptance_conditions_json?: Record<string, boolean>;
  care_areas?: string[];
  latitude?: number;
  longitude?: number;
  monthly_fee?: number;
  monthly_fee_private?: number;
  medicine_cost?: number;
  distance?: number;
  description?: string;
  contact_name?: string;
  contact_hours?: string;
  photos?: FacilityPhoto[];
  images?: FacilityImage[];
  created_at: string;
  updated_at: string;
}

export interface FacilityPhoto {
  id: number | string;
  url: string;
  alt?: string;
  file?: File;
}

export interface FacilityImage {
  id: number;
  facility_id: number;
  image_url: string;
  image_type: string;
  sort_order: number;
  caption?: string;
  created_at: string;
}

export interface FacilityRoomType {
  id: number;
  facility_id: number;
  room_type: string;
  capacity: number;
  available: number;
  monthly_fee?: number;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface FacilityRoomTypeInput {
  room_type: string;
  capacity: number;
  available: number;
  monthly_fee?: number;
  description?: string;
}

export interface FacilitySearchParams {
  name?: string;
  address?: string;
  has_available_beds?: boolean;
  latitude?: number;
  longitude?: number;
  max_distance_km?: number;
  min_monthly_fee?: number;
  max_monthly_fee?: number;
  min_medicine_cost?: number;
  max_medicine_cost?: number;
  sort_by?: "distance" | "monthly_fee" | "medicine_cost" | "available_beds";
  sort_order?: "asc" | "desc";
  // Acceptance conditions
  ventilator?: boolean;
  iv_antibiotics?: boolean;
  tube_feeding?: boolean;
  tracheostomy?: boolean;
  dialysis?: boolean;
  oxygen?: boolean;
  pressure_ulcer?: boolean;
  dementia?: boolean;
}

export interface FacilityCreateData {
  name: string;
  address?: string;
  phone?: string;
  bed_capacity?: number;
  available_beds?: number;
  acceptance_conditions?: string;
  latitude?: number;
  longitude?: number;
  monthly_fee?: number;
  medicine_cost?: number;
}

export interface FacilityUpdateData extends Partial<FacilityCreateData> {}

// Hospital types
export interface Hospital {
  id: number;
  user_id: number;
  name: string;
  address?: string;
  phone?: string;
  created_at: string;
  updated_at: string;
}

export interface HospitalCreateData {
  email: string;
  password: string;
  name: string;
  address?: string;
  phone?: string;
}

// Document types
export interface Document {
  id: number;
  user_id: number;
  sender_id?: number;
  recipient_id?: number;
  filename: string;
  original_name: string;
  title: string;
  document_type: string;
  content_type: string;
  size: number;
  file_size?: number;
  folder?: string;
  created_at: string;
}

// Placement Request types
export interface PlacementRequest {
  id: number;
  hospital_id: number;
  facility_id: number;
  patient_name: string;
  patient_age?: number;
  patient_gender?: string;
  patient_id?: string;
  care_type?: string;
  medical_condition?: string;
  notes?: string;
  status: "pending" | "accepted" | "rejected" | "negotiating" | "completed" | "cancelled";
  room_id?: number;
  hospital_name?: string;
  facility_name?: string;
  created_at: string;
  updated_at: string;
  hospital?: Hospital;
  facility?: Facility;
}

export interface PlacementRequestCreateData {
  facility_id: number;
  patient_name: string;
  patient_age?: number;
  care_type?: string;
  notes?: string;
}

export interface PlacementRequestUpdateData extends Partial<PlacementRequestCreateData> {}

// Message Room types
export interface Message {
  id: number;
  room_id: number;
  sender_id: number;
  content: string;
  created_at: string;
  sender?: User;
}

export interface RoomFile {
  id: number;
  room_id: number;
  uploader_id: number;
  filename: string;
  original_name: string;
  content_type: string;
  size: number;
  created_at: string;
}

export interface MessageRoom {
  id: number;
  request_id: number;
  hospital_id: number;
  facility_id: number;
  status: "active" | "accepted" | "rejected" | "completed" | "negotiating";
  hospital_completed: boolean;
  facility_completed: boolean;
  patient_age?: number;
  patient_gender?: string;
  medical_condition?: string;
  hospital_name?: string;
  facility_name?: string;
  created_at: string;
  updated_at: string;
  messages?: Message[];
  files?: RoomFile[];
  request?: PlacementRequest;
  hospital?: Hospital;
  facility?: Facility;
}

// Room file type for room detail page
export interface RoomFileDetail {
  id: number;
  file_name: string;
  file_size: number;
  sender_id: number;
  created_at: string;
}

// Room message type for room detail page
export interface RoomMessage {
  id: number;
  sender_id: number;
  sender_name?: string;
  message_text: string;
  created_at: string;
}

// Unread counts type
export interface UnreadCounts {
  messages: number;
  requests: number;
}

// API Response types
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface ApiError {
  error: string;
  message?: string;
}
