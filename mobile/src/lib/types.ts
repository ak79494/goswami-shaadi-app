// Shapes of the JSON returned by the Spring Boot backend (backend/src/main/java/.../model).

export type Gender = 'MALE' | 'FEMALE' | 'OTHER';

export type User = {
  id: number;
  email?: string;
  phone?: string;
  gender: Gender;
  role: string;
  goswamiId: string;
  lastActiveAt?: string;
  createdAt?: string;
  premiumMember?: boolean;
  premiumPlan?: string | null;
  premiumValidUntil?: string | null;
};

export type Profile = {
  id: number;
  user: User;
  firstName: string;
  lastName?: string | null;
  dateOfBirth?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  motherTongue?: string | null;
  religion?: string | null;
  community?: string | null;
  subCommunity?: string | null;
  maritalStatus?: string | null;
  height?: string | null;
  bodyType?: string | null;
  education?: string | null;
  college?: string | null;
  profession?: string | null;
  company?: string | null;
  incomeRange?: string | null;
  aboutMe?: string | null;
  hobbies?: string[] | null;
  familyType?: string | null;
  familyValues?: string | null;
  fatherName?: string | null;
  motherName?: string | null;
  fatherOccupation?: string | null;
  motherOccupation?: string | null;
  siblings?: number | null;
  lifestyle?: string | null;
  foodPreference?: string | null;
  smoking?: string | null;
  drinking?: string | null;
  profileVisible?: boolean;
  contactVisible?: boolean;
  timeOfBirth?: string | null;
  placeOfBirth?: string | null;
  manglik?: string | null;
  nakshatra?: string | null;
  rashi?: string | null;
  /** Only present on your own profile (GET /profiles/me). */
  mobileNumber?: string | null;
  whatsappNumber?: string | null;
  /** Who may see your numbers: PREMIUM (default), CONNECTED or HIDDEN. */
  contactDisplayOption?: ContactOption | null;
  updatedAt?: string;
};

export type ContactOption = 'PREMIUM' | 'CONNECTED' | 'HIDDEN';

/** GET /profiles/user/{id}/contact */
export type Contact = {
  available: boolean;
  reason?: 'PREMIUM_REQUIRED' | 'CONNECT_FIRST' | 'HIDDEN' | 'BLOCKED' | 'NO_NUMBER' | null;
  phone?: string | null;
  whatsapp?: string | null;
};

/** Body for PUT /api/profiles/me — the backend replaces every field, so always send the full set. */
export type ProfileForm = Omit<Profile, 'id' | 'user' | 'updatedAt'>;

export type Photo = {
  id: number;
  url: string;
  fileName: string;
  primaryPhoto: boolean;
  sortOrder: number;
};

export type RequestStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN';

export type InterestRequest = {
  id: number;
  sender: User;
  receiver: User;
  status: RequestStatus;
  createdAt: string;
  respondedAt?: string | null;
};

export type InterestState = 'SEND_INTEREST' | 'INTEREST_SENT' | 'INTEREST_RECEIVED' | 'INTEREST_ACCEPTED';

export type Shortlist = { id: number; targetUser: User; createdAt: string };

export type Notification = {
  id: number;
  message: string;
  type?: string | null;
  read: boolean;
  createdAt: string;
};

export type Message = {
  id: number;
  sender: User;
  content: string;
  /** DELETED: deleted for everyone; the server has already wiped the content. */
  messageType?: 'TEXT' | 'VOICE' | 'DELETED' | string;
  audioUrl?: string | null;
  read: boolean;
  createdAt: string;
  deliveredAt?: string | null;
  readAt?: string | null;
  replyToId?: number | null;
  replyToSenderId?: number | null;
  replyToText?: string | null;
  /** Seconds left in which the sender can still delete this for everyone. */
  deleteForEveryoneSeconds?: number;
};

export type BlockedMember = {
  targetUserId: number;
  createdAt: string;
  name: string;
  goswamiId: string;
  photoUrl?: string | null;
};

export type ConversationSummary = {
  userId: number;
  name: string;
  goswamiId: string;
  lastMessage?: string | null;
  lastMessageTime?: string | null;
  unreadCount: number;
  photoUrl?: string | null;
  online: boolean;
  lastActiveAt?: string | null;
};

export type Preference = {
  minAge?: number | null;
  maxAge?: number | null;
  preferredGender?: string | null;
  religions?: string | null;
  communities?: string | null;
  cities?: string | null;
  education?: string | null;
  profession?: string | null;
  maritalStatuses?: string | null;
  foodPreference?: string | null;
  lifestyle?: string | null;
  expectations?: string | null;
};

export type PreferenceMatch = {
  matched: number;
  total: number;
  percentage: number;
  message: string;
  details: { label: string; value: string; matched: boolean }[];
};

/** How one member fits the other's partner preferences (only preferences that were set). */
export type PreferenceSide = { matched: number; total: number; details: { label: string; value: string; matched: boolean }[] };

/** GET /preferences/compatibility/{userId}: theirs = how I fit their preferences, mine = how they fit mine. */
export type Compatibility = { percentage: number | null; theirs: PreferenceSide; mine: PreferenceSide };

export type Page<T> = {
  content: T[];
  last: boolean;
  totalElements: number;
  totalPages: number;
  number: number;
};

export type AuthResponse = { token: string; userId: number; email: string; role: string };

export type PremiumOrderSummary = {
  orderId: number;
  plan: string;
  planName: string;
  amount: number;
  status: 'CREATED' | 'PENDING' | 'PAID' | 'REJECTED';
  paymentMethod?: string | null;
  transactionId?: string | null;
  adminNote?: string | null;
  createdAt: string;
};

export type PremiumStatus = {
  active: boolean;
  plan?: string | null;
  planName?: string | null;
  validUntil?: string | null;
  latestOrder?: PremiumOrderSummary | null;
};

export type AppInfo = {
  companyName: string;
  founderName: string;
  supportPhone: string;
  supportWhatsapp: string;
  supportEmail?: string | null;
  astroWhatsapp: string;
};

export type AdminOrder = PremiumOrderSummary & {
  // Empty once the member has deleted their account.
  userId: number | null;
  goswamiId: string | null;
  name: string;
  email?: string | null;
  phone?: string | null;
  paidAt?: string | null;
};

export type ReportedMember = {
  id: number;
  reportedUserId: number;
  reportedName: string;
  reportedGoswamiId: string;
  reportedEnabled: boolean;
  reporterName: string;
  reporterGoswamiId: string;
  reason: string;
  details?: string | null;
  evidencePath?: string | null;
  status: 'OPEN' | 'DISMISSED' | 'SUSPENDED' | 'RESTORED';
  createdAt: string;
};

export type HelpRequest = {
  id: number;
  userId?: number | null;
  goswamiId?: string | null;
  name: string;
  phone: string;
  topic: string;
  message?: string | null;
  status: 'NEW' | 'CONTACTED' | 'CLOSED';
  createdAt: string;
};
