import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, TriangleAlert } from "lucide-react";
import AuthLayout from "@/components/layout/auth-layout";
import { confirmEmail } from "@/services/api/authService";

type Status = "confirming" | "success" | "error";

const ConfirmEmailPage = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<Status>("confirming");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const hasRun = useRef(false);

  const userId = searchParams.get("userId") ?? "";
  const token = searchParams.get("token") ?? "";

  useEffect(() => {
    // Skydda mot dubbelanrop i React StrictMode
    if (hasRun.current) return;
    hasRun.current = true;

    if (!userId || !token) {
      setStatus("error");
      setErrorMessage(
        "Länken är ofullständig. Öppna länken från mejlet igen eller begär ett nytt bekräftelsemejl."
      );
      return;
    }

    confirmEmail(userId, token)
      .then(() => setStatus("success"))
      .catch((error) => {
        setStatus("error");
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Kunde inte bekräfta e-postadressen."
        );
      });
  }, [userId, token]);

  return (
    <AuthLayout>
      <div className="card bg-base-100 ring-1 ring-base-300/60 shadow-xl">
        <div className="card-body text-center py-10">
          {status === "confirming" && (
            <>
              <span className="loading loading-spinner loading-lg mx-auto text-primary" />
              <h2 className="card-title justify-center text-2xl mt-4">
                Bekräftar din e-postadress...
              </h2>
            </>
          )}

          {status === "success" && (
            <>
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-success/10 text-success ring-1 ring-success/20">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <h2 className="card-title justify-center text-2xl">
                E-postadressen är bekräftad!
              </h2>
              <p className="mt-2 text-base-content/70">
                Ditt konto är aktiverat. Nu kan du logga in och boka din första
                behandling.
              </p>
              <Link to="/login" className="btn btn-primary mt-6 mx-auto">
                Logga in
              </Link>
            </>
          )}

          {status === "error" && (
            <>
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-warning/10 text-warning ring-1 ring-warning/20">
                <TriangleAlert className="h-7 w-7" />
              </div>
              <h2 className="card-title justify-center text-2xl">
                Det gick inte att bekräfta
              </h2>
              <p className="mt-2 text-base-content/70">{errorMessage}</p>
              <p className="mt-1 text-sm text-base-content/60">
                Du kan begära ett nytt bekräftelsemejl genom att försöka logga
                in — då får du möjligheten där.
              </p>
              <Link to="/login" className="btn btn-primary mt-6 mx-auto">
                Till inloggningen
              </Link>
            </>
          )}
        </div>
      </div>
    </AuthLayout>
  );
};

export default ConfirmEmailPage;
