import { useState } from "react";
import { useAuth } from "@/services/api/authContext";
import { useNavigate } from "react-router-dom";

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
        </div>
      </div>
    </div>
  );
}
