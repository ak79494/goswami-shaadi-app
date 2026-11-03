import Ionicons from '@expo/vector-icons/Ionicons';
import { Asset } from 'expo-asset';
import * as Clipboard from 'expo-clipboard';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import * as Sharing from 'expo-sharing';
import { useEffect, useRef, useState, type ComponentRef } from 'react';
import { ActivityIndicator, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, type IconName } from '@/components/button';
import { ErrorBanner } from '@/components/feedback';
import { TextField } from '@/components/fields';
import { Header, KeyboardScreen } from '@/components/screen';
import { useToast } from '@/components/toast';
import { motion } from '@/constants/motion';
import { colors, gradients, radius, shadow } from '@/constants/theme';
import { api, errorMessage } from '@/lib/api';
import { useAppInfo } from '@/lib/app-info';
import { useAuth } from '@/lib/auth';
import { longDate } from '@/lib/format';
import { openWhatsApp } from '@/lib/links';
import type { PaymentInfo, PremiumPlanInfo } from '@/lib/types';

const QR = require('@/assets/images/upi-qr.jpeg');

const METHODS: { key: string; label: string }[] = [
  { key: 'GOOGLE_PAY', label: 'Google Pay' },
  { key: 'PHONEPE', label: 'PhonePe' },
  { key: 'PAYTM', label: 'Paytm' },
  { key: 'UPI', label: 'Other UPI app' },
  { key: 'BANK_TRANSFER', label: 'Bank transfer' },
];

const BENEFITS: { icon: IconName; text: string }[] = [
  { icon: 'call', text: 'See mobile numbers of members' },
  { icon: 'logo-whatsapp', text: 'Message members directly on WhatsApp' },
  { icon: 'diamond', text: 'Premium badge that builds trust with families' },
  { icon: 'chatbubbles', text: 'Chat and voice call in the app' },
];

type Order = { orderId: number; plan: string; planName: string; amount: number };

