// Ensure import.meta.env is evaluated at module load time
const env = import.meta.env;
const viteApiBaseUrl = env?.VITE_API_BASE_URL;

export const API_BASE_URL: string = viteApiBaseUrl || 'http://127.0.0.1:5000';


export const ENABLE_PROFILE: boolean = typeof API_BASE_URL === 'string' && (
  API_BASE_URL.includes('localhost') || API_BASE_URL.includes('127.0.0.1')
);

