import { useState } from "react";
import { Link } from "react-router-dom";
import { MailCheck, KeyRound } from "lucide-react";
import AuthLayout from "@/components/layout/auth-layout";
import { requestPasswordReset } from "@/services/api/authService";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await requestPasswordReset(email.trim());
    } catch {
      // Samma utfall oavsett — vi avslöjar aldrig om adressen finns.
    } finally {
      setLoading(false);
      setSent(true);
    }
  };

  return (
    <AuthLayout>
      <div className="card bg-base-100 ring-1 ring-base-300/60 shadow-xl">
        <div className="card-body">
          {sent ? (
            <div className="text-center py-4">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-success/10 text-success ring-1 ring-success/20">
                <MailCheck className="h-7 w-7" />
              </div>
              <h2 className="card-title justify-center text-2xl">
                Kolla din inkorg
              </h2>
              <p className="mt-2 text-base-content/70">
                Om <span className="font-medium">{email}</span> finns hos oss
                har vi skickat en länk för att återställa lösenordet. Glöm inte
                att titta i skräpposten.
              </p>
              <Link to="/login" className="btn btn-primary mt-6">
                Tillbaka till inloggningen
              </Link>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <KeyRound className="h-5 w-5 text-primary" />
                <h2 className="card-title text-2xl">Glömt lösenordet?</h2>
              </div>
              <p className="text-base-content/70">
                Ingen fara. Ange din e-postadress så skickar vi en länk där du
                kan välja ett nytt.
              </p>
              <form onSubmit={handleSubmit} className="mt-2 flex flex-col gap-5">
                <div className="form-control w-full">
                  <label htmlFor="email" className="label">
                    <span className="label-text">E-post</span>
                  </label>
                  <input
                    id="email"
                    type="email"
                    placeholder="namn@exempel.se"
                    autoComplete="email"
                    className="input input-bordered w-full"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="btn btn-primary w-full"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="loading loading-spinner loading-sm" />
                  ) : null}
                  Skicka återställningslänk
                </button>
              </form>
              <div className="mt-2 text-center text-sm">
                Kom du på det?{" "}
                <Link to="/login" className="underline underline-offset-4">
                  Logga in
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </AuthLayout>
  );
};

export default ForgotPasswordPage;
