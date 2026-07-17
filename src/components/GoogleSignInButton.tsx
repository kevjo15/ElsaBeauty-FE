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
/** Läser aktuellt läge från <html> (theme-providern togglar .dark). */
const isDarkMode = () =>
  typeof document !== "undefined" &&
  document.documentElement.classList.contains("dark");

const GoogleSignInButton = () => {
  const { loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  const [dark, setDark] = useState(isDarkMode);

  // Följ temaväxlingen (lampan i navbaren togglar .dark på <html>) så knappen
  // renderas om med rätt Google-tema i både ljust och mörkt läge.
  useEffect(() => {
    const root = document.documentElement;
    const observer = new MutationObserver(() => setDark(isDarkMode()));
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

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

        // Matcha bredden mot de övriga (full-bredd) knapparna; GIS tillåter max 400.
        const width = Math.min(
          400,
          Math.max(240, Math.round(containerRef.current.offsetWidth || 360))
        );
        // Rensa ev. tidigare iframe (annars staplas knappar vid tema-växling).
        containerRef.current.innerHTML = "";
        window.google.accounts.id.renderButton(containerRef.current, {
          type: "standard",
          // Mörkt läge → fylld svart (smälter in); ljust → outline (ren vit).
          theme: dark ? "filled_black" : "outline",
          size: "large",
          text: "continue_with",
          shape: "rectangular",
          logo_alignment: "center",
          width,
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
  }, [loginWithGoogle, navigate, dark]);

  // Utan klient-ID visas varken knapp eller avdelare — aldrig en död yta.
  if (!CLIENT_ID) return null;

  return (
    <>
      <div className="divider text-xs text-base-content/50 my-1">eller</div>
      <div className="relative">
        <div ref={containerRef} className="flex justify-center [color-scheme:normal]" />
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
