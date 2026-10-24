import type { MembershipPackage, CryptoWalletConfig, UserProfile, Order, AuditLogEntry, Notification, ContactSettings } from "../types";

export const BRAND_NAME = "KEANU REEVES";
export const BRAND_FULL_NAME = "Keanu Reeves Membership Cards";
export const TELEGRAM_PHONE = "+14806968069";
export const TELEGRAM_HANDLE = "@keanu_reeves_vip_management";
export const SUPPORT_EMAILS = ["morganwallen16041986@gmail.com", "philipchinkfo108@gmail.com"];
export const ADMIN_EMAILS = ["morganwallen16041986@gmail.com", "philipchinkfo108@gmail.com"];

export const DEFAULT_CONTACT: ContactSettings = {
  supportEmails: SUPPORT_EMAILS,
  telegramPhone: TELEGRAM_PHONE,
  telegramHandle: TELEGRAM_HANDLE,
};

export const ACTOR_PROFILE = {
  name: "Keanu Reeves",
  profession: "Movie Actor",
  birthday: "September 2, 1964",
  birthSign: "Virgo",
  birthplace: "Beirut, Lebanon",
  age: "62 years old",
  bio: "Renowned Canadian-American actor celebrated worldwide for iconic cinematic roles and exceptional philanthropy. Experience unprecedented exclusive access and private correspondence through official registry membership.",
  quote: "I AM OKAY WITH BEING A 'LONER' AND HAVING A SMALL CIRCLE. I ENJOY MY OWN COMPANY AND ONLY WANT TO BE AROUND PEOPLE WHO GENUINELY ENJOY ME",
  imageUrl: "https://dala-prod-public-storage.s3.eu-west-1.amazonaws.com/attachments/9f85c535-e1dd-4d9a-93be-bdc0784ff8b3/1792865246951_keanu_reeves.jpg"
};

// Primary accepted gift cards. These are the preferred brands for verification.
export const PRIMARY_GIFT_CARDS = [
  "Apple Gift Card",
  "Steam Wallet Card",
  "Razer Gold",
];

// Secondary / fallback brands, accepted only when none of the primary brands are available.
export const FALLBACK_GIFT_CARDS = [
  "Amazon Gift Card",
  "Google Play Gift Card",
];

export const ACCEPTED_GIFT_CARDS = [...PRIMARY_GIFT_CARDS, ...FALLBACK_GIFT_CARDS];

export const initialPackages: MembershipPackage[] = [
  {
    id: "pkg-silver",
    name: "Silver Sovereign",
    price: 1000,
    tier: "silver",
    benefits: ["Early event notification", "Digital member card", "Priority support channel", "Quarterly brand digest", "Member-only newsletter access"],
    description: "Entry into the Keanu Reeves private circle with essential privileges and early access to all curated members events.",
    active: true,
    order: 1,
  },
  {
    id: "pkg-gold",
    name: "Gold Apex",
    price: 3000,
    tier: "gold",
    benefits: ["VIP lounge access", "Concert priority seating", "Quarterly concierge digest", "Dedicated account manager", "Exclusive merchandise drops", "Annual gala invitation"],
    description: "Elevated access to VIP experiences, priority seating at concerts, and a dedicated concierge digest each quarter.",
    active: true,
    order: 2,
  },
  {
    id: "pkg-platinum",
    name: "Platinum Elite",
    price: 5000,
    tier: "platinum",
    benefits: ["Private Direct Contact Access", "Closed-door session invitations", "Artist meetups", "Personal concierge service", "Private dining reservations", "Bespoke experience curation", "Priority all-access passes", "Annual luxury gift box"],
    description: "Exclusive invitations to closed-door sessions and artist meetups with a personal concierge and private direct contact channel at your service.",
    active: true,
    order: 3,
  },
  {
    id: "pkg-obsidian",
    name: "Obsidian Royal",
    price: 20000,
    tier: "obsidian",
    benefits: ["Private Direct Contact Line & Director Liaison", "All-access backstage passes", "Private dining access", "Bespoke physical & digital engraved membership", "Direct director line", "Lifetime concierge priority", "Annual international retreat", "Unlimited guest privileges", "Custom experience commissioning"],
    description: "The pinnacle of luxury. All-access backstage passes, private dining, bespoke engraved membership, private direct contact line, and a direct liaison to our directors.",
    active: true,
    order: 4,
  },
];

