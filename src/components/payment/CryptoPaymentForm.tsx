import { useState } from "react";
import { Bitcoin, Copy, Check, Upload, X, AlertTriangle, QrCode, ChevronLeft } from "lucide-react";
import { toast } from "sonner";
import { useApp } from "../../context/AppContext";
import type { CryptoPaymentPayload } from "../../types";

/** Best-effort QR code: uses a public QR render service; degrades gracefully offline. */
export function qrUrl(data: string, size = 200) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&margin=8&data=${encodeURIComponent(data)}`;
}

function validateHint(address: string) {
  if (address.startsWith("bc1") || address.startsWith("1") || address.startsWith("3")) return "Bitcoin Network address — send only BTC here.";
  if (address.startsWith("0x")) return "Ethereum (ERC-20) address — send only ETH or ERC-20 tokens here.";
  return "Solana Network address — memo is NOT required.";
}

export default function CryptoPaymentForm({ price, onSubmit, onBack }: {
  price: number;
  onSubmit: (payload: CryptoPaymentPayload) => void;
  onBack: () => void;
}) {
  const { state } = useApp();
  const [walletId, setWalletId] = useState("");
  const [txHash, setTxHash] = useState("");
  const [cryptoAmount, setCryptoAmount] = useState(String(price));
  const [proofs, setProofs] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [qrFailed, setQrFailed] = useState(false);

  const selectedWallet = state.wallets.find(w => w.id === walletId);
  const isErc20 = selectedWallet?.network.toUpperCase().includes("ERC");
  const isSol = selectedWallet?.asset.toUpperCase() === "SOL";

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
      .then(() => { setCopied(true); toast.success("Wallet address copied"); setTimeout(() => setCopied(false), 2000); })
      .catch(() => { setCopied(false); toast.error("Could not copy — please copy the address manually"); });
  };

  const handleImages = (files: FileList) => {
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = () => { if (reader.result) setProofs(prev => [...prev, reader.result as string]); };
      reader.readAsDataURL(file);
    });
  };

  const submit = () => {
    if (!selectedWallet || !txHash.trim()) return;
    onSubmit({
      method: "crypto", asset: selectedWallet.asset, network: selectedWallet.network,
      walletAddress: selectedWallet.address, amount: Number(cryptoAmount),
      transactionHash: txHash, timestamp: new Date().toISOString(), proofImages: proofs,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-xs font-semibold text-[#D4AF37]">
        <Bitcoin className="h-4 w-4" /> BTC, ETH, USDT (ERC-20) &amp; SOL supported
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-zinc-400">Select Asset &amp; Network</label>
        <div className="grid grid-cols-2 gap-2">
          {state.wallets.map(w => (
            <button key={w.id} onClick={() => { setWalletId(w.id); setQrFailed(false); }}
              className={`rounded-lg border p-3 text-left text-xs ${walletId === w.id ? "border-[#D4AF37] bg-[#D4AF37]/10 text-[#D4AF37]" : "border-white/10 text-zinc-400 hover:border-white/20"}`}>
              <span className="font-semibold">{w.asset}</span> <span className="text-zinc-500">({w.network})</span>
            </button>
          ))}
        </div>
      </div>

      {selectedWallet && (
        <div className="rounded-xl border border-white/10 bg-white/3 p-4">
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="flex items-center justify-center rounded-lg bg-white p-2">
              {qrFailed ? (
                <div className="flex h-[200px] w-[200px] flex-col items-center justify-center gap-2 text-center">
                  <QrCode className="h-8 w-8 text-zinc-400" />
                  <p className="text-[11px] text-zinc-500">QR unavailable offline. Copy the address below.</p>
                </div>
              ) : (
                <img src={qrUrl(selectedWallet.address)} alt={`${selectedWallet.asset} wallet QR code`} width={200} height={200} className="h-[200px] w-[200px]" onError={() => setQrFailed(true)} />
              )}
            </div>
            <div className="flex-1 space-y-2">
              <p className="text-xs font-semibold text-white">{selectedWallet.label}</p>
              <p className="text-[11px] text-zinc-500">{validateHint(selectedWallet.address)}</p>
              <p className="text-xs text-zinc-500">Send to address:</p>
              <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-black/30 px-3 py-2">
                <code className="flex-1 break-all text-xs text-zinc-200">{selectedWallet.address}</code>
                <button onClick={() => handleCopy(selectedWallet.address)} aria-label="Copy wallet address"
                  className="rounded p-1 text-zinc-400 hover:text-[#D4AF37]">
                  {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
              {(isErc20 || isSol) && (
                <div className={`flex items-start gap-2 rounded-lg px-3 py-2 text-[11px] ${isSol ? "bg-emerald-500/10 text-emerald-300" : "bg-amber-500/10 text-amber-300"}`}>
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  {isSol
                    ? "Send only via the Solana Network. Memo is NOT required."
                    : "Send only via the Ethereum Network (ERC-20). Wrong-chain transfers cannot be recovered."}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-zinc-400">Amount</label>
          <input value={cryptoAmount} onChange={e => setCryptoAmount(e.target.value)} className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white" />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-zinc-400">Transaction Hash</label>
          <input value={txHash} onChange={e => setTxHash(e.target.value)} placeholder="0x..." className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-zinc-600" />
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-zinc-400">Payment Proof Screenshots</label>
        <label className="flex cursor-pointer items-center justify-center rounded-lg border border-dashed border-white/10 bg-white/3 py-6 text-sm text-zinc-500 hover:border-[#D4AF37]/30">
          <Upload className="mr-2 h-4 w-4" />Click to upload images
          <input type="file" accept="image/*" multiple className="hidden" onChange={e => { if (e.target.files) handleImages(e.target.files); }} />
        </label>
        {proofs.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {proofs.map((p, i) => (
              <div key={i} className="relative h-16 w-16 overflow-hidden rounded-lg">
                <img src={p} alt="" className="h-full w-full object-cover" />
                <button onClick={() => setProofs(prev => prev.filter((_, j) => j !== i))} className="absolute right-0.5 top-0.5 rounded-full bg-black/70 p-0.5"><X className="h-3 w-3 text-white" /></button>
              </div>
            ))}
          </div>
        )}
      </div>

      <button onClick={submit} disabled={!selectedWallet || !txHash.trim()}
        className="w-full rounded-lg bg-[#D4AF37] py-2.5 text-sm font-semibold text-black disabled:opacity-40 disabled:cursor-not-allowed">
        Submit Crypto Payment
      </button>

      <button onClick={onBack} className="flex w-full items-center justify-center gap-1 text-center text-xs text-zinc-500 hover:text-zinc-300">
        <ChevronLeft className="h-3.5 w-3.5" /> Change payment method
      </button>
    </div>
  );
}