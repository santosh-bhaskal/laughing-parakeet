import apiClient from './client';
import { ENDPOINTS } from './endpoints';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getExpoPushToken, notificationPlatform } from '../notifications/pushNotifications';

const PUSH_TOKEN_STORAGE_KEY = '@expo_push_token';

const pushNotificationService = {
  registerCurrentDevice: async () => {
    try {
      const token = await getExpoPushToken();
      if (!token) return;
      await apiClient.post(ENDPOINTS.PUSH_TOKEN, { token, platform: notificationPlatform });
      await AsyncStorage.setItem(PUSH_TOKEN_STORAGE_KEY, token);
    } catch (error) {
      // A notification setup failure must never prevent the user from signing in.
      console.warn('Could not register Expo push notifications', error);
    }
  },

  unregisterCurrentDevice: async () => {
    const token = await AsyncStorage.getItem(PUSH_TOKEN_STORAGE_KEY);
    if (!token) return;
    try {
      // This runs before the auth token is removed, so the API can identify the user.
      await apiClient.delete(ENDPOINTS.PUSH_TOKEN, { data: { token } });
    } catch (error) {
      console.warn('Could not remove Expo push token', error);
    } finally {
      await AsyncStorage.removeItem(PUSH_TOKEN_STORAGE_KEY);
    }
  },
};

// ---------------- AUTH SERVICE ----------------
export const authService = {
  login: async (credentials: { email: string; password?: string }) => {
    const res = await apiClient.post(ENDPOINTS.LOGIN, credentials);
    const { token, user } = res.data?.data || res.data;
    if (token) {
      await AsyncStorage.setItem('@auth_token', token);
      await AsyncStorage.setItem('@auth_user', JSON.stringify(user));
      void pushNotificationService.registerCurrentDevice();
    }
    return { token, user };
  },

  signup: async (userData: any) => {
    const res = await apiClient.post(ENDPOINTS.SIGNUP, userData);
    return res.data;
  },

  logout: async () => {
    await pushNotificationService.unregisterCurrentDevice();
    await AsyncStorage.removeItem('@auth_token');
    await AsyncStorage.removeItem('@auth_user');
  },

  getCurrentUser: async () => {
    const json = await AsyncStorage.getItem('@auth_user');
    return json ? JSON.parse(json) : null;
  },
};

// ---------------- DASHBOARD SERVICE ----------------
export const dashboardService = {
  getTelemetry: async () => {
    const res = await apiClient.get(ENDPOINTS.DASHBOARD);
    return res.data?.data || res.data;
  },
};

// ---------------- DAILY RECORD SERVICE ----------------
export const dailyRecordService = {
  getAll: async () => {
    const res = await apiClient.get(ENDPOINTS.DAILY_RECORD);
    return res.data?.data || res.data;
  },

  create: async (data: {
    batchId?: number;
    date: string;
    birdAgeInDays: number;
    feedConsumedBags: number;
    mortalityCount: number;
  }) => {
    const res = await apiClient.post(ENDPOINTS.DAILY_RECORD, data);
    return res.data?.data || res.data;
  },

  update: async (id: number | string, data: any) => {
    const res = await apiClient.put(`${ENDPOINTS.DAILY_RECORD}/${id}`, data);
    return res.data?.data || res.data;
  },

  delete: async (id: number | string) => {
    const res = await apiClient.patch(ENDPOINTS.DAILY_RECORD_DELETE(id));
    return res.data;
  },
};

// ---------------- INVENTORY SERVICE ----------------
export const inventoryService = {
  getBirdInventories: async () => {
    const res = await apiClient.get(ENDPOINTS.BIRD_INVENTORY);
    return res.data?.data || res.data;
  },

  createBirdInventory: async (data: any) => {
    const res = await apiClient.post(ENDPOINTS.BIRD_INVENTORY, data);
    return res.data?.data || res.data;
  },

  updateBirdInventory: async (id: number | string, data: any) => {
    const res = await apiClient.put(`${ENDPOINTS.BIRD_INVENTORY}/${id}`, data);
    return res.data?.data || res.data;
  },

  deleteBirdInventory: async (id: number | string) => {
    const res = await apiClient.patch(ENDPOINTS.BIRD_INVENTORY_DELETE(id));
    return res.data;
  },

  getFeedInventories: async () => {
    const res = await apiClient.get(ENDPOINTS.FEED_INVENTORY);
    return res.data?.data || res.data;
  },

  createFeedInventory: async (data: any) => {
    const res = await apiClient.post(ENDPOINTS.FEED_INVENTORY, data);
    return res.data?.data || res.data;
  },

  updateFeedInventory: async (id: number | string, data: any) => {
    const res = await apiClient.put(`${ENDPOINTS.FEED_INVENTORY}/${id}`, data);
    return res.data?.data || res.data;
  },

  deleteFeedInventory: async (id: number | string) => {
    const res = await apiClient.patch(ENDPOINTS.FEED_INVENTORY_DELETE(id));
    return res.data;
  },
};

