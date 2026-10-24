import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Crown, Bell, User, LogOut, Shield, LayoutDashboard, Home, Menu, X } from "lucide-react";
import { useApp } from "../context/AppContext";
import { supabase } from "../integrations/supabase/client";
import { BRAND_NAME } from "../data/initialData";

export default function Navbar() {
  const { state, dispatch, signOut } = useApp();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const unread = state.currentUser ? state.notifications.filter(n => n.userId === state.currentUser!.id && !n.read).length : 0;
  const userNotifs = state.currentUser ? state.notifications.filter(n => n.userId === state.currentUser!.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 8) : [];

  const navItems = state.currentUser
    ? state.currentUser.role === "admin"
      ? [{ label: "Audit Portal", view: "admin" as const, icon: Shield }, { label: "Packages", view: "landing" as const, icon: Home }]
      : [{ label: "My Orders", view: "dashboard" as const, icon: LayoutDashboard }, { label: "Packages", view: "landing" as const, icon: Home }]
    : [{ label: "Packages", view: "landing" as const, icon: Home }];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-[#D4AF37]/10 navbar-gradient shadow-[0_10px_40px_-24px_rgba(212,175,55,0.55)] backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-2">
          <Crown className="h-6 w-6 shrink-0 text-[#D4AF37]" />
          <div className="leading-none">
            <span className="block font-serif text-lg font-bold tracking-tight text-gold-shimmer">{BRAND_NAME}</span>
            <span className="mt-0.5 block text-[9px] font-semibold uppercase tracking-[0.25em] text-[#D4AF37]">VIP Membership Cards</span>
          </div>
        </div>

        <div className="hidden items-center gap-1 md:flex">
          {navItems.map(item => (
            <button key={item.label} onClick={() => dispatch({ type: "SET_VIEW", payload: item.view })}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${state.view === item.view ? "bg-[#D4AF37]/10 text-[#D4AF37]" : "text-zinc-400 hover:text-white"}`}>
              <item.icon className="h-4 w-4" />{item.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {state.currentUser && (
            <div className="relative">
              <button onClick={() => setNotifOpen(!notifOpen)} className="relative rounded-lg p-2 text-zinc-400 hover:text-white">
                <Bell className="h-5 w-5" />
                {unread > 0 && <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#D4AF37] text-[10px] font-bold text-black">{unread}</span>}
              </button>
              <AnimatePresence>
                {notifOpen && (
                  <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                    className="absolute right-0 top-12 w-80 rounded-xl border border-white/10 bg-[#12141A] p-3 shadow-2xl">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">Notifications</p>
                    {userNotifs.length === 0 ? <p className="text-sm text-zinc-500">No notifications</p> : userNotifs.map(n => (
                      <button key={n.id} onClick={() => { dispatch({ type: "MARK_NOTIF_READ", payload: n.id }); supabase.from("notifications").update({ read: true }).eq("id", n.id).then(() => {}); }}
                        className={`mb-1 w-full rounded-lg p-2 text-left text-xs ${n.read ? "text-zinc-500" : "bg-[#D4AF37]/5 text-zinc-200"}`}>
                        <span className="font-semibold">{n.subject}</span>
                        <p className="mt-0.5 line-clamp-2 text-zinc-400">{n.body}</p>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {state.currentUser ? (
            <div className="hidden items-center gap-2 md:flex">
              <span className="flex items-center gap-1.5 rounded-lg bg-white/5 px-3 py-1.5 text-sm text-zinc-300">
                <User className="h-3.5 w-3.5" />{state.currentUser.fullName}
              </span>
              <button onClick={() => { signOut(); setNotifOpen(false); }}
                className="rounded-lg p-2 text-zinc-400 hover:text-red-400"><LogOut className="h-4 w-4" /></button>
            </div>
          ) : (
            <button onClick={() => dispatch({ type: "SET_VIEW", payload: "landing" })}
              className="hidden rounded-lg bg-[#D4AF37] px-4 py-2 text-sm font-semibold text-black hover:bg-[#F3E5AB] md:block">
              Get Started
            </button>
          )}

          <button className="rounded-lg p-2 text-zinc-400 md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-white/5 app-gradient md:hidden">
            <div className="space-y-1 p-4">
              {navItems.map(item => (
                <button key={item.label} onClick={() => { dispatch({ type: "SET_VIEW", payload: item.view }); setMobileOpen(false); }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-300 hover:bg-white/5">
                  <item.icon className="h-4 w-4" />{item.label}
                </button>
              ))}
              {state.currentUser && (
                <button onClick={() => { signOut(); setMobileOpen(false); }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-400 hover:bg-red-500/10">
                  <LogOut className="h-4 w-4" />Sign Out
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}