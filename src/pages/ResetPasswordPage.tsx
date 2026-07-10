import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { KeyRound, TriangleAlert } from "lucide-react";
import AuthLayout from "@/components/layout/auth-layout";
import { resetPassword } from "@/services/api/authService";

const schema = z
  .object({
    newPassword: z
      .string()
      .min(8, { message: "Lösenordet måste vara minst 8 tecken." })
      .regex(/[A-Z]/, { message: "Minst en versal krävs." })
      .regex(/[a-z]/, { message: "Minst en gemen krävs." })
      .regex(/[0-9]/, { message: "Minst en siffra krävs." })
      .regex(/[^a-zA-Z0-9]/, { message: "Minst ett specialtecken krävs." }),
    confirmNewPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    path: ["confirmNewPassword"],
    message: "Lösenorden matchar inte.",
  });

type FormValues = z.infer<typeof schema>;

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [serverError, setServerError] = useState<string | null>(null);

  const email = searchParams.get("email") ?? "";
  const token = searchParams.get("token") ?? "";
  const linkIsValid = Boolean(email && token);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { newPassword: "", confirmNewPassword: "" },
  });

  const onSubmit = async (values: FormValues) => {
    setServerError(null);
    try {
      await resetPassword({
        email,
        token,
        newPassword: values.newPassword,
        confirmNewPassword: values.confirmNewPassword,
      });
      toast.success("Lösenordet har uppdaterats — logga in med ditt nya lösenord");
      navigate("/login");
    } catch (error) {
      setServerError(
        error instanceof Error
          ? error.message
          : "Kunde inte återställa lösenordet. Försök igen."
      );
    }
  };

  return (
    <AuthLayout>
      <div className="card bg-base-100 ring-1 ring-base-300/60 shadow-xl">
        <div className="card-body">
          {!linkIsValid ? (
            <div className="text-center py-4">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-warning/10 text-warning ring-1 ring-warning/20">
                <TriangleAlert className="h-7 w-7" />
              </div>
              <h2 className="card-title justify-center text-2xl">
                Länken är ofullständig
              </h2>
              <p className="mt-2 text-base-content/70">
                Öppna länken från mejlet igen, eller begär en ny
                återställningslänk.
              </p>
              <Link to="/forgot-password" className="btn btn-primary mt-6">
                Begär ny länk
              </Link>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <KeyRound className="h-5 w-5 text-primary" />
                <h2 className="card-title text-2xl">Välj nytt lösenord</h2>
              </div>
              <p className="text-base-content/70">
                Nytt lösenord för <span className="font-medium">{email}</span>.
              </p>

              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="mt-2 flex flex-col gap-5"
              >
                <div className="form-control w-full">
                  <label htmlFor="newPassword" className="label">
                    <span className="label-text">Nytt lösenord</span>
                  </label>
                  <input
                    id="newPassword"
                    type="password"
                    autoComplete="new-password"
                    className="input input-bordered w-full"
                    {...form.register("newPassword")}
                  />
                  {form.formState.errors.newPassword && (
                    <p className="mt-1 text-sm text-error">
                      {form.formState.errors.newPassword.message}
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
                    {...form.register("confirmNewPassword")}
                  />
                  {form.formState.errors.confirmNewPassword && (
                    <p className="mt-1 text-sm text-error">
                      {form.formState.errors.confirmNewPassword.message}
                    </p>
                  )}
                </div>

                {serverError && (
                  <p className="text-sm text-error text-center">{serverError}</p>
                )}

                <button
                  type="submit"
                  className="btn btn-primary w-full"
                  disabled={form.formState.isSubmitting}
                >
                  {form.formState.isSubmitting ? (
                    <span className="loading loading-spinner loading-sm" />
                  ) : null}
                  Uppdatera lösenord
                </button>
              </form>

              <div className="mt-2 text-center text-sm">
                <Link to="/login" className="underline underline-offset-4">
                  Tillbaka till inloggningen
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </AuthLayout>
  );
};

export default ResetPasswordPage;
