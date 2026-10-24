export type UserRole = "client" | "admin";

export type OrderStatus =
  | "awaiting_payment"
  | "payment_submitted"
  | "under_review"
  | "additional_information_required"
  | "payment_approved"
  | "payment_rejected"
  | "card_ready"
  | "completed"
  | "cancelled";

export type PaymentMethod = "crypto" | "gift_card";

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  createdAt: string;
  dateOfBirth?: string;
  ageVerified: boolean;
}

export interface MembershipPackage {
  id: string;
  name: string;
  price: number;
  tier: "silver" | "gold" | "platinum" | "obsidian";
  benefits: string[];
  description: string;
  active: boolean;
  order: number;
}

export interface ContactSettings {
  supportEmails: string[];
  telegramPhone: string;
  telegramHandle: string;
}

export interface CryptoWalletConfig {
  id: string;
  asset: string;
  network: string;
  address: string;
  label: string;
}

export interface CryptoPaymentPayload {
  method: "crypto";
  asset: string;
  network: string;
  walletAddress: string;
  amount: number;
  transactionHash: string;
  timestamp: string;
  proofImages: string[];
}

export interface GiftCardPaymentPayload {
  method: "gift_card";
  brand: string;
  denomination: number;
  currency: string;
  purchaseReference: string;
  notes: string;
  proofImages: string[];
}

export type PaymentPayload = CryptoPaymentPayload | GiftCardPaymentPayload;

export interface Order {
  id: string;
  reference: string;
  userId: string;
  packageId: string;
  packageName: string;
  packagePrice: number;
  status: OrderStatus;
  paymentMethod?: PaymentMethod;
  paymentPayload?: PaymentPayload;
  adminNotes: string;
  additionalInfoRequested?: string;
  additionalInfoProvided?: string;
  cardArtworkUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLogEntry {
  id: string;
  orderId: string;
  adminId: string;
  adminName: string;
  previousStatus: OrderStatus;
  newStatus: OrderStatus;
  notes: string;
  timestamp: string;
}

export interface Notification {
  id: string;
  userId: string;
  subject: string;
  body: string;
  type: "order_placed" | "payment_submitted" | "under_review" | "info_requested" | "approved" | "rejected" | "card_ready" | "completed";
  read: boolean;
  createdAt: string;
}

export interface AboutSectionConfig {
  quote: string;
  imageUrl: string;
  bio: string;
  name: string;
  profession: string;
  birthday: string;
  birthSign: string;
  birthplace: string;
  age: string;
}

export interface AppState {
  currentUser: UserProfile | null;
  users: UserProfile[];
  packages: MembershipPackage[];
  orders: Order[];
  auditLogs: AuditLogEntry[];
  notifications: Notification[];
  wallets: CryptoWalletConfig[];
  adminEmails: string[];
  contact: ContactSettings;
  aboutSection: AboutSectionConfig;
  view: "landing" | "dashboard" | "admin";
}