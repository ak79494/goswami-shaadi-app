import Ionicons from '@expo/vector-icons/Ionicons';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import {
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
  type KeyboardTypeOptions,
  type TextInputProps,
} from 'react-native';
import Animated from 'react-native-reanimated';

import { motion } from '@/constants/motion';
import { colors, radius } from '@/constants/theme';
import { toIsoDate } from '@/lib/format';
import type { IconName } from './button';
import { BottomSheet } from './sheet';

type TextFieldProps = {
  label?: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  icon?: IconName;
  secure?: boolean;
  error?: string | null;
  hint?: string;
  prefix?: string;
  multiline?: boolean;
  maxLength?: number;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: TextInputProps['autoCapitalize'];
  autoComplete?: TextInputProps['autoComplete'];
  returnKeyType?: TextInputProps['returnKeyType'];
  onSubmitEditing?: () => void;
};

export function TextField({
  label,
  value,
  onChangeText,
  placeholder,
  icon,
  secure,
  error,
  hint,
  prefix,
  multiline,
  maxLength,
  keyboardType,
  autoCapitalize = 'sentences',
  autoComplete,
  returnKeyType,
  onSubmitEditing,
}: TextFieldProps) {
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(true);
  return (
    <View style={styles.field}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View
        style={[
          styles.box,
          multiline && styles.boxMultiline,
          focused && styles.boxFocused,
          !!error && styles.boxError,
        ]}>
        {icon ? <Ionicons name={icon} size={19} color={focused ? colors.primary : colors.textFaint} /> : null}
        {prefix ? <Text style={styles.prefix}>{prefix}</Text> : null}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textFaint}
          secureTextEntry={secure && hidden}
          multiline={multiline}
          maxLength={maxLength}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoComplete={autoComplete}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={[styles.input, multiline && styles.inputMultiline]}
          textAlignVertical={multiline ? 'top' : 'center'}
        />
        {secure ? (
          <Pressable onPress={() => setHidden((h) => !h)} hitSlop={10} accessibilityLabel={hidden ? 'Show password' : 'Hide password'}>
            <Ionicons name={hidden ? 'eye-outline' : 'eye-off-outline'} size={20} color={colors.textMuted} />
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <Animated.Text entering={motion.fade()} style={styles.error}>
          {error}
        </Animated.Text>
      ) : hint ? (
        <Text style={styles.hint}>{hint}</Text>
      ) : null}
      {multiline && maxLength ? (
        <Text style={styles.counter}>
          {value.length}/{maxLength}
        </Text>
      ) : null}
    </View>
  );
}

type SelectFieldProps = {
  label: string;
  value?: string | null;
  options: string[];
  onChange: (v: string) => void;
  placeholder?: string;
  format?: (v: string) => string;
  icon?: IconName;
  error?: string | null;
};

