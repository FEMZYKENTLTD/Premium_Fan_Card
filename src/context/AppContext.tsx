import { createContext, useContext, useReducer, useEffect, useCallback, type ReactNode } from "react";
import { supabase } from "../integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/auth/AuthProvider";
import type { AppState, Order, OrderStatus, AuditLogEntry, Notification, PaymentPayload, MembershipPackage, CryptoWalletConfig, UserProfile, ContactSettings, AboutSectionConfig } from "../types";
import { initialPackages, initialWallets, initialOrders, initialAuditLogs, initialNotifications, ADMIN_EMAILS, DEFAULT_CONTACT } from "../data/initialData";

type Action =
  | { type: "LOGIN"; payload: UserProfile }
  | { type: "LOGOUT" }
  | { type: "REGISTER"; payload: UserProfile }
  | { type: "SET_VIEW"; payload: AppState["view"] }
  | { type: "CREATE_ORDER"; payload: Order }
  | { type: "SUBMIT_PAYMENT"; payload: { orderId: string; paymentMethod: "crypto" | "gift_card"; paymentPayload: PaymentPayload } }
  | { type: "ADMIN_CHANGE_STATUS"; payload: { orderId: string; newStatus: OrderStatus; notes: string; adminId: string; adminName: string } }
  | { type: "ADMIN_PROVIDE_INFO"; payload: { orderId: string; info: string } }
  | { type: "UPLOAD_CARD"; payload: { orderId: string; artworkUrl: string } }
  | { type: "UPDATE_PACKAGE"; payload: MembershipPackage }
  | { type: "UPDATE_WALLET"; payload: CryptoWalletConfig }
  | { type: "MARK_NOTIF_READ"; payload: string }
  | { type: "UPDATE_PROFILE"; payload: Partial<UserProfile> }
  | { type: "SET_ADMIN_EMAILS"; payload: string[] }
  | { type: "UPDATE_CONTACT"; payload: ContactSettings }
  | { type: "HYDRATE"; payload: Partial<AppState> }
  | { type: "UPDATE_ABOUT"; payload: AboutSectionConfig };

const defaultState: AppState = {
  currentUser: null,
  users: [],
  packages: initialPackages,
  orders: initialOrders,
  auditLogs: initialAuditLogs,
  notifications: initialNotifications,
  wallets: initialWallets,
  adminEmails: ADMIN_EMAILS,
  contact: DEFAULT_CONTACT,
  aboutSection: {
    quote: "I AM OKAY WITH BEING A 'LONER' AND HAVING A SMALL CIRCLE. I ENJOY MY OWN COMPANY AND ONLY WANT TO BE AROUND PEOPLE WHO GENUINELY ENJOY ME",
    imageUrl: "https://dala-prod-public-storage.s3.eu-west-1.amazonaws.com/attachments/9f85c535-e1dd-4d9a-93be-bdc0784ff8b3/1792865246951_keanu_reeves.jpg",
    bio: "Renowned Canadian-American actor celebrated worldwide for iconic cinematic roles and exceptional philanthropy. Experience unprecedented exclusive access and private correspondence through official registry membership.",
    name: "Keanu Reeves",
    profession: "Movie Actor",
    birthday: "September 2, 1964",
    birthSign: "Virgo",
    birthplace: "Beirut, Lebanon",
    age: "62 years old",
  },
  view: "landing",
};

function generateId() { return Math.random().toString(36).slice(2, 10) + Date.now().toString(36); }

function createNotification(userId: string, subject: string, body: string, type: Notification["type"]): Notification {
  return { id: generateId(), userId, subject, body, type, read: false, createdAt: new Date().toISOString() };
}

