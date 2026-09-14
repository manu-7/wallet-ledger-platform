import { createContext, useContext, useState, useCallback } from "react";
import { apiRequest } from "../api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [accessToken, setAccessToken] = useState(localStorage.getItem("wl_access_token"));
  const [userEmail, setUserEmail] = useState(localStorage.getItem("wl_user_email"));

  const login = useCallback(async (email, password) => {
    const tokens = await apiRequest("/auth/login", {
      method: "POST",
      body: { email, password },
    });
    localStorage.setItem("wl_access_token", tokens.access_token);
    localStorage.setItem("wl_refresh_token", tokens.refresh_token);
    localStorage.setItem("wl_user_email", email);
    setAccessToken(tokens.access_token);
    setUserEmail(email);
  }, []);

  const signup = useCallback(async (email, password) => {
    await apiRequest("/auth/signup", { method: "POST", body: { email, password } });
    await login(email, password);
  }, [login]);

  const logout = useCallback(() => {
    localStorage.removeItem("wl_access_token");
    localStorage.removeItem("wl_refresh_token");
    localStorage.removeItem("wl_user_email");
    setAccessToken(null);
    setUserEmail(null);
  }, []);

  return (
    <AuthContext.Provider value={{ accessToken, userEmail, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
