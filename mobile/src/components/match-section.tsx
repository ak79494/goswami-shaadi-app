import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { Avatar } from '@/components/avatar';
import { Button, type IconName } from '@/components/button';
import { Segmented } from '@/components/segmented';
import { motion } from '@/constants/motion';
import { colors, radius, shadow } from '@/constants/theme';
import { fullName } from '@/lib/format';
import type { Compatibility, Gender, PreferenceSide, Profile } from '@/lib/types';

const MATCH_GRADIENT = ['#8B5CF6', '#C04BC9', '#EC4899'] as const;
const ACCENT = '#B4489E';

type Words = { obj: string; subj: string; poss: string };

function pronouns(gender?: Gender): Words {
  if (gender === 'FEMALE') return { obj: 'Her', subj: 'She', poss: 'her' };
  if (gender === 'MALE') return { obj: 'Him', subj: 'He', poss: 'his' };
  return { obj: 'Them', subj: 'They', poss: 'their' };
}

const same = (a?: string | null, b?: string | null) => !!a && !!b && a.trim().toLowerCase() === b.trim().toLowerCase();
const article = (word: string) => (/^[aeiou]/i.test(word) ? 'an' : 'a');

/** Things the two members share, worded like "She too is a vegetarian". */
function commonGround(me: Profile, other: Profile, w: Words): { icon: IconName; text: string }[] {
  const out: { icon: IconName; text: string }[] = [];
  const too = w.subj === 'They' ? 'They too are' : `${w.subj} too is`;
  if (same(me.foodPreference, other.foodPreference)) {
    const diet = other.foodPreference!.toLowerCase();
    out.push({ icon: 'restaurant', text: diet === 'jain' ? 'You both follow a Jain diet' : `${too} ${article(diet)} ${diet}` });
  }
  if (same(me.city, other.city)) out.push({ icon: 'location', text: `${w.subj} too ${w.subj === 'They' ? 'live' : 'lives'} in ${other.city}` });
  else if (same(me.state, other.state)) out.push({ icon: 'location', text: `${w.subj} too ${w.subj === 'They' ? 'live' : 'lives'} in ${other.state}` });
  if (same(me.profession, other.profession)) out.push({ icon: 'briefcase', text: `You both work as ${other.profession}` });
  if (same(me.education, other.education)) out.push({ icon: 'school', text: `You both studied ${other.education}` });
  if (same(me.motherTongue, other.motherTongue)) out.push({ icon: 'chatbubbles', text: `You both speak ${other.motherTongue}` });
  if (same(me.community, other.community)) out.push({ icon: 'people', text: `You both belong to the ${other.community} community` });
  if (same(me.familyValues, other.familyValues)) out.push({ icon: 'home', text: `You both have ${other.familyValues!.toLowerCase()} family values` });
  const hobbies = (other.hobbies ?? []).filter((h) => (me.hobbies ?? []).some((m) => same(m, h)));
  if (hobbies.length) out.push({ icon: 'heart', text: `You both enjoy ${hobbies.slice(0, 3).join(', ')}` });
  return out;
}

function verdict(percentage: number): string {
  if (percentage >= 80) return 'Excellent match';
  if (percentage >= 60) return 'Great match';
  if (percentage >= 40) return 'Good match';
  return 'Some things in common';
}

