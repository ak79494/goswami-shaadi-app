import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, View } from 'react-native';

import { Button, IconButton } from '@/components/button';
import { MatchCard } from '@/components/cards';
import { CardSkeleton, EmptyState, ErrorBanner } from '@/components/feedback';
import { SelectField, TextField } from '@/components/fields';
import { TabTitle } from '@/components/screen';
import { Segmented } from '@/components/segmented';
import { BottomSheet } from '@/components/sheet';
import { colors } from '@/constants/theme';
import { useActivity } from '@/lib/activity';
import { api, errorMessage } from '@/lib/api';
import { PROFESSIONS, RELIGIONS } from '@/lib/options';
import { fetchProfile, rememberProfiles } from '@/lib/profiles';
import type { Page, Profile } from '@/lib/types';

type TabKey = 'new' | 'active' | 'shortlist';
type Filters = { city: string; religion: string; profession: string };

const TAB_KEYS: TabKey[] = ['new', 'active', 'shortlist'];
const PAGE_SIZE = 10;

export default function Matches() {
  const params = useLocalSearchParams<{ tab?: string }>();
  const { shortlistIds } = useActivity();
  const [tab, setTab] = useState<TabKey>('new');
  const [filters, setFilters] = useState<Filters>({ city: '', religion: '', profession: '' });
  const [filterOpen, setFilterOpen] = useState(false);
  const [items, setItems] = useState<Profile[] | null>(null);
  const [page, setPage] = useState(0);
  const [last, setLast] = useState(false);
  const [total, setTotal] = useState<number | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestSeq = useRef(0);

  // Allow deep links such as /matches?tab=shortlist from the home screen.
  const [seenParam, setSeenParam] = useState<string | undefined>(undefined);
  if (params.tab !== seenParam) {
    setSeenParam(params.tab);
    if (params.tab && TAB_KEYS.includes(params.tab as TabKey)) setTab(params.tab as TabKey);
  }

  // Show the skeleton again whenever the tab or filters change.
  const queryKey = `${tab}|${filters.city}|${filters.religion}|${filters.profession}`;
  const [shownKey, setShownKey] = useState(queryKey);
  if (shownKey !== queryKey) {
    setShownKey(queryKey);
    setItems(null);
    setLast(false);
  }

  // Read the shortlist through a ref so un-starring a card just hides it instead of reloading the list.
  const shortlistRef = useRef(shortlistIds);
  useEffect(() => {
    shortlistRef.current = shortlistIds;
  }, [shortlistIds]);

  const load = useCallback(
    async (nextPage: number) => {
      // Only the newest request may update the list, so fast tab switches can't mix results.
      const seq = ++requestSeq.current;
      try {
        if (tab === 'shortlist') {
          const ids = [...shortlistRef.current];
          const profiles = await Promise.all(ids.map((id) => fetchProfile(id).catch(() => null)));
          if (seq !== requestSeq.current) return;
          setItems(profiles.filter((p): p is Profile => !!p));
          setLast(true);
          setTotal(ids.length);
        } else {
          const q = new URLSearchParams({ type: tab, page: String(nextPage), size: String(PAGE_SIZE) });
          if (filters.city.trim()) q.set('city', filters.city.trim());
          if (filters.religion) q.set('religion', filters.religion);
          if (filters.profession) q.set('profession', filters.profession);
          const res = await api.get<Page<Profile>>(`/profiles/search?${q.toString()}`);
          if (seq !== requestSeq.current) return;
          rememberProfiles(res.content);
          setItems((prev) => (nextPage === 0 || !prev ? res.content : [...prev, ...res.content]));
          setLast(res.last);
          setTotal(res.totalElements);
        }
        setPage(nextPage);
        setError(null);
      } catch (e) {
        if (seq !== requestSeq.current) return;
        setError(errorMessage(e));
        setItems((prev) => prev ?? []);
      }
    },
    [tab, filters],
  );

  useEffect(() => {
    load(0);
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load(0);
    setRefreshing(false);
  };

  const onEndReached = async () => {
    if (last || loadingMore || !items?.length || tab === 'shortlist') return;
    setLoadingMore(true);
    await load(page + 1);
    setLoadingMore(false);
  };

  const filterCount = [filters.city.trim(), filters.religion, filters.profession].filter(Boolean).length;
  const visible = tab === 'shortlist' && items ? items.filter((p) => shortlistIds.has(p.user.id)) : items;

  const subtitle =
    total === null
      ? 'Finding members for you…'
      : tab === 'shortlist'
        ? `${visible?.length ?? 0} shortlisted`
        : `${total} members found`;

  return (
    <View style={styles.root}>
      <TabTitle
        title="Matches"
        subtitle={subtitle}
        right={
          tab !== 'shortlist' ? (
            <IconButton icon="options-outline" accessibilityLabel="Filter matches" badge={filterCount} onPress={() => setFilterOpen(true)} />
          ) : null
        }
      />
      <View style={styles.tabs}>
        <Segmented
          tabs={[
            { key: 'new', label: 'New' },
            { key: 'active', label: 'Active' },
            { key: 'shortlist', label: 'Shortlisted', badge: shortlistIds.size || undefined },
          ]}
          value={tab}
          onChange={setTab}
        />
      </View>

      {visible === null ? (
        <View style={{ paddingTop: 8 }}>
          <CardSkeleton />
          <CardSkeleton />
        </View>
      ) : (
        <FlatList
          data={visible}
          keyExtractor={(p) => String(p.id)}
          renderItem={({ item, index }) => <MatchCard profile={item} index={index % PAGE_SIZE} />}
          contentContainerStyle={{ paddingTop: 8, paddingBottom: 24, flexGrow: 1 }}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.6}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary} />}
          ListHeaderComponent={error ? <ErrorBanner message={error} onRetry={() => load(0)} /> : undefined}
          ListFooterComponent={loadingMore ? <ActivityIndicator color={colors.primary} style={{ marginVertical: 20 }} /> : undefined}
          ListEmptyComponent={
            tab === 'shortlist' ? (
              <EmptyState
                icon="star-outline"
                title="No shortlisted profiles yet"
                message="Tap the ☆ on any profile to save it here and decide later."
                actionLabel="Browse matches"
                onAction={() => setTab('new')}
              />
            ) : filterCount ? (
              <EmptyState
                icon="search-outline"
                title="No matches for these filters"
                message="Try removing a filter to see more members."
                actionLabel="Clear filters"
                onAction={() => setFilters({ city: '', religion: '', profession: '' })}
              />
            ) : (
              <EmptyState icon="people-outline" title="No members yet" message="New members join every day. Pull down to refresh." />
            )
          }
        />
      )}

      <FilterSheet
        visible={filterOpen}
        initial={filters}
        onClose={() => setFilterOpen(false)}
        onApply={(f) => {
          setFilters(f);
          setFilterOpen(false);
        }}
      />
    </View>
  );
}