export default function Premium() {
  const insets = useSafeAreaInsets();
  const { premium, refreshPremium } = useAuth();
  const info = useAppInfo();
  const toast = useToast();
  const scroll = useRef<ComponentRef<typeof ScrollView>>(null);

  const [plans, setPlans] = useState<PremiumPlanInfo[] | null>(null);
  const [payment, setPayment] = useState<PaymentInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState('DIAMOND');
  const [order, setOrder] = useState<Order | null>(null);
  const [method, setMethod] = useState('GOOGLE_PAY');
  const [utr, setUtr] = useState('');
  const [utrError, setUtrError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    try {
      const res = await api.get<{ plans: PremiumPlanInfo[]; payment: PaymentInfo }>('/premium/plans');
      setPlans(res.plans);
      setPayment(res.payment);
      setError(null);
    } catch (e) {
      setError(errorMessage(e));
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- async fetch: state is only set once the request resolves
    load();
    refreshPremium();
  }, [refreshPremium]);

  const pending = premium?.latestOrder?.status === 'PENDING' ? premium.latestOrder : null;
  const rejected = premium?.latestOrder?.status === 'REJECTED' ? premium.latestOrder : null;
  const plan = plans?.find((p) => p.plan === selected);

  const startCheckout = async () => {
    if (!plan) return;
    setBusy(true);
    try {
      const created = await api.post<Order>('/premium/orders', { plan: plan.plan });
      setOrder(created);
      setUtr('');
      setUtrError(null);
      scroll.current?.scrollTo({ y: 0, animated: false });
    } catch (e) {
      toast(errorMessage(e), 'error');
    } finally {
      setBusy(false);
    }
  };

  const upiLink = (o: Order) =>
    `upi://pay?pa=${encodeURIComponent(payment?.upiId ?? '')}&pn=${encodeURIComponent(payment?.payeeName ?? 'Goswami Shaadi')}` +
    `&am=${o.amount}&cu=INR&tn=${encodeURIComponent(`GoswamiShaadi ${o.planName} #${o.orderId}`)}`;

  const payWithApp = async (o: Order) => {
    try {
      await Linking.openURL(upiLink(o));
    } catch {
      toast('No UPI app found. Copy the UPI ID or save the QR code and pay from your UPI app.', 'error');
    }
  };

  const copy = async (text: string, what: string) => {
    await Clipboard.setStringAsync(text);
    toast(`${what} copied`, 'info');
  };

  const saveQr = async () => {
    try {
      const [asset] = await Asset.loadAsync(QR);
      if (!asset.localUri || !(await Sharing.isAvailableAsync())) throw new Error();
      await Sharing.shareAsync(asset.localUri, { mimeType: 'image/jpeg', dialogTitle: 'Save the payment QR code' });
    } catch {
      toast('Could not open the share sheet. Take a screenshot of the QR code instead.', 'error');
    }
  };

  const submit = async () => {
    if (!order) return;
    const clean = utr.replace(/\s+/g, '');
    if (!/^[A-Za-z0-9]{6,40}$/.test(clean)) {
      setUtrError('Enter the UPI reference / UTR number shown in your payment app (usually 12 digits)');
      return;
    }
    setBusy(true);
    try {
      await api.post(`/premium/orders/${order.orderId}/submit-payment`, { paymentMethod: method, transactionId: clean });
      await refreshPremium();
      setOrder(null);
      toast('Payment submitted — we will activate Premium as soon as it is verified');
      scroll.current?.scrollTo({ y: 0, animated: true });
    } catch (e) {
      setUtrError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardScreen style={styles.root}>
      <Header title={order ? `Pay ₹${order.amount}` : 'Premium membership'} subtitle={order ? `${order.planName} plan` : undefined} />
      <ScrollView ref={scroll} contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + 32 }]} keyboardShouldPersistTaps="handled">
        {error ? <ErrorBanner message={error} onRetry={load} /> : null}

        {order ? (
          <Animated.View entering={motion.fade()}>
            <Step n={1} title="Pay with any UPI app" />
            <Button title={`Pay ₹${order.amount} with UPI app`} icon="flash" size="lg" onPress={() => payWithApp(order)} />
            <Text style={styles.hint}>Opens Google Pay, PhonePe, Paytm or your bank app with the amount filled in.</Text>

            <View style={styles.qrCard}>
              <Text style={styles.qrTitle}>Or scan / upload this QR code</Text>
              <Image source={QR} style={styles.qr} contentFit="contain" />
              <View style={styles.qrActions}>
                {Platform.OS !== 'web' ? <Button title="Save QR" icon="download-outline" variant="secondary" size="sm" onPress={saveQr} style={{ flex: 1 }} /> : null}
                {payment?.upiId ? (
                  <Button title="Copy UPI ID" icon="copy-outline" variant="secondary" size="sm" onPress={() => copy(payment.upiId, 'UPI ID')} style={{ flex: 1 }} />
                ) : null}
              </View>
              {payment?.upiId ? <Text style={styles.upiId}>UPI ID: {payment.upiId}</Text> : null}
              <Text style={styles.amountNote}>Amount to pay: ₹{order.amount}</Text>
            </View>

            {payment?.accountNumber ? (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Bank transfer</Text>
                <CopyRow label="Account name" value={payment.accountName} onCopy={copy} />
                <CopyRow label="Account number" value={payment.accountNumber} onCopy={copy} />
                <CopyRow label="IFSC" value={payment.ifsc} onCopy={copy} />
                <CopyRow label="Bank" value={payment.bankName} onCopy={copy} />
              </View>
            ) : null}

            <Step n={2} title="Enter your payment reference" />
            <Text style={styles.label}>Paid with</Text>
            <View style={styles.methods}>
              {METHODS.map((m) => (
                <Pressable key={m.key} onPress={() => setMethod(m.key)} style={[styles.method, method === m.key && styles.methodOn]}>
                  <Text style={[styles.methodText, method === m.key && styles.methodTextOn]}>{m.label}</Text>
                </Pressable>
              ))}
            </View>
            <TextField
              label="UPI reference / UTR number"
              value={utr}
              onChangeText={(v) => {
                setUtr(v);
                if (utrError) setUtrError(null);
              }}
              placeholder="e.g. 431245678901"
              icon="receipt-outline"
              keyboardType="default"
              autoCapitalize="characters"
              hint="Find it in your payment app under the transaction details."
              error={utrError}
            />
            <Button title="Submit for verification" icon="checkmark-circle" size="lg" loading={busy} onPress={submit} />
            <Button title="Choose a different plan" variant="ghost" onPress={() => setOrder(null)} style={{ marginTop: 6 }} />
          </Animated.View>
        ) : (
          <>
            <LinearGradient colors={gradients.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
              <Ionicons name="diamond" size={30} color={colors.gold} />
              <Text style={styles.heroTitle}>{premium?.active ? `You are a ${premium.planName} member` : 'Go Premium'}</Text>
              <Text style={styles.heroText}>
                {premium?.active
                  ? `Active till ${longDate(premium.validUntil)}. Renew any time — the new plan starts when this one ends.`
                  : 'Connect faster with the families you like.'}
              </Text>
              <View style={styles.benefits}>
                {BENEFITS.map((b) => (
                  <View key={b.text} style={styles.benefit}>
                    <Ionicons name={b.icon} size={16} color={colors.white} />
                    <Text style={styles.benefitText}>{b.text}</Text>
                  </View>
                ))}
              </View>
            </LinearGradient>

            {pending ? (
              <Animated.View entering={motion.enter()} style={[styles.banner, { backgroundColor: colors.warningSoft }]}>
                <Ionicons name="time-outline" size={22} color={colors.warning} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.bannerTitle}>Payment being verified</Text>
                  <Text style={styles.bannerText}>
                    ₹{pending.amount} for {pending.planName} · UTR {pending.transactionId}. We will activate Premium and notify you as soon as
                    it is confirmed, usually within a few hours.
                  </Text>
                  <Text
                    style={styles.bannerLink}
                    onPress={() =>
                      openWhatsApp(info.supportWhatsapp, `Hi, I paid ₹${pending.amount} for Goswami Shaadi ${pending.planName}. UTR: ${pending.transactionId}`)
                    }>
                    Ask about it on WhatsApp
                  </Text>
                </View>
              </Animated.View>
            ) : null}
            {rejected ? (
              <Animated.View entering={motion.enter()} style={[styles.banner, { backgroundColor: colors.primarySoft }]}>
                <Ionicons name="alert-circle-outline" size={22} color={colors.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.bannerTitle}>Last payment could not be verified</Text>
                  <Text style={styles.bannerText}>{rejected.adminNote}</Text>
                </View>
              </Animated.View>
            ) : null}

            <Text style={styles.section}>Choose a plan</Text>
            {plans === null && !error ? <ActivityIndicator color={colors.primary} style={{ marginVertical: 24 }} /> : null}
            {plans?.map((p, i) => (
              <Animated.View key={p.plan} entering={motion.enter(i * 60)}>
                <Pressable
                  onPress={() => setSelected(p.plan)}
                  style={[styles.plan, selected === p.plan && styles.planOn]}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: selected === p.plan }}>
                  <View style={[styles.radio, selected === p.plan && styles.radioOn]}>
                    {selected === p.plan ? <View style={styles.radioDot} /> : null}
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.planHead}>
                      <Text style={styles.planName}>{p.planName}</Text>
                      {p.plan === 'DIAMOND' ? <Text style={styles.tag}>MOST POPULAR</Text> : null}
                      {p.plan === 'PLATINUM_PLUS' ? <Text style={[styles.tag, styles.tagGold]}>BEST VALUE</Text> : null}
                    </View>
                    <Text style={styles.planMeta}>
                      {p.months} months · ₹{Math.round(p.amount / p.months)}/month
                    </Text>
                  </View>
                  <Text style={styles.planPrice}>₹{p.amount}</Text>
                </Pressable>
              </Animated.View>
            ))}
            {plan ? (
              <Button
                title={`Continue · Pay ₹${plan.amount}`}
                icon="lock-closed"
                size="lg"
                loading={busy}
                disabled={!!pending}
                onPress={startCheckout}
                style={{ marginTop: 8 }}
              />
            ) : null}
            <Text style={styles.footnote}>
              Payments go directly to {payment?.payeeName ?? 'Goswami Shaadi'} by UPI. Premium starts once our team confirms your payment.
            </Text>
          </>
        )}
      </ScrollView>
    </KeyboardScreen>
  );
}

