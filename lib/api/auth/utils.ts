const ACCESS_COOKIE = "accessKey";
const AUTH_REDIRECT_EVENT = "auth:redirect-login";

type JwtPayload = {
  exp?: number;
  roles?: string[];
  schoolId?: number;
  sub?: string;
};

export const redirectToLogin = () => {
  if (typeof window === "undefined") {
    return;
  }
  const event = new CustomEvent(AUTH_REDIRECT_EVENT, { cancelable: true });
  const handled = window.dispatchEvent(event);

  if (!handled && window.location.pathname !== "/login") {
    window.location.replace("/login");
  }
};

export const AUTH_REDIRECT_EVENT_NAME = AUTH_REDIRECT_EVENT;

export const getCookieValue = (name: string) => {
  if (typeof document === "undefined") {
    return null;
  }
  const match = document.cookie.match(
    new RegExp(
      `(?:^|; )${name.replace(/[-\.$?*|{}\(\)\[\]\\/\+^]/g, "\\$&")}=([^;]*)`
    )
  );
  return match ? decodeURIComponent(match[1]) : null;
};

export const getAccessToken = () => getCookieValue(ACCESS_COOKIE);

export const decodeJwtPayload = (token: string) => {
  const parts = token.split(".");
  if (parts.length !== 3) {
    return null;
  }
  const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
  try {
    const json = atob(padded);
    return JSON.parse(json) as JwtPayload;
  } catch {
    return null;
  }
};

export const isTokenExpired = (token: string) => {
  const payload = decodeJwtPayload(token);
  if (!payload?.exp) {
    return false;
  }
  return Date.now() >= payload.exp * 1000;
};

export const getCurrentUser = () => {
  const token = getAccessToken();
  if (!token) {
    return null;
  }
  const payload = decodeJwtPayload(token);
  if (!payload) {
    return null;
  }

  console.log("Decoded JWT payload:", payload);

  return {
    username: payload.sub,
    roles: payload.roles || [],
    schoolId: payload.schoolId,
  };
};