/** "You & Her": two-way preference match, a match percentage and what the two members have in common. */
export function MatchSection({
  me,
  myPhoto,
  other,
  otherPhoto,
  compatibility,
}: {
  me: Profile;
  myPhoto?: string;
  other: Profile;
  otherPhoto?: string;
  compatibility: Compatibility;
}) {
  const w = pronouns(other.user.gender);
  const [side, setSide] = useState<'theirs' | 'mine'>('theirs');
  const common = commonGround(me, other, w);
  const shown: PreferenceSide = compatibility[side];
  const pct = compatibility.percentage;

  return (
    <Animated.View entering={motion.enter()} style={styles.card}>
      <LinearGradient colors={MATCH_GRADIENT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
        {SPARKLES.map((s, i) => (
          <View key={i} style={[styles.sparkle, s]} />
        ))}
        <Text style={styles.heroTitle}>You & {w.obj}</Text>
        <View style={styles.pair}>
          <Avatar uri={myPhoto} name={fullName(me)} size={96} ring="rgba(255,255,255,0.9)" />
          <View style={styles.link}>
            <Ionicons name="swap-horizontal" size={22} color={ACCENT} />
          </View>
          <Avatar uri={otherPhoto} name={fullName(other)} size={96} ring="rgba(255,255,255,0.9)" />
        </View>
        {pct !== null ? (
          <View style={styles.score}>
            <Ionicons name="heart" size={15} color={colors.white} />
            <Text style={styles.scoreText}>
              {pct}% match · {verdict(pct)}
            </Text>
          </View>
        ) : null}
      </LinearGradient>
      <View style={styles.wave} />

      <View style={styles.body}>
        <Segmented
          tabs={[
            { key: 'theirs', label: `${w.poss[0].toUpperCase()}${w.poss.slice(1)} preferences` },
            { key: 'mine', label: 'Your preferences' },
          ]}
          value={side}
          onChange={setSide}
        />
        <Text style={styles.headline}>
          {side === 'theirs'
            ? `You match ${shown.matched}/${shown.total} of ${w.poss} preferences`
            : `${w.subj} ${w.subj === 'They' ? 'match' : 'matches'} ${shown.matched}/${shown.total} of your preferences`}
        </Text>

        {shown.total === 0 ? (
          side === 'theirs' ? (
            <Text style={styles.empty}>{`${other.firstName} hasn't set partner preferences yet.`}</Text>
          ) : (
            <>
              <Text style={styles.empty}>{`Set your partner preferences to see how well ${other.firstName} fits what you're looking for.`}</Text>
              <Button title="Set preferences" icon="options-outline" variant="secondary" size="sm" onPress={() => router.push('/preferences')} style={styles.emptyButton} />
            </>
          )
        ) : (
          <View key={side}>
            {shown.details.map((d, i) => (
              <Animated.View key={d.label} entering={motion.fade(i * 40)} style={[styles.row, i === shown.details.length - 1 && styles.rowLast]}>
                <View style={styles.rowText}>
                  <Text style={styles.rowLabel}>{d.label}</Text>
                  <Text style={styles.rowValue}>{d.value}</Text>
                </View>
                <View style={[styles.check, d.matched ? styles.checkOn : styles.checkOff]}>
                  <Ionicons name={d.matched ? 'checkmark' : 'remove'} size={18} color={d.matched ? ACCENT : colors.textFaint} />
                </View>
              </Animated.View>
            ))}
          </View>
        )}

        {common.length ? (
          <>
            <Text style={styles.commonTitle}>Common between the both of you</Text>
            {common.map((c) => (
              <View key={c.text} style={styles.commonRow}>
                <LinearGradient colors={MATCH_GRADIENT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.commonIcon}>
                  <Ionicons name={c.icon} size={18} color={colors.white} />
                </LinearGradient>
                <Text style={styles.commonText}>{c.text}</Text>
              </View>
            ))}
          </>
        ) : null}
      </View>
    </Animated.View>
  );
}

const SPARKLES = [
  { top: 18, left: 22, width: 8, height: 8 },
  { top: 64, left: 54, width: 5, height: 5 },
  { top: 30, right: 36, width: 6, height: 6 },
  { top: 120, right: 22, width: 9, height: 9 },
  { top: 150, left: 30, width: 6, height: 6 },
];

const styles = StyleSheet.create({
  card: { marginTop: 18, borderRadius: radius.lg, backgroundColor: colors.surface, overflow: 'hidden', borderWidth: 1, borderColor: colors.border, ...shadow.card },
  hero: { alignItems: 'center', paddingTop: 20, paddingBottom: 44 },
  sparkle: { position: 'absolute', borderRadius: 99, backgroundColor: 'rgba(255,255,255,0.55)' },
  heroTitle: { color: colors.white, fontSize: 24, fontWeight: '800', letterSpacing: 0.3 },
  pair: { flexDirection: 'row', alignItems: 'center', marginTop: 16 },
  link: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: -14,
    zIndex: 1,
    ...shadow.card,
  },
  score: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 16,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  scoreText: { color: colors.white, fontSize: 14, fontWeight: '800' },
  // A wide circle whose top edge curves into the gradient like a wave.
  wave: {
    alignSelf: 'center',
    width: 520,
    height: 520,
    borderRadius: 260,
    marginTop: -30,
    marginBottom: -490,
    backgroundColor: colors.surface,
    transform: [{ scaleX: 1.4 }],
  },
  body: { paddingHorizontal: 16, paddingBottom: 18 },
  headline: { fontSize: 18, fontWeight: '800', color: colors.text, textAlign: 'center', marginTop: 16, marginBottom: 4 },
  empty: { fontSize: 14, lineHeight: 20, color: colors.textMuted, textAlign: 'center', marginTop: 10 },
  emptyButton: { alignSelf: 'center', marginTop: 12 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 13,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderStrong,
  },
  rowLast: { borderBottomWidth: 0 },
  rowText: { flex: 1 },
  rowLabel: { fontSize: 13, color: colors.textMuted },
  rowValue: { fontSize: 15, color: colors.text, marginTop: 3 },
  check: { width: 34, height: 34, borderRadius: 17, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  checkOn: { borderColor: ACCENT, backgroundColor: '#FBEFF8' },
  checkOff: { borderColor: colors.border, backgroundColor: colors.surfaceAlt },
  commonTitle: { fontSize: 18, fontWeight: '800', color: colors.text, marginTop: 20, marginBottom: 6 },
  commonRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 8 },
  commonIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  commonText: { flex: 1, fontSize: 15, color: colors.text, lineHeight: 21 },
});
