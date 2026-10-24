import { useState } from "react";
import { motion } from "framer-motion";
import { Shield, Search, Check, X, AlertTriangle, Upload, Eye, Clock, BarChart3, Settings, Package, Wallet, Image, FileText, Users } from "lucide-react";
import AdminManagementTab from "./AdminManagementTab";
import { useApp } from "../context/AppContext";
import { supabase } from "../integrations/supabase/client";
import { toast } from "sonner";
import type { Order, OrderStatus, AuditLogEntry, MembershipPackage, CryptoWalletConfig } from "../types";

type Tab = "queue" | "audit" | "packages" | "wallets" | "fulfillment" | "about" | "admins";

const statusOptions: OrderStatus[] = ["under_review", "additional_information_required", "payment_approved", "payment_rejected", "card_ready", "completed", "cancelled"];

function StatusBadge({ status }: { status: OrderStatus }) {
  const colors: Record<OrderStatus, string> = {
    awaiting_payment: "bg-zinc-500/20 text-zinc-400", payment_submitted: "bg-blue-500/20 text-blue-400",
    under_review: "bg-amber-500/20 text-amber-400", additional_information_required: "bg-orange-500/20 text-orange-400",
    payment_approved: "bg-emerald-500/20 text-emerald-400", payment_rejected: "bg-red-500/20 text-red-400",
    card_ready: "bg-[#D4AF37]/20 text-[#D4AF37]", completed: "bg-emerald-500/20 text-emerald-400", cancelled: "bg-zinc-500/20 text-zinc-500",
  };
  return <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase ${colors[status]}`}>{status.replace(/_/g, " ")}</span>;
}

function ReviewModal({ order, onClose }: { order: Order; onClose: () => void }) {
  const { state, dispatch } = useApp();
  const [action, setAction] = useState<OrderStatus | null>(null);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  const handleAction = async () => {
    if (!action) return;
    if ((action === "payment_rejected" || action === "additional_information_required") && !notes.trim()) {
      setError("Reason is mandatory for rejection and info requests"); return;
    }
    dispatch({ type: "ADMIN_CHANGE_STATUS", payload: { orderId: order.id, newStatus: action, notes, adminId: state.currentUser?.id || "admin-1", adminName: state.currentUser?.fullName || "Executive Admin" } });
    // Sync to Supabase
    try {
      await supabase.from("orders").update({ status: action, admin_notes: notes, updated_at: new Date().toISOString() }).eq("id", order.id);
      await supabase.from("audit_logs").insert({
        id: Math.random().toString(36).slice(2) + Date.now().toString(36),
        order_id: order.id,
        admin_id: state.currentUser?.id || "admin-1",
        admin_name: state.currentUser?.fullName || "Executive Admin",
        previous_status: order.status,
        new_status: action,
        notes,
      });
    } catch (e: any) { toast.error("Sync failed: " + (e.message || "")); }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-white/10 bg-[#12141A] p-6" onClick={e => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-serif text-lg font-bold text-white">Review Submission</h3>
          <button onClick={onClose} className="text-zinc-500 hover:text-white"><X className="h-5 w-5" /></button>
        </div>

        <div className="mb-4 rounded-lg bg-white/3 p-4 text-sm">
          <p className="text-zinc-300"><span className="font-semibold">Order:</span> {order.reference}</p>
          <p className="text-zinc-300"><span className="font-semibold">Package:</span> {order.packageName} (${order.packagePrice.toLocaleString()})</p>
          <p className="text-zinc-300"><span className="font-semibold">Method:</span> {order.paymentMethod === "crypto" ? "Cryptocurrency" : "Gift Card"}</p>
          {order.paymentPayload && (
            <div className="mt-2 border-t border-white/5 pt-2">
              {order.paymentPayload.method === "crypto" ? (
                <>
                  <p className="text-xs text-zinc-400">Asset: {(order.paymentPayload as any).asset} | Network: {(order.paymentPayload as any).network}</p>
                  <p className="text-xs text-zinc-400">Amount: {(order.paymentPayload as any).amount}</p>
                  <p className="text-xs text-zinc-400 font-mono break-all">TX: {(order.paymentPayload as any).transactionHash}</p>
                </>
              ) : (
                <>
                  <p className="text-xs text-zinc-400">Brand: {(order.paymentPayload as any).brand}</p>
                  <p className="text-xs text-zinc-400">Denomination: {(order.paymentPayload as any).denomination} {(order.paymentPayload as any).currency}</p>
                  <p className="text-xs text-zinc-400">Reference: {(order.paymentPayload as any).purchaseReference}</p>
                  <p className="text-xs text-zinc-400">Notes: {(order.paymentPayload as any).notes}</p>
                </>
              )}
              {order.paymentPayload.proofImages.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs text-zinc-500 mb-1">Proof Images ({order.paymentPayload.proofImages.length}):</p>
                  <div className="grid grid-cols-4 gap-1.5">
                    {order.paymentPayload.proofImages.slice(0, 8).map((img, i) => (
                      <img key={i} src={img} alt="" className="aspect-square rounded-lg object-cover" />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          {order.additionalInfoProvided && <p className="mt-2 text-xs text-emerald-400">Client response: {order.additionalInfoProvided}</p>}
        </div>

        {error && <p className="mb-3 rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-400">{error}</p>}

        <div className="mb-3">
          <label className="mb-1.5 block text-xs font-medium text-zinc-400">Select Action</label>
          <div className="flex flex-wrap gap-2">
            {statusOptions.map(s => (
              <button key={s} onClick={() => { setAction(s); setError(""); }}
                className={`rounded-lg px-3 py-1.5 text-xs ${action === s ? "bg-[#D4AF37] text-black font-semibold" : "bg-white/5 text-zinc-400 hover:bg-white/10"}`}>
                {s.replace(/_/g, " ")}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <label className="mb-1.5 block text-xs font-medium text-zinc-400">
            Notes {action === "payment_rejected" || action === "additional_information_required" ? "(mandatory)" : "(optional)"}
          </label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-zinc-600"
            placeholder={action === "additional_information_required" ? "What information do you need from the client?" : action === "payment_rejected" ? "Reason for rejection..." : "Verification notes..."} />
        </div>

        <button onClick={handleAction} disabled={!action}
          className="w-full rounded-lg bg-[#D4AF37] py-2.5 text-sm font-semibold text-black disabled:opacity-40">
          Apply Status Change
        </button>
      </motion.div>
    </div>
  );
}

export default function AdminPortal() {
  const { state, dispatch } = useApp();
  const [tab, setTab] = useState<Tab>("queue");
  const [search, setSearch] = useState("");
  const [reviewOrder, setReviewOrder] = useState<Order | null>(null);
  const [fulfillOrderId, setFulfillOrderId] = useState("");
  const [cardArtwork, setCardArtwork] = useState<string>("");
  const [aboutQuote, setAboutQuote] = useState(state.aboutSection.quote);
  const [aboutImageUrl, setAboutImageUrl] = useState(state.aboutSection.imageUrl);
  const [aboutBio, setAboutBio] = useState(state.aboutSection.bio);

  const pendingOrders = state.orders.filter(o => ["payment_submitted", "under_review", "additional_information_required"].includes(o.status));
  const approvedOrders = state.orders.filter(o => ["payment_approved", "card_ready", "completed"].includes(o.status));
  const rejectedOrders = state.orders.filter(o => o.status === "payment_rejected");

  const filteredOrders = state.orders.filter(o => {
    const q = search.toLowerCase();
    return !q || o.reference.toLowerCase().includes(q) || o.packageName.toLowerCase().includes(q) || o.status.includes(q);
  }).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  const handleUploadArtwork = (files: FileList) => {
    const file = files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => { if (reader.result) setCardArtwork(reader.result as string); };
    reader.readAsDataURL(file);
  };

  const handleFulfill = async () => {
    if (fulfillOrderId && cardArtwork) {
      dispatch({ type: "UPLOAD_CARD", payload: { orderId: fulfillOrderId, artworkUrl: cardArtwork } });
      try {
        await supabase.from("orders").update({ card_artwork_url: cardArtwork, status: "card_ready", updated_at: new Date().toISOString() }).eq("id", fulfillOrderId);
      } catch (e: any) { toast.error("Sync failed: " + (e.message || "")); }
      setFulfillOrderId("");
      setCardArtwork("");
    }
  };

  const persistPackage = async (pkg: MembershipPackage) => {
    try { await supabase.from("membership_packages").update({ price: pkg.price, active: pkg.active, sort_order: pkg.order, updated_at: new Date().toISOString() }).eq("id", pkg.id); } catch (e: any) { toast.error("Sync failed: " + (e.message || "")); }
  };
  const persistWallet = async (w: CryptoWalletConfig) => {
    try { await supabase.from("crypto_wallets").update({ asset: w.asset, network: w.network, address: w.address, label: w.label, updated_at: new Date().toISOString() }).eq("id", w.id); } catch (e: any) { toast.error("Sync failed: " + (e.message || "")); }
  };

  const handleSaveAbout = async () => {
    try {
      const { error } = await supabase.from("site_settings").update({
        about_quote: aboutQuote,
        about_image_url: aboutImageUrl,
        about_bio: aboutBio,
        updated_at: new Date().toISOString(),
      } as any).eq("id", "default");
      if (error) throw error;
      dispatch({ type: "UPDATE_ABOUT", payload: { ...state.aboutSection, quote: aboutQuote, imageUrl: aboutImageUrl, bio: aboutBio } });
      toast.success("About section updated successfully");
    } catch (e: any) {
      toast.error("Failed to save: " + (e.message || ""));
    }
  };

  const tabs: { key: Tab; label: string; icon: typeof Shield }[] = [
    { key: "queue", label: "Verification Queue", icon: Shield },
    { key: "audit", label: "Audit Trail", icon: FileText },
    { key: "packages", label: "Packages", icon: Package },
    { key: "wallets", label: "Wallets", icon: Wallet },
    { key: "fulfillment", label: "Card Fulfillment", icon: Image },
    { key: "about", label: "About & Media", icon: Settings },
    { key: "admins", label: "Admin Team & Security", icon: Users },
  ];

  return (
    <div className="min-h-[100dvh] app-gradient pt-20 pb-12 px-4 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-2 font-serif text-2xl font-bold text-gold-shimmer">Executive Audit Command Center</h1>
        <p className="mb-6 text-sm text-zinc-500">Keanu Reeves Membership Verification &mdash; review submissions, manage packages, and fulfill membership cards.</p>

        {/* Metrics */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[{ label: "Pending", value: pendingOrders.length, color: "text-amber-400" }, { label: "Approved", value: approvedOrders.length, color: "text-emerald-400" }, { label: "Rejected", value: rejectedOrders.length, color: "text-red-400" }, { label: "Total Orders", value: state.orders.length, color: "text-[#D4AF37]" }].map(m => (
            <div key={m.label} className="premium-card rounded-xl p-4">
              <p className={`text-2xl font-bold ${m.color}`}>{m.value}</p>
              <p className="text-xs text-zinc-500">{m.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="mb-4 flex gap-1 overflow-x-auto rounded-xl bg-white/3 p-1">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs whitespace-nowrap ${tab === t.key ? "bg-[#D4AF37] text-black font-semibold" : "text-zinc-400 hover:text-white"}`}>
              <t.icon className="h-3.5 w-3.5" />{t.label}
            </button>
          ))}
        </div>

        {/* Queue Tab */}
        {tab === "queue" && (
          <div>
            <div className="mb-3 relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search orders..." className="w-full rounded-lg border border-white/10 bg-white/5 pl-9 pr-3 py-2 text-sm text-white placeholder-zinc-600" />
            </div>
            <div className="overflow-x-auto rounded-xl border border-white/5">
              <table className="w-full text-xs">
                <thead className="bg-white/3">
                  <tr>{["Reference", "Package", "Status", "Method", "Updated", "Action"].map(h => <th key={h} className="px-4 py-3 text-left font-semibold text-zinc-400">{h}</th>)}</tr>
                </thead>
                <tbody>
                  {filteredOrders.map(o => (
                    <tr key={o.id} className="border-t border-white/5 hover:bg-white/2">
                      <td className="px-4 py-3 font-mono text-zinc-300">{o.reference}</td>
                      <td className="px-4 py-3 text-zinc-300">{o.packageName}</td>
                      <td className="px-4 py-3"><StatusBadge status={o.status} /></td>
                      <td className="px-4 py-3 text-zinc-400">{o.paymentMethod || "-"}</td>
                      <td className="px-4 py-3 text-zinc-500">{new Date(o.updatedAt).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        {["payment_submitted", "under_review", "additional_information_required"].includes(o.status) && (
                          <button onClick={() => setReviewOrder(o)} className="rounded-lg bg-[#D4AF37]/10 px-3 py-1.5 text-[#D4AF37] hover:bg-[#D4AF37]/20">Review</button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {filteredOrders.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-zinc-500">No orders found</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Audit Tab */}
        {tab === "audit" && (
          <div className="space-y-2">
            {state.auditLogs.sort((a, b) => b.timestamp.localeCompare(a.timestamp)).map(log => (
              <div key={log.id} className="premium-card rounded-xl p-4">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <Clock className="h-3 w-3 text-zinc-500" />
                  <span className="text-zinc-500">{new Date(log.timestamp).toLocaleString()}</span>
                  <span className="text-zinc-400">|</span>
                  <span className="font-mono text-zinc-300">{log.orderId}</span>
                  <span className="text-zinc-400">|</span>
                  <span className="text-zinc-400">{log.adminName}</span>
                </div>
                <div className="mt-2 flex items-center gap-2 text-xs">
                  <StatusBadge status={log.previousStatus} />
                  <span className="text-zinc-500">&rarr;</span>
                  <StatusBadge status={log.newStatus} />
                </div>
                {log.notes && <p className="mt-2 text-xs text-zinc-400 italic">{log.notes}</p>}
              </div>
            ))}
            {state.auditLogs.length === 0 && <p className="py-8 text-center text-sm text-zinc-500">No audit entries yet.</p>}
          </div>
        )}

        {/* Packages Tab */}
        {tab === "packages" && (
          <div className="space-y-3">
            {state.packages.sort((a, b) => a.order - b.order).map(pkg => (
              <div key={pkg.id} className="rounded-xl border border-white/5 bg-[#12141A] p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-white">{pkg.name}</h4>
                    <p className="text-xs text-zinc-500">${pkg.price.toLocaleString()} &bull; {pkg.benefits.length} benefits &bull; {pkg.tier}</p>
                  </div>
                  <button onClick={() => { const next = { ...pkg, active: !pkg.active }; dispatch({ type: "UPDATE_PACKAGE", payload: next }); persistPackage(next); }}
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${pkg.active ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"}`}>
                    {pkg.active ? "Active" : "Inactive"}
                  </button>
                </div>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <div>
                    <label className="text-[10px] text-zinc-500">Price</label>
                    <input type="number" defaultValue={pkg.price} onBlur={e => { const next = { ...pkg, price: Number(e.target.value) }; dispatch({ type: "UPDATE_PACKAGE", payload: next }); persistPackage(next); }}
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white" />
                  </div>
                  <div>
                    <label className="text-[10px] text-zinc-500">Order</label>
                    <input type="number" defaultValue={pkg.order} onBlur={e => { const next = { ...pkg, order: Number(e.target.value) }; dispatch({ type: "UPDATE_PACKAGE", payload: next }); persistPackage(next); }}
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Wallets Tab */}
        {tab === "wallets" && (
          <div className="space-y-3">
            <p className="text-xs text-zinc-500">Edit the asset, network, receiving address, and display label for each wallet. Changes are saved when you leave a field.</p>
            {state.wallets.map(w => (
              <div key={w.id} className="rounded-xl border border-white/5 bg-[#12141A] p-4">
                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="flex items-center gap-3 sm:col-span-2">
                    <span className="rounded-lg bg-white/5 px-2 py-1 text-xs font-bold text-[#D4AF37]">{w.asset}</span>
                    <span className="text-xs text-zinc-500">{w.network}</span>
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] uppercase tracking-wide text-zinc-500">Asset</label>
                    <input defaultValue={w.asset} onBlur={e => { const next = { ...w, asset: e.target.value }; dispatch({ type: "UPDATE_WALLET", payload: next }); persistWallet(next); }}
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white" />
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] uppercase tracking-wide text-zinc-500">Network</label>
                    <input defaultValue={w.network} onBlur={e => { const next = { ...w, network: e.target.value }; dispatch({ type: "UPDATE_WALLET", payload: next }); persistWallet(next); }}
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white" />
                  </div>
                </div>
                <div className="mt-2">
                  <label className="mb-1 block text-[10px] uppercase tracking-wide text-zinc-500">Receiving Address</label>
                  <input defaultValue={w.address} onBlur={e => { const next = { ...w, address: e.target.value }; dispatch({ type: "UPDATE_WALLET", payload: next }); persistWallet(next); }}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white font-mono" />
                </div>
                <div className="mt-2">
                  <label className="mb-1 block text-[10px] uppercase tracking-wide text-zinc-500">Display Label</label>
                  <input defaultValue={w.label} onBlur={e => { const next = { ...w, label: e.target.value }; dispatch({ type: "UPDATE_WALLET", payload: next }); persistWallet(next); }}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Admin Team & Security Tab */}
        {tab === "admins" && <AdminManagementTab />}

        {/* About & Media Tab */}
        {tab === "about" && (
          <div className="space-y-5">
            <p className="text-xs text-zinc-500">Edit the About section displayed on the landing page. Changes are saved to the database.</p>

            {/* Image URL + Preview */}
            <div className="rounded-xl border border-white/5 bg-[#12141A] p-5">
              <label className="mb-2 block text-xs font-medium text-zinc-400">Portrait Image URL</label>
              <input value={aboutImageUrl} onChange={e => setAboutImageUrl(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-zinc-600 font-mono" placeholder="https://..." />
              {aboutImageUrl && (
                <div className="mt-4 flex items-start gap-4">
                  <div className="relative h-48 w-36 shrink-0 overflow-hidden rounded-lg border border-[#D4AF37]/20">
                    <img src={aboutImageUrl} alt="Preview" className="h-full w-full object-cover object-top" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                  </div>
                  <div className="text-xs text-zinc-500">
                    <p className="font-medium text-zinc-400">Live Preview</p>
                    <p className="mt-1">Upload to Supabase Storage or use any public URL for the portrait image.</p>
                  </div>
                </div>
              )}
            </div>

            {/* Quote */}
            <div className="rounded-xl border border-white/5 bg-[#12141A] p-5">
              <label className="mb-2 block text-xs font-medium text-zinc-400">Featured Quote</label>
              <textarea value={aboutQuote} onChange={e => setAboutQuote(e.target.value)} rows={4}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-zinc-600" placeholder="Enter the featured quote..." />
            </div>

            {/* Bio */}
            <div className="rounded-xl border border-white/5 bg-[#12141A] p-5">
              <label className="mb-2 block text-xs font-medium text-zinc-400">Biography</label>
              <textarea value={aboutBio} onChange={e => setAboutBio(e.target.value)} rows={4}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-zinc-600" placeholder="Enter the biography text..." />
            </div>

            <button onClick={handleSaveAbout}
              className="w-full rounded-lg bg-[#D4AF37] py-2.5 text-sm font-semibold text-black hover:bg-[#F3E5AB] transition-colors">
              Save About Section
            </button>
          </div>
        )}

        {/* Fulfillment Tab */}
        {tab === "fulfillment" && (
          <div className="space-y-4">
            <p className="text-xs text-zinc-400">Upload custom card artwork for approved members.</p>
            <div className="rounded-xl border border-white/5 bg-[#12141A] p-4">
              <label className="mb-1.5 block text-xs font-medium text-zinc-400">Select Order</label>
              <select value={fulfillOrderId} onChange={e => setFulfillOrderId(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white">
                <option value="">Choose an approved order...</option>
                {state.orders.filter(o => o.status === "payment_approved").map(o => (
                  <option key={o.id} value={o.id}>{o.reference} - {o.packageName}</option>
                ))}
              </select>
            </div>
            <div className="rounded-xl border border-white/5 bg-[#12141A] p-4">
              <label className="mb-1.5 block text-xs font-medium text-zinc-400">Card Artwork Image</label>
              <label className="flex cursor-pointer items-center justify-center rounded-lg border border-dashed border-white/10 bg-white/3 py-8 text-sm text-zinc-500 hover:border-[#D4AF37]/30">
                <Upload className="mr-2 h-5 w-5" />Upload card design
                <input type="file" accept="image/*" className="hidden" onChange={e => { if (e.target.files) handleUploadArtwork(e.target.files); }} />
              </label>
              {cardArtwork && (
                <div className="mt-3">
                  <img src={cardArtwork} alt="Card preview" className="mx-auto max-w-xs rounded-xl" />
                </div>
              )}
            </div>
            <button onClick={handleFulfill} disabled={!fulfillOrderId || !cardArtwork}
              className="w-full rounded-lg bg-[#D4AF37] py-2.5 text-sm font-semibold text-black disabled:opacity-40">
              Upload & Mark Card Ready
            </button>
          </div>
        )}
      </div>

      {reviewOrder && <ReviewModal order={reviewOrder} onClose={() => setReviewOrder(null)} />}
    </div>
  );
}