function Step({ n, title }: { n: number; title: string }) {
  return (
    <View style={styles.step}>
      <View style={styles.stepNum}>
        <Text style={styles.stepNumText}>{n}</Text>
      </View>
      <Text style={styles.stepTitle}>{title}</Text>
    </View>
  );
}

function CopyRow({ label, value, onCopy }: { label: string; value?: string | null; onCopy: (v: string, what: string) => void }) {
  if (!value) return null;
  return (
    <View style={styles.copyRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.copyLabel}>{label}</Text>
        <Text style={styles.copyValue}>{value}</Text>
      </View>
      <Pressable onPress={() => onCopy(value, label)} hitSlop={10} accessibilityLabel={`Copy ${label}`}>
        <Ionicons name="copy-outline" size={20} color={colors.primary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  body: { padding: 16 },
  hero: { borderRadius: radius.lg, padding: 20, gap: 6 },
  heroTitle: { color: colors.white, fontSize: 22, fontWeight: '800', marginTop: 4 },
  heroText: { color: 'rgba(255,255,255,0.9)', fontSize: 14, lineHeight: 20 },
  benefits: { marginTop: 10, gap: 8 },
  benefit: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  benefitText: { color: colors.white, fontSize: 14, fontWeight: '600', flex: 1 },
  banner: { flexDirection: 'row', gap: 12, padding: 14, borderRadius: radius.md, marginTop: 14 },
  bannerTitle: { fontSize: 15, fontWeight: '800', color: colors.text },
  bannerText: { fontSize: 13, lineHeight: 19, color: colors.textMuted, marginTop: 3 },
  bannerLink: { fontSize: 13, fontWeight: '700', color: colors.primary, marginTop: 8 },
  section: { fontSize: 13, fontWeight: '800', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.6, marginTop: 22, marginBottom: 10 },
  plan: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    marginBottom: 10,
  },
  planOn: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: colors.borderStrong, alignItems: 'center', justifyContent: 'center' },
  radioOn: { borderColor: colors.primary },
  radioDot: { width: 11, height: 11, borderRadius: 6, backgroundColor: colors.primary },
  planHead: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  planName: { fontSize: 17, fontWeight: '800', color: colors.text },
  tag: { fontSize: 9, fontWeight: '900', color: colors.white, backgroundColor: colors.primary, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, overflow: 'hidden' },
  tagGold: { backgroundColor: colors.gold },
  planMeta: { fontSize: 13, color: colors.textMuted, marginTop: 3 },
  planPrice: { fontSize: 20, fontWeight: '900', color: colors.text },
  footnote: { fontSize: 12, lineHeight: 18, color: colors.textFaint, textAlign: 'center', marginTop: 14 },
  step: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8, marginBottom: 12 },
  stepNum: { width: 26, height: 26, borderRadius: 13, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  stepNumText: { color: colors.white, fontWeight: '800', fontSize: 13 },
  stepTitle: { fontSize: 17, fontWeight: '800', color: colors.text },
  hint: { fontSize: 12, color: colors.textMuted, textAlign: 'center', marginTop: 8 },
  qrCard: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: 16, marginTop: 16, marginBottom: 20, alignItems: 'center', ...shadow.card },
  qrTitle: { fontSize: 14, fontWeight: '700', color: colors.text, marginBottom: 10 },
  qr: { width: 240, height: 333 },
  qrActions: { flexDirection: 'row', gap: 10, alignSelf: 'stretch', marginTop: 12 },
  upiId: { fontSize: 13, fontWeight: '700', color: colors.text, marginTop: 10 },
  amountNote: { fontSize: 13, color: colors.textMuted, marginTop: 4 },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: colors.border },
  cardTitle: { fontSize: 15, fontWeight: '800', color: colors.text, marginBottom: 6 },
  copyRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  copyLabel: { fontSize: 12, color: colors.textMuted },
  copyValue: { fontSize: 15, fontWeight: '700', color: colors.text, marginTop: 2 },
  label: { fontSize: 13, fontWeight: '700', color: colors.text, marginBottom: 8 },
  methods: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  method: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: radius.pill, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.surface },
  methodOn: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  methodText: { fontSize: 13, fontWeight: '600', color: colors.textMuted },
  methodTextOn: { color: colors.primary },
});
