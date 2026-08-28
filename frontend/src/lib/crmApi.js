import axios from 'axios';

const configuredUrl = process.env.REACT_APP_CRM_API_URL || 'http://localhost:8000/api';
let baseURL = configuredUrl;
try {
  const url = new URL(configuredUrl, window.location.origin);
  if (['localhost', '127.0.0.1'].includes(url.hostname) && ['localhost', '127.0.0.1'].includes(window.location.hostname)) {
    url.hostname = window.location.hostname;
  }
  baseURL = url.toString().replace(/\/$/, '');
} catch {
  baseURL = configuredUrl;
}

const crmApi = axios.create({
  baseURL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

export default crmApi;
