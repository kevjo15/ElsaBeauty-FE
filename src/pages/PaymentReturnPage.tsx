import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import MainLayout from "@/components/layout/main-layout";
import { CheckCircle2, XCircle } from "lucide-react";
import { finalizePaymentBooking } from "@/services/api";
import { useAuth } from "@/services/api/authContext";

type State =
  | { kind: "processing" }
  | { kind: "failed"; message: string }
  | { kind: "already-booked" };

/**
 * Landningssida för redirect-betalsätt (Klarna/Amazon Pay). Stripe skickar tillbaka
 * kunden hit med payment_intent + redirect_status. Bokningen slutförs serverside ur
 * PaymentIntent-metadatan (finalizePaymentBooking) — inget behöver sparas i webbläsaren.
 * Skulle kunden aldrig komma hit stäms betalningen ändå av via Stripe-webhooken.
 * Kort/wallets går aldrig via denna sida — de bekräftas inline i betalmodalen.
 */
const PaymentReturnPage: React.FC = () => {
  const [params] = useSearchParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [state, setState] = useState<State>({ kind: "processing" });
  const ran = useRef(false); // vänta tills auth återställts efter redirect-reloaden

  useEffect(() => {
    if (ran.current || !user) return;
    ran.current = true;

    const paymentIntentId = params.get("payment_intent");
    const redirectStatus = params.get("redirect_status");

    const finish = async () => {
      if (!paymentIntentId || redirectStatus === "failed") {
        setState({
          kind: "failed",
          message:
            "Betalningen genomfördes inte. Inget har dragits — du kan försöka igen.",
        });
        return;
      }

      try {
        const booking = await finalizePaymentBooking(paymentIntentId);
        navigate(`/booking-confirmation/${booking?.id || ""}`, { replace: true });
      } catch (error: unknown) {
        const response = (error as { response?: { status?: number; data?: unknown } })
          ?.response;
        const data = response?.data;
        const msg =
          typeof data === "string"
            ? data
            : (data as { error?: string })?.error || "";

        if (response?.status === 409) {
          // Conflict = betalningen är redan kopplad till en bokning
          // (webhooken hann först, eller omladdad sida) — allt är klart.
          setState({ kind: "already-booked" });
          return;
        }
        setState({
          kind: "failed",
          message:
            msg ||
            "Bokningen kunde inte slutföras. Kontakta kliniken om beloppet dragits.",
        });
      }
    };

    finish();
  }, [user, params, navigate]);

  return (
    <MainLayout>
      <div className="container mx-auto py-6 max-w-2xl">
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body items-center text-center">
            {state.kind === "processing" && (
              <>
                <span className="loading loading-spinner loading-lg" />
                <p className="mt-4">Slutför din bokning...</p>
              </>
            )}

            {state.kind === "failed" && (
              <>
                <div className="w-16 h-16 bg-error/10 rounded-full flex items-center justify-center mb-4">
                  <XCircle className="h-10 w-10 text-error" />
                </div>
                <h2 className="card-title text-2xl">Bokningen slutfördes inte</h2>
                <p className="text-base-content/70">{state.message}</p>
                <div className="card-actions justify-center mt-6 gap-2">
                  <Link to="/dashboard" className="btn btn-ghost">Till Dashboard</Link>
                  <Link to="/bookings" className="btn btn-primary">Försök igen</Link>
                </div>
              </>
            )}

            {state.kind === "already-booked" && (
              <>
                <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle2 className="h-10 w-10 text-success" />
                </div>
                <h2 className="card-title text-2xl">Din bokning är klar</h2>
                <p className="text-base-content/70">
                  Betalningen är kopplad till din bokning — du hittar den under Mina
                  bokningar.
                </p>
                <div className="card-actions justify-center mt-6 gap-2">
                  <Link to="/dashboard" className="btn btn-ghost">Till Dashboard</Link>
                  <Link to="/bookings/history" className="btn btn-primary">Mina bokningar</Link>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default PaymentReturnPage;
