import { NavLink } from "react-router-dom";
import { LayoutDashboard, Upload, Sparkles, ClipboardCheck, MessageSquare, Calendar, Globe, X } from "lucide-react";
import logo from "../assets/swipe-wise-logo.png";
import { ROUTES } from "../constants/routes.js";

const navItems = [
  { to: ROUTES.DASHBOARD, label: "Dashboard", icon: LayoutDashboard },
  { to: ROUTES.UPLOAD, label: "Upload Cards", icon: Upload },
  { to: ROUTES.GENERATE, label: "Generate with AI", icon: Sparkles },
  { to: ROUTES.SCRIPTS, label: "Scripts", icon: MessageSquare },
  { to: ROUTES.QOTD, label: "QOTD", icon: Calendar },
  { to: ROUTES.JURISDICTIONS, label: "Jurisdictions", icon: Globe },
  { to: ROUTES.REVIEW, label: "Review & Publish", icon: ClipboardCheck },
];

export default function Sidebar({ open = false, onClose = () => {} }) {
  return (
    <>
      {/* Mobile backdrop */}
      <div
        onClick={onClose}
        aria-hidden="true"
        className={`fixed inset-0 z-30 bg-black/50 transition-opacity lg:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 shrink-0 transform flex-col border-r border-surface-light-border bg-surface-light-card transition-transform duration-200 dark:border-surface-dark-border dark:bg-surface-dark-card lg:static lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-surface-light-border px-5 py-5 dark:border-surface-dark-border">
          <div>
            <img src={logo} alt="SwipeWise" className="h-10 w-auto object-contain" />
            <p className="mt-2 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Admin Panel
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-surface-dark-bg lg:hidden"
          >
            <X size={20} />
          </button>
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-3">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end
              onClick={onClose}
              className={({ isActive }) =>
                [
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition",
                  isActive
                    ? "bg-brand-gradient text-white shadow-sm"
                    : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-surface-dark-bg",
                ].join(" ")
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}
