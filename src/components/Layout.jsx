import { Outlet } from "react-router-dom";
import TopBar from "./TopBar.jsx";

export default function Layout() {
  return (
    <div className="flex min-h-screen flex-col">
      <TopBar />
      <main className="flex-1 p-4 sm:p-6">
        <Outlet />
      </main>
    </div>
  );
}
