import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/services/api/authContext";
import ModeToggle from "@/components/mode-toggle";
import Logo from "@/components/Logo";
import Footer from "@/components/layout/Footer";
import { LogIn, UserPlus, Menu } from "lucide-react";

interface PublicLayoutProps {
  children: React.ReactNode;
}

const PublicLayout: React.FC<PublicLayoutProps> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="flex flex-col min-h-screen">
      {/* Navbar för publik sida */}
      <div className="navbar sticky top-0 z-40 bg-base-100/80 supports-[backdrop-filter]:bg-base-100/70 backdrop-blur border-b border-base-300/60 shadow-sm">
        <div className="navbar-start">
          {/* Mobilmeny — nav-länkarna (och auth på de minsta skärmarna) */}
          <div className="dropdown lg:hidden">
            <div
              tabIndex={0}
              role="button"
              className="btn btn-ghost btn-square"
              aria-label="Öppna meny"
            >
              <Menu className="h-5 w-5" />
            </div>
            <ul
              tabIndex={0}
              className="menu menu-sm dropdown-content mt-3 z-50 p-2 shadow-lg bg-base-100 rounded-box w-56 border border-base-300/60"
            >
              <li>
                <Link to="/#about">Om oss</Link>
              </li>
              <li>
                <Link to="/services">Behandlingar</Link>
              </li>
              <li>
                <Link to="/#contact">Kontakt</Link>
              </li>
              {/* Auth-åtgärder finns här bara när de är dolda i navbar-end (under sm) */}
              <li className="sm:hidden mt-1 border-t border-base-300/60 pt-1">
                {isAuthenticated ? (
                  <Link to="/dashboard">Till Dashboard</Link>
                ) : (
                  <Link to="/login">Logga in</Link>
                )}
              </li>
              {!isAuthenticated && (
                <li className="sm:hidden">
                  <Link to="/register">Registrera</Link>
                </li>
              )}
            </ul>
          </div>

          <button
            className="btn btn-ghost px-2"
            onClick={() => navigate("/")}
            aria-label="Till startsidan"
          >
            <Logo />
          </button>
        </div>

        <div className="navbar-center hidden lg:flex">
          <nav className="flex items-center gap-4">
            <Link to="/#about" className="link link-hover text-base-content/80">
              Om oss
            </Link>
            <Link to="/services" className="link link-hover text-base-content/80">
              Behandlingar
            </Link>
            <Link to="/#contact" className="link link-hover text-base-content/80">
              Kontakt
            </Link>
          </nav>
        </div>

        <div className="navbar-end gap-2">
          <ModeToggle />
          {/* Auth-knappar döljs på de minsta skärmarna (finns i mobilmenyn) */}
          <div className="hidden sm:flex items-center gap-2">
            {isAuthenticated ? (
              <Link to="/dashboard" className="btn btn-primary btn-sm">
                Till Dashboard
              </Link>
            ) : (
              <>
                <Link to="/login" className="btn btn-ghost btn-sm">
                  <LogIn className="h-4 w-4" />
                  Logga in
                </Link>
                <Link to="/register" className="btn btn-primary btn-sm">
                  <UserPlus className="h-4 w-4" />
                  Registrera
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default PublicLayout;
