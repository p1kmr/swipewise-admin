import { LogOut, Menu, Moon, Sun } from "lucide-react";
import { useAuth } from "../hooks/useAuth.js";
import { useTheme } from "../hooks/useTheme.js";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "../constants/routes.js";

export default function TopBar({ onMenuClick = () => {} }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate(ROUTES.LOGIN);
  }

  return (
    <header className="flex items-center justify-between gap-3 border-b border-surface-light-border bg-surface-light-card px-4 py-4 dark:border-surface-dark-border dark:bg-surface-dark-card sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Open menu"
          className="rounded-lg border border-surface-light-border p-2 text-gray-600 transition hover:bg-gray-50 dark:border-surface-dark-border dark:text-gray-300 dark:hover:bg-surface-dark-bg lg:hidden"
        >
          <Menu size={18} />
        </button>
        <div className="min-w-0">
          <h1 className="truncate text-base font-semibold sm:text-lg">SwipeWise Admin</h1>
          <p className="hidden text-sm text-gray-500 dark:text-gray-400 sm:block">
            Question management
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 sm:gap-3">
        <span className="hidden text-sm text-gray-600 dark:text-gray-300 md:inline">
          {user?.name || user?.email}
        </span>
        <button
          type="button"
          onClick={toggleTheme}
          className="rounded-lg border border-surface-light-border p-2 text-gray-600 transition hover:bg-gray-50 dark:border-surface-dark-border dark:text-gray-300 dark:hover:bg-surface-dark-bg"
          aria-label="Toggle theme"
        >
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <button
          type="button"
          onClick={handleLogout}
          className="inline-flex items-center gap-2 rounded-lg border border-surface-light-border px-2.5 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-surface-dark-border dark:text-gray-200 dark:hover:bg-surface-dark-bg sm:px-3"
        >
          <LogOut size={16} />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
}
