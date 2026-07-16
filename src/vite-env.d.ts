/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_SIGNALR_BASE_URL?: string;
  /** Google OAuth-klient-ID (publikt). Tomt/saknas = Google-inloggning döljs. */
  readonly VITE_GOOGLE_CLIENT_ID?: string;
  /** Stripe publik nyckel (pk_...). Tomt/saknas = kort-steget döljs, bokning sker kortlöst. */
  readonly VITE_STRIPE_PUBLISHABLE_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
