import type { KeyboardTypeOptions } from 'react-native';

import { ageFromDob, heightLabel } from '@/lib/format';
import * as O from '@/lib/options';
import type { Profile, ProfileForm } from '@/lib/types';
import type { IconName } from './button';
import { ChipSelect, DateField, SelectField, TextField } from './fields';

type Key = keyof ProfileForm;

type FieldDef =
  | { key: Key; kind: 'text'; label: string; placeholder?: string; required?: boolean; keyboard?: KeyboardTypeOptions; icon?: IconName; hint?: string; prefix?: string; maxLength?: number }
  | { key: Key; kind: 'number'; label: string; placeholder?: string }
  | { key: Key; kind: 'select'; label: string; options: string[]; required?: boolean; format?: (v: string) => string }
  | { key: Key; kind: 'date' | 'time'; label: string; required?: boolean }
  | { key: Key; kind: 'multiline'; label: string; placeholder?: string; maxLength: number }
  | { key: Key; kind: 'chips'; label: string; options: string[] };

export type SectionKey = 'basic' | 'religion' | 'career' | 'family' | 'about' | 'contact';

export type Section = { key: SectionKey; title: string; subtitle: string; icon: IconName; fields: FieldDef[] };

const formatHeight = (v: string) => heightLabel(v) ?? v;

export const SECTIONS: Section[] = [
  {
    key: 'basic',
    title: 'Basic details',
    subtitle: 'The essentials every match sees first',
    icon: 'person-outline',
    fields: [
      { key: 'firstName', kind: 'text', label: 'First name', required: true, placeholder: 'e.g. Priya' },
      { key: 'lastName', kind: 'text', label: 'Last name', placeholder: 'e.g. Goswami' },
      { key: 'dateOfBirth', kind: 'date', label: 'Date of birth', required: true },
      { key: 'maritalStatus', kind: 'select', label: 'Marital status', options: O.MARITAL_STATUS, required: true },
      { key: 'height', kind: 'select', label: 'Height', options: O.HEIGHTS, format: formatHeight },
      { key: 'bodyType', kind: 'select', label: 'Body type', options: O.BODY_TYPES },
      { key: 'motherTongue', kind: 'select', label: 'Mother tongue', options: O.MOTHER_TONGUES },
      { key: 'city', kind: 'text', label: 'City', required: true, placeholder: 'e.g. Varanasi', icon: 'location-outline' },
      { key: 'state', kind: 'select', label: 'State', options: O.STATES },
    ],
  },
  {
    key: 'religion',
    title: 'Religion & horoscope',
    subtitle: 'Helps families find the right community match',
    icon: 'flower-outline',
    fields: [
      { key: 'religion', kind: 'select', label: 'Religion', options: O.RELIGIONS },
      { key: 'community', kind: 'select', label: 'Community', options: O.COMMUNITIES },
      { key: 'subCommunity', kind: 'select', label: 'Sub-community (Dashnami)', options: O.SUB_COMMUNITIES },
      { key: 'manglik', kind: 'select', label: 'Manglik', options: O.MANGLIK },
      { key: 'rashi', kind: 'select', label: 'Rashi (moon sign)', options: O.RASHI },
      { key: 'nakshatra', kind: 'select', label: 'Nakshatra', options: O.NAKSHATRA },
      { key: 'timeOfBirth', kind: 'time', label: 'Time of birth' },
      { key: 'placeOfBirth', kind: 'text', label: 'Place of birth', placeholder: 'City of birth' },
    ],
  },
  {
    key: 'career',
    title: 'Education & career',
    subtitle: 'Share what you studied and what you do',
    icon: 'school-outline',
    fields: [
      { key: 'education', kind: 'select', label: 'Highest education', options: O.EDUCATION },
      { key: 'college', kind: 'text', label: 'College / University', placeholder: 'e.g. BHU' },
      { key: 'profession', kind: 'select', label: 'Profession', options: O.PROFESSIONS },
      { key: 'company', kind: 'text', label: 'Company / Organisation', placeholder: 'Where you work' },
      { key: 'incomeRange', kind: 'select', label: 'Annual income', options: O.INCOME_RANGES },
    ],
  },
  {
    key: 'family',
    title: 'Family & lifestyle',
    subtitle: 'Tell families a little about your home',
    icon: 'home-outline',
    fields: [
      { key: 'familyType', kind: 'select', label: 'Family type', options: O.FAMILY_TYPES },
      { key: 'familyValues', kind: 'select', label: 'Family values', options: O.FAMILY_VALUES },
      { key: 'fatherOccupation', kind: 'select', label: "Father's occupation", options: O.OCCUPATIONS },
      { key: 'motherOccupation', kind: 'select', label: "Mother's occupation", options: O.OCCUPATIONS },
      { key: 'siblings', kind: 'number', label: 'Number of siblings', placeholder: '0' },
      { key: 'foodPreference', kind: 'select', label: 'Diet', options: O.FOOD },
      { key: 'smoking', kind: 'select', label: 'Smoking', options: O.YES_NO },
      { key: 'drinking', kind: 'select', label: 'Drinking', options: O.YES_NO },
      { key: 'lifestyle', kind: 'select', label: 'Lifestyle', options: O.LIFESTYLE },
    ],
  },
  {
    key: 'about',
    title: 'About you',
    subtitle: 'A warm introduction gets many more interests',
    icon: 'sparkles-outline',
    fields: [
      {
        key: 'aboutMe',
        kind: 'multiline',
        label: 'About me',
        placeholder: 'Describe yourself, your values, and what you are looking for in a partner…',
        maxLength: 1000,
      },
      { key: 'hobbies', kind: 'chips', label: 'Interests & hobbies', options: O.HOBBIES },
    ],
  },
  {
    key: 'contact',
    title: 'Contact number',
    subtitle: 'Shown only to premium members, as your privacy settings allow',
    icon: 'call-outline',
    fields: [
      {
        key: 'mobileNumber',
        kind: 'text',
        label: 'Mobile number (also used for WhatsApp)',
        placeholder: '10-digit mobile number',
        keyboard: 'phone-pad',
        prefix: '+91',
        maxLength: 10,
        hint: 'Members can call you or message you on WhatsApp on this number. Leave blank to use the number you signed up with.',
      },
    ],
  },
];

