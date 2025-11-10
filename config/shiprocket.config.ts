/**
 * Shiprocket Configuration
 * Hardcoded credentials (tested and working)
 * Environment variables override these if set
 */

export const SHIPROCKET_CONFIG = {
  // API User Credentials (from Settings > API > Create API User)
  // ✅ Tested and working credentials
  EMAIL: process.env.SHIPROCKET_EMAIL || 'gautammanak2@gmail.com',
  PASSWORD: process.env.SHIPROCKET_PASSWORD || '4z@ItFRvI9AhvC0Y',
  
  // Pickup Location Details
  // Location Name: "Home" (as configured in Shiprocket Dashboard > Settings > Pickup Locations)
  // Address: 374 Gali No. 2 Sector 59, Noida, UP
  // Pincode: 201301
  // City: Gautam Buddha Nagar
  // State: Uttar Pradesh
  // Country: India
  // Contact: GAUTAM KUMAR (9997355153, gautammanak1@gmail.com)
  PICKUP_PINCODE: process.env.SHIPROCKET_PICKUP_PINCODE || '201301',
  PICKUP_LOCATION: process.env.SHIPROCKET_PICKUP_LOCATION || 'Home', // Must match exact name "Home" from Shiprocket dashboard
  
  // API Base URL
  API_BASE_URL: 'https://apiv2.shiprocket.in/v1/external',
  
  // Token Settings
  TOKEN_VALIDITY_HOURS: 240, // 10 days as per Shiprocket docs
} as const

/**
 * Verified Shiprocket Account Details:
 * - Company ID: 3406078
 * - API User ID: 8419925
 * - API User Email: gautammanak2@gmail.com
 * - Token Status: ✅ Working
 * 
 * Pickup Location Configuration:
 * - Location Name: "Home"
 * - Address: 374 Gali No. 2 Sector 59, Noida, UP
 * - Pincode: 201301
 * - City: Gautam Buddha Nagar
 * - State: Uttar Pradesh
 * - Contact: GAUTAM KUMAR (Warehouse Manager)
 * - Phone: 9997355153 (Verified)
 * - Email: gautammanak1@gmail.com
 */

