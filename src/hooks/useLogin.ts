import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser as loginUserApi } from "../services/api/authService";

export function useLogin() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);

    try {
      await loginUserApi(email, password);
      setLoading(false);
      navigate("/home");
    } catch (err: unknown) {
      setLoading(false);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred");
      }
    }
  };

  return { login, error, loading };
}
