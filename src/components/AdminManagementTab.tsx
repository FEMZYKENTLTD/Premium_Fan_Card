import { useState } from "react";
import { motion } from "framer-motion";
import {
  UserPlus, Trash2, Mail, KeyRound, ShieldCheck, Copy, RefreshCw, Lock, AlertTriangle,
  Phone, MessageCircle, Save, AtSign,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { useAuth } from "@/auth/AuthProvider";
import { supabase } from "../integrations/supabase/client";
import { ADMIN_EMAILS } from "../data/initialData";
import { toast } from "sonner";

function Card({ children }: { children: React.ReactNode }) {
  return <div className="rounded-xl border border-white/5 bg-[#12141A] p-5">{children}</div>;
}

function SectionTitle({ icon: Icon, title, subtitle }: { icon: typeof UserPlus; title: string; subtitle: string }) {
  return (
    <div className="mb-4 flex items-start gap-3">
      <span className="mt-0.5 rounded-lg bg-[#D4AF37]/10 p-2 text-[#D4AF37]"><Icon className="h-4 w-4" /></span>
      <div>
        <h3 className="font-serif text-lg font-bold text-white">{title}</h3>
        <p className="text-xs text-zinc-500">{subtitle}</p>
      </div>
    </div>
  );
}

export default function AdminManagementTab() {
  const { state, dispatch } = useApp();
  const { resetPassword } = useAuth();

  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);

  const [resetLookup, setResetLookup] = useState("");
  const [resetting, setResetting] = useState(false);

  const [resettingSelf, setResettingSelf] = useState(false);

  const [contactDraft, setContactDraft] = useState({
    emails: state.contact.supportEmails.join(", "),
    phone: state.contact.telegramPhone,
    handle: state.contact.telegramHandle,
  });
  const [savingContact, setSavingContact] = useState(false);

  const handleSaveContact = async () => {
    const emails = contactDraft.emails
      .split(/[\s,]+/)
      .map(e => e.trim().toLowerCase())
      .filter(Boolean);
    if (emails.length === 0) { toast.error("Add at least one contact email"); return; }
    if (!emails.every(e => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e))) { toast.error("One or more contact emails are invalid"); return; }
    const next = {
      supportEmails: emails,
      telegramPhone: contactDraft.phone.trim(),
      telegramHandle: contactDraft.handle.trim(),
    };
    setSavingContact(true);
    try {
      const { error } = await supabase.from("site_settings").upsert({
        id: "default",
        support_emails: next.supportEmails,
        telegram_phone: next.telegramPhone,
        telegram_handle: next.telegramHandle,
        updated_at: new Date().toISOString(),
      });
      if (error) throw error;
      dispatch({ type: "UPDATE_CONTACT", payload: next });
      toast.success("Contact details published to the portal");
    } catch (e: any) {
      toast.error("Failed to save contact details: " + (e.message || "Unknown error"));
    } finally {
      setSavingContact(false);
    }
  };

  const adminEmails = state.adminEmails.length > 0 ? state.adminEmails : ADMIN_EMAILS;

  const sendReset = async (email: string) => {
    const { error } = await resetPassword(email);
    if (error) { toast.error(error); return false; }
    toast.success(`Password reset link sent to ${email}`);
    return true;
  };

  const handleAddAdmin = async () => {
    const email = newEmail.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { toast.error("Enter a valid email address"); return; }
    if (adminEmails.some(a => a.toLowerCase() === email)) { toast.error("This email is already an administrator"); return; }
    setAdding(true);
    try {
      const { error } = await supabase.from("admin_emails").insert({ email });
      if (error) throw error;
      const next = [...adminEmails, email].sort();
      dispatch({ type: "SET_ADMIN_EMAILS", payload: next });
      await supabase.from("profiles").update({ role: "admin" }).eq("email", email);
      await supabase.from("audit_logs").insert({
        id: Math.random().toString(36).slice(2) + Date.now().toString(36),
        order_id: "admin-management", admin_id: state.currentUser?.id || "admin-1",
        admin_name: state.currentUser?.fullName || "Executive Admin",
        previous_status: "admin_added", new_status: "admin_added",
        notes: `Added administrator ${email}${newName.trim() ? ` (${newName.trim()})` : ""}`,
      });
      toast.success(`${email} is now an administrator`);
      await sendReset(email);
      setNewEmail(""); setNewName("");
    } catch (e: any) {
      toast.error("Failed to add admin: " + (e.message || "Unknown error"));
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveAdmin = async (email: string) => {
    const me = state.currentUser?.email?.toLowerCase();
    const others = adminEmails.filter(a => a.toLowerCase() !== email.toLowerCase());
    if (others.length === 0) { toast.error("You cannot remove the last administrator"); return; }
    if (me === email.toLowerCase()) { toast.error("You cannot revoke your own admin access"); return; }
    try {
      const { error } = await supabase.from("admin_emails").delete().eq("email", email);
      if (error) throw error;
      dispatch({ type: "SET_ADMIN_EMAILS", payload: others });
      toast.success(`Admin access revoked for ${email}`);
    } catch (e: any) {
      toast.error("Failed to revoke admin: " + (e.message || "Unknown error"));
    }
  };

  const handleResetLookup = async () => {
    const email = resetLookup.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { toast.error("Enter a valid email address"); return; }
    setResetting(true);
    try { if (await sendReset(email)) setResetLookup(""); }
    finally { setResetting(false); }
  };

  const handleResetSelf = async () => {
    const email = state.currentUser?.email;
    if (!email) { toast.error("No signed-in account found"); return; }
    setResettingSelf(true);
    try { await sendReset(email); }
    finally { setResettingSelf(false); }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* Contact & support details (admin-editable) */}
      <Card>
        <div className="lg:col-span-2">
          <SectionTitle icon={AtSign} title="Contact & Support Details" subtitle="These values power the concierge contact section across the public portal and are saved to the database." />
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-xs font-medium text-zinc-400">Support Emails <span className="text-zinc-600">(comma-separated)</span></label>
              <textarea value={contactDraft.emails} onChange={e => setContactDraft(d => ({ ...d, emails: e.target.value }))} rows={2}
                placeholder="morganwallen16041986@gmail.com, teammate@example.com"
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-zinc-600 focus:border-[#D4AF37]/40 focus:outline-none" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-zinc-400"><Phone className="mr-1 inline h-3.5 w-3.5 text-[#D4AF37]" />Telegram Phone</label>
              <input value={contactDraft.phone} onChange={e => setContactDraft(d => ({ ...d, phone: e.target.value }))} placeholder="+14806968069"
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-zinc-600 focus:border-[#D4AF37]/40 focus:outline-none" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-zinc-400"><MessageCircle className="mr-1 inline h-3.5 w-3.5 text-[#D4AF37]" />Telegram Handle</label>
              <input value={contactDraft.handle} onChange={e => setContactDraft(d => ({ ...d, handle: e.target.value }))} placeholder="@keanu_reeves_vip_management"
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-zinc-600 focus:border-[#D4AF37]/40 focus:outline-none" />
            </div>
          </div>
          <button onClick={handleSaveContact} disabled={savingContact}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-[#D4AF37] py-2.5 text-sm font-semibold text-black transition active:scale-[0.98] disabled:opacity-40">
            {savingContact ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {savingContact ? "Publishing..." : "Save Contact Details"}
          </button>
          <p className="mt-2 text-[11px] text-zinc-600">Live contact strip currently shows: {state.contact.supportEmails.join(", ")} · {state.contact.telegramHandle}</p>
        </div>
      </Card>

      {/* Add new admin */}
      <Card>
        <SectionTitle icon={UserPlus} title="Add New Administrator" subtitle="Grant dashboard access to a new administrator email." />
        <div className="space-y-3">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-400">Admin Email</label>
            <input value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="name@example.com"
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-zinc-600 focus:border-[#D4AF37]/40 focus:outline-none" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-400">Full Name <span className="text-zinc-600">(optional)</span></label>
            <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Jane Doe"
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-zinc-600 focus:border-[#D4AF37]/40 focus:outline-none" />
          </div>
          <button onClick={handleAddAdmin} disabled={adding}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#D4AF37] py-2.5 text-sm font-semibold text-black transition active:scale-[0.98] disabled:opacity-40">
            {adding ? <RefreshCw className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
            {adding ? "Adding..." : "Add Administrator & Send Setup Link"}
          </button>
          <p className="text-[11px] text-zinc-600">The administrator receives a secure password setup email. They become active immediately after confirming.</p>
        </div>
      </Card>

      {/* Password reset console */}
      <Card>
        <SectionTitle icon={KeyRound} title="Password Reset Console" subtitle="Send a secure password reset link to any user or administrator." />
        <div className="space-y-3">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-400">Account Email</label>
            <input value={resetLookup} onChange={e => setResetLookup(e.target.value)} placeholder="user@example.com"
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-zinc-600 focus:border-[#D4AF37]/40 focus:outline-none" />
          </div>
          <button onClick={handleResetLookup} disabled={resetting}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#D4AF37]/30 bg-[#D4AF37]/10 py-2.5 text-sm font-semibold text-[#D4AF37] transition hover:bg-[#D4AF37]/20 active:scale-[0.98] disabled:opacity-40">
            {resetting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
            {resetting ? "Sending..." : "Send Password Reset Link"}
          </button>

          <div className="mt-2 border-t border-white/5 pt-3">
            <div className="mb-2 flex items-center gap-2 text-xs font-medium text-zinc-400"><Lock className="h-3.5 w-3.5" />Reset My Own Password</div>
            <button onClick={handleResetSelf} disabled={resettingSelf}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-white/5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10 active:scale-[0.98] disabled:opacity-40">
              {resettingSelf ? <RefreshCw className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
              {resettingSelf ? "Sending..." : `Send link to ${state.currentUser?.email || "my account"}`}
            </button>
          </div>
        </div>
      </Card>

      {/* Directory */}
      <Card>
        <SectionTitle icon={ShieldCheck} title={`Administrator Directory (${adminEmails.length})`} subtitle="Everyone with executive dashboard access." />
        <div className="space-y-2">
          {adminEmails.map((email, i) => {
            const isSelf = state.currentUser?.email?.toLowerCase() === email.toLowerCase();
            return (
              <motion.div key={email} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                className="flex items-center justify-between rounded-lg border border-white/5 bg-white/3 px-3 py-2.5">
                <div className="flex min-w-0 items-center gap-2.5">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#D4AF37]/15 font-serif text-xs font-bold text-[#D4AF37]">
                    {email.charAt(0).toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm text-white">{email}</p>
                    {isSelf && <p className="text-[10px] font-medium uppercase tracking-wide text-[#D4AF37]">You</p>}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button onClick={() => sendReset(email)} title="Send password reset link"
                    className="rounded-lg p-1.5 text-zinc-400 transition hover:bg-white/10 hover:text-[#D4AF37]"><Mail className="h-4 w-4" /></button>
                  <button onClick={() => navigator.clipboard?.writeText(email).then(() => toast.success("Email copied"))} title="Copy email"
                    className="rounded-lg p-1.5 text-zinc-400 transition hover:bg-white/10 hover:text-white"><Copy className="h-4 w-4" /></button>
                  <button onClick={() => { setPendingEmail(email); }} title="Revoke admin access" disabled={isSelf}
                    className="rounded-lg p-1.5 text-zinc-400 transition hover:bg-red-500/10 hover:text-red-400 disabled:opacity-30 disabled:hover:bg-transparent">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </Card>

      {/* Security note */}
      <Card>
        <SectionTitle icon={AlertTriangle} title="Security Notes" subtitle="Guidelines for executive account management." />
        <ul className="space-y-2 text-xs text-zinc-400">
          <li className="flex gap-2"><ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#D4AF37]" />New administrators are recognised immediately by their email whitelist entry and receive a secure setup link.</li>
          <li className="flex gap-2"><ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#D4AF37]" />Password reset links expire automatically and can only be used once.</li>
          <li className="flex gap-2"><ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#D4AF37]" />You cannot revoke your own access or remove the final administrator to keep the portal reachable.</li>
        </ul>
      </Card>

      {pendingEmail && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4" onClick={() => setPendingEmail(null)}>
          <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }}
            className="w-full max-w-md rounded-2xl border border-white/10 bg-[#12141A] p-6" onClick={e => e.stopPropagation()}>
            <h3 className="mb-2 font-serif text-lg font-bold text-white">Revoke admin access?</h3>
            <p className="mb-4 text-sm text-zinc-400">{pendingEmail} will immediately lose access to the executive dashboard.</p>
            <div className="flex gap-2">
              <button onClick={() => setPendingEmail(null)} className="flex-1 rounded-lg bg-white/5 py-2.5 text-sm font-semibold text-white hover:bg-white/10">Cancel</button>
              <button onClick={() => { const e = pendingEmail; setPendingEmail(null); void handleRemoveAdmin(e); }}
                className="flex-1 rounded-lg bg-red-500/90 py-2.5 text-sm font-semibold text-white hover:bg-red-500">Revoke Access</button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}