// ---------------- STOCK OUT SERVICE ----------------
export const stockOutService = {
  getMasters: async () => {
    const res = await apiClient.get(ENDPOINTS.STOCKOUT_MASTER);
    return res.data?.data || res.data;
  },

  createMaster: async (data: any) => {
    const res = await apiClient.post(ENDPOINTS.STOCKOUT_MASTER, data);
    return res.data?.data || res.data;
  },

  updateMaster: async (id: number | string, data: any) => {
    const res = await apiClient.put(`${ENDPOINTS.STOCKOUT_MASTER}/finalize/${id}`, data);
    return res.data?.data || res.data;
  },

  deleteMaster: async (id: number | string) => {
    const res = await apiClient.patch(ENDPOINTS.STOCKOUT_MASTER_DELETE(id));
    return res.data;
  },

  getMasterById: async (masterId: number | string) => {
    const res = await apiClient.get(`${ENDPOINTS.STOCKOUT_MASTER}/${masterId}`);
    return res.data?.data || res.data;
  },

  getEntries: async (masterId: number | string) => {
    const res = await apiClient.get(ENDPOINTS.STOCKOUT_ENTRIES_BY_MASTER(masterId));
    const entries = res.data?.entries || res.data?.data?.entries || res.data?.data || res.data;
    return Array.isArray(entries) ? entries : [];
  },

  addEntry: async (entryData: any) => {
    const payload = {
      stockOutMasterId: Number(entryData.stockOutMasterId ?? entryData.masterId),
      birds: Number(entryData.birds) || 0,
      weight: Number(entryData.weight) || 0,
    };
    const res = await apiClient.post(ENDPOINTS.STOCKOUT_ENTRY, payload);
    return res.data?.entry || res.data?.data || res.data;
  },

  createEntry: async (entryData: any) => {
    const payload = {
      stockOutMasterId: Number(entryData.stockOutMasterId ?? entryData.masterId),
      birds: Number(entryData.birds) || 0,
      weight: Number(entryData.weight) || 0,
    };
    const res = await apiClient.post(ENDPOINTS.STOCKOUT_ENTRY, payload);
    return res.data?.entry || res.data?.data || res.data;
  },

  updateEntry: async (id: number | string, data: any) => {
    const res = await apiClient.put(`${ENDPOINTS.STOCKOUT_ENTRY}/${id}`, data);
    return res.data?.data || res.data;
  },

  deleteEntry: async (id: number | string) => {
    const res = await apiClient.delete(`${ENDPOINTS.STOCKOUT_ENTRY}/${id}`);
    return res.data;
  },

  finalizeMaster: async (id: number | string, data: any) => {
    const res = await apiClient.put(`${ENDPOINTS.STOCKOUT_MASTER}/finalize/${id}`, data);
    return res.data?.data || res.data;
  },
};

// ---------------- FINAL REPORT SERVICE ----------------
export const finalReportService = {
  getAll: async () => {
    const res = await apiClient.get(ENDPOINTS.FINAL_REPORT);
    return res.data?.data || res.data;
  },

  getPrepareData: async (batchId?: number | string) => {
    const url = batchId
      ? `${ENDPOINTS.FINAL_REPORT_PREPARE}?batchId=${batchId}`
      : ENDPOINTS.FINAL_REPORT_PREPARE;
    const res = await apiClient.get(url);
    return res.data?.data || res.data;
  },

  getById: async (id: number | string) => {
    const res = await apiClient.get(ENDPOINTS.FINAL_REPORT_BY_ID(id));
    return res.data?.data || res.data;
  },

  create: async (data: any) => {
    const res = await apiClient.post(ENDPOINTS.FINAL_REPORT, data);
    return res.data?.data || res.data;
  },

  update: async (id: number | string, data: any) => {
    const res = await apiClient.put(`${ENDPOINTS.FINAL_REPORT}/${id}`, data);
    return res.data?.data || res.data;
  },

  delete: async (id: number | string) => {
    const res = await apiClient.patch(ENDPOINTS.FINAL_REPORT_DELETE(id));
    return res.data;
  },
};
