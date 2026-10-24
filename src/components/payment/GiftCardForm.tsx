import { useState } from "react";
import { CreditCard, Upload, X, AlertTriangle, ShieldCheck, ChevronLeft } from "lucide-react";
import { PRIMARY_GIFT_CARDS, FALLBACK_GIFT_CARDS } from "../../data/initialData";
import type { GiftCardPaymentPayload } from "../../types";

export default function GiftCardForm({ price, onSubmit, onBack }: {
  price: number;
  onSubmit: (payload: GiftCardPaymentPayload) => void;
  onBack: () => void;
}) {
  const [brand, setBrand] = useState("");
  const [denom, setDenom] = useState(String(price));
  const [currency, setCurrency] = useState("USD");
  const [ref, setRef] = useState("");
  const [notes, setNotes] = useState("");
  const [proofs, setProofs] = useState<string[]>([]);

  const handleImages = (files: FileList) => {
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = () => { if (reader.result) setProofs(prev => [...prev, reader.result as string]); };
      reader.readAsDataURL(file);
    });
  };

  const chip = (card: string) => `rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
    brand === card ? "border-[#D4AF37] bg-[#D4AF37]/15 text-[#D4AF37]" : "border-white/10 text-zinc-400 hover:border-white/20"}`;

  const submit = () => {
    if (!brand.trim() || !ref.trim()) return;
    onSubmit({ method: "gift_card", brand, denomination: Number(denom), currency, purchaseReference: ref, notes, proofImages: proofs });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-xs font-semibold text-[#D4AF37]">
        <CreditCard className="h-4 w-4" /> Gift card payment
      </div>

      <div className="rounded-lg border border-white/10 bg-white/3 p-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-[#D4AF37]">
          <ShieldCheck className="h-4 w-4" /> Primary accepted: Apple, Steam, Razer Gold
        </div>
        <p className="mt-1 text-[11px] text-zinc-400">If none of the primary cards are available to you, Amazon and Google Play are accepted as fallback options.</p>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-zinc-400">Accepted Brand / Issuer</label>
        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Primary</p>
        <div className="mb-3 flex flex-wrap gap-2">
          {PRIMARY_GIFT_CARDS.map(card => (
            <button key={card} type="button" onClick={() => setBrand(card)} className={chip(card)}>{card}</button>
          ))}
        </div>
        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Fallback (if primary unavailable)</p>
        <div className="flex flex-wrap gap-2">
          {FALLBACK_GIFT_CARDS.map(card => (
            <button key={card} type="button" onClick={() => setBrand(card)} className={chip(card)}>{card}</button>
          ))}
        </div>
        <select value={brand} onChange={e => setBrand(e.target.value)} className="mt-3 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white [color-scheme:dark]">
          <option value="" disabled>Select an accepted gift card</option>
          <optgroup label="Primary">{PRIMARY_GIFT_CARDS.map(c => <option key={c} value={c}>{c}</option>)}</optgroup>
          <optgroup label="Fallback">{FALLBACK_GIFT_CARDS.map(c => <option key={c} value={c}>{c}</option>)}</optgroup>
        </select>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-zinc-400">Denomination</label>
          <input type="number" value={denom} onChange={e => setDenom(e.target.value)} className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white" />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-zinc-400">Currency</label>
          <select value={currency} onChange={e => setCurrency(e.target.value)} className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white">
            <option>USD</option><option>EUR</option><option>GBP</option>
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-xs font-medium text-zinc-400">Purchase Reference</label>
          <input value={ref} onChange={e => setRef(e.target.value)} placeholder="Receipt / order #" className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-zinc-600" />
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-zinc-400">Submission Notes</label>
        <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-zinc-600" placeholder="Additional context..." />
      </div>

      <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
        <div className="flex items-start gap-2">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
          <p className="text-xs text-amber-200/80">Do NOT submit confidential redemption PINs or secret claim codes. Submit purchase receipts and card front/back serial verification images only.</p>
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-zinc-400">Receipt / Proof Images (up to 100)</label>
        <label className="flex cursor-pointer items-center justify-center rounded-lg border border-dashed border-white/10 bg-white/3 py-6 text-sm text-zinc-500 hover:border-[#D4AF37]/30">
          <Upload className="mr-2 h-4 w-4" />Click to upload receipts
          <input type="file" accept="image/*" multiple className="hidden" onChange={e => { if (e.target.files) handleImages(e.target.files); }} />
        </label>
        {proofs.length > 0 && (
          <div className="mt-2 grid grid-cols-6 gap-1.5 sm:grid-cols-8">
            {proofs.slice(0, 24).map((p, i) => (
              <div key={i} className="relative aspect-square overflow-hidden rounded-lg">
                <img src={p} alt="" className="h-full w-full object-cover" />
                <button onClick={() => setProofs(prev => prev.filter((_, j) => j !== i))} className="absolute right-0.5 top-0.5 rounded-full bg-black/70 p-0.5"><X className="h-2.5 w-2.5 text-white" /></button>
              </div>
            ))}
            {proofs.length > 24 && <p className="col-span-full text-xs text-zinc-500">+{proofs.length - 24} more images</p>}
          </div>
        )}
      </div>

      <button onClick={submit} disabled={!brand.trim() || !ref.trim()}
        className="w-full rounded-lg bg-[#D4AF37] py-2.5 text-sm font-semibold text-black disabled:opacity-40 disabled:cursor-not-allowed">
        Submit Gift Card Payment
      </button>

      <button onClick={onBack} className="flex w-full items-center justify-center gap-1 text-center text-xs text-zinc-500 hover:text-zinc-300">
        <ChevronLeft className="h-3.5 w-3.5" /> Change payment method
      </button>
    </div>
  );
}