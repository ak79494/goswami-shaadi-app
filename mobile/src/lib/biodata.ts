import { File, Paths } from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

import { api, mediaUrl, TUNNEL_HEADERS } from './api';
import { ageFromDob, fullName, heightLabel } from './format';
import { formatPhone } from './links';
import type { Photo, Preference, Profile } from './types';

const BASE64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

function toBase64(bytes: Uint8Array): string {
  let out = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i];
    const b = i + 1 < bytes.length ? bytes[i + 1] : 0;
    const c = i + 2 < bytes.length ? bytes[i + 2] : 0;
    out += BASE64[a >> 2] + BASE64[((a & 3) << 4) | (b >> 4)];
    out += i + 1 < bytes.length ? BASE64[((b & 15) << 2) | (c >> 6)] : '=';
    out += i + 2 < bytes.length ? BASE64[c & 63] : '=';
  }
  return out;
}

/** The PDF renderer can't send the tunnel header, so the photo is embedded as a data URI instead. */
async function photoDataUri(path?: string | null): Promise<string | null> {
  const url = mediaUrl(path);
  if (!url) return null;
  try {
    const res = await fetch(url, { headers: TUNNEL_HEADERS });
    if (!res.ok) return null;
    const type = res.headers.get('content-type') ?? 'image/jpeg';
    return `data:${type};base64,${toBase64(new Uint8Array(await res.arrayBuffer()))}`;
  } catch {
    return null;
  }
}

const esc = (v: unknown) =>
  String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

function section(title: string, rows: [string, string | number | null | undefined][]): string {
  const filled = rows.filter(([, v]) => v !== null && v !== undefined && String(v).trim() !== '');
  if (!filled.length) return '';
  return `<section><h2>${esc(title)}</h2><table>${filled
    .map(([k, v]) => `<tr><th>${esc(k)}</th><td>${esc(v)}</td></tr>`)
    .join('')}</table></section>`;
}

function formatDob(dob?: string | null) {
  if (!dob) return null;
  const d = new Date(`${dob}T00:00:00`);
  return Number.isNaN(d.getTime()) ? dob : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}