function FilterSheet({
  visible,
  initial,
  onApply,
  onClose,
}: {
  visible: boolean;
  initial: Filters;
  onApply: (f: Filters) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState(initial);
  // Each time the sheet opens, start the draft from the filters that are applied right now.
  const [wasVisible, setWasVisible] = useState(visible);
  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible) setDraft(initial);
  }

  return (
    <BottomSheet visible={visible} onClose={onClose} title="Filter matches">
      <TextField
        label="City"
        icon="location-outline"
        value={draft.city}
        onChangeText={(city) => setDraft((d) => ({ ...d, city }))}
        placeholder="Any city"
        autoCapitalize="words"
      />
      <SelectField
        label="Religion"
        value={draft.religion || null}
        options={['', ...RELIGIONS]}
        format={(v) => v || 'Any religion'}
        placeholder="Any religion"
        onChange={(religion) => setDraft((d) => ({ ...d, religion }))}
      />
      <SelectField
        label="Profession"
        value={draft.profession || null}
        options={['', ...PROFESSIONS]}
        format={(v) => v || 'Any profession'}
        placeholder="Any profession"
        onChange={(profession) => setDraft((d) => ({ ...d, profession }))}
      />
      <View style={styles.sheetActions}>
        <Button title="Clear" variant="secondary" onPress={() => onApply({ city: '', religion: '', profession: '' })} style={{ flex: 1 }} />
        <Button title="Show matches" onPress={() => onApply(draft)} style={{ flex: 2 }} />
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  tabs: { paddingHorizontal: 16, paddingBottom: 8 },
  sheetActions: { flexDirection: 'row', gap: 12, marginTop: 8 },
});