function matchAdminEmail(email: string, dynamic: string[] | undefined): boolean {
  const lower = email.toLowerCase().trim();
  return [...ADMIN_EMAILS, ...(dynamic ?? [])].some(a => a.toLowerCase() === lower);
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "LOGIN":
      return { ...state, currentUser: action.payload, view: action.payload.role === "admin" ? "admin" : "dashboard" };
    case "LOGOUT":
      return { ...state, currentUser: null, view: "landing" };
    case "REGISTER":
      return { ...state, users: [...state.users, action.payload], currentUser: action.payload, view: "dashboard" };
    case "SET_VIEW":
      return { ...state, view: action.payload };
    case "CREATE_ORDER":
      return {
        ...state,
        orders: [...state.orders, action.payload],
        notifications: [...state.notifications, createNotification(action.payload.userId, "Order Placed", `Your ${action.payload.packageName} membership order ${action.payload.reference} has been created.`, "order_placed")],
      };
    case "SUBMIT_PAYMENT": {
      const { orderId, paymentMethod, paymentPayload } = action.payload;
      const order = state.orders.find(o => o.id === orderId);
      if (!order) return state;
      const updatedOrder: Order = { ...order, status: "payment_submitted", paymentMethod, paymentPayload, updatedAt: new Date().toISOString() };
      return {
        ...state,
        orders: state.orders.map(o => o.id === orderId ? updatedOrder : o),
        notifications: [...state.notifications, createNotification(order.userId, "Payment Submitted", `We received your payment for ${order.reference}. Verification takes 1-3 working days.`, "payment_submitted")],
      };
    }
    case "ADMIN_CHANGE_STATUS": {
      const { orderId, newStatus, notes, adminId, adminName } = action.payload;
      const order = state.orders.find(o => o.id === orderId);
      if (!order) return state;
      const log: AuditLogEntry = { id: generateId(), orderId, adminId, adminName, previousStatus: order.status, newStatus, notes, timestamp: new Date().toISOString() };
      const updatedOrder: Order = { ...order, status: newStatus, adminNotes: notes || order.adminNotes, additionalInfoRequested: newStatus === "additional_information_required" ? notes : order.additionalInfoRequested, updatedAt: new Date().toISOString() };
      const notifMap: Partial<Record<OrderStatus, { subject: string; type: Notification["type"] }>> = {
        under_review: { subject: "Under Review", type: "under_review" },
        additional_information_required: { subject: "Additional Info Required", type: "info_requested" },
        payment_approved: { subject: "Payment Approved", type: "approved" },
        payment_rejected: { subject: "Payment Rejected", type: "rejected" },
        card_ready: { subject: "Card Ready", type: "card_ready" },
        completed: { subject: "Membership Active", type: "completed" },
      };
      const notifDef = notifMap[newStatus];
      const newNotif = notifDef ? createNotification(order.userId, notifDef.subject, `${notifDef.subject}: Order ${order.reference}. ${notes}`, notifDef.type) : null;
      return {
        ...state,
        orders: state.orders.map(o => o.id === orderId ? updatedOrder : o),
        auditLogs: [...state.auditLogs, log],
        notifications: newNotif ? [...state.notifications, newNotif] : state.notifications,
      };
    }
    case "ADMIN_PROVIDE_INFO": {
      const { orderId, info } = action.payload;
      return { ...state, orders: state.orders.map(o => o.id === orderId ? { ...o, additionalInfoProvided: info, status: "under_review" as OrderStatus, updatedAt: new Date().toISOString() } : o) };
    }
    case "UPLOAD_CARD": {
      const { orderId, artworkUrl } = action.payload;
      const order = state.orders.find(o => o.id === orderId);
      if (!order) return state;
      const log: AuditLogEntry = { id: generateId(), orderId, adminId: "admin-1", adminName: "Admin", previousStatus: order.status, newStatus: "card_ready", notes: "Card artwork uploaded", timestamp: new Date().toISOString() };
      return {
        ...state,
        orders: state.orders.map(o => o.id === orderId ? { ...o, cardArtworkUrl: artworkUrl, status: "card_ready" as OrderStatus, updatedAt: new Date().toISOString() } : o),
        auditLogs: [...state.auditLogs, log],
        notifications: [...state.notifications, createNotification(order.userId, "Card Ready", `Your ${order.packageName} membership card is ready for download.`, "card_ready")],
      };
    }
    case "UPDATE_PACKAGE":
      return { ...state, packages: state.packages.map(p => p.id === action.payload.id ? action.payload : p) };
    case "UPDATE_WALLET":
      return { ...state, wallets: state.wallets.map(w => w.id === action.payload.id ? action.payload : w) };
    case "MARK_NOTIF_READ":
      return { ...state, notifications: state.notifications.map(n => n.id === action.payload ? { ...n, read: true } : n) };
    case "UPDATE_PROFILE":
      if (!state.currentUser) return state;
      return { ...state, currentUser: { ...state.currentUser, ...action.payload } };
    case "SET_ADMIN_EMAILS":
      return { ...state, adminEmails: action.payload };
    case "UPDATE_CONTACT":
      return { ...state, contact: action.payload };
    case "UPDATE_ABOUT":
      return { ...state, aboutSection: action.payload };
    case "HYDRATE":
      return { ...state, ...action.payload };
    default:
      return state;
  }
}