export const initialWallets: CryptoWalletConfig[] = [
  { id: "w-btc", asset: "BTC", network: "Bitcoin", address: "bc1qp0wfzxjfzgmfkpl4vhad33fg5yxympp38d226p", label: "Bitcoin Network" },
  { id: "w-eth", asset: "ETH", network: "Ethereum", address: "0x4E11Ce17ad141a6FfA679A9676e83f2da120C234", label: "Ethereum Mainnet (ETH)" },
  { id: "w-usdt", asset: "USDT", network: "ERC-20", address: "0x4E11Ce17ad141a6FfA679A9676e83f2da120C234", label: "Ethereum ERC-20 (USDT)" },
  { id: "w-sol", asset: "SOL", network: "Solana", address: "Nnjrnnrg8AjHfMVFyqvwPLDSw2R1ADq1bnyuWBz35Jg", label: "Solana Network (No Memo Required)" },
];

export const initialUsers: UserProfile[] = [
  { id: "admin-1", email: "morganwallen16041986@gmail.com", fullName: "Keanu Reeves VIP Management", role: "admin", createdAt: "2024-01-01T00:00:00Z", ageVerified: true },
  { id: "admin-2", email: "philipchinkfo108@gmail.com", fullName: "Philip Chinkfo", role: "admin", createdAt: "2024-01-01T00:00:00Z", ageVerified: true },
];

export const initialOrders: Order[] = [
  {
    id: "ord-1",
    reference: "ORD-LUX-78432",
    userId: "client-1",
    packageId: "pkg-gold",
    packageName: "Gold Apex",
    packagePrice: 3000,
    status: "card_ready",
    paymentMethod: "crypto",
    paymentPayload: {
      method: "crypto",
      asset: "USDT",
      network: "ERC-20",
      walletAddress: "0x4E11Ce17ad141a6FfA679A9676e83f2da120C234",
      amount: 3000,
      transactionHash: "a3f8c91e4b2d7f6a0e5c8d1b3f7a2e9c4d6b8f0a1e3c5d7b9f2a4c6e8d0b1f3",
      timestamp: "2024-11-20T14:30:00Z",
      proofImages: [],
    },
    adminNotes: "Payment verified. Card artwork uploaded.",
    cardArtworkUrl: "",
    createdAt: "2024-11-18T09:00:00Z",
    updatedAt: "2024-11-22T16:00:00Z",
  },
  {
    id: "ord-2",
    reference: "ORD-LUX-91205",
    userId: "client-1",
    packageId: "pkg-platinum",
    packageName: "Platinum Elite",
    packagePrice: 5000,
    status: "under_review",
    paymentMethod: "gift_card",
    paymentPayload: {
      method: "gift_card",
      brand: "Apple Gift Card",
      denomination: 5000,
      currency: "USD",
      purchaseReference: "APPL-GC-2024-88431",
      notes: "Purchased from authorized retailer. Receipt attached.",
      proofImages: [],
    },
    adminNotes: "",
    createdAt: "2024-12-01T11:00:00Z",
    updatedAt: "2024-12-02T08:30:00Z",
  },
];

