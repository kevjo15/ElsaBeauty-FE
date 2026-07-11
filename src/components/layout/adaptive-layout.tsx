import React from "react";
import MainLayout from "@/components/layout/main-layout";
import PublicLayout from "@/components/layout/public-layout";
import { useAuth } from "@/services/api/authContext";

interface AdaptiveLayoutProps {
  children: React.ReactNode;
}

/**
 * För sidor som är publika men får extra funktioner som inloggad
 * (t.ex. tjänstelistan): inloggade får app-navbaren, besökare den publika.
 */
const AdaptiveLayout: React.FC<AdaptiveLayoutProps> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? (
    <MainLayout>{children}</MainLayout>
  ) : (
    <PublicLayout>{children}</PublicLayout>
  );
};

export default AdaptiveLayout;
