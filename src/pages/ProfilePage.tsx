import MainLayout from "@/components/layout/main-layout";
import { useAuth } from "@/services/api/authContext";
import { User, Mail, Shield } from "lucide-react";

const ProfilePage = () => {
  const { user } = useAuth();

  const getRoleDisplay = (role?: string) => {
    if (!role) return "Kund";
    const r = role.toLowerCase();
    if (r.includes("admin")) return "Administratör";
    if (r.includes("employee")) return "Medarbetare";
    return "Kund";
  };

  const getRoleBadgeClass = (role?: string) => {
    if (!role) return "badge-primary";
    const r = role.toLowerCase();
    if (r.includes("admin")) return "badge-error";
    if (r.includes("employee")) return "badge-warning";
    return "badge-primary";
  };

  return (
    <MainLayout>
      <div className="container mx-auto max-w-2xl px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Min profil</h1>

        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            {/* Avatar och namn */}
            <div className="flex items-center gap-4 mb-6">
              <div className="avatar placeholder">
                <div className="bg-primary text-primary-content w-16 rounded-full">
                  <span className="text-2xl">
                    {user?.firstName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "?"}
                  </span>
                </div>
              </div>
              <div>
                <h2 className="text-xl font-semibold">
                  {user?.firstName && user?.lastName
                    ? `${user.firstName} ${user.lastName}`
                    : user?.email || "Användare"}
                </h2>
                <span className={`badge ${getRoleBadgeClass(user?.role)}`}>
                  {getRoleDisplay(user?.role)}
                </span>
              </div>
            </div>

            <div className="divider"></div>

            {/* Användarinformation */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-base-content/60" />
                <div>
                  <p className="text-sm text-base-content/60">Namn</p>
                  <p className="font-medium">
                    {user?.firstName && user?.lastName
                      ? `${user.firstName} ${user.lastName}`
                      : "Ej angivet"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-base-content/60" />
                <div>
                  <p className="text-sm text-base-content/60">E-post</p>
                  <p className="font-medium">{user?.email || "Ej angivet"}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-base-content/60" />
                <div>
                  <p className="text-sm text-base-content/60">Roll</p>
                  <p className="font-medium">{getRoleDisplay(user?.role)}</p>
                </div>
              </div>
            </div>

            <div className="divider"></div>

            {/* Framtida funktioner */}
            <div className="text-center text-base-content/50 py-4">
              <p className="text-sm">Fler profilinställningar kommer snart</p>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default ProfilePage;
