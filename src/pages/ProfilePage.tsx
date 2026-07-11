import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { AxiosError } from "axios";
import { useNavigate } from "react-router-dom";
import MainLayout from "@/components/layout/main-layout";
import { useAuth } from "@/services/api/authContext";
import {
  updateMyProfile,
  updateMyPassword,
  uploadMyAvatar,
  deleteMyAvatar,
  deleteMyAccount,
} from "@/services/api/userAPI";
import {
  Mail,
  Shield,
  KeyRound,
  Save,
  Camera,
  Trash2,
  AlertTriangle,
} from "lucide-react";

const profileSchema = z.object({
  firstName: z.string().min(2, "Ange minst 2 tecken"),
  lastName: z.string().min(2, "Ange minst 2 tecken"),
  phoneNumber: z
    .string()
    .regex(/^\+?[0-9\s\-()]{7,15}$/, "Ange ett giltigt telefonnummer"),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Ange ditt nuvarande lösenord"),
    newPassword: z.string().min(8, "Minst 8 tecken"),
    confirmNewPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "Lösenorden matchar inte",
    path: ["confirmNewPassword"],
  });

type ProfileFormValues = z.infer<typeof profileSchema>;
type PasswordFormValues = z.infer<typeof passwordSchema>;

function getApiErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof AxiosError) {
    const data = error.response?.data;
    if (typeof data === "string" && data) return data;
    if (data?.title) return data.title;
    if (data?.error) return data.error;
  }
  return fallback;
}

const MAX_AVATAR_BYTES = 5 * 1024 * 1024;

