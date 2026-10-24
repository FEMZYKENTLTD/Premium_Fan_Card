import { useState } from "react";
import { motion } from "framer-motion";
import { Clock, Check, X, CreditCard, Send, Download, Eye } from "lucide-react";
import { useApp } from "../context/AppContext";
import { supabase } from "../integrations/supabase/client";
import { toast } from "sonner";
import type { Order, OrderStatus } from "../types";
import PaymentModal from "./PaymentModal";

const statusSteps: { key: OrderStatus; label: string }[] = [
  { key: "awaiting_payment", label: "Order Created" },
  { key: "payment_submitted", label: "Payment Submitted" },
  { key: "under_review", label: "Under Review" },
  { key: "payment_approved", label: "Approved" },
  { key: "card_ready", label: "Card Ready" },
  { key: "completed", label: "Active" },
];

const statusColor: Record<OrderStatus, string> = {
  awaiting_payment: "text-zinc-400", payment_submitted: "text-blue-400", under_review: "text-amber-400",
  additional_information_required: "text-orange-400", payment_approved: "text-emerald-400",
  payment_rejected: "text-red-400", card_ready: "text-[#D4AF37]", completed: "text-emerald-400", cancelled: "text-zinc-500",
};

function OrderTimeline({ status }: { status: OrderStatus }) {
  const currentIdx = statusSteps.findIndex(s => s.key === status);
  const isRejected = status === "payment_rejected";
  const isInfoReq = status === "additional_information_required";
  return (
    <div className="flex items-center gap-1 overflow-x-auto py-2">
      {statusSteps.map((step, i) => {
        const active = currentIdx >= 0 && i <= currentIdx;
        return (
          <div key={step.key} className="flex items-center">
            <div className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] ${active ? "bg-[#D4AF37] text-black" : "bg-white/5 text-zinc-500"}`}>
              {active ? <Check className="h-3 w-3" /> : i + 1}
            </div>
            {i < statusSteps.length - 1 && <div className={`h-px w-4 sm:w-6 ${active ? "bg-[#D4AF37]" : "bg-white/10"}`} />}
          </div>
        );
      })}
      {isRejected && <span className="ml-2 text-xs text-red-400">Rejected</span>}
      {isInfoReq && <span className="ml-2 text-xs text-orange-400">Info Required</span>}
    </div>
  );
}

function MembershipCard({ order, userName }: { order: Order; userName: string }) {
  const tier = order.packageName.includes("Silver") ? "silver" : order.packageName.includes("Gold") ? "gold" : order.packageName.includes("Platinum") ? "platinum" : "obsidian";
  const gradients: Record<string, string> = {
    silver: "from-zinc-700 via-zinc-600 to-zinc-800", gold: "from-yellow-800 via-yellow-600 to-yellow-900",
    platinum: "from-zinc-500 via-zinc-300 to-zinc-600", obsidian: "from-gray-900 via-gray-800 to-black",
  };
  return (
    <div className={`relative aspect-[1.6/1] w-full max-w-sm rounded-2xl bg-gradient-to-br ${gradients[tier]} p-5 shadow-2xl overflow-hidden`}>
      <div className="absolute inset-0 opacity-20" style={{ background: "radial-gradient(circle at 80% 20%, rgba(255,255,255,0.3), transparent 50%)" }} />
      {order.cardArtworkUrl ? (
        <img src={order.cardArtworkUrl} alt="Card Artwork" className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <div className="relative flex h-full flex-col justify-between">
          <div>
            <p className="font-serif text-sm font-bold uppercase tracking-[0.25em] text-white/80">KEANU REEVES</p>
            <p className="text-[8px] font-semibold uppercase tracking-[0.3em] text-white/40">Membership Card</p>
            <p className="mt-1 font-serif text-lg font-bold text-white capitalize">{tier} Tier</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-white">{userName}</p>
            <p className="mt-0.5 text-xs text-white/50 font-mono">{order.reference}</p>
            <p className="text-[10px] text-white/40">Member since {new Date(order.createdAt).toLocaleDateString()}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CustomerDashboard() {
  const { state, dispatch } = useApp();
  const [payOrderId, setPayOrderId] = useState<string | null>(null);
  const [viewCard, setViewCard] = useState<string | null>(null);
  const [infoResponse, setInfoResponse] = useState<Record<string, string>>({});

  if (!state.currentUser) return null;
  const myOrders = state.orders.filter(o => o.userId === state.currentUser!.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const handleProvideInfo = async (orderId: string) => {
    const info = infoResponse[orderId];
    if (info?.trim()) {
      dispatch({ type: "ADMIN_PROVIDE_INFO", payload: { orderId, info } });
      setInfoResponse(prev => ({ ...prev, [orderId]: "" }));
      try {
        await supabase.from("orders").update({ additional_info_provided: info, status: "under_review", updated_at: new Date().toISOString() }).eq("id", orderId);
      } catch (e: any) { toast.error("Sync failed: " + (e.message || "")); }
    }
  };

  return (
    <div className="min-h-[100dvh] app-gradient pt-20 pb-12 px-4 sm:px-6">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-2 font-serif text-2xl font-bold text-gold-shimmer">My Memberships</h1>
        <p className="mb-8 text-sm text-zinc-500">Track your orders and view issued membership cards.</p>

        {myOrders.length === 0 ? (
          <div className="premium-card rounded-2xl p-12 text-center">
            <CreditCard className="mx-auto mb-3 h-10 w-10 text-zinc-600" />
            <p className="text-sm text-zinc-400">No orders yet. Browse packages to get started.</p>
            <button onClick={() => dispatch({ type: "SET_VIEW", payload: "landing" })} className="mt-4 rounded-lg bg-[#D4AF37] px-4 py-2 text-sm font-semibold text-black">View Packages</button>
          </div>
        ) : (
          <div className="space-y-6">
            {myOrders.map(order => (
              <motion.div key={order.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="premium-card rounded-2xl p-5">
                <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-white">{order.packageName}</h3>
                    <p className="text-xs text-zinc-500 font-mono">{order.reference} &bull; ${order.packagePrice.toLocaleString()}</p>
                  </div>
                  <span className={`rounded-full bg-white/5 px-3 py-1 text-xs font-medium ${statusColor[order.status]}`}>
                    {order.status.replace(/_/g, " ")}
                  </span>
                </div>

                <OrderTimeline status={order.status} />

                {order.paymentPayload && (
                  <div className="mt-3 rounded-lg bg-white/3 p-3 text-xs text-zinc-400">
                    <span className="font-medium text-zinc-300">Payment:</span>{" "}
                    {order.paymentPayload.method === "crypto" ? `${(order.paymentPayload as any).asset} (${(order.paymentPayload as any).network})` : `Gift Card: ${(order.paymentPayload as any).brand}`}
                  </div>
                )}

                {order.status === "awaiting_payment" && (
                  <button onClick={() => setPayOrderId(order.id)} className="mt-3 flex items-center gap-2 rounded-lg bg-[#D4AF37] px-4 py-2 text-sm font-semibold text-black">
                    <CreditCard className="h-4 w-4" />Submit Payment
                  </button>
                )}

                {order.status === "additional_information_required" && (
                  <div className="mt-3 rounded-lg border border-orange-500/20 bg-orange-500/5 p-3">
                    <p className="mb-2 text-xs text-orange-300">Admin request: {order.additionalInfoRequested}</p>
                    <div className="flex gap-2">
                      <input value={infoResponse[order.id] || ""} onChange={e => setInfoResponse(prev => ({ ...prev, [order.id]: e.target.value }))}
                        placeholder="Provide additional info..." className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white" />
                      <button onClick={() => handleProvideInfo(order.id)} className="rounded-lg bg-orange-500 px-3 py-2 text-xs font-semibold text-black">
                        <Send className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                {(order.status === "card_ready" || order.status === "completed") && (
                  <div className="mt-3 flex gap-2">
                    <button onClick={() => setViewCard(order.id)} className="flex items-center gap-2 rounded-lg bg-[#D4AF37]/10 px-4 py-2 text-xs font-semibold text-[#D4AF37] hover:bg-[#D4AF37]/20">
                      <Eye className="h-3.5 w-3.5" />View Card
                    </button>
                    {order.status === "card_ready" && (
                      <button onClick={() => dispatch({ type: "ADMIN_CHANGE_STATUS", payload: { orderId: order.id, newStatus: "completed", notes: "Member acknowledged receipt", adminId: state.currentUser!.id, adminName: state.currentUser!.fullName } })}
                        className="flex items-center gap-2 rounded-lg bg-emerald-500/10 px-4 py-2 text-xs font-semibold text-emerald-400">
                        <Download className="h-3.5 w-3.5" />Activate
                      </button>
                    )}
                  </div>
                )}

                {order.status === "payment_rejected" && order.adminNotes && (
                  <div className="mt-3 rounded-lg border border-red-500/20 bg-red-500/5 p-3 text-xs text-red-300">
                    <p className="font-medium">Rejection reason:</p>
                    <p className="mt-1">{order.adminNotes}</p>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {payOrderId && (
        <PaymentModal order={myOrders.find(o => o.id === payOrderId)!} onClose={() => setPayOrderId(null)} />
      )}

      {viewCard && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4" onClick={() => setViewCard(null)}>
          <motion.div initial={{ scale: 0.9, rotateY: -15 }} animate={{ scale: 1, rotateY: 0 }} className="perspective-[1000px]" onClick={e => e.stopPropagation()}>
            <MembershipCard order={myOrders.find(o => o.id === viewCard)!} userName={state.currentUser!.fullName} />
            <p className="mt-3 text-center text-xs text-zinc-500">Click outside to close</p>
          </motion.div>
        </div>
      )}
    </div>
  );
}