import { useState } from "react";
import { Link } from "react-router-dom";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { MailCheck } from "lucide-react";
import AuthLayout from "@/components/layout/auth-layout";
import GoogleSignInButton from "@/components/GoogleSignInButton";
import { registerUser } from "@/services/api/authService";

const formSchema = z
  .object({
    firstName: z
      .string()
      .min(2, { message: "Förnamnet måste vara minst 2 tecken." }),
    lastName: z
      .string()
      .min(2, { message: "Efternamnet måste vara minst 2 tecken." }),
    email: z.string().email({ message: "Ogiltig e-postadress." }),
    phoneNumber: z
      .string()
      .regex(/^\+?[0-9\s\-()]{7,15}$/, { message: "Ange ett giltigt telefonnummer." }),
    password: z
      .string()
      .min(8, { message: "Lösenordet måste vara minst 8 tecken." })
      .regex(/[A-Z]/, { message: "Lösenordet måste innehålla minst en versal." })
      .regex(/[a-z]/, { message: "Lösenordet måste innehålla minst en gemen." })
      .regex(/[0-9]/, { message: "Lösenordet måste innehålla minst en siffra." })
      .regex(/[^a-zA-Z0-9]/, { message: "Lösenordet måste innehålla minst ett specialtecken." }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Lösenorden matchar inte.",
  });

type FormValues = z.infer<typeof formSchema>;

export default function RegisterPage() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phoneNumber: "",
      password: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(values: FormValues) {
    setServerError(null);
    try {
      await registerUser(values);
      setRegisteredEmail(values.email);
    } catch (error) {
      if (error instanceof Error) {
        setServerError(error.message);
      } else {
        setServerError("Registreringen misslyckades. Försök igen.");
      }
    }
  }

  if (registeredEmail) {
    return (
      <AuthLayout>
        <div className="card bg-base-100 ring-1 ring-base-300/60 shadow-xl">
          <div className="card-body text-center py-10">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary ring-1 ring-primary/20">
              <MailCheck className="h-7 w-7" />
            </div>
            <h2 className="card-title justify-center text-2xl">
              Kolla din inkorg!
            </h2>
            <p className="mt-2 text-base-content/70">
              Vi har skickat ett bekräftelsemejl till{" "}
              <span className="font-medium">{registeredEmail}</span>. Klicka på
              länken i mejlet för att aktivera ditt konto.
            </p>
            <p className="mt-1 text-sm text-base-content/60">
              Inget mejl? Titta i skräpposten, eller försök logga in så kan du
              begära ett nytt.
            </p>
            <Link to="/login" className="btn btn-primary mt-6 mx-auto">
              Till inloggningen
            </Link>
          </div>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div className="card bg-base-100 ring-1 ring-base-300/60 shadow-xl">
        <div className="card-body">
            <h2 className="card-title text-2xl">Skapa konto</h2>
            <p className="text-base-content">
              Fyll i formuläret nedan för att skapa ett nytt konto.
            </p>

            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid gap-4">
                {/* Förnamn */}
                <div>
                  <label htmlFor="firstName" className="label">
                    Förnamn
                  </label>
                  <input
                    id="firstName"
                    placeholder="Anna"
                    autoComplete="given-name"
                    className="input input-bordered w-full"
                    disabled={form.formState.isSubmitting}
                    {...form.register("firstName")}
                  />
                  {form.formState.errors.firstName && (
                    <p className="text-error text-sm mt-1">
                      {form.formState.errors.firstName.message}
                    </p>
                  )}
                </div>

                {/* Efternamn */}
                <div>
                  <label htmlFor="lastName" className="label">
                    Efternamn
                  </label>
                  <input
                    id="lastName"
                    placeholder="Andersson"
                    autoComplete="family-name"
                    className="input input-bordered w-full"
                    disabled={form.formState.isSubmitting}
                    {...form.register("lastName")}
                  />
                  {form.formState.errors.lastName && (
                    <p className="text-error text-sm mt-1">
                      {form.formState.errors.lastName.message}
                    </p>
                  )}
                </div>

                {/* E-post */}
                <div>
                  <label htmlFor="email" className="label">
                    E-post
                  </label>
                  <input
                    id="email"
                    type="email"
                    placeholder="namn@exempel.se"
                    autoComplete="email"
                    className="input input-bordered w-full"
                    disabled={form.formState.isSubmitting}
                    {...form.register("email")}
                  />
                  {form.formState.errors.email && (
                    <p className="text-error text-sm mt-1">
                      {form.formState.errors.email.message}
                    </p>
                  )}
                </div>

                {/* Telefon */}
                <div>
                  <label htmlFor="phoneNumber" className="label">
                    Telefonnummer
                  </label>
                  <input
                    id="phoneNumber"
                    type="tel"
                    placeholder="+46 70 123 45 67"
                    autoComplete="tel"
                    className="input input-bordered w-full"
                    disabled={form.formState.isSubmitting}
                    {...form.register("phoneNumber")}
                  />
                  {form.formState.errors.phoneNumber && (
                    <p className="text-error text-sm mt-1">
                      {form.formState.errors.phoneNumber.message}
                    </p>
                  )}
                </div>

                {/* Lösenord */}
                <div>
                  <label htmlFor="password" className="label">
                    Lösenord
                  </label>
                  <input
                    id="password"
                    type="password"
                    autoComplete="new-password"
                    className="input input-bordered w-full"
                    disabled={form.formState.isSubmitting}
                    {...form.register("password")}
                  />
                  {form.formState.errors.password && (
                    <p className="text-error text-sm mt-1">
                      {form.formState.errors.password.message}
                    </p>
                  )}
                </div>

                {/* Bekräfta lösenord */}
                <div>
                  <label htmlFor="confirmPassword" className="label">
                    Bekräfta lösenord
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    className="input input-bordered w-full"
                    disabled={form.formState.isSubmitting}
                    {...form.register("confirmPassword")}
                  />
                  {form.formState.errors.confirmPassword && (
                    <p className="text-error text-sm mt-1">
                      {form.formState.errors.confirmPassword.message}
                    </p>
                  )}
                </div>

                {/* Serverfel */}
                {serverError && (
                  <p className="text-error text-sm text-center">{serverError}</p>
                )}

                <button
                  type="submit"
                  className="btn btn-primary w-full"
                  disabled={form.formState.isSubmitting}
                >
                  {form.formState.isSubmitting ? (
                    <>
                      <span className="loading loading-spinner loading-sm" />
                      Skapar konto...
                    </>
                  ) : (
                    "Skapa konto"
                  )}
                </button>
              </div>
            </form>

          <GoogleSignInButton />

          <p className="mt-4 text-center text-xs text-base-content/60">
            Genom att skapa ett konto godkänner du våra{" "}
            <Link to="/terms" className="link">
              användarvillkor
            </Link>{" "}
            och vår{" "}
            <Link to="/privacy" className="link">
              integritetspolicy
            </Link>
            .
          </p>

          <div className="mt-4 text-center text-sm">
            Har du redan ett konto?{" "}
            <Link to="/login" className="underline">
              Logga in
            </Link>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
}