const ProfilePage = () => {
  const { user, refreshUser, logout } = useAuth();
  const navigate = useNavigate();
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deletingAccount, setDeletingAccount] = useState(false);
  const canDelete =
    !!user?.email &&
    deleteConfirm.trim().toLowerCase() === user.email.toLowerCase();

  const onDeleteAccount = async () => {
    if (!canDelete) return;
    setDeletingAccount(true);
    try {
      await deleteMyAccount();
      toast.success("Ditt konto har raderats");
      await logout();
      navigate("/");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Kunde inte radera kontot"));
      setDeletingAccount(false);
    }
  };

  const onAvatarSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // tillåt att samma fil väljs igen
    if (!file) return;

    if (file.size > MAX_AVATAR_BYTES) {
      toast.error("Bilden får vara högst 5 MB");
      return;
    }

    setAvatarBusy(true);
    try {
      await uploadMyAvatar(file);
      await refreshUser();
      toast.success("Profilbilden har uppdaterats");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Kunde inte ladda upp bilden"));
    } finally {
      setAvatarBusy(false);
    }
  };

  const onDeleteAvatar = async () => {
    setAvatarBusy(true);
    try {
      await deleteMyAvatar();
      await refreshUser();
      toast.success("Profilbilden har tagits bort");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Kunde inte ta bort bilden"));
    } finally {
      setAvatarBusy(false);
    }
  };

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

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    values: {
      firstName: user?.firstName ?? "",
      lastName: user?.lastName ?? "",
      phoneNumber: user?.phoneNumber ?? "",
    },
  });

  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmNewPassword: "",
    },
  });

  const onSaveProfile = async (values: ProfileFormValues) => {
    setSavingProfile(true);
    try {
      await updateMyProfile(values);
      await refreshUser();
      toast.success("Profilen har uppdaterats");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Kunde inte uppdatera profilen"));
    } finally {
      setSavingProfile(false);
    }
  };

  const onSavePassword = async (values: PasswordFormValues) => {
    setSavingPassword(true);
    try {
      await updateMyPassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      passwordForm.reset();
      toast.success("Lösenordet har ändrats");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Kunde inte ändra lösenordet"));
    } finally {
      setSavingPassword(false);
    }
  };

  const profileErrors = profileForm.formState.errors;
  const passwordErrors = passwordForm.formState.errors;

  return (
    <MainLayout>
      <div className="container mx-auto max-w-2xl px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Min profil</h1>

        {/* Kontokort */}
        <div className="card bg-base-100 shadow-xl mb-6">
          <div className="card-body">
            <div className="flex items-center gap-4">
              <div className="relative">
                {user?.avatarUrl ? (
                  <div className="avatar">
                    <div className="w-20 rounded-full ring-2 ring-primary/30 ring-offset-2 ring-offset-base-100">
                      <img src={user.avatarUrl} alt="Din profilbild" />
                    </div>
                  </div>
                ) : (
                  <div className="avatar placeholder">
                    <div className="bg-primary text-primary-content w-20 rounded-full">
                      <span className="text-3xl">
                        {user?.firstName?.[0]?.toUpperCase() ||
                          user?.email?.[0]?.toUpperCase() ||
                          "?"}
                      </span>
                    </div>
                  </div>
                )}
                <button
                  type="button"
                  className="btn btn-primary btn-circle btn-xs absolute -bottom-1 -right-1"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={avatarBusy}
                  aria-label="Byt profilbild"
                  title="Byt profilbild"
                >
                  {avatarBusy ? (
                    <span className="loading loading-spinner loading-xs" />
                  ) : (
                    <Camera className="h-3.5 w-3.5" />
                  )}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={onAvatarSelected}
                />
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
                {user?.avatarUrl && (
                  <button
                    type="button"
                    className="btn btn-ghost btn-xs mt-2 block text-error"
                    onClick={onDeleteAvatar}
                    disabled={avatarBusy}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Ta bort bild
                  </button>
                )}
              </div>
            </div>

            <div className="divider my-2"></div>

            <div className="flex flex-col sm:flex-row gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-base-content/60" />
                <span>{user?.email || "Ej angivet"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-base-content/60" />
                <span>{getRoleDisplay(user?.role)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Redigera profil */}
        <div className="card bg-base-100 shadow-xl mb-6">
          <div className="card-body">
            <h2 className="card-title text-lg">Kontaktuppgifter</h2>
            <form
              onSubmit={profileForm.handleSubmit(onSaveProfile)}
              className="flex flex-col gap-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="form-control w-full">
                  <label htmlFor="firstName" className="label">
                    <span className="label-text">Förnamn</span>
                  </label>
                  <input
                    id="firstName"
                    type="text"
                    autoComplete="given-name"
                    className="input input-bordered w-full"
                    {...profileForm.register("firstName")}
                  />
                  {profileErrors.firstName && (
                    <p className="mt-1 text-sm text-error">
                      {profileErrors.firstName.message}
                    </p>
                  )}
                </div>
                <div className="form-control w-full">
                  <label htmlFor="lastName" className="label">
                    <span className="label-text">Efternamn</span>
                  </label>
                  <input
                    id="lastName"
                    type="text"
                    autoComplete="family-name"
                    className="input input-bordered w-full"
                    {...profileForm.register("lastName")}
                  />
                  {profileErrors.lastName && (
                    <p className="mt-1 text-sm text-error">
                      {profileErrors.lastName.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="form-control w-full">
                <label htmlFor="phoneNumber" className="label">
                  <span className="label-text">Telefonnummer</span>
                </label>
                <input
                  id="phoneNumber"
                  type="tel"
                  autoComplete="tel"
                  placeholder="070-123 45 67"
                  className="input input-bordered w-full"
                  {...profileForm.register("phoneNumber")}
                />
                {profileErrors.phoneNumber && (
                  <p className="mt-1 text-sm text-error">
                    {profileErrors.phoneNumber.message}
                  </p>
                )}
              </div>

              <div className="card-actions justify-end">
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={savingProfile}
                >
                  {savingProfile ? (
                    <span className="loading loading-spinner loading-sm" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Spara ändringar
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Byt lösenord */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title text-lg">
              <KeyRound className="h-5 w-5" />
              Byt lösenord
            </h2>
            <form
              onSubmit={passwordForm.handleSubmit(onSavePassword)}
              className="flex flex-col gap-4"
            >
              <div className="form-control w-full">
                <label htmlFor="currentPassword" className="label">
                  <span className="label-text">Nuvarande lösenord</span>
                </label>
                <input
                  id="currentPassword"
                  type="password"
                  autoComplete="current-password"
                  className="input input-bordered w-full"
                  {...passwordForm.register("currentPassword")}
                />
                {passwordErrors.currentPassword && (
                  <p className="mt-1 text-sm text-error">
                    {passwordErrors.currentPassword.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="form-control w-full">
                  <label htmlFor="newPassword" className="label">
                    <span className="label-text">Nytt lösenord</span>
                  </label>
                  <input
                    id="newPassword"
                    type="password"
                    autoComplete="new-password"
                    className="input input-bordered w-full"
                    {...passwordForm.register("newPassword")}
                  />
                  {passwordErrors.newPassword && (
                    <p className="mt-1 text-sm text-error">
                      {passwordErrors.newPassword.message}
                    </p>
                  )}
                </div>
                <div className="form-control w-full">
                  <label htmlFor="confirmNewPassword" className="label">
                    <span className="label-text">Bekräfta nytt lösenord</span>
                  </label>
                  <input
                    id="confirmNewPassword"
                    type="password"
                    autoComplete="new-password"
                    className="input input-bordered w-full"
                    {...passwordForm.register("confirmNewPassword")}
                  />
                  {passwordErrors.confirmNewPassword && (
                    <p className="mt-1 text-sm text-error">
                      {passwordErrors.confirmNewPassword.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="card-actions justify-end">
                <button
                  type="submit"
                  className="btn btn-outline"
                  disabled={savingPassword}
                >
                  {savingPassword ? (
                    <span className="loading loading-spinner loading-sm" />
                  ) : (
                    <KeyRound className="h-4 w-4" />
                  )}
                  Byt lösenord
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Danger zone: radera konto */}
        <div className="card bg-base-100 shadow-xl border border-error/30">
          <div className="card-body">
            <h2 className="card-title text-lg text-error">
              <AlertTriangle className="h-5 w-5" />
              Radera konto
            </h2>
            <p className="text-sm text-base-content/70">
              Detta raderar dina personuppgifter permanent och kan inte ångras.
              Din bokningshistorik behålls avidentifierad för klinikens
              räkning, och du loggas ut direkt.
            </p>
            <div className="card-actions justify-end mt-2">
              <button
                type="button"
                className="btn btn-error btn-outline"
                onClick={() => {
                  setDeleteConfirm("");
                  setDeleteOpen(true);
                }}
              >
                <Trash2 className="h-4 w-4" />
                Radera mitt konto
              </button>
            </div>
          </div>
        </div>
      </div>

      {deleteOpen && (
        <dialog className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg text-error">
              <AlertTriangle className="inline h-5 w-5 mr-1" />
              Radera konto permanent
            </h3>
            <p className="py-3 text-sm">
              Detta går inte att ångra. Skriv din e-postadress
              (<strong>{user?.email}</strong>) för att bekräfta.
            </p>
            <input
              type="email"
              autoComplete="off"
              className="input input-bordered w-full"
              placeholder="Din e-postadress"
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              disabled={deletingAccount}
            />
            <div className="modal-action">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setDeleteOpen(false)}
                disabled={deletingAccount}
              >
                Avbryt
              </button>
              <button
                type="button"
                className="btn btn-error"
                onClick={onDeleteAccount}
                disabled={!canDelete || deletingAccount}
              >
                {deletingAccount && (
                  <span className="loading loading-spinner loading-xs" />
                )}
                Radera permanent
              </button>
            </div>
          </div>
          <div
            className="modal-backdrop bg-black/30"
            onClick={() => !deletingAccount && setDeleteOpen(false)}
          />
        </dialog>
      )}
    </MainLayout>
  );
};

export default ProfilePage;
