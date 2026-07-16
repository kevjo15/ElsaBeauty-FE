import { loadStripe, type Stripe } from "@stripe/stripe-js";

const PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY?.trim();

/** True när Stripe är konfigurerat (publik nyckel satt). Styr om kort-steget visas. */
export const isStripeEnabled = !!PUBLISHABLE_KEY;

/**
 * Laddar Stripe.js en gång (lazy). Null om ingen publik nyckel är satt —
 * då hoppas kort-steget över och bokning sker kortlöst (som Google-knappen).
 */
export const stripePromise: Promise<Stripe | null> | null = PUBLISHABLE_KEY
  ? loadStripe(PUBLISHABLE_KEY)
  : null;