function biodataHtml(profile: Profile, photo: string | null, preference: Preference | null): string {
  const name = fullName(profile);
  const age = ageFromDob(profile.dateOfBirth);
  const phone = profile.mobileNumber || profile.user.phone;
  const ageRange =
    preference?.minAge || preference?.maxAge ? `${preference?.minAge ?? 18} – ${preference?.maxAge ?? 60} years` : null;

  return `<!doctype html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<style>
  @page { margin: 18mm 14mm; }
  * { box-sizing: border-box; }
  body { font-family: -apple-system, Roboto, 'Segoe UI', Arial, sans-serif; color: #202944; margin: 0; }
  .frame { border: 2px solid #D92F4B; border-radius: 14px; padding: 22px 24px; }
  .blessing { text-align: center; color: #A81E3A; font-size: 13px; letter-spacing: 1px; margin-bottom: 6px; }
  .title { text-align: center; color: #D92F4B; font-size: 26px; font-weight: 800; letter-spacing: 3px; margin: 0 0 18px; }
  .hero { display: flex; gap: 20px; align-items: center; padding-bottom: 16px; border-bottom: 1px solid #F1E3E7; }
  .photo { width: 130px; height: 162px; border-radius: 12px; object-fit: cover; border: 3px solid #FFE1E7; }
  .placeholder { width: 130px; height: 162px; border-radius: 12px; background: #FFE1E7; color: #D92F4B;
                 display: flex; align-items: center; justify-content: center; font-size: 44px; font-weight: 800; }
  .name { font-size: 24px; font-weight: 800; margin: 0; }
  .meta { color: #646B80; font-size: 14px; margin-top: 6px; line-height: 1.5; }
  .id { display: inline-block; margin-top: 8px; background: #FFF0F3; color: #D92F4B; font-weight: 700;
        font-size: 12px; padding: 4px 10px; border-radius: 999px; }
  section { margin-top: 16px; page-break-inside: avoid; }
  h2 { color: #D92F4B; font-size: 15px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 6px;
       border-left: 4px solid #D92F4B; padding-left: 8px; }
  table { width: 100%; border-collapse: collapse; }
  th { text-align: left; width: 38%; color: #646B80; font-weight: 600; font-size: 13px; padding: 6px 0; vertical-align: top; }
  td { font-size: 14px; font-weight: 600; padding: 6px 0; border-bottom: 1px dashed #F1E3E7; }
  p.about { font-size: 14px; line-height: 1.6; margin: 0; }
  .footer { text-align: center; color: #9CA1B3; font-size: 11px; margin-top: 20px; }
</style></head><body><div class="frame">
  <div class="blessing">|| Shree Ganeshaya Namah ||</div>
  <h1 class="title">BIODATA</h1>
  <div class="hero">
    ${photo ? `<img class="photo" src="${photo}"/>` : `<div class="placeholder">${esc(name.charAt(0) || '?')}</div>`}
    <div>
      <p class="name">${esc(name)}</p>
      <div class="meta">${esc(
        [age ? `${age} years` : null, heightLabel(profile.height), profile.maritalStatus].filter(Boolean).join(' · '),
      )}<br/>${esc([profile.profession, [profile.city, profile.state].filter(Boolean).join(', ')].filter(Boolean).join(' · '))}</div>
      <span class="id">Goswami Jodi ID: ${esc(profile.user.goswamiId)}</span>
    </div>
  </div>
  ${profile.aboutMe ? `<section><h2>About me</h2><p class="about">${esc(profile.aboutMe)}</p></section>` : ''}
  ${section('Personal details', [
    ['Full name', name],
    ['Date of birth', formatDob(profile.dateOfBirth)],
    ['Height', heightLabel(profile.height)],
    ['Marital status', profile.maritalStatus],
    ['Body type', profile.bodyType],
    ['Mother tongue', profile.motherTongue],
    ['Religion', profile.religion],
    ['Community', [profile.community, profile.subCommunity].filter(Boolean).join(' · ')],
    ['Lives in', [profile.city, profile.state, profile.country].filter(Boolean).join(', ')],
  ])}
  ${section('Horoscope', [
    ['Rashi', profile.rashi],
    ['Nakshatra', profile.nakshatra],
    ['Manglik', profile.manglik],
    ['Time of birth', profile.timeOfBirth],
    ['Place of birth', profile.placeOfBirth],
  ])}
  ${section('Education & career', [
    ['Education', profile.education],
    ['College', profile.college],
    ['Profession', profile.profession],
    ['Company', profile.company],
    ['Annual income', profile.incomeRange],
  ])}
  ${section('Family', [
    ["Father's name", profile.fatherName],
    ["Father's occupation", profile.fatherOccupation],
    ["Mother's name", profile.motherName],
    ["Mother's occupation", profile.motherOccupation],
    ['Siblings', profile.siblings],
    ['Family type', profile.familyType],
    ['Family values', profile.familyValues],
  ])}
  ${section('Lifestyle', [
    ['Diet', profile.foodPreference],
    ['Smoking', profile.smoking],
    ['Drinking', profile.drinking],
    ['Lifestyle', profile.lifestyle],
    ['Interests', profile.hobbies?.join(', ')],
  ])}
  ${section('Partner preferences', [
    ['Age', ageRange],
    ['Religion', preference?.religions],
    ['Community', preference?.communities],
    ['City', preference?.cities],
    ['Education', preference?.education],
    ['Profession', preference?.profession],
    ['Marital status', preference?.maritalStatuses],
    ['Expectations', preference?.expectations],
  ])}
  ${section('Contact', [
    ['Mobile & WhatsApp', formatPhone(phone)],
  ])}
  <div class="footer">Created with the Goswami Jodi app</div>
</div></body></html>`;
}

/** The printed PDF has a random file name, which is what families would see on WhatsApp. */
function namedCopy(uri: string, profile: Profile): string {
  const name = fullName(profile).replace(/[\\/:*?"<>|\s]+/g, '-');
  const named = new File(Paths.cache, `${name || 'My'}-Biodata.pdf`);
  if (named.exists) named.delete();
  new File(uri).move(named);
  return named.uri;
}

/**
 * Builds the member's own marriage biodata as a PDF and opens the share sheet, so it can be saved
 * to Files or sent on WhatsApp. On the web it opens the browser's print dialog instead.
 */
export async function shareMyBiodata(profile: Profile, photos: Photo[]): Promise<void> {
  const primary = photos.find((p) => p.primaryPhoto) ?? photos[0];
  const [photo, preference] = await Promise.all([
    photoDataUri(primary?.url),
    api.get<Preference>('/preferences').catch(() => null),
  ]);
  const html = biodataHtml(profile, photo, preference);

  if (Platform.OS === 'web') {
    await Print.printAsync({ html });
    return;
  }
  const { uri } = await Print.printToFileAsync({ html, base64: false });
  if (!(await Sharing.isAvailableAsync())) throw new Error('Sharing is not available on this device');
  await Sharing.shareAsync(namedCopy(uri, profile), {
    mimeType: 'application/pdf',
    UTI: 'com.adobe.pdf',
    dialogTitle: `Biodata — ${fullName(profile)}`,
  });
}
