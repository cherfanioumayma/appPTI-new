// Configuration Firebase
export const FIREBASE_CONFIG = {
  apiKey: "your-api-key",
  authDomain: "your-auth-domain",
  projectId: "your-project-id",
  storageBucket: "your-storage-bucket",
  messagingSenderId: "your-messaging-sender-id",
  appId: "your-app-id"
};

// Types d'utilisateurs
export const USER_ROLES = {
  WORKER: 'worker',
  SUPERVISOR: 'supervisor',
  ADMIN: 'admin'
};

// Types d'alertes
export const ALERT_TYPES = {
  MANUAL: 'manual',
  AUTOMATIC: 'automatic',
  FALL: 'fall',
  IMMOBILITY: 'immobility',
  SOS: 'sos'
};

// Statuts d'alerte
export const ALERT_STATUS = {
  PENDING: 'pending',
  ACKNOWLEDGED: 'acknowledged',
  RESOLVED: 'resolved',
  CANCELLED: 'cancelled'
};

// Configuration GPS
export const GPS_CONFIG = {
  UPDATE_INTERVAL: 10000, // 10 secondes
  ACCURACY: 10, // 10 mètres
  DISTANCE_FILTER: 10 // 10 mètres
};

// Configuration audio
export const AUDIO_CONFIG = {
  QUALITY: 'high',
  SAMPLE_RATE: 44100,
  CHANNELS: 1,
  BITRATE: 128000
};

// Couleurs du thème
export const COLORS = {
  primary: '#2196F3',
  secondary: '#FF9800',
  success: '#4CAF50',
  danger: '#F44336',
  warning: '#FFC107',
  info: '#00BCD4',
  light: '#F5F5F5',
  dark: '#212121',
  white: '#FFFFFF',
  black: '#000000',
  gray: '#9E9E9E',
  lightGray: '#E0E0E0'
};

// Configuration des notifications
export const NOTIFICATION_CONFIG = {
  CHANNEL_ID: 'pti-alerts',
  CHANNEL_NAME: 'Alertes PTI',
  CHANNEL_DESCRIPTION: 'Notifications d\'alertes de sécurité'
};

// URLs API (à configurer selon votre backend)
export const API_URLS = {
  BASE_URL: 'https://your-api-domain.com/api',
  ALERTS: '/alerts',
  USERS: '/users',
  LOCATIONS: '/locations',
  AUDIO: '/audio'
}; 