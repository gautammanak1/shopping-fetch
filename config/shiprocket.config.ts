export const SHIPROCKET_CONFIG = {
  EMAIL: process.env.SHIPROCKET_EMAIL || '',
  PASSWORD: process.env.SHIPROCKET_PASSWORD || '',
  PICKUP_PINCODE: process.env.SHIPROCKET_PICKUP_PINCODE || '201301',
  PICKUP_LOCATION: process.env.SHIPROCKET_PICKUP_LOCATION || 'Home',
  API_BASE_URL: 'https://apiv2.shiprocket.in/v1/external',
  TOKEN_VALIDITY_HOURS: 240,
} as const

