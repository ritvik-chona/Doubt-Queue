import axios from 'axios';

export const SESSION_EXPIRED_EVENT = 'auth:expired';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
});

// Turns the server's { error: { message, details } } into an Error with
// .status, .details and .fieldErrors ({ field: message }) for forms.
api.interceptors.response.use(
  (response) => response,
  (err) => {
    if (axios.isCancel(err)) return Promise.reject(err);

    const status = err.response?.status;
    const body = err.response?.data?.error;
    const message =
      body?.message ||
      (err.response ? `Request failed (${status})` : 'Cannot reach the server. Check your connection.');

    const error = new Error(message);
    error.status = status;
    error.details = body?.details ?? [];
    error.fieldErrors = Object.fromEntries(error.details.map((d) => [d.field, d.message]));

    // A 401 from anything other than the session check or login means the
    // cookie expired mid-session; AuthContext listens and signs the user out.
    const url = err.config?.url ?? '';
    if (status === 401 && !url.startsWith('/auth/')) {
      window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
    }

    return Promise.reject(error);
  }
);

export const isCanceled = (err) => axios.isCancel(err);

export default api;
