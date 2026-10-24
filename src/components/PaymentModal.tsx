import { useState } from "react";
import { motion } from "framer-motion";
import { Bitcoin, CreditCard, Check, X, Clock } from "lucide-react";
import { useApp } from "../context/AppContext";
import { supabase } from "../integrations/supabase/client";
import { toast } from "sonner";
import CryptoPaymentForm from "./payment/CryptoPaymentForm";
import GiftCardForm from "./payment/GiftCardForm";
import type { Order, PaymentPayload } from "../types";

interface Props { order: Order; onClose: () => void; }

export default function PaymentModal({ order, onClose }: Props) {
  const { dispatch } = useApp();
  const [method, setMethod] = useState<"crypto" | "gift_card" | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const persist = async (paymentMethod: "crypto" | "gift_card", payload: PaymentPayload) => {
    dispatch({ type: "SUBMIT_PAYMENT", payload: { orderId: order.id, paymentMethod, paymentPayload: payload } });
    try {
      const { error } = await supabase.from("orders")
        .update({ status: "payment_submitted", payment_method: paymentMethod, payment_payload: payload as any, updated_at: new Date().toISOString() })
        .eq("id", order.id);
      if (error) throw error;
    } catch (e: any) {
      toast.error("Sync failed: " + (e.message || "Unknown error"));
    }
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4">
        <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#12141A] p-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10">
            <Check className="h-7 w-7 text-emerald-400" />
          </div>
          <h3 className="font-serif text-xl font-bold text-white">Payment Submitted</h3>
          <p className="mt-2 text-sm text-zinc-400">Your payment for {order.reference} has been received. Verification takes 1-3 working days.</p>
          <button onClick={onClose} className="mt-5 rounded-lg bg-[#D4AF37] px-6 py-2.5 text-sm font-semibold text-black">Done</button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-white/10 bg-[#12141A] p-6" onClick={e => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="font-serif text-lg font-bold text-white">Keanu Reeves &mdash; Membership Verification</h3>
            <p className="text-xs text-zinc-500">Submit Payment &bull; {order.reference} &bull; {order.packageName} &bull; ${order.packagePrice.toLocaleString()}</p>
          </div>
          <button onClick={onClose} aria-label="Close" className="text-zinc-500 hover:text-white"><X className="h-5 w-5" /></button>
        </div>

        <div className="mb-4 flex items-center gap-2 rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
          <Clock className="h-4 w-4 shrink-0" />Manual verification: 1-3 working days. Do NOT submit confidential redemption PINs.
        </div>

        {!method ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <button onClick={() => setMethod("crypto")}
              className="rounded-xl border border-white/10 bg-white/3 p-6 text-left hover:border-[#D4AF37]/40 transition-colors">
              <Bitcoin className="mb-3 h-8 w-8 text-[#F7931A]" />
              <h4 className="font-semibold text-white">Cryptocurrency</h4>
              <p className="mt-1 text-xs text-zinc-400">BTC, ETH, USDT (ERC-20), SOL</p>
            </button>
            <button onClick={() => setMethod("gift_card")}
              className="rounded-xl border border-white/10 bg-white/3 p-6 text-left hover:border-[#D4AF37]/40 transition-colors">
              <CreditCard className="mb-3 h-8 w-8 text-[#D4AF37]" />
              <h4 className="font-semibold text-white">Gift Card</h4>
              <p className="mt-1 text-xs text-zinc-400">Primary: Apple, Steam, Razer Gold</p>
            </button>
          </div>
        ) : method === "crypto" ? (
          <CryptoPaymentForm price={order.packagePrice} onBack={() => setMethod(null)}
            onSubmit={payload => void persist("crypto", payload)} />
        ) : (
          <GiftCardForm price={order.packagePrice} onBack={() => setMethod(null)}
            onSubmit={payload => void persist("gift_card", payload)} />
        )}
      </motion.div>
    </div>
  );
}