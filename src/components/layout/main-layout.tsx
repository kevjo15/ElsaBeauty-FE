import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/services/api/authContext";
import ModeToggle from "@/components/mode-toggle";
import Logo from "@/components/Logo";
import Footer from "@/components/layout/Footer";
import NotificationCenter from "@/components/NotificationCenter";
import { Menu, Home, Scissors, Calendar, LogOut, Shield, Briefcase } from "lucide-react";

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const role = user?.role?.toLowerCase() || "";
  const isAdmin = role.includes("admin");
  const isEmployee = role.includes("employee");

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    [
      "btn btn-ghost btn-sm rounded-full transition",
      isActive
        ? "bg-primary/10 text-primary ring-1 ring-primary/20"
        : "text-base-content/80 hover:bg-base-200",
    ].join(" ");

  return (
    <div className="flex flex-col min-h-screen">
      {/* Polished Navbar */}
      <div className="navbar sticky top-0 z-40 bg-base-100/80 supports-[backdrop-filter]:bg-base-100/70 backdrop-blur border-b border-base-300/60 shadow-sm">
        {/* Left: Mobile menu + Brand */}
        <div className="navbar-start">
          {/* Mobile dropdown */}
          <div className="dropdown">
            <div tabIndex={0} role="button" className="btn btn-ghost lg:hidden">
              <Menu className="h-5 w-5" />
            </div>
            <ul
              tabIndex={0}
              className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow-lg bg-base-100 rounded-box w-56"
            >
              <li>
                <NavLink to="/dashboard" className={linkClass}>
                  <Home className="h-4 w-4" />
                  Dashboard
                </NavLink>
              </li>
              <li>
                <NavLink to="/services" className={linkClass}>
                  <Scissors className="h-4 w-4" />
                  Behandlingar
                </NavLink>
              </li>
              <li>
                <NavLink to="/bookings/history" className={linkClass}>
                  <Calendar className="h-4 w-4" />
                  Bokningar
                </NavLink>
              </li>
              {isEmployee && !isAdmin && (
                <li>
                  <NavLink to="/employee" className={linkClass}>
                    <Briefcase className="h-4 w-4" />
                    Medarbetare
                  </NavLink>
                </li>
              )}
              {isAdmin && (
                <li>
                  <NavLink to="/admin" className={linkClass}>
                    <Shield className="h-4 w-4" />
                    Admin
                  </NavLink>
                </li>
              )}
              <li className="mt-2">
                <button onClick={handleLogout} className="btn btn-ghost btn-sm">
                  <LogOut className="h-4 w-4" />
                  Logga ut
                </button>
              </li>
            </ul>
          </div>

          <button
            className="btn btn-ghost px-2"
            onClick={() => navigate("/dashboard")}
            aria-label="Till din översikt"
          >
            <Logo markSize={24} />
          </button>
        </div>

        {/* Center: Desktop nav */}
        <div className="navbar-center hidden lg:flex">
          <nav className="flex items-center gap-2">
            <NavLink to="/dashboard" className={linkClass}>
              <Home className="h-4 w-4" />
              Dashboard
            </NavLink>
            <NavLink to="/services" className={linkClass}>
              <Scissors className="h-4 w-4" />
              Behandlingar
            </NavLink>
            <NavLink to="/bookings/history" className={linkClass}>
              <Calendar className="h-4 w-4" />
              Bokningar
            </NavLink>
            {isEmployee && !isAdmin && (
              <NavLink to="/employee" className={linkClass}>
                <Briefcase className="h-4 w-4" />
                Medarbetare
              </NavLink>
            )}
            {isAdmin && (
              <NavLink to="/admin" className={linkClass}>
                <Shield className="h-4 w-4" />
                Admin
              </NavLink>
            )}
          </nav>
        </div>

        {/* Right: Theme + Notifications + Avatar */}
        <div className="navbar-end">
          <div className="mr-1">
            <ModeToggle />
          </div>
          <div className="mr-1">
            <NotificationCenter userId={user?.id} />
          </div>
          <div className="dropdown dropdown-end">
            <div
              tabIndex={0}
              role="button"
              className="btn btn-circle avatar placeholder"
            >
              {user?.avatarUrl ? (
                <div className="w-10 rounded-full ring-1 ring-primary/20">
                  <img src={user.avatarUrl} alt="Din profilbild" />
                </div>
              ) : (
                <div className="bg-primary/15 text-primary rounded-full w-10 h-10 flex items-center justify-center pt-2 ring-1 ring-primary/20">
                  <span className="text-xl leading-none">
                    {user?.firstName?.charAt(0) || "U"}
                  </span>
                </div>
              )}
            </div>
            <ul
              tabIndex={0}
              className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow-lg bg-base-100 rounded-box w-56"
            >
              <li className="menu-title px-4 py-2">
                <span className="text-sm font-medium">
                  {user?.firstName || user?.email || "Användare"}
                </span>
                {user?.role && (
                  <span className="text-xs text-base-content/60">
                    {isAdmin ? "Administratör" : isEmployee ? "Medarbetare" : "Kund"}
                  </span>
                )}
              </li>
              <div className="divider my-0"></div>
              <li>
                <a onClick={() => navigate("/profile")}>Profil</a>
              </li>
              <li>
                <a onClick={handleLogout}>
                  <LogOut className="h-4 w-4" />
                  Logga ut
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Main Content — tonad yta i ljust läge så korten (base-100) lyfter;
          mörkt läge återgår till ren bas */}
      <main className="flex-1 p-6 bg-base-200/40 dark:bg-transparent">{children}</main>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default MainLayout;
