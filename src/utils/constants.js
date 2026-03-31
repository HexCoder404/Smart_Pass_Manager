/** 
 * Central API configuration 
 * 
 * In production, this points to your Render backend.
 * In development, it points to your local node server (3001).
 */
export const API_URL = window.location.hostname === "localhost" 
  ? "http://localhost:3001" 
  : "https://hashsecure.onrender.com";
