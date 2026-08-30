import axios from 'axios';

const configuredUrl = process.env.REACT_APP_CRM_API_URL || '/api';
let baseURL = configuredUrl;
try {
  const browserLocation = typeof window !== 'undefined' ? window.location : null;
  const url = new URL(configuredUrl, browserLocation?.origin || 'https://datalabgeorgia.ge');
  if (browserLocation && ['localhost', '127.0.0.1'].includes(url.hostname) && ['localhost', '127.0.0.1'].includes(browserLocation.hostname)) {
    url.hostname = browserLocation.hostname;
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