/** The onboarding wizard asks for everything except the contact number (the sign-up phone is used until then). */
export const WIZARD_SECTIONS = SECTIONS.filter((s) => s.key !== 'contact');

const PHONE_KEYS = new Set<string>(['mobileNumber']);

export function sectionByKey(key: string): Section | undefined {
  return SECTIONS.find((s) => s.key === key);
}

export function emptyForm(): ProfileForm {
  return { firstName: '', country: 'India', religion: 'Hindu', community: 'Brahmin-Goswami', maritalStatus: 'Never Married', hobbies: [] };
}

export function formFromProfile(p: Profile): ProfileForm {
  const { id: _id, user: _user, updatedAt: _updatedAt, ...rest } = p;
  return { ...rest, hobbies: p.hobbies ?? [] };
}

/** Converts blank strings to null so the backend stores "not provided" consistently. */
export function toRequest(form: ProfileForm): ProfileForm {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(form)) {
    // Phone numbers are sent as "" when cleared: the backend treats null as "keep the saved number".
    if (PHONE_KEYS.has(k)) out[k] = typeof v === 'string' ? v.replace(/\D/g, '') : v;
    else out[k] = typeof v === 'string' ? (v.trim() === '' ? null : v.trim()) : v;
  }
  // One number per member: the mobile number is also their WhatsApp, so drop any older separate one.
  out.whatsappNumber = '';
  return out as ProfileForm;
}

export function validateSection(section: Section, form: ProfileForm): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const f of section.fields) {
    if ('required' in f && f.required) {
      const v = form[f.key];
      if (v === null || v === undefined || String(v).trim() === '') errors[f.key] = `${f.label} is required`;
    }
  }
  for (const key of PHONE_KEYS) {
    if (!section.fields.some((f) => f.key === key)) continue;
    const digits = String(form[key as Key] ?? '').replace(/\D/g, '');
    if (digits && !/^[6-9]\d{9}$/.test(digits)) errors[key] = 'Enter a valid 10-digit mobile number';
  }
  if (section.fields.some((f) => f.key === 'dateOfBirth') && form.dateOfBirth) {
    const age = ageFromDob(form.dateOfBirth);
    if (age !== null && age < 18) errors.dateOfBirth = 'You must be at least 18 years old';
  }
  return errors;
}

export function ProfileFields({
  section,
  form,
  onChange,
  errors = {},
}: {
  section: Section;
  form: ProfileForm;
  onChange: (key: Key, value: unknown) => void;
  errors?: Record<string, string>;
}) {
  const maxDob = new Date();
  maxDob.setFullYear(maxDob.getFullYear() - 18);

  return (
    <>
      {section.fields.map((f) => {
        const raw = form[f.key];
        const value = raw === null || raw === undefined ? '' : String(raw);
        const error = errors[f.key];
        const label = 'required' in f && f.required ? `${f.label} *` : f.label;
        switch (f.kind) {
          case 'text':
            return (
              <TextField
                key={f.key}
                label={label}
                value={value}
                onChangeText={(v) => onChange(f.key, v)}
                placeholder={f.placeholder}
                keyboardType={f.keyboard}
                icon={f.icon}
                prefix={f.prefix}
                maxLength={f.maxLength}
                hint={f.hint}
                autoCapitalize={f.keyboard ? 'none' : 'words'}
                error={error}
              />
            );
          case 'number':
            return (
              <TextField
                key={f.key}
                label={label}
                value={value}
                onChangeText={(v) => {
                  const digits = v.replace(/\D/g, '').slice(0, 2);
                  onChange(f.key, digits === '' ? null : Number(digits));
                }}
                placeholder={f.placeholder}
                keyboardType="number-pad"
              />
            );
          case 'select':
            return (
              <SelectField
                key={f.key}
                label={label}
                value={value || null}
                options={f.options}
                format={f.format}
                onChange={(v) => onChange(f.key, v)}
                error={error}
              />
            );
          case 'date':
          case 'time':
            return (
              <DateField
                key={f.key}
                label={label}
                mode={f.kind}
                value={value || null}
                maximumDate={f.kind === 'date' ? maxDob : undefined}
                minimumDate={f.kind === 'date' ? new Date(1950, 0, 1) : undefined}
                onChange={(v) => onChange(f.key, v)}
                error={error}
              />
            );
          case 'multiline':
            return (
              <TextField
                key={f.key}
                label={label}
                value={value}
                onChangeText={(v) => onChange(f.key, v)}
                placeholder={f.placeholder}
                multiline
                maxLength={f.maxLength}
              />
            );
          case 'chips':
            return (
              <ChipSelect
                key={f.key}
                label={label}
                options={[...new Set([...f.options, ...(form.hobbies ?? [])])]}
                value={form.hobbies ?? []}
                onChange={(v) => onChange(f.key, v)}
                multiple
              />
            );
        }
      })}
    </>
  );
}
