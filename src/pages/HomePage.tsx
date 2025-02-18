import React from "react";
import { useAuth } from "@/services/api/authContext";

const HomePage: React.FC = () => {
  const { logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-3xl font-bold mb-4">Home</h1>
      <button
        onClick={handleLogout}
        className="px-4 py-2 bg-blue-500 text-white rounded"
      >
        Logout
      </button>
    </div>
  );
};

export default HomePage;
