import { createContext, useContext, useEffect, useReducer } from "react";
import { apiFetch, getStoredToken, setStoredToken } from "../services/apiClient.js";

const initialState = { user: null, loading: true };

function reducer(state, action) {
  switch (action.type) {
    case "AUTH_CHANGED":
      return { user: action.user, loading: false };
    case "SIGNED_OUT":
      return { user: null, loading: false };
    case "LOADING_DONE":
      return { ...state, loading: false };
    default:
      return state;
  }
}

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      dispatch({ type: "SIGNED_OUT" });
      return;
    }

    apiFetch("/api/auth/me")
      .then(({ user }) => dispatch({ type: "AUTH_CHANGED", user }))
      .catch(() => {
        setStoredToken(null);
        dispatch({ type: "SIGNED_OUT" });
      });
  }, []);

  const value = {
    user: state.user,
    isAdmin: state.user?.role === "admin",
    loading: state.loading,
    isAuthenticated: Boolean(state.user),
    login: async (email, password) => {
      const { token, user } = await apiFetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      setStoredToken(token);
      dispatch({ type: "AUTH_CHANGED", user });
      return user;
    },
    logout: () => {
      setStoredToken(null);
      dispatch({ type: "SIGNED_OUT" });
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuthContext must be used within AuthProvider");
  }
  return ctx;
}
