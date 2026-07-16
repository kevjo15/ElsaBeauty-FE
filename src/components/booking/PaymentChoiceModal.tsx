import { useState } from "react";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { toast } from "sonner";
import { Wallet, MapPin } from "lucide-react";
import { stripePromise } from "@/services/stripe";
import { createSetupIntent, createPaymentIntent } from "@/services/api";

/** Resultatet av betalvalet — skickas till bokningsskapandet. */
export interface PaymentChoiceResult {
  paymentMethodId?: string;
  paymentIntentId?: string;
}

interface PaymentChoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  serviceId: string;
  servicePrice: number;
  employeeId: string;
  startTime: string;
  endTime: string;
  /** Anropas när betalning/kort är klart. Föräldern skapar bokningen. */
  onComplete: (result: PaymentChoiceResult) => void;
}

type Mode = "choice" | "online" | "onsite";

/** Kort-/betalformuläret — måste ligga inuti <Elements>. */
const StripeForm: React.FC<{
  intent: "pay" | "setup";
  submitLabel: string;
  onDone: (id: string) => void;
  onBack: () => void;
}> = ({ intent, submitLabel, onDone, onBack }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setBusy(true);

    if (intent === "pay") {
      // Kort/wallets bekräftas inline; Klarna redirectar till sin sida och
      // kommer tillbaka till /payment-return, som slutför bokningen.
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: "if_required",
        confirmParams: {
          return_url: `${window.location.origin}/payment-return`,
        },
      });
      if (error) {
        toast.error(error.message || "Betalningen misslyckades.");
        setBusy(false);
        return;
      }
      if (paymentIntent?.status !== "succeeded") {
        toast.error("Betalningen slutfördes inte.");
        setBusy(false);
        return;
      }
      onDone(paymentIntent.id);
    } else {
      const { error, setupIntent } = await stripe.confirmSetup({
        elements,
        redirect: "if_required",
      });
      if (error) {
        toast.error(error.message || "Kortet kunde inte sparas.");
        setBusy(false);
        return;
      }
      const pm =
        typeof setupIntent?.payment_method === "string"
          ? setupIntent.payment_method
          : setupIntent?.payment_method?.id;
      if (!pm) {
        toast.error("Kortet kunde inte sparas. Försök igen.");
        setBusy(false);
        return;
      }
      onDone(pm);
    }
    // Föräldern skapar bokningen; håll knappen upptagen tills dess.
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-4">
      <PaymentElement />
      <div className="modal-action">
        <button type="button" className="btn btn-ghost" onClick={onBack} disabled={busy}>
          Tillbaka
        </button>
        <button type="submit" className="btn btn-primary" disabled={!stripe || busy}>
          {busy && <span className="loading loading-spinner loading-xs" />}
          {submitLabel}
        </button>
      </div>
    </form>
  );
};

/**
 * Betalvalsteg vid bokning: kunden väljer att betala hela beloppet online,
 * eller på plats (spara kort för no-show). Visas bara när Stripe är konfigurerat.
 */
const PaymentChoiceModal: React.FC<PaymentChoiceModalProps> = ({
  isOpen,
  onClose,
  serviceId,
  servicePrice,
  employeeId,
  startTime,
  endTime,
  onComplete,
}) => {
  const [mode, setMode] = useState<Mode>("choice");
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [amount, setAmount] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const reset = () => {
    setMode("choice");
    setClientSecret(null);
    setAmount(null);
  };
  const close = () => {
    reset();
    onClose();
  };

  const startOnlinePayment = async () => {
    setLoading(true);
    try {
      const res = await createPaymentIntent(serviceId, employeeId, startTime, endTime);
      setClientSecret(res.clientSecret);
      setAmount(res.amount);
      setMode("online");
    } catch {
      toast.error("Kunde inte förbereda betalningen. Försök igen.");
    } finally {
      setLoading(false);
    }
  };

  const startOnSite = async () => {
    setLoading(true);
    try {
      const cs = await createSetupIntent();
      setClientSecret(cs);
      setMode("onsite");
    } catch {
      toast.error("Kunde inte förbereda kortbetalning. Försök igen.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <dialog className="modal modal-open">
      <div className="modal-box">
        <h3 className="font-bold text-lg">Hur vill du betala?</h3>

        {mode === "choice" && (
          <div className="mt-4 space-y-3">
            <button
              className="btn btn-primary w-full justify-start gap-3"
              onClick={startOnlinePayment}
              disabled={loading}
            >
              <Wallet className="h-5 w-5" />
              Betala online nu ({servicePrice} kr)
            </button>
            <button
              className="btn btn-outline w-full justify-start gap-3"
              onClick={startOnSite}
              disabled={loading}
            >
              <MapPin className="h-5 w-5 text-primary" />
              Betala på plats (spara kort)
            </button>

            <p className="text-xs text-base-content/50">
              Vid "betala på plats" sparas ett kort och debiteras endast vid
              utebliven tid, enligt våra villkor.
            </p>

            {loading && (
              <div className="pt-2 text-center">
                <span className="loading loading-spinner loading-sm" />
              </div>
            )}
            <div className="modal-action">
              <button className="btn btn-ghost" onClick={close} disabled={loading}>
                Avbryt
              </button>
            </div>
          </div>
        )}

        {mode === "online" && clientSecret && (
          <>
            <p className="py-2 text-sm text-base-content/70">
              Du betalar {amount} kr nu.
            </p>
            <Elements stripe={stripePromise} options={{ clientSecret, locale: "sv" }}>
              <StripeForm
                intent="pay"
                submitLabel={`Betala ${amount} kr`}
                onDone={(pi) => onComplete({ paymentIntentId: pi })}
                onBack={reset}
              />
            </Elements>
          </>
        )}

        {mode === "onsite" && clientSecret && (
          <>
            <p className="py-2 text-sm text-base-content/70">
              Inget dras nu — du betalar på plats. Kortet används bara om du
              uteblir från besöket, enligt våra villkor.
            </p>
            <Elements stripe={stripePromise} options={{ clientSecret, locale: "sv" }}>
              <StripeForm
                intent="setup"
                submitLabel="Spara kort & boka"
                onDone={(pm) => onComplete({ paymentMethodId: pm })}
                onBack={reset}
              />
            </Elements>
          </>
        )}
      </div>
      <div className="modal-backdrop bg-black/30" onClick={close} />
    </dialog>
  );
};

export default PaymentChoiceModal;
