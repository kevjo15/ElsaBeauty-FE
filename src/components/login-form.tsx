import { useState } from "react";
import { useAuth } from "@/services/api/authContext";
import { useNavigate } from "react-router-dom";

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
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred");
      }
    }
  };

  return (
    <div className={`flex flex-col gap-6 ${className}`} {...props}>
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title text-2xl">Login</h2>
          <p>Enter your email below to login to your account</p>
          <form onSubmit={handleSubmit}>
            <div className="flex flex-col gap-6">
              {/* Email Field */}
              <div className="form-control w-full">
                <label htmlFor="email" className="label">
                  <span className="label-text">Email</span>
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  className="input input-bordered w-full"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              {/* Password Field */}
              <div className="form-control w-full">
                <div className="flex items-center">
                  <label htmlFor="password" className="label">
                    <span className="label-text">Password</span>
                  </label>
                  <a
                    href="#"
                    className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                  >
                    Forgot your password?
                  </a>
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

              {/* Login Button */}
              <button
                type="submit"
                className="btn btn-primary w-full"
                disabled={loading}
              >
                {loading ? "Logging in..." : "Login"}
              </button>

              {/* Google Login Button */}
              <button type="button" className="btn btn-outline w-full">
                Login with Google
              </button>
            </div>

            {/* Signup Link */}
            <div className="mt-4 text-center text-sm">
              Don't have an account?{" "}
              <a href="#" className="underline underline-offset-4">
                Sign up
              </a>
            </div>
          </form>

          {/* Demo accounts */}
          <div className="divider text-xs text-base-content/50">Try a demo account</div>
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
