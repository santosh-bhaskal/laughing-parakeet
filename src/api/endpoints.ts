export const ENDPOINTS = {
  // Auth
  LOGIN: '/auth/login',
  SIGNUP: '/auth/signup',
  RESET_PASSWORD: '/auth/reset-password',

  // Expo push notifications
  PUSH_TOKEN: '/notifications/push-token',

  // Dashboard Telemetry
  DASHBOARD: '/dashboard',

  // Daily Production Records
  DAILY_RECORD: '/dailyrecord',
  DAILY_RECORD_DELETE: (id: string | number) => `/dailyrecord/soft-delete/${id}`,

  // Bird Inventory
  BIRD_INVENTORY: '/birdsinventory',
  BIRD_INVENTORY_DELETE: (id: string | number) => `/birdsinventory/soft-delete/${id}`,

  // Feed Inventory
  FEED_INVENTORY: '/feedinventory',
  FEED_INVENTORY_DELETE: (id: string | number) => `/feedinventory/soft-delete/${id}`,

  // Final Settlement Reports
  FINAL_REPORT: '/finalreport',
  FINAL_REPORT_BY_ID: (id: string | number) => `/finalreport/${id}`,
  FINAL_REPORT_PREPARE: '/finalreport/prepare',
  FINAL_REPORT_DELETE: (id: string | number) => `/finalreport/soft-delete/${id}`,

  // Stock Out Dispatches
  STOCKOUT_MASTER: '/stockout/master',
  STOCKOUT_MASTER_DELETE: (id: string | number) => `/stockout/master/soft-delete/${id}`,
  STOCKOUT_ENTRY: '/stockout/entry',
  STOCKOUT_ENTRIES_BY_MASTER: (masterId: string | number) => `/stockout/entry/${masterId}`,
};
