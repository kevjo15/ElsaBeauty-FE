import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/services/api/authContext";
import ModeToggle from "@/components/mode-toggle";
import { LogIn, UserPlus } from "lucide-react";

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
          <button
            className="btn btn-ghost text-xl font-semibold"
            onClick={() => navigate("/")}
          >
            ElsaBeauty
          </button>
        </div>

        <div className="navbar-center hidden lg:flex">
          <nav className="flex items-center gap-4">
            <a href="#about" className="link link-hover text-base-content/80">
              Om oss
            </a>
            <a href="#services" className="link link-hover text-base-content/80">
              Tjänster
            </a>
            <a href="#contact" className="link link-hover text-base-content/80">
              Kontakt
            </a>
          </nav>
        </div>

        <div className="navbar-end gap-2">
          <ModeToggle />
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

      {/* Main Content */}
      <main className="flex-1">{children}</main>
    </div>
  );
};

export default PublicLayout;
