import type { Profile } from './types';

export function ageFromDob(dob?: string | null): number | null {
  if (!dob) return null;
  const [y, m, d] = dob.split('-').map(Number);
  if (!y || !m || !d) return null;
  const today = new Date();
  let age = today.getFullYear() - y;
  if (today.getMonth() + 1 < m || (today.getMonth() + 1 === m && today.getDate() < d)) age--;
  return age;
}

/** Heights are stored as "feet.inches" strings (e.g. "5.4", "5.10"), matching the web app. */
export function heightLabel(h?: string | null): string | null {
  if (!h) return null;
  const [ft, inch] = h.split('.');
  if (!ft) return h;
  return `${ft}' ${inch ? Number(inch) : 0}"`;
}

export function displayName(p?: Pick<Profile, 'firstName' | 'lastName'> | null): string {
  if (!p) return '';
  const last = p.lastName?.trim();
  return last ? `${p.firstName} ${last.charAt(0).toUpperCase()}.` : p.firstName;
}

export function fullName(p?: Pick<Profile, 'firstName' | 'lastName'> | null): string {
  if (!p) return '';
  return [p.firstName, p.lastName].filter(Boolean).join(' ');
}

export function initials(name?: string | null): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || '?';
}

function parseDate(iso?: string | null): Date | null {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function isOnline(lastActiveAt?: string | null): boolean {
  const d = parseDate(lastActiveAt);
  return !!d && Date.now() - d.getTime() < 5 * 60 * 1000;
}

export function timeAgo(iso?: string | null): string {
  const d = parseDate(iso);
  if (!d) return '';
  const s = Math.max(0, Math.floor((Date.now() - d.getTime()) / 1000));
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export function lastSeen(iso?: string | null): string {
  if (isOnline(iso)) return 'Online now';
  const ago = timeAgo(iso);
  return ago ? `Active ${ago}` : '';
}

export function clockTime(iso?: string | null): string {
  const d = parseDate(iso);
  if (!d) return '';
  return d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });
}

/** "2 Nov 2026, 9:40 pm" */
export function dateTime(iso?: string | null): string {
  const d = parseDate(iso);
  if (!d) return '';
  return `${d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}, ${clockTime(iso)}`;
}

/** One-line summary used on cards: "27 yrs · 5' 6" · Pune". */
export function profileHeadline(p: Profile): string {
  const age = ageFromDob(p.dateOfBirth);
  return [age ? `${age} yrs` : null, heightLabel(p.height), p.city].filter(Boolean).join(' · ');
}

const COMPLETION_FIELDS: (keyof Profile)[] = [
  'firstName', 'lastName', 'dateOfBirth', 'city', 'state', 'motherTongue', 'religion', 'community',
  'subCommunity', 'maritalStatus', 'height', 'education', 'profession', 'incomeRange', 'aboutMe',
  'familyType', 'familyValues', 'fatherOccupation', 'motherOccupation', 'foodPreference',
];

export function profileCompletion(p: Profile | null, photoCount: number): number {
  if (!p) return 0;
  const filled = COMPLETION_FIELDS.filter((k) => {
    const v = p[k];
    return v !== null && v !== undefined && String(v).trim() !== '';
  }).length;
  const hobbies = p.hobbies && p.hobbies.length > 0 ? 1 : 0;
  const photos = Math.min(photoCount, 3);
  const total = COMPLETION_FIELDS.length + 1 + 3;
  return Math.round(((filled + hobbies + photos) / total) * 100);
}

export function toIsoDate(d: Date): string {
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

/** True while a member's premium membership is paid up (from the user object on any profile). */
export function isPremiumUser(user?: { premiumMember?: boolean; premiumValidUntil?: string | null } | null): boolean {
  if (!user?.premiumMember || !user.premiumValidUntil) return false;
  return new Date(user.premiumValidUntil).getTime() > Date.now();
}

export function longDate(iso?: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}