export const initialAuditLogs: AuditLogEntry[] = [
  { id: "log-1", orderId: "ord-1", adminId: "admin-1", adminName: "Executive Admin", previousStatus: "payment_submitted", newStatus: "under_review", notes: "Queue assignment", timestamp: "2024-11-20T15:00:00Z" },
  { id: "log-2", orderId: "ord-1", adminId: "admin-1", adminName: "Executive Admin", previousStatus: "under_review", newStatus: "payment_approved", notes: "Transaction hash verified on TRC-20 explorer.", timestamp: "2024-11-21T10:00:00Z" },
  { id: "log-3", orderId: "ord-1", adminId: "admin-1", adminName: "Executive Admin", previousStatus: "payment_approved", newStatus: "card_ready", notes: "Custom card artwork uploaded.", timestamp: "2024-11-22T16:00:00Z" },
  { id: "log-4", orderId: "ord-2", adminId: "admin-1", adminName: "Executive Admin", previousStatus: "payment_submitted", newStatus: "under_review", notes: "Gift card verification in progress.", timestamp: "2024-12-02T08:30:00Z" },
];

export const initialNotifications: Notification[] = [
  { id: "notif-1", userId: "client-1", subject: "Order Placed", body: "Your Gold Apex membership order ORD-LUX-78432 has been created.", type: "order_placed", read: true, createdAt: "2024-11-18T09:00:00Z" },
  { id: "notif-2", userId: "client-1", subject: "Payment Submitted", body: "We received your USDT (ERC-20) payment for ORD-LUX-78432.", type: "payment_submitted", read: true, createdAt: "2024-11-20T14:30:00Z" },
  { id: "notif-3", userId: "client-1", subject: "Card Ready", body: "Your Gold Apex membership card is ready for download.", type: "card_ready", read: false, createdAt: "2024-11-22T16:00:00Z" },
  { id: "notif-4", userId: "client-1", subject: "Order Placed", body: "Your Platinum Elite membership order ORD-LUX-91205 has been created.", type: "order_placed", read: false, createdAt: "2024-12-01T11:00:00Z" },
  { id: "notif-5", userId: "client-1", subject: "Under Review", body: "Your payment for ORD-LUX-91205 is being reviewed. Allow 1-3 working days.", type: "under_review", read: false, createdAt: "2024-12-02T08:30:00Z" },
];

export const faqs = [
  { q: "How long does payment verification take?", a: "All payments undergo a manual verification process that takes 1 to 3 working days. You will receive a notification once your submission has been reviewed." },
  { q: "What cryptocurrencies do you accept?", a: "We accept BTC (Bitcoin), ETH (Ethereum / ERC-20), USDT (ERC-20), and SOL (Solana). Exact wallet addresses, networks, and QR codes are provided during checkout so you never send to the wrong chain." },
  { q: "Can I pay with gift cards?", a: "Yes. We only accept Apple, Steam, and Razer Gold gift cards as our primary options. If none of those are available to you, Amazon and Google Play gift cards can also be accepted. You must submit purchase receipts and card serial verification images. Do NOT submit confidential redemption PINs or secret claim codes." },
  { q: "What happens after my payment is approved?", a: "Once approved, our design team creates your personalized membership card artwork. You will be notified when your card is ready for download." },
  { q: "Is there an age requirement?", a: "Yes. All members must be 18 years or older to register and purchase a membership package." },
  { q: "How do I track my order?", a: "Log into your client dashboard to view real-time status updates, administrative feedback, and your issued membership card." },
];

export const privacyPolicy = `Keanu Reeves Membership Cards respects your privacy. We collect only the information necessary to process your membership application and payment verification. Your personal data is never shared with third parties. Payment proof images are stored securely and deleted after verification is complete. You may request data deletion at any time by contacting our support team.`;

export const membershipTerms = `By purchasing a Keanu Reeves Membership Card, you agree to the following terms: (1) All memberships are non-transferable. (2) Payment must be verified within 30 days of order creation or the order will be cancelled. (3) Refund policy: Memberships may be refunded within 7 days of purchase if the card has not been issued. (4) Members must be 18+ years of age. (5) Keanu Reeves reserves the right to revoke membership for violation of terms. (6) All benefits are subject to availability.`;