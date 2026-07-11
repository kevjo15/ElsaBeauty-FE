import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/services/api/authContext";

const GSI_SRC = "https://accounts.google.com/gsi/client";
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim();

/** Laddar GIS-scriptet en gång; efterföljande anrop återanvänder samma tagg. */
function loadGsiScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) return resolve();

    const existing = document.querySelector<HTMLScriptElement>(`script[src="${GSI_SRC}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("GIS load failed")));
      return;
    }

    const script = document.createElement("script");
    script.src = GSI_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("GIS load failed"));
    document.head.appendChild(script);
  });
}

/**
 * "Logga in med Google" via Google Identity Services: Googles officiella knapp
 * renderas i containern, callbacken ger ett ID-token som backend verifierar
 * (POST /api/auth/google) — samma sessionsflöde som lösenordslogin därefter.
 * Renderar ingenting om VITE_GOOGLE_CLIENT_ID saknas.
 */
const GoogleSignInButton = () => {
  const { loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!CLIENT_ID || !containerRef.current) return;
    let cancelled = false;

    loadGsiScript()
      .then(() => {
        if (cancelled || !containerRef.current || !window.google) return;

        window.google.accounts.id.initialize({
          client_id: CLIENT_ID,
          callback: async (response) => {
            setBusy(true);
            try {
              await loginWithGoogle(response.credential);
              navigate("/home");
            } catch (error) {
              toast.error(
                error instanceof Error
                  ? error.message
                  : "Google-inloggningen misslyckades. Försök igen."
              );
            } finally {
              setBusy(false);
            }
          },
        });

        window.google.accounts.id.renderButton(containerRef.current, {
          type: "standard",
          theme: "outline",
          size: "large",
          text: "continue_with",
          shape: "rectangular",
          logo_alignment: "center",
          width: 320,
          locale: "sv_SE",
        });
      })
      .catch(() => {
        // Scriptet kunde inte laddas (t.ex. offline) — lämna ytan tom.
        console.warn("Google Identity Services could not be loaded");
      });

    return () => {
      cancelled = true;
    };
  }, [loginWithGoogle, navigate]);

  // Utan klient-ID visas varken knapp eller avdelare — aldrig en död yta.
  if (!CLIENT_ID) return null;

  return (
    <>
      <div className="divider text-xs text-base-content/50 my-1">eller</div>
      <div className="relative flex justify-center">
        <div ref={containerRef} />
        {busy && (
          <div className="absolute inset-0 flex items-center justify-center bg-base-100/60">
            <span className="loading loading-spinner loading-sm" />
          </div>
        )}
      </div>
    </>
  );
};

export default GoogleSignInButton;
