import { api } from "./apiService";
import {
  CREATE_SETUP_INTENT_URL,
  CREATE_PAYMENT_INTENT_URL,
  BOOKINGS_BASE_URL,
} from "./apiUrl";

/**
 * Skapar en Stripe SetupIntent för den inloggade kunden. Returnerar clientSecret
 * som Stripe.js använder för att spara kortet (0 kr dras).
 */
export async function createSetupIntent(): Promise<string> {
  const res = await api.post<{ clientSecret: string }>(CREATE_SETUP_INTENT_URL, {});
  return res.data.clientSecret;
}

/**
 * Skapar en PaymentIntent för onlinebetalning (hela priset). Bokningsuppgifterna
 * skickas med så de kan läggas i PI-metadatan → betalningen kan stämmas av till en
 * bokning även via webhook om kunden inte kommer tillbaka (t.ex. Klarna-redirect).
 * Returnerar clientSecret för Stripe.js + beloppet (kr) som debiteras.
 */
export async function createPaymentIntent(
  serviceId: string,
  employeeId: string,
  startTime: string,
  endTime: string
): Promise<{ clientSecret: string; amount: number }> {
  const res = await api.post<{ clientSecret: string; amount: number }>(
    CREATE_PAYMENT_INTENT_URL,
    { serviceId, employeeId, startTime, endTime }
  );
  return res.data;
}

/** Admin/personal markerar en passerad bokning som utebliven → drar no-show-avgiften. */
export async function markBookingNoShow(bookingId: string): Promise<void> {
  await api.post(`${BOOKINGS_BASE_URL}/${bookingId}/no-show`, {});
}
