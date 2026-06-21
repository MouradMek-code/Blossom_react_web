// Set REACT_APP_API_URL in a .env file at the project root to point at your
// deployed backend (e.g. https://blossom-api.onrender.com). CRA only exposes
// env vars prefixed with REACT_APP_ to the browser bundle, and they're baked
// in at build time - changing .env requires restarting `npm start` (dev) or
// rebuilding (production).
export const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";
