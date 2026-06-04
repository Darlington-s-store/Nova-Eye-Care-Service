import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000, // 30s timeout — allows headroom for Neon database cold starts and external APIs
  headers: {
    'Content-Type': 'application/json',
  },
});

// Helper to convert snake_case to camelCase
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const toCamel = (obj: any): any => {
  if (Array.isArray(obj)) return obj.map(toCamel);
  if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj).reduce((acc, key) => {
      const camelKey = key.replace(/([-_][a-z])/g, (group) =>
        group.toUpperCase().replace('-', '').replace('_', '')
      );
      acc[camelKey] = toCamel(obj[key]);
      return acc;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }, {} as any);
  }
  return obj;
};

// Add interceptor for auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('nova_auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add interceptor for response conversion
api.interceptors.response.use((response) => {
  if (response.data) {
    response.data = toCamel(response.data);
  }
  return response;
});

export interface AuthResponse {
  token: string;
  user: User;
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: 'patient' | 'admin';
}

export interface Profile {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  role: string;
  registrationCompleted?: boolean;
  nationality?: string;
  gender?: string;
  dateOfBirth?: string;
  address?: string;
  bloodGroup?: string;
  region?: string;
  medicalHistory?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  createdAt: string;
}

export interface MedicalHistory {
  ocularHistory: string;
  systemicConditions: string;
  currentMedications: string;
  familyEyeHistory: string;
  allergies: string;
}

export interface AdminStats {
  summary: {
    totalAppointments: number;
    pendingAppointments: number;
    todayAppointments: number;
    pendingReviews: number;
    totalUsers: number;
  };
  recentAppointments: {
    id: string;
    fullName: string;
    service: string;
    appointmentDate: string;
    appointmentTime: string;
    status: string;
  }[];
  statusStats?: { status: string; count: number }[];
  bookingTrends?: { period: string; count: number }[];
  serviceStats?: { service: string; count: number }[];
  revenueTrends?: { period: string; revenue: number }[];
  genderStats?: { label: string; count: number }[];
}

export interface Review {
  id: string;
  userId: string | null;
  authorName: string;
  rating: number;
  content: string;
  approved: boolean;
  createdAt: string;
}

export interface Appointment {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  service: string;
  appointmentDate: string;
  appointmentTime: string;
  appointmentType?: "in_person" | "virtual";
  doctorName?: string | null;
  notes: string | null;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  userId: string | null;
  createdAt: string;
}

export interface Screening {
  id: string;
  patientId: string;
  patientName: string;
  vaRightEye: string;
  vaLeftEye: string;
  iopRight: number;
  iopLeft: number;
  colourVisionResult: string;
  diagnosis: string;
  screeningDate: string;
  recommendedFollowup: string;
  isVisibleToPatient: boolean;
  createdAt: string;
}

export interface Service {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  fullDescription: string;
  imageUrl: string;
  displayOrder: number;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  body?: string; // Compatibility
  link?: string | null;
  type: string;
  isRead: boolean;
  read?: boolean; // Compatibility
  createdAt: string;
}

export interface KB {
  id: string;
  question: string;
  answer: string;
  category: string | null;
  active: boolean;
  updatedAt: string;
}

export interface Prescription {
  id: string;
  doctorName: string;
  prescriptionDetails: string;
  issuedAt: string;
}

export interface Invoice {
  id: string;
  amount: number;
  status: string;
  description: string;
  createdAt: string;
}

export interface SMSLog {
  id: number;
  phone: string;
  message: string;
  status: 'sent' | 'failed';
  providerResponse: unknown;
  createdAt: string;
}

export interface SMSStats {
  total: number;
  sent: number;
  failed: number;
}

export interface ClinicSettings {
  id: string;
  clinicName: string;
  contactPhone: string;
  address: string;
  openingHours: string;
  socialFacebook?: string;
  socialInstagram?: string;
  socialTwitter?: string;
  announcementTitle?: string;
  announcementBody?: string;
  showAnnouncement?: boolean;
  maintenanceMode?: boolean;
  chatbotEnabled?: boolean;
  [key: string]: unknown;
}

