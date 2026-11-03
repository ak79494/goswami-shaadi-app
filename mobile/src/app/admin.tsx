import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/button';
import { EmptyState, ErrorBanner } from '@/components/feedback';
import { Header } from '@/components/screen';
import { Segmented } from '@/components/segmented';
import { ActionSheet } from '@/components/sheet';
import { useToast } from '@/components/toast';
import { colors, radius } from '@/constants/theme';
import { api, errorMessage } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { timeAgo } from '@/lib/format';
import { callPhone, formatPhone, openWhatsApp } from '@/lib/links';
import type { AdminOrder, HelpRequest, ReportedMember } from '@/lib/types';

type Tab = 'payments' | 'reviewed' | 'help' | 'reports';

const REJECT_REASONS = [
  'Payment not received in the account',
  'Amount paid does not match the plan',
  'UPI reference (UTR) not found',
];

/** Back office: verify premium payments, follow up on help requests and act on reported members. Admins only. */
export default function Admin() {
  const { isAdmin } = useAuth();
  const toast = useToast();
  const [tab, setTab] = useState<Tab>('payments');
  const [orders, setOrders] = useState<AdminOrder[] | null>(null);
  const [requests, setRequests] = useState<HelpRequest[] | null>(null);
  const [reports, setReports] = useState<ReportedMember[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [rejecting, setRejecting] = useState<AdminOrder | null>(null);

  const load = useCallback(async () => {
    try {
      if (tab === 'help') setRequests(await api.get<HelpRequest[]>('/admin/help-requests'));
      else if (tab === 'reports') setReports(await api.get<ReportedMember[]>('/admin/reports'));
      else setOrders(await api.get<AdminOrder[]>(`/admin/premium/orders?status=${tab === 'payments' ? 'PENDING' : 'REVIEWED'}`));
      setError(null);
    } catch (e) {
      setError(errorMessage(e));
    }
  }, [tab]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- async fetch: state is only set once the request resolves
    load();
  }, [load]);

  if (!isAdmin) {
    return (
      <View style={styles.root}>
        <Header title="Admin panel" />
        <EmptyState icon="lock-closed-outline" title="Admins only" message="This area is for the Goswami Jodi team." actionLabel="Go back" onAction={() => router.back()} />
      </View>
    );
  }

  const review = async (order: AdminOrder, action: 'approve' | 'reject', reason?: string) => {
    setBusyId(order.orderId);
    try {
      await api.post(`/admin/premium/orders/${order.orderId}/${action}`, action === 'reject' ? { reason } : undefined);
      setOrders((list) => list?.filter((o) => o.orderId !== order.orderId) ?? null);
      toast(action === 'approve' ? `Premium activated for ${order.name}` : 'Payment rejected — the member has been told', 'info');
    } catch (e) {
      toast(errorMessage(e), 'error');
    } finally {
      setBusyId(null);
    }
  };

  const confirmApprove = (order: AdminOrder) =>
    Alert.alert('Approve payment?', `Only approve after you see ₹${order.amount} with UTR ${order.transactionId} in the account.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Approve', onPress: () => review(order, 'approve') },
    ]);

  const setHelpStatus = async (r: HelpRequest, status: HelpRequest['status']) => {
    try {
      const updated = await api.patch<HelpRequest>(`/admin/help-requests/${r.id}?status=${status}`);
      setRequests((list) => list?.map((x) => (x.id === r.id ? updated : x)) ?? null);
    } catch (e) {
      toast(errorMessage(e), 'error');
    }
  };

  const actOnReport = async (report: ReportedMember, action: 'dismiss' | 'suspend' | 'restore') => {
    setBusyId(report.id);
    try {
      await api.post(`/admin/reports/${report.id}/${action}`);
      setReports(await api.get<ReportedMember[]>('/admin/reports'));
    } catch (e) {
      toast(errorMessage(e), 'error');
    } finally {
      setBusyId(null);
    }
  };

  const confirmSuspend = (report: ReportedMember) =>
    Alert.alert('Suspend this member?', `${report.reportedName} will be signed out and hidden from everyone until you restore them.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Suspend', style: 'destructive', onPress: () => actOnReport(report, 'suspend') },
    ]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const list = tab === 'help' ? requests : tab === 'reports' ? reports : orders;

  return (
    <View style={styles.root}>
      <Header title="Admin panel" />
      <View style={styles.tabs}>
        <Segmented
          tabs={[
            { key: 'payments', label: 'To verify', badge: tab === 'payments' ? orders?.length : undefined },
            { key: 'reviewed', label: 'Reviewed' },
            { key: 'help', label: 'Help' },
            { key: 'reports', label: 'Reports', badge: reports?.filter((r) => r.status === 'OPEN').length },
          ]}
          value={tab}
          onChange={setTab}
        />
      </View>
      {error ? <ErrorBanner message={error} onRetry={load} /> : null}
      {list === null && !error ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : tab === 'reports' ? (
        <FlatList
          data={reports ?? []}
          keyExtractor={(r) => String(r.id)}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
          ListEmptyComponent={<EmptyState icon="flag-outline" title="No reports" message="Members reported by others show up here." />}
          renderItem={({ item: r }) => (
            <View style={styles.card}>
              <View style={styles.cardHead}>
                <Text style={styles.name}>{r.reportedName}</Text>
                <Text style={[styles.status, r.status === 'OPEN' && styles.statusNew]}>{r.status}</Text>
              </View>
              <Text style={styles.meta}>
                {r.reportedGoswamiId} · {timeAgo(r.createdAt)}
              </Text>
              <Text style={styles.message}>{r.reason}</Text>
              {r.details ? <Text style={styles.meta}>{r.details}</Text> : null}
              <Text style={styles.meta}>
                Reported by {r.reporterName} ({r.reporterGoswamiId})
              </Text>
              {r.status === 'OPEN' ? (
                <>
                  <View style={styles.actions}>
                    <Button title="Dismiss" size="sm" variant="secondary" disabled={busyId === r.id} onPress={() => actOnReport(r, 'dismiss')} style={{ flex: 1 }} />
                    <Button title="Suspend" icon="ban-outline" size="sm" loading={busyId === r.id} onPress={() => confirmSuspend(r)} style={{ flex: 1 }} />
                  </View>
                  <Button title="View profile" size="sm" variant="ghost" onPress={() => router.push(`/profile/${r.reportedUserId}`)} />
                </>
              ) : !r.reportedEnabled ? (
                <Button title="Restore member" size="sm" variant="ghost" loading={busyId === r.id} onPress={() => actOnReport(r, 'restore')} />
              ) : null}
            </View>
          )}
        />
      ) : tab === 'help' ? (
        <FlatList
          data={requests ?? []}
          keyExtractor={(r) => String(r.id)}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
          ListEmptyComponent={<EmptyState icon="help-buoy-outline" title="No help requests" message="New call-back requests show up here." />}
          renderItem={({ item: r }) => (
            <View style={styles.card}>
              <View style={styles.cardHead}>
                <Text style={styles.name}>{r.name}</Text>
                <Text style={[styles.status, r.status === 'NEW' && styles.statusNew]}>{r.status}</Text>
              </View>
              <Text style={styles.meta}>
                {r.topic} · {timeAgo(r.createdAt)}
                {r.goswamiId ? ` · ${r.goswamiId}` : ' · not a member yet'}
              </Text>
              {r.message ? <Text style={styles.message}>{r.message}</Text> : null}
              <Text style={styles.phone}>{formatPhone(r.phone)}</Text>
              <View style={styles.actions}>
                <Button title="Call" icon="call" size="sm" variant="secondary" onPress={() => callPhone(r.phone)} style={{ flex: 1 }} />
                <Button
                  title="WhatsApp"
                  icon="logo-whatsapp"
                  size="sm"
                  variant="success"
                  onPress={() => openWhatsApp(r.phone, `Namaste ${r.name}, this is Goswami Jodi. You asked us for help with: ${r.topic}.`)}
                  style={{ flex: 1 }}
                />
              </View>
              {r.status !== 'CLOSED' ? (
                <Button
                  title={r.status === 'NEW' ? 'Mark as contacted' : 'Close request'}
                  size="sm"
                  variant="ghost"
                  onPress={() => setHelpStatus(r, r.status === 'NEW' ? 'CONTACTED' : 'CLOSED')}
                />
              ) : null}
            </View>
          )}
        />
      ) : (
        <FlatList
          data={orders ?? []}
          keyExtractor={(o) => String(o.orderId)}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
          ListEmptyComponent={
            <EmptyState
              icon="checkmark-done-outline"
              title={tab === 'payments' ? 'All caught up' : 'Nothing reviewed yet'}
              message={tab === 'payments' ? 'New premium payments to verify show up here.' : 'Approved and rejected payments show up here.'}
            />
          }
          renderItem={({ item: o }) => (
            <View style={styles.card}>
              <View style={styles.cardHead}>
                <Text style={styles.name}>{o.name}</Text>
                <Text style={styles.amount}>₹{o.amount}</Text>
              </View>
              <Text style={styles.meta}>
                {o.goswamiId ? `${o.goswamiId} · ` : ''}{o.planName} · {timeAgo(o.paidAt ?? o.createdAt)}
              </Text>
              <View style={styles.utr}>
                <Ionicons name="receipt-outline" size={16} color={colors.textMuted} />
                <Text style={styles.utrText} selectable>
                  {o.paymentMethod?.replace('_', ' ')} · UTR {o.transactionId}
                </Text>
              </View>
              {o.phone ? <Text style={styles.meta}>{formatPhone(o.phone)}</Text> : null}
              {tab === 'payments' ? (
                <View style={styles.actions}>
                  <Button
                    title="Reject"
                    size="sm"
                    variant="secondary"
                    disabled={busyId === o.orderId}
                    onPress={() => setRejecting(o)}
                    style={{ flex: 1 }}
                  />
                  <Button
                    title="Approve"
                    icon="checkmark"
                    size="sm"
                    variant="success"
                    loading={busyId === o.orderId}
                    onPress={() => confirmApprove(o)}
                    style={{ flex: 1 }}
                  />
                </View>
              ) : (
                <Text style={[styles.status, o.status === 'PAID' ? styles.statusPaid : styles.statusNew, { alignSelf: 'flex-start', marginTop: 8 }]}>
                  {o.status === 'PAID' ? 'APPROVED' : 'REJECTED'}
                  {o.adminNote ? ` · ${o.adminNote}` : ''}
                </Text>
              )}
            </View>
          )}
        />
      )}
      <ActionSheet
        visible={!!rejecting}
        title="Why are you rejecting this payment?"
        message="The member will see this reason and can try again."
        actions={REJECT_REASONS.map((reason) => ({
          label: reason,
          onPress: () => {
            const order = rejecting;
            if (order) review(order, 'reject', reason);
          },
        }))}
        onClose={() => setRejecting(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  tabs: { paddingHorizontal: 16, paddingTop: 12 },
  list: { padding: 16, gap: 12, flexGrow: 1 },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: 16, borderWidth: 1, borderColor: colors.border },
  cardHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  name: { flex: 1, fontSize: 16, fontWeight: '800', color: colors.text },
  amount: { fontSize: 18, fontWeight: '900', color: colors.success },
  meta: { fontSize: 13, color: colors.textMuted, marginTop: 4 },
  utr: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10, padding: 10, borderRadius: radius.sm, backgroundColor: colors.surfaceAlt },
  utrText: { flex: 1, fontSize: 13, fontWeight: '700', color: colors.text },
  message: { fontSize: 14, lineHeight: 20, color: colors.text, marginTop: 8 },
  phone: { fontSize: 15, fontWeight: '800', color: colors.primary, marginTop: 8 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 12 },
  status: { fontSize: 11, fontWeight: '800', color: colors.textMuted, backgroundColor: colors.surfaceAlt, paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.pill, overflow: 'hidden' },
  statusNew: { color: colors.primary, backgroundColor: colors.primarySoft },
  statusPaid: { color: colors.success, backgroundColor: colors.successSoft },
});
