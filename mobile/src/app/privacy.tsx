import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { SwitchRow } from '@/components/fields';
import { formFromProfile, toRequest } from '@/components/profile-form';
import { Header } from '@/components/screen';
import { useToast } from '@/components/toast';
import { colors, radius } from '@/constants/theme';
import { api, errorMessage } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { formatPhone } from '@/lib/links';
import type { ContactOption, Profile, ProfileForm } from '@/lib/types';

const CONTACT_OPTIONS: { key: ContactOption; title: string; subtitle: string }[] = [
  { key: 'PREMIUM', title: 'All premium members', subtitle: 'Recommended — serious families can reach you quickly' },
  { key: 'CONNECTED', title: 'Premium members I have connected with', subtitle: 'Only after you accept their interest, or they accept yours' },
  { key: 'HIDDEN', title: 'No one', subtitle: 'Members can still chat and call you inside the app' },
];

export default function Privacy() {
  const { profile, setProfile } = useAuth();
  const toast = useToast();
  const [saving, setSaving] = useState<string | null>(null);

  if (!profile) return null;
  const contactOption: ContactOption = profile.contactDisplayOption ?? 'PREMIUM';
  const phone = profile.mobileNumber || profile.user.phone;

  const save = async (change: Partial<ProfileForm>, key: string, message: string) => {
    setSaving(key);
    try {
      const saved = await api.put<Profile>('/profiles/me', toRequest({ ...formFromProfile(profile), ...change }));
      setProfile(saved);
      toast(message, 'info');
    } catch (e) {
      toast(errorMessage(e), 'error');
    } finally {
      setSaving(null);
    }
  };

  return (
    <View style={styles.root}>
      <Header title="Privacy settings" />
      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.section}>Profile</Text>
        <View style={styles.card}>
          <SwitchRow
            icon="eye-outline"
            title="Show my profile in search"
            subtitle={saving === 'visible' ? 'Saving…' : 'Turn off to take a break without deleting your account'}
            value={profile.profileVisible !== false}
            onChange={(v) =>
              save({ profileVisible: v }, 'visible', v ? 'Your profile is visible in search' : 'Your profile is hidden from search')
            }
          />
        </View>

        <Text style={styles.section}>Who can see my phone & WhatsApp</Text>
        <View style={styles.card}>
          {CONTACT_OPTIONS.map((o, i) => {
            const on = contactOption === o.key;
            return (
              <Pressable
                key={o.key}
                disabled={!!saving}
                onPress={() => !on && save({ contactDisplayOption: o.key }, o.key, 'Contact privacy updated')}
                style={[styles.option, i === CONTACT_OPTIONS.length - 1 && { borderBottomWidth: 0 }]}
                accessibilityRole="radio"
                accessibilityState={{ selected: on }}>
                <View style={[styles.radio, on && styles.radioOn]}>{on ? <View style={styles.radioDot} /> : null}</View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.optionTitle}>{o.title}</Text>
                  <Text style={styles.optionSub}>{saving === o.key ? 'Saving…' : o.subtitle}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>
        <Pressable onPress={() => router.push('/edit/contact')} style={styles.numbers} accessibilityRole="button">
          <Ionicons name="call-outline" size={18} color={colors.primary} />
          <Text style={styles.numbersText}>
            Mobile & WhatsApp {formatPhone(phone) || 'not set'}
          </Text>
          <Text style={styles.link}>Edit</Text>
        </Pressable>

        <View style={styles.note}>
          <Ionicons name="lock-closed-outline" size={18} color={colors.textMuted} />
          <Text style={styles.noteText}>
            Your email address is never shown to other members. You can block or report anyone from the ⋯ menu on their profile.
          </Text>
        </View>

        <Pressable onPress={() => router.push('/blocked')} style={({ pressed }) => [styles.blockedRow, pressed && { backgroundColor: colors.primarySoft }]} accessibilityRole="button">
          <Ionicons name="ban-outline" size={20} color={colors.primary} />
          <Text style={styles.blockedText}>Blocked members</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.textFaint} />
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  blockedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 12,
    padding: 16,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  blockedText: { flex: 1, fontSize: 15, fontWeight: '600', color: colors.text },
  root: { flex: 1, backgroundColor: colors.bg },
  body: { padding: 16, paddingBottom: 40 },
  section: { fontSize: 13, fontWeight: '800', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.6, marginTop: 8, marginBottom: 8, marginLeft: 4 },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 14, marginBottom: 14 },
  option: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: colors.borderStrong, alignItems: 'center', justifyContent: 'center' },
  radioOn: { borderColor: colors.primary },
  radioDot: { width: 11, height: 11, borderRadius: 6, backgroundColor: colors.primary },
  optionTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  optionSub: { fontSize: 12, color: colors.textMuted, marginTop: 2, lineHeight: 17 },
  numbers: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: radius.md, backgroundColor: colors.primarySoft, marginBottom: 14 },
  numbersText: { flex: 1, fontSize: 13, color: colors.text, fontWeight: '600' },
  link: { fontSize: 13, fontWeight: '800', color: colors.primary },
  note: { flexDirection: 'row', gap: 10, padding: 14 },
  noteText: { flex: 1, fontSize: 12, lineHeight: 18, color: colors.textMuted },
});