export const apiService = {
  // Auth
  auth: {
    login: async (credentials: Record<string, unknown>): Promise<AuthResponse> => {
      const { data } = await api.post('/auth/login', credentials);
      if (data.token) localStorage.setItem('nova_auth_token', data.token);
      return data;
    },
    register: async (userData: Record<string, unknown>): Promise<AuthResponse> => {
      const { data } = await api.post('/auth/register', userData);
      if (data.token) localStorage.setItem('nova_auth_token', data.token);
      return data;
    },
    logout: () => {
      localStorage.removeItem('nova_auth_token');
    },
    getMe: async (): Promise<User> => {
      const { data } = await api.get('/auth/me');
      return data;
    },
    updatePassword: async (passwordData: Record<string, unknown>) => {
      const { data } = await api.post('/auth/update-password', passwordData);
      return data;
    },
    adminCreateUser: async (userData: Record<string, unknown>): Promise<void> => {
      await api.post('/auth/admin-create-user', userData);
    },
    adminResetPassword: async (resetData: { userId: string; newPassword: string }): Promise<void> => {
      await api.post('/auth/admin-reset-password', resetData);
    },
    getCaptcha: async (): Promise<{ question: string; captchaToken: string }> => {
      const { data } = await api.get('/auth/captcha');
      return data;
    },
    sendOtp: async (payload: {
      email: string;
      phone?: string;
      captchaToken?: string;
      captchaAnswer?: string;
      channel?: 'email' | 'sms';
    }): Promise<{
      message: string;
      otpToken: string;
      sentViaEmail: boolean;
      sentViaSMS: boolean;
      devOtp?: string;
    }> => {
      const { data } = await api.post('/auth/send-otp', payload);
      return data;
    },
    sendResetOtp: async (payload: { identifier: string }): Promise<{
      message: string;
      resetOtpToken: string;
      sentViaEmail: boolean;
      sentViaSMS: boolean;
      devOtp?: string;
    }> => {
      const { data } = await api.post('/auth/send-reset-otp', payload);
      return data;
    },
    verifyResetOtp: async (payload: { resetOtpToken: string; otp: string }): Promise<{
      message: string;
      success: boolean;
    }> => {
      const { data } = await api.post('/auth/verify-reset-otp', payload);
      return data;
    },
    resetPassword: async (payload: Record<string, unknown>): Promise<{
      message: string;
      success: boolean;
    }> => {
      const { data } = await api.post('/auth/reset-password', payload);
      return data;
    },
  },

  // User Profiles
  profiles: {
    getMe: async (): Promise<Profile> => {
      const { data } = await api.get('/profiles/me');
      return data;
    },
    getAll: async (): Promise<Profile[]> => {
      const { data } = await api.get('/profiles');
      return data;
    },
    getOne: async (id: string): Promise<Profile> => {
      const { data } = await api.get(`/profiles/${id}`);
      return data;
    },
    updateMe: async (profileData: Record<string, unknown>): Promise<Profile> => {
      const { data } = await api.put('/profiles/me', profileData);
      return data;
    },
    updateByAdmin: async (id: string, profileData: Record<string, unknown>): Promise<Profile> => {
      const { data } = await api.put(`/profiles/${id}`, profileData);
      return data;
    },
    delete: async (id: string): Promise<void> => {
      await api.delete(`/profiles/${id}`);
    },
  },

  // Clinic Settings
  settings: {
    get: async (): Promise<ClinicSettings> => {
      const { data } = await api.get('/settings');
      return data;
    },
    update: async (settingsData: Record<string, unknown>): Promise<Record<string, unknown>> => {
      const { data } = await api.put('/settings', settingsData);
      return data;
    },
  },

  // Notifications
  notifications: {
    getMine: async (): Promise<Notification[]> => {
      const { data } = await api.get('/notifications');
      return data;
    },
    getAdmin: async (): Promise<Notification[]> => {
      const { data } = await api.get('/notifications/admin');
      return data;
    },
    markAsRead: async (id: string): Promise<Notification> => {
      const { data } = await api.patch(`/notifications/${id}/read`);
      return data;
    },
    markAllAsRead: async (): Promise<void> => {
      await api.patch('/notifications/read-all');
    },
    create: async (notificationData: Record<string, unknown>): Promise<Notification> => {
      const { data } = await api.post('/notifications', notificationData);
      return data;
    },
  },

  // CMS
  cms: {
    getAll: async (): Promise<Record<string, unknown>[]> => {
      const { data } = await api.get('/cms');
      return data;
    },
    getSection: async (section: string): Promise<Record<string, unknown>> => {
      const { data } = await api.get(`/cms/${section}`);
      return data;
    },
    updateSection: async (section: string, contentJson: Record<string, unknown>): Promise<Record<string, unknown>> => {
      const { data } = await api.put(`/cms/${section}`, { contentJson });
      return data;
    },
  },

  // Chatbot
  chatbot: {
    getAllKnowledge: async (): Promise<KB[]> => {
      const { data } = await api.get('/chatbot/knowledge');
      return data;
    },
    upsertKnowledge: async (kbData: Record<string, unknown>): Promise<KB> => {
      const { data } = await api.post('/chatbot/knowledge', kbData);
      return data;
    },
    toggleKnowledge: async (id: string): Promise<void> => {
      await api.patch(`/chatbot/knowledge/${id}/toggle`);
    },
    deleteKnowledge: async (id: string): Promise<void> => {
      await api.delete(`/chatbot/knowledge/${id}`);
    },
  },

  // Appointments
  appointments: {
    getAll: async (): Promise<Appointment[]> => {
      const { data } = await api.get('/appointments');
      return data;
    },
    getAvailableSlots: async (date: string): Promise<string[]> => {
      const { data } = await api.get(`/appointments/available-slots?date=${date}`);
      return data;
    },
    create: async (appointmentData: Record<string, unknown>): Promise<Appointment> => {
      const { data } = await api.post('/appointments', appointmentData);
      return data;
    },
    updateStatus: async (id: string, status: string): Promise<Appointment> => {
      const { data } = await api.patch(`/appointments/${id}/status`, { status });
      return data;
    },
    update: async (id: string, appointmentData: Record<string, unknown>): Promise<Appointment> => {
      const { data } = await api.put(`/appointments/${id}`, appointmentData);
      return data;
    },
    delete: async (id: string): Promise<void> => {
      await api.delete(`/appointments/${id}`);
    },
  },

  // Medical History & Screenings
  medical: {
    getHistory: async (patientId?: string): Promise<unknown> => {
      const url = patientId ? `/medical/history/${patientId}` : '/medical/history';
      const { data } = await api.get(url);
      return data;
    },
    updateHistory: async (historyData: Record<string, unknown>, patientId?: string): Promise<unknown> => {
      const url = patientId ? `/medical/history/${patientId}` : '/medical/history';
      const { data } = await api.post(url, historyData);
      return data;
    },
    getScreenings: async (patientId?: string): Promise<Screening[]> => {
      const url = patientId ? `/medical/screenings?patientId=${patientId}` : '/medical/screenings';
      const { data } = await api.get(url);
      return data;
    },
    getAllScreenings: async (): Promise<Screening[]> => {
      const { data } = await api.get('/medical/screenings/all');
      return data;
    },
    createScreening: async (screeningData: Record<string, unknown>): Promise<Screening> => {
      const { data } = await api.post('/medical/screenings', screeningData);
      return data;
    },
    updateScreening: async (id: string, screeningData: Record<string, unknown>): Promise<Screening> => {
      const { data } = await api.put(`/medical/screenings/${id}`, screeningData);
      return data;
    },
  },

  // Dashboard Stats
  dashboard: {
    getAdminStats: async (): Promise<AdminStats> => {
      const { data } = await api.get('/dashboard/admin');
      return data;
    },
    getUserStats: async (): Promise<unknown> => {
      const { data } = await api.get('/dashboard/user');
      return data;
    },
  },

  // Clinical Services
  services: {
    getAll: async (): Promise<Service[]> => {
      const { data } = await api.get('/services');
      return data;
    },
    getAdminAll: async (): Promise<Service[]> => {
      const { data } = await api.get('/services/all');
      return data;
    },
    create: async (serviceData: Record<string, unknown>): Promise<Service> => {
      const { data } = await api.post('/services', serviceData);
      return data;
    },
    update: async (id: string, serviceData: Record<string, unknown>): Promise<Service> => {
      const { data } = await api.put(`/services/${id}`, serviceData);
      return data;
    },
    delete: async (id: string): Promise<void> => {
      await api.delete(`/services/${id}`);
    },
    reorder: async (orderData: { id: string; displayOrder: number }[]): Promise<void> => {
      await api.post('/services/reorder', { services: orderData });
    },
  },

  // Reviews
  reviews: {
    getApproved: async (): Promise<Review[]> => {
      const { data } = await api.get('/reviews/approved');
      return data;
    },
    getAll: async (): Promise<Review[]> => {
      const { data } = await api.get('/reviews');
      return data;
    },
    updateStatus: async (id: string, approved: boolean): Promise<unknown> => {
      const { data } = await api.put(`/reviews/${id}/status`, { approved });
      return data;
    },
    create: async (reviewData: Record<string, unknown>): Promise<unknown> => {
      const { data } = await api.post('/reviews', reviewData);
      return data;
    },
    approve: async (id: string): Promise<unknown> => {
      const { data } = await api.patch(`/reviews/${id}/approve`);
      return data;
    },
    unapprove: async (id: string): Promise<unknown> => {
      const { data } = await api.patch(`/reviews/${id}/unapprove`);
      return data;
    },
    delete: async (id: string): Promise<void> => {
      await api.delete(`/reviews/${id}`);
    },
  },

  // Prescriptions
  prescriptions: {
    mine: async (): Promise<Prescription[]> => {
      const { data } = await api.get('/prescriptions/mine');
      return data;
    },
    getByPatient: async (patientId: string): Promise<Prescription[]> => {
      const { data } = await api.get(`/prescriptions/patient/${patientId}`);
      return data;
    },
    create: async (pData: Record<string, unknown>): Promise<Prescription> => {
      const { data } = await api.post('/prescriptions', pData);
      return data;
    }
  },

  // Invoices
  invoices: {
    mine: async (): Promise<Invoice[]> => {
      const { data } = await api.get('/invoices/mine');
      return data;
    },
    getByPatient: async (patientId: string): Promise<Invoice[]> => {
      const { data } = await api.get(`/invoices/patient/${patientId}`);
      return data;
    },
    create: async (iData: Record<string, unknown>): Promise<Invoice> => {
      const { data } = await api.post('/invoices', iData);
      return data;
    }
  },

  // Medical History
  medicalHistory: {
    get: async (): Promise<MedicalHistory> => {
      const { data } = await api.get('/medical/history');
      return data;
    },
    update: async (historyData: Record<string, unknown>): Promise<MedicalHistory> => {
      const { data } = await api.post('/medical/history', historyData);
      return data;
    },
    getByPatient: async (patientId: string): Promise<MedicalHistory> => {
      const { data } = await api.get(`/medical/history/${patientId}`);
      return data;
    }
  },

  // User Management
  users: {
    getAll: async (): Promise<User[]> => {
      const { data } = await api.get('/users');
      return data;
    },
    delete: async (id: string): Promise<void> => {
      await api.delete(`/users/${id}`);
    }
  },

  // Media upload
  media: {
    upload: async (file: File): Promise<{ url: string }> => {
      const formData = new FormData();
      formData.append('file', file);
      const { data } = await api.post('/media/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return data;
    }
  },
  
  // SMS Management
  sms: {
    getLogs: async (): Promise<SMSLog[]> => {
      const { data } = await api.get('/sms/logs');
      return data;
    },
    getStats: async (): Promise<SMSStats> => {
      const { data } = await api.get('/sms/stats');
      return data;
    },
    sendBulk: async (bulkData: { message: string; recipients: 'all' | string[] }): Promise<{ message: string; details: Record<string, unknown> }> => {
      const { data } = await api.post('/sms/send-bulk', bulkData);
      return data;
    }
  }
};

export default api;
