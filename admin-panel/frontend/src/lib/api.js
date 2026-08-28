import axios from "axios";

function localBackendUrl(configuredUrl) {
  if (!configuredUrl || typeof window === "undefined") return configuredUrl;
  try {
    const url = new URL(configuredUrl);
    if (["localhost", "127.0.0.1"].includes(url.hostname) && ["localhost", "127.0.0.1"].includes(window.location.hostname)) {
      url.hostname = window.location.hostname;
    }
    return url.origin;
  } catch {
    return configuredUrl;
  }
}

const BACKEND_URL = localBackendUrl(process.env.REACT_APP_BACKEND_URL);
export const API = `${BACKEND_URL}/api`;

const http = axios.create({ baseURL: API, withCredentials: true });

http.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error?.config?.url || "";
    if (error?.response?.status === 401 && !url.includes("/auth/me")) {
      window.dispatchEvent(new CustomEvent("crm:unauthorized"));
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  config: async () => {
    const { data } = await http.get("/auth/config");
    return data;
  },
  me: async () => {
    const { data } = await http.get("/auth/me");
    return data;
  },
  login: async (payload) => {
    const { data } = await http.post("/auth/login", payload);
    return data;
  },
  logout: async () => {
    await http.post("/auth/logout");
  },
  loginUrl: `${API}/auth/google/login`,
};

export const usersApi = {
  list: async () => {
    const { data } = await http.get("/users");
    return data;
  },
  create: async (payload) => {
    const { data } = await http.post("/users", payload);
    return data;
  },
  update: async (id, payload) => {
    const { data } = await http.patch(`/users/${id}`, payload);
    return data;
  },
  revokeSessions: async (id) => {
    const { data } = await http.post(`/users/${id}/revoke-sessions`);
    return data;
  },
  pendingCount: async () => {
    const { data } = await http.get("/users/pending-count");
    return data;
  },
  approve: async (id, role) => {
    const { data } = await http.post(`/users/${id}/approve`, { role });
    return data;
  },
  reject: async (id) => {
    const { data } = await http.post(`/users/${id}/reject`);
    return data;
  },
};

export const portalApi = {
  tickets: async () => {
    const { data } = await http.get("/portal/tickets");
    return data;
  },
};

export const analyticsApi = {
  overview: async (params) => {
    const { data } = await http.get("/analytics/overview", { params });
    return data;
  },
};

export const websiteRequestsApi = {
  list: async () => {
    const { data } = await http.get("/website-requests");
    return data;
  },
  count: async () => {
    const { data } = await http.get("/website-requests/count");
    return data;
  },
  markRead: async (id) => {
    const { data } = await http.post(`/website-requests/${id}/read`);
    return data;
  },
  approve: async (id, payload) => {
    const { data } = await http.post(`/website-requests/${id}/approve`, payload);
    return data;
  },
  merge: async (id, payload) => {
    const { data } = await http.post(`/website-requests/${id}/merge`, payload);
    return data;
  },
  reject: async (id) => {
    const { data } = await http.post(`/website-requests/${id}/reject`);
    return data;
  },
};

export const ticketsApi = {
  list: async (params = {}) => {
    const clean = {};
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "" && v !== "all") clean[k] = v;
    });
    const { data } = await http.get("/tickets", { params: clean });
    return data;
  },
  counts: async () => {
    const { data } = await http.get("/tickets/counts");
    return data;
  },
  get: async (id) => {
    const { data } = await http.get(`/tickets/${id}`);
    return data;
  },
  create: async (payload) => {
    const { data } = await http.post("/tickets", payload);
    return data;
  },
  update: async (id, payload) => {
    const { data } = await http.put(`/tickets/${id}`, payload);
    return data;
  },
  addItem: async (id, payload) => {
    const { data } = await http.post(`/tickets/${id}/items`, payload);
    return data;
  },
  updateItem: async (id, itemId, payload) => {
    const { data } = await http.put(`/tickets/${id}/items/${itemId}`, payload);
    return data;
  },
  removeItem: async (id, itemId) => {
    const { data } = await http.delete(`/tickets/${id}/items/${itemId}`);
    return data;
  },
  remove: async (id) => {
    const { data } = await http.delete(`/tickets/${id}`);
    return data;
  },
  activities: async (id) => {
    const { data } = await http.get(`/tickets/${id}/activities`);
    return data;
  },
  addNote: async (id, message, itemId) => {
    const { data } = await http.post(`/tickets/${id}/activities`, {
      message,
      item_id: itemId || undefined,
    });
    return data;
  },
  companies: async () => {
    const { data } = await http.get("/companies");
    return data;
  },
  customers: async () => {
    const { data } = await http.get("/customers");
    return data;
  },
};

export default http;
