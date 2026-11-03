import { Linking } from 'react-native';

/** Indian numbers are stored as 10 digits; links and dialers want the +91 country code. */
function withCountryCode(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  return digits.length === 10 ? `91${digits}` : digits;
}

export function formatPhone(phone?: string | null): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
  return phone;
}

/** Opens a WhatsApp chat with the number, with the message already typed. */
export async function openWhatsApp(phone: string, text?: string): Promise<boolean> {
  const url = `https://wa.me/${withCountryCode(phone)}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
  try {
    await Linking.openURL(url);
    return true;
  } catch {
    return false;
  }
}

export async function callPhone(phone: string): Promise<boolean> {
  try {
    await Linking.openURL(`tel:+${withCountryCode(phone)}`);
    return true;
  } catch {
    return false;
  }
}
