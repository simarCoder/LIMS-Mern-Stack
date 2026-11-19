import { useState, useEffect, useCallback } from "react";
import { authLogin, authLogout, authMe } from "../services/api";

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState("");

  // Check existing session on application initialization
  useEffect(() => {
    let active = true;

    authMe()
      .then((data) => {
        if (active && data?.user) {
          setUser(data.user);
        }
      })
      .catch(() => {
        if (active) {
          setUser(null);
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(async (labCode, username, password) => {
    setAuthError("");
    try {
      const res = await authLogin(labCode, username, password);
      if (res?.user) {
        setUser(res.user);
        return res.user;
      }
      throw new Error("Login failed. No user profile returned.");
    } catch (err) {
      setAuthError(err.message || "Failed to sign in. Please verify credentials.");
      throw err;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authLogout();
    } catch {
      // Ignored during client-side logout
    } finally {
      setUser(null);
    }
  }, []);

  return {
    user,
    isAuthenticated: Boolean(user),
    loading,
    authError,
    setAuthError,
    login,
    logout,
  };
}
