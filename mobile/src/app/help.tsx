import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { TextField } from '@/components/fields';
import { Header, KeyboardScreen } from '@/components/screen';
import { useToast } from '@/components/toast';
import { motion } from '@/constants/motion';
import { colors, radius, shadow } from '@/constants/theme';
import { api, errorMessage } from '@/lib/api';
import { useAppInfo } from '@/lib/app-info';
import { useAuth } from '@/lib/auth';
import { fullName } from '@/lib/format';
import { callPhone, formatPhone, openWhatsApp } from '@/lib/links';

const TOPICS = ['Help me find a match', 'Premium & payments', 'My profile', 'App problem', 'Something else'];

const FAQS: { q: string; a: string }[] = [
  {
    q: 'How do I find the right match?',
    a: 'Complete your profile and partner preferences, then browse Matches. Send an interest to members you like — you can start chatting right away.',
  },
  {
    q: 'Can someone help me search for a match?',
    a: 'Yes. Use "Request a call back" below and choose "Help me find a match". Our team will call you, understand what your family is looking for and suggest suitable profiles.',
  },
  {
    q: 'Who can see my phone number?',
    a: 'Only premium members, and only if your Privacy settings allow it. You can limit it to members you have connected with, or hide it completely.',
  },
  {
    q: 'How do I become a premium member?',
    a: 'Open the ☰ menu and tap Upgrade to Premium. Pay by UPI, enter the payment reference, and Premium is activated as soon as our team verifies it.',
  },
  {
    q: 'How do I download my biodata?',
    a: 'Open the ☰ menu and tap Download Biodata. A PDF with your photo and details is created that you can save or share on WhatsApp.',
  },
  {
    q: 'Someone is bothering me. What should I do?',
    a: 'Open their profile, tap ⋯ and choose Block or Report profile. Blocked members can no longer see you, message you or call you. To undo it, open the ☰ menu and tap Blocked Members.',
  },
];

