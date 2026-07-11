import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/services/api/authContext";
import { resendConfirmation } from "@/services/api/authService";
import { Link, useNavigate } from "react-router-dom";
import GoogleSignInButton from "@/components/GoogleSignInButton";

const DEMO_ACCOUNTS = [
  { label: "Admin", email: "admin@elsabeauty.se", password: "Password123!" },
  { label: "Employee", email: "employee@elsabeauty.se", password: "Password123!" },
  { label: "Customer", email: "customer@elsabeauty.se", password: "Password123!" },
];

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [showResend, setShowResend] = useState(false);
  const [resending, setResending] = useState(false);

  const handleLoginError = (err: unknown) => {
    const message =
      err instanceof Error ? err.message : "Ett oväntat fel inträffade";
    setError(message);
    setShowResend(message.includes("inte bekräftad"));
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await resendConfirmation(email);
      toast.success("Nytt bekräftelsemejl skickat — kolla din inkorg");
      setShowResend(false);
      setError(null);
    } catch {
      toast.error("Kunde inte skicka mejlet. Försök igen.");
    } finally {
      setResending(false);
    }
  };

  const { login } = useAuth();
  const navigate = useNavigate();

  const loginAsDemo = async (demoEmail: string, demoPassword: string) => {
    setLoading(true);
    setError(null);
    setEmail(demoEmail);
    setPassword(demoPassword);
    try {
      await login(demoEmail, demoPassword);
      navigate("/home");
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await login(email, password);
      setLoading(false);
      navigate("/home");
    } catch (err) {
      setLoading(false);
      handleLoginError(err);
    }
  };

  return (
    <div className={`flex flex-col gap-6 ${className}`} {...props}>
      <div className="card bg-base-100 ring-1 ring-base-300/60 shadow-xl">
        <div className="card-body">
          <h2 className="card-title text-2xl">Logga in</h2>
          <p>Ange din e-postadress för att logga in på ditt konto</p>
          <form onSubmit={handleSubmit}>
            <div className="flex flex-col gap-6">
              {/* Email Field */}
              <div className="form-control w-full">
                <label htmlFor="email" className="label">
                  <span className="label-text">E-post</span>
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="namn@exempel.se"
                  className="input input-bordered w-full"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              {/* Password Field */}
              <div className="form-control w-full">
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="label">
                    <span className="label-text">Lösenord</span>
                  </label>
                  <Link
                    to="/forgot-password"
                    className="text-sm underline-offset-4 hover:underline"
                  >
                    Glömt lösenordet?
                  </Link>
                </div>
                <input
                  id="password"
                  type="password"
                  className="input input-bordered w-full"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              {/* Error Message */}
              {error && (
                <p className="text-sm text-error text-center">{error}</p>
              )}

              {/* Obekräftad adress: erbjud nytt bekräftelsemejl */}
              {showResend && (
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={handleResend}
                  disabled={resending}
                >
                  {resending ? (
                    <span className="loading loading-spinner loading-xs" />
                  ) : null}
                  Skicka nytt bekräftelsemejl
                </button>
              )}

              {/* Login Button */}
              <button
                type="submit"
                className="btn btn-primary w-full"
                disabled={loading}
              >
                {loading ? "Loggar in..." : "Logga in"}
              </button>

              <GoogleSignInButton />
            </div>

            {/* Signup Link */}
            <div className="mt-4 text-center text-sm">
              Har du inget konto?{" "}
              <Link to="/register" className="underline underline-offset-4">
                Registrera dig
              </Link>
            </div>
          </form>

          {/* Demo accounts */}
          <div className="divider text-xs text-base-content/50">Testa med demokonto</div>
          <div className="flex gap-2 justify-center">
            {DEMO_ACCOUNTS.map((account) => (
              <button
                key={account.label}
                type="button"
                className="btn btn-outline btn-sm flex-1"
                disabled={loading}
                onClick={() => loginAsDemo(account.email, account.password)}
              >
                {account.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