const AppContext = createContext<{ state: AppState; dispatch: React.Dispatch<Action>; signIn: (email: string, password: string) => Promise<void>; signUp: (email: string, password: string, fullName: string, dob: string) => Promise<void>; signOut: () => Promise<void>; authLoading: boolean } | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, defaultState, (base) => {
    const saved = localStorage.getItem("lux-membership-state");
    if (saved) {
      try { return { ...base, ...JSON.parse(saved) }; } catch { return base; }
    }
    return base;
  });

  // Authentication is delegated to the pre-installed Supabase auth kit.
  const { user, profile, loading, signIn: kitSignIn, signUp: kitSignUp, signOut: kitSignOut, updateProfile } = useAuth();

  const fetchUserData = useCallback(async (userId: string, role: "admin" | "client") => {
    try {
      const [ordersRes, notifsRes, pkgsRes, walletsRes, adminsRes, settingsRes] = await Promise.all([
        supabase.from("orders").select("*").eq(role === "admin" ? "id" : "user_id", role === "admin" ? "%" : userId).order("created_at", { ascending: false }),
        supabase.from("notifications").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
        supabase.from("membership_packages").select("*").eq("active", true).order("sort_order"),
        supabase.from("crypto_wallets").select("*"),
        supabase.from("admin_emails").select("email"),
        supabase.from("site_settings").select("*").eq("id", "default").maybeSingle(),
      ]);

      const hydrate: Partial<AppState> = {};
      if (ordersRes.data && ordersRes.data.length > 0) {
        hydrate.orders = ordersRes.data.map((r: any) => ({
          id: r.id, reference: r.reference, userId: r.user_id, packageId: r.package_id,
          packageName: r.package_name, packagePrice: Number(r.package_price), status: r.status,
          paymentMethod: r.payment_method, paymentPayload: r.payment_payload,
          adminNotes: r.admin_notes || "", additionalInfoRequested: r.additional_info_requested,
          additionalInfoProvided: r.additional_info_provided, cardArtworkUrl: r.card_artwork_url,
          createdAt: r.created_at, updatedAt: r.updated_at,
        }));
      }
      if (notifsRes.data && notifsRes.data.length > 0) {
        hydrate.notifications = notifsRes.data.map((r: any) => ({
          id: r.id, userId: r.user_id, subject: r.subject, body: r.body, type: r.type, read: r.read, createdAt: r.created_at,
        }));
      }
      if (pkgsRes.data && pkgsRes.data.length > 0) {
        hydrate.packages = pkgsRes.data.map((r: any) => ({
          id: r.id, name: r.name, price: Number(r.price), tier: r.tier, benefits: r.benefits,
          description: r.description, active: r.active, order: r.sort_order,
        }));
      }
      if (walletsRes.data && walletsRes.data.length > 0) {
        hydrate.wallets = walletsRes.data.map((r: any) => ({
          id: r.id, asset: r.asset, network: r.network, address: r.address, label: r.label,
        }));
      }
      if (adminsRes.data) {
        hydrate.adminEmails = (adminsRes.data as { email: string }[]).map(r => r.email).sort();
      }
      const s = settingsRes.data as any;
      if (s) {
        hydrate.contact = {
          supportEmails: (s.support_emails as string[]) || DEFAULT_CONTACT.supportEmails,
          telegramPhone: s.telegram_phone || DEFAULT_CONTACT.telegramPhone,
          telegramHandle: s.telegram_handle || DEFAULT_CONTACT.telegramHandle,
        };
        hydrate.aboutSection = {
          quote: s.about_quote || defaultState.aboutSection.quote,
          imageUrl: s.about_image_url || defaultState.aboutSection.imageUrl,
          bio: s.about_bio || defaultState.aboutSection.bio,
          name: defaultState.aboutSection.name,
          profession: defaultState.aboutSection.profession,
          birthday: defaultState.aboutSection.birthday,
          birthSign: defaultState.aboutSection.birthSign,
          birthplace: defaultState.aboutSection.birthplace,
          age: defaultState.aboutSection.age,
        };
      }
      if (Object.keys(hydrate).length > 0) {
        dispatch({ type: "HYDRATE", payload: hydrate });
      }
    } catch (e: any) {
      toast.error("Failed to sync data: " + (e.message || "Unknown error"));
    }
  }, []);

  // Sync the kit's auth session into app state. Admin role is granted either by
  // the profiles.role column or by the pre-authorized admin email whitelist
  // (static defaults plus any dynamically added admin_emails rows).
  const adminEmailsKey = state.adminEmails.join(",");
  useEffect(() => {
    if (loading) return;
    if (user) {
      const email = user.email || "";
      const role: "admin" | "client" = (profile?.role === "admin") || matchAdminEmail(email, state.adminEmails) ? "admin" : "client";
      const u: UserProfile = {
        id: user.id,
        email,
        fullName: (profile?.full_name as string) || email.split("@")[0],
        role,
        createdAt: (profile?.created_at as string) || new Date().toISOString(),
        dateOfBirth: (profile?.date_of_birth as string) || undefined,
        ageVerified: true,
      };
      dispatch({ type: "LOGIN", payload: u });
      void fetchUserData(user.id, role);
    } else {
      dispatch({ type: "LOGOUT" });
    }
  }, [user, profile, loading, fetchUserData, adminEmailsKey]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await kitSignIn(email, password);
    if (error) { toast.error(error); throw new Error(error); }
  }, [kitSignIn]);

  const signUp = useCallback(async (email: string, password: string, fullName: string, dob: string) => {
    const { error, needsConfirmation } = await kitSignUp(email, password, fullName);
    if (error) { toast.error(error); throw new Error(error); }
    if (!needsConfirmation) {
      // Persist the date of birth onto the profile row created by the signup trigger.
      await updateProfile({ date_of_birth: dob } as any);
    } else {
      toast.success("Account created! Check your email to confirm.");
    }
  }, [kitSignUp, updateProfile]);

  const signOut = useCallback(async () => {
    await kitSignOut();
    dispatch({ type: "LOGOUT" });
    toast.success("Signed out successfully");
  }, [kitSignOut]);

  useEffect(() => {
    localStorage.setItem("lux-membership-state", JSON.stringify(state));
  }, [state]);

  return <AppContext.Provider value={{ state, dispatch, signIn, signUp, signOut, authLoading: loading }}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be within AppProvider");
  return ctx;
}