export default function Help() {
  const insets = useSafeAreaInsets();
  const { status, profile } = useAuth();
  const info = useAppInfo();
  const toast = useToast();
  const signedIn = status === 'ready';

  const [name, setName] = useState(profile ? fullName(profile) : '');
  const [phone, setPhone] = useState(profile?.mobileNumber ?? profile?.user.phone ?? '');
  const [topic, setTopic] = useState(TOPICS[0]);
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [open, setOpen] = useState<number | null>(null);

  const submit = async () => {
    const e: Record<string, string> = {};
    if (name.trim().length < 2) e.name = 'Enter your name';
    if (!/^[6-9]\d{9}$/.test(phone.replace(/\D/g, '').replace(/^91(?=\d{10}$)/, ''))) e.phone = 'Enter a valid 10-digit mobile number';
    setErrors(e);
    if (Object.keys(e).length) return;
    setBusy(true);
    try {
      await api.post(signedIn ? '/help-requests' : '/public/help-requests', { name: name.trim(), phone, topic, message: message.trim() });
      setSent(true);
    } catch (err) {
      toast(errorMessage(err), 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardScreen style={styles.root}>
      <Header title="Help & Support" />
      <ScrollView contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + 32 }]} keyboardShouldPersistTaps="handled">
        <Animated.View entering={motion.enter()} style={styles.contact}>
          <View style={styles.contactIcon}>
            <Ionicons name="headset" size={26} color={colors.primary} />
          </View>
          <Text style={styles.contactTitle}>Talk to the {info.companyName} team</Text>
          <Text style={styles.contactText}>Questions about matches, membership or your profile? Call or WhatsApp us.</Text>
          <Text style={styles.phone}>{formatPhone(info.supportPhone)}</Text>
          <View style={styles.row}>
            <Button title="Call" icon="call" variant="secondary" onPress={() => callPhone(info.supportPhone)} style={{ flex: 1 }} />
            <Button
              title="WhatsApp"
              icon="logo-whatsapp"
              variant="success"
              onPress={() => openWhatsApp(info.supportWhatsapp, `Hi ${info.companyName}, I need help with the app.`)}
              style={{ flex: 1 }}
            />
          </View>
        </Animated.View>

        <Text style={styles.section}>Request a call back</Text>
        <Animated.View entering={motion.enter(60)} style={styles.card}>
          {sent ? (
            <View style={styles.sent}>
              <Ionicons name="checkmark-circle" size={44} color={colors.success} />
              <Text style={styles.sentTitle}>Request received</Text>
              <Text style={styles.sentText}>Our team will call you on {formatPhone(phone)} soon.</Text>
              <Button title="Send another request" variant="ghost" size="sm" onPress={() => setSent(false)} />
            </View>
          ) : (
            <>
              <TextField label="Your name" value={name} onChangeText={setName} icon="person-outline" autoCapitalize="words" error={errors.name} />
              <TextField
                label="Mobile number"
                value={phone}
                onChangeText={setPhone}
                prefix="+91"
                keyboardType="phone-pad"
                maxLength={10}
                error={errors.phone}
              />
              <Text style={styles.label}>What do you need help with?</Text>
              <View style={styles.topics}>
                {TOPICS.map((t) => (
                  <Pressable key={t} onPress={() => setTopic(t)} style={[styles.topic, topic === t && styles.topicOn]}>
                    <Text style={[styles.topicText, topic === t && styles.topicTextOn]}>{t}</Text>
                  </Pressable>
                ))}
              </View>
              <TextField
                label="Message (optional)"
                value={message}
                onChangeText={setMessage}
                multiline
                maxLength={1000}
                placeholder="e.g. Looking for a match for my daughter, 26, in Bihar"
              />
              <Button title="Request a call back" icon="call-outline" loading={busy} onPress={submit} />
            </>
          )}
        </Animated.View>

        <Text style={styles.section}>Frequently asked questions</Text>
        <View style={styles.card}>
          {FAQS.map((f, i) => (
            <Pressable
              key={f.q}
              onPress={() => setOpen(open === i ? null : i)}
              style={[styles.faq, i === FAQS.length - 1 && { borderBottomWidth: 0 }]}
              accessibilityRole="button"
              accessibilityState={{ expanded: open === i }}>
              <View style={styles.faqHead}>
                <Text style={styles.faqQ}>{f.q}</Text>
                <Ionicons name={open === i ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textMuted} />
              </View>
              {open === i ? (
                <Animated.Text entering={motion.fade()} style={styles.faqA}>
                  {f.a}
                </Animated.Text>
              ) : null}
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </KeyboardScreen>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  body: { padding: 16 },
  contact: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: 20, alignItems: 'center', ...shadow.card },
  contactIcon: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  contactTitle: { fontSize: 18, fontWeight: '800', color: colors.text, marginTop: 12, textAlign: 'center' },
  contactText: { fontSize: 13, lineHeight: 19, color: colors.textMuted, textAlign: 'center', marginTop: 4 },
  phone: { fontSize: 20, fontWeight: '800', color: colors.primary, marginTop: 12, letterSpacing: 0.5 },
  row: { flexDirection: 'row', gap: 10, marginTop: 14, alignSelf: 'stretch' },
  section: { fontSize: 13, fontWeight: '800', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.6, marginTop: 24, marginBottom: 10, marginLeft: 4 },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: 16, borderWidth: 1, borderColor: colors.border },
  label: { fontSize: 13, fontWeight: '700', color: colors.text, marginBottom: 8, letterSpacing: 0.2 },
  topics: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  topic: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.pill, borderWidth: 1.5, borderColor: colors.border },
  topicOn: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  topicText: { fontSize: 13, fontWeight: '600', color: colors.textMuted },
  topicTextOn: { color: colors.primary },
  sent: { alignItems: 'center', paddingVertical: 12, gap: 6 },
  sentTitle: { fontSize: 18, fontWeight: '800', color: colors.text },
  sentText: { fontSize: 14, color: colors.textMuted, textAlign: 'center', marginBottom: 6 },
  faq: { paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  faqHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  faqQ: { flex: 1, fontSize: 15, fontWeight: '700', color: colors.text },
  faqA: { fontSize: 14, lineHeight: 21, color: colors.textMuted, marginTop: 8 },
});
