import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/services/api/authContext";
import ModeToggle from "@/components/mode-toggle";

// Icons
import { Menu, Home, Calendar, Scissors, LogOut } from "lucide-react";

import {
  CategoryWithServices,
  getCategoriesWithServices,
} from "@/services/api/apiService";

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<CategoryWithServices[]>([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await getCategoriesWithServices();
        setCategories(data);
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };

    fetchCategories();
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header/Navbar */}
      {/* Header/Navbar */}
      <div className="navbar bg-base-100 sticky top-0 z-40 shadow-md">
        <div className="navbar-start">
          <div className="dropdown">
            <div tabIndex={0} role="button" className="btn btn-ghost lg:hidden">
              <Menu className="h-5 w-5" />
            </div>
            <ul
              tabIndex={0}
              className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52"
            >
              <li>
                <a onClick={() => navigate("/home")}>
                  <Home className="mr-2 h-4 w-4" />
                  Dashboard
                </a>
              </li>
              <li>
                <a>
                  <Scissors className="mr-2 h-4 w-4" />
                  Services
                </a>
                <ul className="p-2">
                  {categories.length > 0 ? (
                    categories.map((category) => (
                      <li key={category.id}>
                        <a onClick={() => navigate(`/category/${category.id}`)}>
                          {category.name}
                        </a>
                        {category.services.length > 0 && (
                          <ul className="p-2">
                            {category.services.map((service) => (
                              <li key={service.id}>
                                <a
                                  onClick={() =>
                                    navigate(`/service/${service.id}`)
                                  }
                                >
                                  {service.name}
                                </a>
                              </li>
                            ))}
                          </ul>
                        )}
                      </li>
                    ))
                  ) : (
                    <li>
                      <a>No categories available</a>
                    </li>
                  )}
                </ul>
              </li>
              <li>
                <a>
                  <Calendar className="mr-2 h-4 w-4" />
                  Bookings
                </a>
                <ul className="p-2">
                  <li>
                    <a onClick={() => navigate("/bookings")}>My Appointments</a>
                  </li>
                  <li>
                    <a onClick={() => navigate("/bookings/history")}>
                      Booking History
                    </a>
                  </li>
                  <li>
                    <a onClick={() => navigate("/bookings/new")}>
                      Schedule New Booking
                    </a>
                  </li>
                </ul>
              </li>
              <li>
                <a onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </a>
              </li>
            </ul>
          </div>
          <a
            className="btn btn-ghost text-xl"
            onClick={() => navigate("/home")}
          >
            ElsaBeauty
          </a>
        </div>
        <div className="navbar-center hidden lg:flex">
          <ul className="menu menu-horizontal px-1">
            <li>
              <a onClick={() => navigate("/home")}>
                <Home className="mr-2 h-4 w-4" />
                Dashboard
              </a>
            </li>
            <li>
              <details>
                <summary>
                  <Scissors className="mr-2 h-4 w-4" />
                  Services
                </summary>
                <ul className="p-2">
                  {categories.length > 0 ? (
                    categories.map((category) => (
                      <li key={category.id}>
                        <a onClick={() => navigate(`/category/${category.id}`)}>
                          {category.name}
                        </a>
                        {category.services.length > 0 && (
                          <ul className="p-2">
                            {category.services.map((service) => (
                              <li key={service.id}>
                                <a
                                  onClick={() =>
                                    navigate(`/service/${service.id}`)
                                  }
                                >
                                  {service.name}
                                </a>
                              </li>
                            ))}
                          </ul>
                        )}
                      </li>
                    ))
                  ) : (
                    <li>
                      <a>No categories available</a>
                    </li>
                  )}
                </ul>
              </details>
            </li>
            <li>
              <details>
                <summary>
                  <Calendar className="mr-2 h-4 w-4" />
                  Bookings
                </summary>
                <ul className="p-2">
                  <li>
                    <a onClick={() => navigate("/bookings")}>My Appointments</a>
                  </li>
                  <li>
                    <a onClick={() => navigate("/bookings/history")}>
                      Booking History
                    </a>
                  </li>
                  <li>
                    <a onClick={() => navigate("/bookings/new")}>
                      Schedule New Booking
                    </a>
                  </li>
                </ul>
              </details>
            </li>
          </ul>
        </div>
        <div className="navbar-end">
          <div className="mr-4">
            {" "}
            {/* Added margin-right */}
            <ModeToggle />
          </div>
          <div className="dropdown dropdown-end">
            <div
              tabIndex={0}
              role="button"
              className="btn btn-circle avatar placeholder"
            >
              <div className="bg-gray-300 text-gray-800 rounded-full w-10 h-10 flex items-center justify-center pt-2">
                {" "}
                {/* Added pt-1 for slight vertical adjustment */}
                <span className="text-xl leading-none">
                  {user?.firstName?.charAt(0) || "U"}
                </span>
              </div>
            </div>
            <ul
              tabIndex={0}
              className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52"
            >
              <li>
                <a onClick={() => navigate("/profile")}>Profile</a>
              </li>
              <li>
                <a onClick={handleLogout}>Logout</a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
};

export default MainLayout;
