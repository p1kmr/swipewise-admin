import { createContext, useContext, useEffect, useReducer } from "react";

const STORAGE_KEY = "swipewise-admin-theme";

const initialState = {
  theme: "light",
};

function getInitialTheme() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "light" || stored === "dark") {
    return stored;
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function reducer(state, action) {
  switch (action.type) {
    case "SET_THEME":
      return { theme: action.payload };
    case "TOGGLE":
      return { theme: state.theme === "dark" ? "light" : "dark" };
    default:
      return state;
  }
}

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState, () => ({
    theme: getInitialTheme(),
  }));

  useEffect(() => {
    const root = document.documentElement;
    if (state.theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem(STORAGE_KEY, state.theme);
  }, [state.theme]);

  const value = {
    theme: state.theme,
    setTheme: (theme) => dispatch({ type: "SET_THEME", payload: theme }),
    toggleTheme: () => dispatch({ type: "TOGGLE" }),
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useThemeContext() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useThemeContext must be used within ThemeProvider");
  }
  return ctx;
}
