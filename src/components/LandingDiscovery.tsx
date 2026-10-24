import { useState } from "react";
import { motion } from "framer-motion";
import { Crown, Shield, Gem, Sparkles, ChevronDown, Mail, Phone, MessageCircle, Lock, FileText, X, Users, Calendar, Star, Check, ArrowUpRight, MapPin, Cake, Moon } from "lucide-react";
import { useApp } from "../context/AppContext";
import { supabase } from "../integrations/supabase/client";
import { toast } from "sonner";
import { faqs, privacyPolicy, membershipTerms, BRAND_NAME, ACTOR_PROFILE } from "../data/initialData";
import type { MembershipPackage } from "../types";

const tierIcons: Record<string, typeof Crown> = { silver: Shield, gold: Crown, platinum: Gem, obsidian: Sparkles };
const tierColors: Record<string, string> = { silver: "#C0C0C0", gold: "#D4AF37", platinum: "#E5E4E2", obsidian: "#D4AF37" };

function AuthModal({ onClose }: { onClose: () => void }) {
  const { signIn, signUp } = useApp();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [dob, setDob] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "register") {
        if (!fullName.trim()) { setError("Full name required"); setLoading(false); return; }
        if (!email.trim() || !email.includes("@")) { setError("Valid email required"); setLoading(false); return; }
        if (!password || password.length < 6) { setError("Password must be at least 6 characters"); setLoading(false); return; }
        if (!dob) { setError("Date of birth required"); setLoading(false); return; }
        const age = new Date().getFullYear() - new Date(dob).getFullYear();
        if (age < 18) { setError("You must be 18 or older"); setLoading(false); return; }
        await signUp(email, password, fullName, dob);
      } else {
        if (!email.trim() || !email.includes("@")) { setError("Valid email required"); setLoading(false); return; }
        if (!password) { setError("Password required"); setLoading(false); return; }
        await signIn(email, password);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        className="w-full max-w-md rounded-2xl border border-white/10 bg-[#12141A] p-6" onClick={e => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-serif text-xl font-bold text-white">{mode === "login" ? "Sign In" : "Create Account"}</h3>
          <button onClick={onClose} className="text-zinc-500 hover:text-white"><X className="h-5 w-5" /></button>
        </div>
        {error && <p className="mb-3 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-3">
          {mode === "register" && (
            <>
              <input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Full Name" className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-[#D4AF37]/50" />
              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">Date of Birth (Must be 18+)</label>
                <div className="relative">
                  <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                  <input type="date" value={dob} onChange={e => setDob(e.target.value)} className="w-full rounded-lg border border-white/10 bg-white/5 py-2.5 pl-9 pr-3 text-sm text-white [color-scheme:dark] outline-none focus:border-[#D4AF37]/50" />
                </div>
                <p className="mt-1 text-[10px] text-zinc-600">Format: YYYY-MM-DD</p>
              </div>
            </>
          )}
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email Address" className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-[#D4AF37]/50" />
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-[#D4AF37]/50" />
          <button type="submit" disabled={loading} className="w-full rounded-lg bg-[#D4AF37] py-2.5 text-sm font-semibold text-black hover:bg-[#F3E5AB] disabled:opacity-50">
            {loading ? "Please wait..." : mode === "login" ? "Sign In" : "Create Membership"}
          </button>
        </form>
        <p className="mt-3 text-center text-xs text-zinc-500">
          {mode === "login" ? "No account? " : "Already a member? "}
          <button onClick={() => setMode(mode === "login" ? "register" : "login")} className="text-[#D4AF37] hover:underline">
            {mode === "login" ? "Register" : "Sign In"}
          </button>
        </p>
        <p className="mt-2 text-center text-[10px] text-zinc-600">Registration is for members only. Admin access is pre-authorized.</p>
      </motion.div>
    </div>
  );
}

function PackageCard({ pkg, onSelect }: { pkg: MembershipPackage; onSelect: () => void }) {
  const Icon = tierIcons[pkg.tier] || Crown;
  const color = tierColors[pkg.tier];
  const hasPrivateContact = pkg.price >= 5000;
  return (
    <motion.div whileHover={{ y: -6 }} className="premium-card relative overflow-hidden rounded-2xl p-6">
      <div className="absolute inset-0 opacity-[0.03]" style={{ background: `radial-gradient(ellipse at top, ${color}, transparent 70%)` }} />
      {hasPrivateContact && (
        <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-[#D4AF37]/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-[#D4AF37]">
          <MessageCircle className="h-3 w-3" />Private Contact
        </div>
      )}
      <div className="relative">
        <div className="mb-3 flex items-center gap-2">
          <Icon className="h-5 w-5" style={{ color }} />
          <span className="text-xs font-semibold uppercase tracking-wider" style={{ color }}>{pkg.tier}</span>
        </div>
        <h3 className="font-serif text-xl font-bold text-white">{pkg.name}</h3>
        <p className="mt-1 text-2xl font-bold text-[#D4AF37]">${pkg.price.toLocaleString()}</p>
        <p className="mt-2 text-sm text-zinc-400">{pkg.description}</p>
        <ul className="mt-4 space-y-1.5">
          {pkg.benefits.slice(0, 5).map(b => (
            <li key={b} className="flex items-start gap-2 text-xs text-zinc-300">
              <Check className="mt-0.5 h-3 w-3 shrink-0 text-[#D4AF37]" />{b}
            </li>
          ))}
          {pkg.benefits.length > 5 && <li className="text-xs text-zinc-500">+{pkg.benefits.length - 5} more benefits</li>}
        </ul>
        <button onClick={onSelect} className="mt-5 w-full rounded-lg border border-[#D4AF37]/30 bg-[#D4AF37]/10 py-2.5 text-sm font-semibold text-[#D4AF37] hover:bg-[#D4AF37] hover:text-black transition-colors">
          Select Package
        </button>
      </div>
    </motion.div>
  );
}

export default function LandingDiscovery() {
  const { state, dispatch } = useApp();
  const contact = state.contact;
  const [authOpen, setAuthOpen] = useState(false);
  const [policyModal, setPolicyModal] = useState<"privacy" | "terms" | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const handleSelectPackage = async (pkg: MembershipPackage) => {
    if (!state.currentUser) { setAuthOpen(true); return; }
    if (state.currentUser.role === "admin") return;
    const ref = `ORD-LUX-${Math.floor(10000 + Math.random() * 90000)}`;
    const order = { id: Math.random().toString(36).slice(2), reference: ref, userId: state.currentUser.id, packageId: pkg.id, packageName: pkg.name, packagePrice: pkg.price, status: "awaiting_payment" as const, adminNotes: "", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    dispatch({ type: "CREATE_ORDER", payload: order });
    dispatch({ type: "SET_VIEW", payload: "dashboard" });
    try {
      await supabase.from("orders").insert({
        id: order.id, reference: ref, user_id: order.userId, package_id: pkg.id,
        package_name: pkg.name, package_price: pkg.price, status: "awaiting_payment",
      });
    } catch (e: any) { toast.error("Order sync failed: " + (e.message || "")); }
  };

  return (
    <div className="min-h-[100dvh] app-gradient pt-16">
      {/* Hero */}
      <section className="relative overflow-hidden px-4 py-20 sm:px-6 md:py-28">
        <div className="absolute inset-0 opacity-[0.04]" style={{ background: "radial-gradient(ellipse at 50% 0%, #D4AF37, transparent 60%)" }} />
        <div className="aurora-orb h-72 w-72 bg-[#D4AF37]" style={{ top: "-4rem", left: "8%" }} />
        <div className="aurora-orb h-80 w-80 bg-[#7C3AED]" style={{ top: "2rem", right: "6%", animationDelay: "-6s" }} />
        <div className="relative mx-auto max-w-4xl text-center">
          <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-[#D4AF37]">Official Keanu Reeves Private Membership Registry</motion.p>
          <motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="text-gold-shimmer sheen-text font-serif text-5xl font-bold leading-tight tracking-tight md:text-7xl">
            KEANU REEVES
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="mt-3 text-sm font-semibold uppercase tracking-[0.4em] text-[#D4AF37]">
            Membership Cards
          </motion.p>
          <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="mx-auto mt-5 max-w-[65ch] text-base text-zinc-400 leading-relaxed">
            Keanu Reeves Membership Cards curate unparalleled experiences for discerning individuals. Four tiers of membership, one standard of excellence.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <a href="#packages" className="rounded-lg bg-[#D4AF37] px-6 py-3 text-sm font-semibold text-black hover:bg-[#F3E5AB]">View Packages</a>
            {!state.currentUser && <button onClick={() => setAuthOpen(true)} className="rounded-lg border border-white/10 px-6 py-3 text-sm text-zinc-300 hover:border-[#D4AF37]/50">Sign In</button>}
          </motion.div>
        </div>
      </section>

      {/* About Keanu Reeves */}
      <section className="px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="relative overflow-hidden rounded-2xl border border-[#D4AF37]/20 premium-card">
            <div className="absolute inset-0 opacity-[0.03]" style={{ background: "radial-gradient(ellipse at 30% 50%, #D4AF37, transparent 60%)" }} />
            <div className="relative grid lg:grid-cols-[380px_1fr]">
              {/* Portrait Image */}
              <div className="relative min-h-[320px] overflow-hidden">
                <img
                  src={state.aboutSection.imageUrl}
                  alt={state.aboutSection.name}
                  className="absolute inset-0 h-full w-full object-cover object-top"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#12141A]/95 via-[#12141A]/20 to-transparent lg:bg-gradient-to-r lg:from-transparent lg:via-[#12141A]/10 lg:to-[#12141A]" />
                <div className="absolute bottom-5 left-5 z-20 flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#D4AF37]/20 backdrop-blur-sm">
                    <Star className="h-4 w-4 text-[#D4AF37]" />
                  </div>
                  <span className="rounded-full bg-black/60 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#D4AF37] backdrop-blur-sm">Official Portrait</span>
                </div>
              </div>
              {/* Content */}
              <div className="p-8 lg:p-10">
                <div className="mb-6">
                  <h3 className="font-serif text-3xl font-bold text-white">{state.aboutSection.name}</h3>
                  <p className="mt-1 text-sm font-semibold uppercase tracking-[0.2em] text-[#D4AF37]">{state.aboutSection.profession}</p>
                </div>
                <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="rounded-lg border border-white/5 bg-white/[0.03] p-3 text-center">
                    <Cake className="mx-auto mb-1.5 h-4 w-4 text-[#D4AF37]" />
                    <p className="text-[9px] font-semibold uppercase tracking-wider text-zinc-500">Birthday</p>
                    <p className="mt-0.5 text-xs font-medium text-zinc-200">{state.aboutSection.birthday}</p>
                  </div>
                  <div className="rounded-lg border border-white/5 bg-white/[0.03] p-3 text-center">
                    <Moon className="mx-auto mb-1.5 h-4 w-4 text-[#D4AF37]" />
                    <p className="text-[9px] font-semibold uppercase tracking-wider text-zinc-500">Sign</p>
                    <p className="mt-0.5 text-xs font-medium text-zinc-200">{state.aboutSection.birthSign}</p>
                  </div>
                  <div className="rounded-lg border border-white/5 bg-white/[0.03] p-3 text-center">
                    <MapPin className="mx-auto mb-1.5 h-4 w-4 text-[#D4AF37]" />
                    <p className="text-[9px] font-semibold uppercase tracking-wider text-zinc-500">Birthplace</p>
                    <p className="mt-0.5 text-xs font-medium text-zinc-200">{state.aboutSection.birthplace}</p>
                  </div>
                  <div className="rounded-lg border border-white/5 bg-white/[0.03] p-3 text-center">
                    <Users className="mx-auto mb-1.5 h-4 w-4 text-[#D4AF37]" />
                    <p className="text-[9px] font-semibold uppercase tracking-wider text-zinc-500">Age</p>
                    <p className="mt-0.5 text-xs font-medium text-zinc-200">{state.aboutSection.age}</p>
                  </div>
                </div>
                {/* Featured Quote */}
                <blockquote className="relative mb-6 border-l-2 border-[#D4AF37]/60 bg-[#D4AF37]/[0.04] px-6 py-5">
                  <span className="absolute -left-3 -top-3 font-serif text-5xl leading-none text-[#D4AF37]/40">&ldquo;</span>
                  <p className="font-serif text-lg leading-relaxed text-zinc-200 italic">{state.aboutSection.quote}</p>
                  <footer className="mt-3 text-xs font-semibold uppercase tracking-wider text-[#D4AF37]">&mdash; {state.aboutSection.name}</footer>
                </blockquote>
                <p className="text-sm leading-relaxed text-zinc-400">{state.aboutSection.bio}</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Packages */}
      <section id="packages" className="px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <h2 className="mb-2 text-center font-serif text-3xl font-bold text-white">Keanu Reeves Membership Tiers</h2>
          <p className="mb-10 text-center text-sm text-zinc-500">Choose your level of exclusivity</p>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {state.packages.filter(p => p.active).sort((a, b) => a.order - b.order).map(pkg => (
              <PackageCard key={pkg.id} pkg={pkg} onSelect={() => handleSelectPackage(pkg)} />
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-8 text-center font-serif text-3xl font-bold text-white">Frequently Asked</h2>
          <div className="space-y-2">
            {faqs.map((faq, i) => (
              <div key={i} className="overflow-hidden rounded-xl border border-white/5 bg-[#12141A]">
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="flex w-full items-center justify-between px-5 py-4 text-left text-sm font-medium text-zinc-200">
                  {faq.q}
                  <ChevronDown className={`h-4 w-4 text-zinc-500 transition-transform ${openFaq === i ? "rotate-180" : ""}`} />
                </button>
                {openFaq === i && <div className="border-t border-white/5 px-5 py-4 text-sm text-zinc-400">{faq.a}</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-3xl premium-card rounded-2xl p-8">
          <h2 className="mb-6 text-center font-serif text-2xl font-bold text-white">Contact Concierge</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <a href={`https://t.me/${contact.telegramHandle.replace("@", "")}`} target="_blank" rel="noopener noreferrer"
              className="group flex cursor-pointer items-center gap-3 rounded-lg border border-transparent bg-white/3 p-3 transition-all hover:border-[#D4AF37]/40 hover:bg-white/5">
              <MessageCircle className="h-5 w-5 text-[#D4AF37]" />
              <div className="flex-1"><p className="text-xs text-zinc-500">Telegram</p><p className="text-sm text-zinc-200 transition-colors group-hover:text-[#D4AF37]">{contact.telegramHandle}</p></div>
              <ArrowUpRight className="h-4 w-4 text-zinc-600 transition-colors group-hover:text-[#D4AF37]" />
            </a>
            <a href={`https://t.me/${contact.telegramPhone}`} target="_blank" rel="noopener noreferrer"
              className="group flex cursor-pointer items-center gap-3 rounded-lg border border-transparent bg-white/3 p-3 transition-all hover:border-[#D4AF37]/40 hover:bg-white/5">
              <Phone className="h-5 w-5 text-[#D4AF37]" />
              <div className="flex-1"><p className="text-xs text-zinc-500">Telegram Number <span className="ml-1 rounded bg-[#D4AF37]/15 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-[#D4AF37]">Telegram Only</span></p><p className="text-sm text-zinc-200 transition-colors group-hover:text-[#D4AF37]">{contact.telegramPhone}</p></div>
              <ArrowUpRight className="h-4 w-4 text-zinc-600 transition-colors group-hover:text-[#D4AF37]" />
            </a>
            {contact.supportEmails.map(email => (
              <a key={email} href={`mailto:${email}`}
                className="group flex cursor-pointer items-center gap-3 rounded-lg border border-transparent bg-white/3 p-3 transition-all hover:border-[#D4AF37]/40 hover:bg-white/5">
                <Mail className="h-5 w-5 text-[#D4AF37]" />
                <div className="flex-1"><p className="text-xs text-zinc-500">Email</p><p className="text-sm text-zinc-200 break-all transition-colors group-hover:text-[#D4AF37]">{email}</p></div>
                <ArrowUpRight className="h-4 w-4 text-zinc-600 transition-colors group-hover:text-[#D4AF37]" />
              </a>
            ))}
          </div>
          <div className="mt-6 flex items-center justify-center gap-4 text-xs text-zinc-500">
            <button onClick={() => setPolicyModal("privacy")} className="flex items-center gap-1 hover:text-[#D4AF37]"><Lock className="h-3 w-3" />Privacy Policy</button>
            <button onClick={() => setPolicyModal("terms")} className="flex items-center gap-1 hover:text-[#D4AF37]"><FileText className="h-3 w-3" />Membership Terms</button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 px-4 py-8 text-center text-xs text-zinc-600 sm:px-6">
        <p className="mb-1 font-serif text-sm font-bold uppercase tracking-[0.3em] text-[#D4AF37]">KEANU REEVES</p>
        <p>{BRAND_NAME} Membership Cards &copy; {new Date().getFullYear()}. All rights reserved. Verification window: 1-3 working days.</p>
      </footer>

      {/* Modals */}
      {authOpen && <AuthModal onClose={() => setAuthOpen(false)} />}
      {policyModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4" onClick={() => setPolicyModal(null)}>
          <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-white/10 bg-[#12141A] p-6" onClick={e => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-serif text-lg font-bold text-white">{policyModal === "privacy" ? "Privacy Policy" : "Membership Terms"}</h3>
              <button onClick={() => setPolicyModal(null)} className="text-zinc-500 hover:text-white"><X className="h-5 w-5" /></button>
            </div>
            <p className="text-sm leading-relaxed text-zinc-400">{policyModal === "privacy" ? privacyPolicy : membershipTerms}</p>
          </motion.div>
        </div>
      )}
    </div>
  );
}