/** A field that opens a bottom sheet with a searchable list of options. */
export function SelectField({ label, value, options, onChange, placeholder = 'Select', format, icon, error }: SelectFieldProps) {
  const [open, setOpen] = useState(false);
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        onPress={() => setOpen(true)}
        style={[styles.box, !!error && styles.boxError]}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${value || placeholder}`}>
        {icon ? <Ionicons name={icon} size={19} color={colors.textFaint} /> : null}
        <Text style={[styles.input, styles.selectText, !value && { color: colors.textFaint }]} numberOfLines={1}>
          {value ? (format ? format(value) : value) : placeholder}
        </Text>
        <Ionicons name="chevron-down" size={18} color={colors.textMuted} />
      </Pressable>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <PickerSheet
        visible={open}
        title={label}
        options={options}
        value={value}
        format={format}
        onClose={() => setOpen(false)}
        onSelect={(v) => {
          onChange(v);
          setOpen(false);
        }}
      />
    </View>
  );
}

export function PickerSheet({
  visible,
  title,
  options,
  value,
  format,
  onSelect,
  onClose,
}: {
  visible: boolean;
  title: string;
  options: string[];
  value?: string | null;
  format?: (v: string) => string;
  onSelect: (v: string) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState('');
  const searchable = options.length > 12;
  const filtered = query
    ? options.filter((o) => (format ? format(o) : o).toLowerCase().includes(query.toLowerCase()))
    : options;

  const close = () => {
    setQuery('');
    onClose();
  };

  return (
    <BottomSheet visible={visible} onClose={close} title={title}>
      {searchable ? (
        <View style={[styles.box, styles.search]}>
          <Ionicons name="search" size={18} color={colors.textFaint} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search"
            placeholderTextColor={colors.textFaint}
            style={styles.input}
          />
        </View>
      ) : null}
      <FlatList
        data={filtered}
        keyExtractor={(o) => o}
        keyboardShouldPersistTaps="handled"
        style={styles.sheetList}
        renderItem={({ item }) => {
          const selected = item === value;
          return (
            <Pressable
              onPress={() => {
                Haptics.selectionAsync();
                setQuery('');
                onSelect(item);
              }}
              style={({ pressed }) => [styles.option, pressed && { backgroundColor: colors.primarySoft }]}>
              <Text style={[styles.optionText, selected && styles.optionSelected]}>{format ? format(item) : item}</Text>
              {selected ? <Ionicons name="checkmark-circle" size={22} color={colors.primary} /> : null}
            </Pressable>
          );
        }}
      />
    </BottomSheet>
  );
}

type DateFieldProps = {
  label: string;
  value?: string | null;
  onChange: (v: string) => void;
  mode?: 'date' | 'time';
  maximumDate?: Date;
  minimumDate?: Date;
  placeholder?: string;
  error?: string | null;
};

/** Native date/time picker. Dates are stored as yyyy-MM-dd and times as HH:mm, like the backend expects. */
export function DateField({ label, value, onChange, mode = 'date', maximumDate, minimumDate, placeholder, error }: DateFieldProps) {
  const [iosOpen, setIosOpen] = useState(false);
  const current = parseValue(value, mode) ?? (mode === 'date' ? maximumDate ?? new Date(1998, 0, 1) : new Date(2000, 0, 1, 6, 0));

  const commit = (d?: Date) => {
    if (!d) return;
    if (mode === 'date') onChange(toIsoDate(d));
    else onChange(`${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`);
  };

  const open = () => {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: current,
        mode,
        maximumDate,
        minimumDate,
        is24Hour: false,
        onChange: (e, d) => e.type === 'set' && commit(d),
      });
    } else {
      setIosOpen(true);
    }
  };

  const shown = value ? formatValue(value, mode) : placeholder ?? (mode === 'date' ? 'Select date' : 'Select time');

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <Pressable onPress={open} style={[styles.box, !!error && styles.boxError]} accessibilityRole="button">
        <Ionicons name={mode === 'date' ? 'calendar-outline' : 'time-outline'} size={19} color={colors.textFaint} />
        <Text style={[styles.input, styles.selectText, !value && { color: colors.textFaint }]}>{shown}</Text>
      </Pressable>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {Platform.OS === 'ios' && iosOpen ? (
        <View style={styles.iosPicker}>
          <DateTimePicker
            value={current}
            mode={mode}
            display="spinner"
            maximumDate={maximumDate}
            minimumDate={minimumDate}
            onChange={(_, d) => commit(d)}
          />
          <Pressable onPress={() => setIosOpen(false)} style={styles.iosDone}>
            <Text style={styles.iosDoneText}>Done</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

function parseValue(v: string | null | undefined, mode: 'date' | 'time'): Date | null {
  if (!v) return null;
  if (mode === 'date') {
    const [y, m, d] = v.split('-').map(Number);
    return y && m && d ? new Date(y, m - 1, d) : null;
  }
  const [h, min] = v.split(':').map(Number);
  return Number.isFinite(h) ? new Date(2000, 0, 1, h, min || 0) : null;
}

function formatValue(v: string, mode: 'date' | 'time') {
  const d = parseValue(v, mode);
  if (!d) return v;
  return mode === 'date'
    ? d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
    : d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });
}

/** Wrapping chips for single or multiple choice. */
export function ChipSelect({
  label,
  options,
  value,
  onChange,
  multiple,
}: {
  label?: string;
  options: string[];
  value: string[];
  onChange: (v: string[]) => void;
  multiple?: boolean;
}) {
  return (
    <View style={styles.field}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={styles.chips}>
        {options.map((o) => {
          const on = value.includes(o);
          return (
            <Animated.View key={o} layout={motion.layout}>
              <Pressable
                onPress={() => {
                  Haptics.selectionAsync();
                  if (multiple) onChange(on ? value.filter((x) => x !== o) : [...value, o]);
                  else onChange(on ? [] : [o]);
                }}
                style={[styles.chip, on && styles.chipOn]}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: on }}>
                {on ? <Ionicons name="checkmark" size={15} color={colors.primary} /> : null}
                <Text style={[styles.chipText, on && styles.chipTextOn]}>{o}</Text>
              </Pressable>
            </Animated.View>
          );
        })}
      </View>
    </View>
  );
}

export function SwitchRow({
  icon,
  title,
  subtitle,
  value,
  onChange,
}: {
  icon: IconName;
  title: string;
  subtitle?: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <View style={styles.switchRow}>
      <View style={styles.switchIcon}>
        <Ionicons name={icon} size={19} color={colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.switchTitle}>{title}</Text>
        {subtitle ? <Text style={styles.switchSub}>{subtitle}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={(v) => {
          Haptics.selectionAsync();
          onChange(v);
        }}
        trackColor={{ true: colors.primary, false: colors.borderStrong }}
        thumbColor={colors.white}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  field: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '700', color: colors.text, marginBottom: 8, letterSpacing: 0.2 },
  box: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  boxMultiline: { alignItems: 'flex-start', paddingVertical: 12 },
  boxFocused: { borderColor: colors.primary, backgroundColor: '#FFFDFD' },
  boxError: { borderColor: colors.primaryBright },
  prefix: { fontSize: 15, fontWeight: '600', color: colors.text, paddingRight: 8, borderRightWidth: 1, borderRightColor: colors.border },
  input: { flex: 1, fontSize: 15, color: colors.text, paddingVertical: 12 },
  inputMultiline: { minHeight: 110, paddingVertical: 0 },
  selectText: { paddingVertical: 15 },
  error: { color: colors.primaryBright, fontSize: 12, marginTop: 6, fontWeight: '600' },
  hint: { color: colors.textMuted, fontSize: 12, marginTop: 6 },
  counter: { alignSelf: 'flex-end', color: colors.textFaint, fontSize: 11, marginTop: 4 },
  search: { marginBottom: 8, minHeight: 46 },
  sheetList: { flexGrow: 0 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    paddingHorizontal: 6,
    borderRadius: radius.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  optionText: { fontSize: 16, color: colors.text },
  optionSelected: { color: colors.primary, fontWeight: '700' },
  iosPicker: { backgroundColor: colors.surface, borderRadius: radius.md, marginTop: 8 },
  iosDone: { alignSelf: 'flex-end', padding: 12 },
  iosDoneText: { color: colors.primary, fontWeight: '700', fontSize: 16 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipOn: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  chipText: { fontSize: 13, fontWeight: '600', color: colors.textMuted },
  chipTextOn: { color: colors.primary },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  switchIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  switchTitle: { fontSize: 15, fontWeight: '600', color: colors.text },
  switchSub: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
});
