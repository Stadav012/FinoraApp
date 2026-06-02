import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  StyleSheet, Text, View, ScrollView, TouchableOpacity,
  Animated, Easing, ActivityIndicator, TextInput, Alert,
  Dimensions, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import KeyboardAwareModal from '../../components/KeyboardAwareModal';
import { sharedModalStyles as ms } from '../../components/sharedModalStyles';
import { useTheme } from '../../contexts/ThemeContext';
import {
  getSubscriptions, createSubscription, deleteSubscription,
  getMonthlyTotal, getUpcoming,
  type Subscription,
} from '../../lib/services/subscriptionsService';
import { currencyFormatter, getProfile } from '../../lib/services/dashboardService';

const { width } = Dimensions.get('window');

const CYCLES = [
  { id: 'weekly' as const, label: 'Weekly' },
  { id: 'monthly' as const, label: 'Monthly' },
  { id: 'quarterly' as const, label: 'Quarterly' },
  { id: 'yearly' as const, label: 'Yearly' },
];

const REMIND_OPTIONS = [
  { days: 0, label: 'Same day' },
  { days: 1, label: '1 day before' },
  { days: 3, label: '3 days before' },
  { days: 7, label: '1 week before' },
];

const SUB_ICONS = [
  { id: 'play-circle', label: 'Streaming' },
  { id: 'musical-notes', label: 'Music' },
  { id: 'cloud', label: 'Cloud' },
  { id: 'fitness', label: 'Fitness' },
  { id: 'newspaper', label: 'News' },
  { id: 'game-controller', label: 'Gaming' },
  { id: 'code-slash', label: 'Dev Tools' },
  { id: 'shield-checkmark', label: 'Security' },
  { id: 'card', label: 'Other' },
];

const SUB_COLORS = ['#e50914', '#1db954', '#1cb0f6', '#ff9f43', '#a570ff', '#636e72'];

function cycleLabelShort(cycle: string) {
  switch (cycle) {
    case 'weekly': return '/wk';
    case 'monthly': return '/mo';
    case 'quarterly': return '/qtr';
    case 'yearly': return '/yr';
    default: return '';
  }
}

function daysUntil(dateStr: string): number {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86_400_000);
}

// ── Subscription Card ──
function SubCard({
  sub, index, fmt, onDelete,
}: {
  sub: Subscription; index: number; fmt: (n: number) => string; onDelete: (id: string) => void;
}) {
  const slideAnim = useRef(new Animated.Value(0)).current;
  const days = daysUntil(sub.next_billing_date);
  const isUrgent = days <= 3 && days >= 0;
  const isPast = days < 0;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(index * 100),
      Animated.spring(slideAnim, { toValue: 1, friction: 8, tension: 50, useNativeDriver: true }),
    ]).start();
  }, []);

  let dueLine = '';
  if (isPast) dueLine = 'Past due';
  else if (days === 0) dueLine = 'Due today';
  else if (days === 1) dueLine = 'Due tomorrow';
  else dueLine = `Due in ${days} days`;

  return (
    <Animated.View style={[scStyles.card, {
      opacity: slideAnim,
      transform: [{ translateY: slideAnim.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) }],
    }]}>
      <View style={[scStyles.iconWrap, { backgroundColor: sub.color + '18' }]}>
        <Ionicons name={sub.icon as any} size={22} color={sub.color} />
      </View>
      <View style={scStyles.cardInfo}>
        <Text style={scStyles.cardName} numberOfLines={1}>{sub.name}</Text>
        <Text style={[scStyles.cardDue, isUrgent && { color: '#ff6b6b' }, isPast && { color: '#ff6b6b' }]}>
          {dueLine} · {sub.billing_cycle}
        </Text>
      </View>
      <View style={scStyles.cardRight}>
        <Text style={scStyles.cardAmount}>{fmt(Number(sub.amount))}</Text>
        <Text style={scStyles.cardCycle}>{cycleLabelShort(sub.billing_cycle)}</Text>
      </View>
      <TouchableOpacity
        style={scStyles.deleteBtn}
        onPress={() => Alert.alert('Remove', `Cancel "${sub.name}"?`, [
          { text: 'Keep', style: 'cancel' },
          { text: 'Remove', style: 'destructive', onPress: () => onDelete(sub.id) },
        ])}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      >
        <Ionicons name="close" size={16} color={Colors.textTertiary} />
      </TouchableOpacity>
    </Animated.View>
  );
}

// ══════════════════════════════════════════════
// MAIN SUBSCRIPTIONS SCREEN
// ══════════════════════════════════════════════

export default function SubscriptionsScreen() {
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currency, setCurrency] = useState('USD');
  const [showCreate, setShowCreate] = useState(false);

  // Form
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [cycle, setCycle] = useState<'weekly' | 'monthly' | 'quarterly' | 'yearly'>('monthly');
  const [remind, setRemind] = useState(3);
  const [icon, setIcon] = useState('card');
  const [color, setColor] = useState(SUB_COLORS[2]);

  // Hero anims
  const heroOpacity = useRef(new Animated.Value(0)).current;
  const heroScale = useRef(new Animated.Value(0.9)).current;

  const fmt = currencyFormatter(currency);

  const loadData = useCallback(async () => {
    try {
      const [s, p] = await Promise.all([getSubscriptions(), getProfile()]);
      setSubs(s);
      setCurrency(p.currency);
    } catch (e: any) {
      console.error('Subs load:', e.message);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);
  useEffect(() => {
    if (!isLoading) {
      Animated.parallel([
        Animated.spring(heroScale, { toValue: 1, friction: 7, tension: 50, useNativeDriver: true }),
        Animated.timing(heroOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      ]).start();
    }
  }, [isLoading]);

  const onRefresh = useCallback(() => { setRefreshing(true); loadData(); }, [loadData]);

  const handleCreate = async () => {
    const amt = parseFloat(amount);
    if (!name.trim() || !amt || amt <= 0) return;

    // Default next billing to 1 cycle from now
    const now = new Date();
    let nextDate = new Date(now);
    if (cycle === 'weekly') nextDate.setDate(now.getDate() + 7);
    else if (cycle === 'monthly') nextDate.setMonth(now.getMonth() + 1);
    else if (cycle === 'quarterly') nextDate.setMonth(now.getMonth() + 3);
    else nextDate.setFullYear(now.getFullYear() + 1);

    try {
      await createSubscription({
        name: name.trim(),
        amount: amt,
        billing_cycle: cycle,
        next_billing_date: nextDate.toISOString().split('T')[0],
        remind_days_before: remind,
        icon,
        color,
      });
      setShowCreate(false);
      setName(''); setAmount(''); setCycle('monthly'); setRemind(3); setIcon('card'); setColor(SUB_COLORS[2]);
      loadData();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const handleDelete = async (id: string) => {
    try { await deleteSubscription(id); loadData(); }
    catch (e: any) { Alert.alert('Error', e.message); }
  };

  const monthlyTotal = getMonthlyTotal(subs);
  const upcoming = getUpcoming(subs, 7);
  const yearlyEstimate = monthlyTotal * 12;

  const { colors } = useTheme();

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.finoraGreen} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      {/* Create Modal */}
      <KeyboardAwareModal visible={showCreate} onClose={() => setShowCreate(false)}>
        <Text style={[ms.title, { color: colors.text }]}>Add Subscription</Text>
        <Text style={[ms.subtitle, { color: colors.textSecondary }]}>Track a recurring payment</Text>

        <TextInput
          style={[ms.input, { color: colors.text, borderColor: colors.borderSubtle, backgroundColor: colors.surface }]} placeholder="Name (e.g. Netflix)"
          placeholderTextColor={colors.textTertiary} value={name} onChangeText={setName} autoFocus
        />
        <TextInput
          style={[ms.input, { color: colors.text, borderColor: colors.borderSubtle, backgroundColor: colors.surface }]} placeholder="Amount"
          placeholderTextColor={colors.textTertiary} value={amount} onChangeText={setAmount} keyboardType="decimal-pad"
        />

        <Text style={[ms.sectionLabel, { color: colors.textSecondary }]}>Billing Cycle</Text>
        <View style={ms.chipRow}>
          {CYCLES.map(c => (
            <TouchableOpacity
              key={c.id}
              style={[ms.chip, cycle === c.id && ms.chipSelected]}
              onPress={() => setCycle(c.id)}
            >
              <Text style={[ms.chipText, cycle === c.id && ms.chipTextSelected]}>{c.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[ms.sectionLabel, { color: colors.textSecondary }]}>Remind Me</Text>
        <View style={ms.chipRow}>
          {REMIND_OPTIONS.map(r => (
            <TouchableOpacity
              key={r.days}
              style={[ms.chip, remind === r.days && { ...ms.chipSelected, borderColor: colors.finoraSkyBlue, backgroundColor: colors.finoraSkyBlue + '12' }]}
              onPress={() => setRemind(r.days)}
            >
              <Text style={[ms.chipText, remind === r.days && { color: colors.finoraSkyBlue }]}>{r.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[ms.sectionLabel, { color: colors.textSecondary }]}>Icon</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={ms.iconRow}>
          {SUB_ICONS.map(ic => (
            <TouchableOpacity
              key={ic.id}
              style={[ms.iconBtn, icon === ic.id && { ...ms.iconBtnSelected, backgroundColor: color + '15', borderColor: color }]}
              onPress={() => setIcon(ic.id)}
            >
              <Ionicons name={ic.id as any} size={20} color={icon === ic.id ? color : colors.textSecondary} />
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={[ms.sectionLabel, { color: colors.textSecondary }]}>Color</Text>
        <View style={ms.colorRow}>
          {SUB_COLORS.map(c => (
            <TouchableOpacity
              key={c}
              style={[ms.colorDot, { backgroundColor: c }, color === c && ms.colorDotSelected]}
              onPress={() => setColor(c)}
            />
          ))}
        </View>

        <View style={ms.actions}>
          <TouchableOpacity style={ms.cancelBtn} onPress={() => setShowCreate(false)}>
            <Text style={ms.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[ms.saveBtn, { backgroundColor: color, shadowColor: color }, (!name.trim() || !amount) && ms.saveBtnDisabled]}
            onPress={handleCreate} disabled={!name.trim() || !amount}
          >
            <Text style={ms.saveText}>Add Subscription</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAwareModal>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.finoraGreen} />}
      >
        <Text style={[styles.pageTitle, { color: colors.text }]}>Subscriptions</Text>

        {/* ── Hero Summary Card ── */}
        <Animated.View style={[styles.heroCard, { opacity: heroOpacity, transform: [{ scale: heroScale }] }]}>
          <View style={styles.heroBlob1} />
          <View style={styles.heroBlob2} />
          <View style={styles.heroGlass}>
            <View style={styles.heroTop}>
              <View>
                <Text style={styles.heroLabel}>Monthly spend</Text>
                <Text style={styles.heroAmount}>{fmt(monthlyTotal)}</Text>
              </View>
              <View style={styles.heroDivider} />
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.heroLabel}>Yearly estimate</Text>
                <Text style={styles.heroAmount}>{fmt(yearlyEstimate)}</Text>
              </View>
            </View>
            <View style={styles.heroBottom}>
              <View style={styles.heroStatPill}>
                <Ionicons name="layers" size={14} color="#fff" />
                <Text style={styles.heroStatText}>{subs.length} active</Text>
              </View>
              {upcoming.length > 0 && (
                <View style={[styles.heroStatPill, { backgroundColor: 'rgba(255,107,107,0.25)' }]}>
                  <Ionicons name="alert-circle" size={14} color="#ff6b6b" />
                  <Text style={[styles.heroStatText, { color: '#ff6b6b' }]}>{upcoming.length} due this week</Text>
                </View>
              )}
            </View>
          </View>
        </Animated.View>

        {/* ── Upcoming ── */}
        {upcoming.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Due Soon</Text>
            {upcoming.map((s, i) => (
              <SubCard key={s.id} sub={s} index={i} fmt={fmt} onDelete={handleDelete} />
            ))}
          </>
        )}

        {/* ── All Subscriptions ── */}
        <Text style={styles.sectionTitle}>All Subscriptions</Text>
        {subs.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons name="card-outline" size={48} color={Colors.textTertiary} />
            </View>
            <Text style={styles.emptyTitle}>No subscriptions yet</Text>
            <Text style={styles.emptySub}>Track your recurring payments and never get surprised by a charge again.</Text>
          </View>
        ) : (
          subs.map((s, i) => (
            <SubCard key={s.id} sub={s} index={i} fmt={fmt} onDelete={handleDelete} />
          ))
        )}

        {/* ── Add Button ── */}
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowCreate(true)} activeOpacity={0.7}>
          <View style={styles.addBtnIcon}>
            <Ionicons name="add" size={22} color={Colors.finoraSkyBlue} />
          </View>
          <Text style={styles.addBtnText}>Add Subscription</Text>
        </TouchableOpacity>

        <View style={{ height: 120 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ══════════════════════════════════════════════
// STYLES
// ══════════════════════════════════════════════

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg },
  pageTitle: { fontSize: Typography.sizes.heading, fontWeight: '700', color: Colors.text, marginBottom: Spacing.xl },
  sectionTitle: {
    fontSize: Typography.sizes.caption, fontWeight: '600', color: Colors.textSecondary,
    textTransform: 'uppercase', letterSpacing: 1, marginBottom: Spacing.md, marginTop: Spacing.lg,
  },

  // Hero
  heroCard: {
    borderRadius: 20, backgroundColor: '#1a1a2e', overflow: 'hidden', marginBottom: Spacing.lg,
    shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.2, shadowRadius: 24, elevation: 8,
  },
  heroBlob1: {
    position: 'absolute', top: -30, right: -20, width: 120, height: 120,
    borderRadius: 60, backgroundColor: Colors.finoraSkyBlue, opacity: 0.3,
  },
  heroBlob2: {
    position: 'absolute', bottom: -30, left: -10, width: 100, height: 100,
    borderRadius: 50, backgroundColor: '#a570ff', opacity: 0.15,
  },
  heroGlass: { padding: 20, backgroundColor: 'rgba(255,255,255,0.05)' },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  heroLabel: { fontSize: 12, color: 'rgba(255,255,255,0.45)', marginBottom: 4 },
  heroAmount: { fontSize: 24, fontWeight: '800', color: '#fff', letterSpacing: -0.5 },
  heroDivider: { width: 1, height: 36, backgroundColor: 'rgba(255,255,255,0.1)' },
  heroBottom: { flexDirection: 'row', gap: 8 },
  heroStatPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  heroStatText: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.7)' },

  // Empty
  emptyState: { alignItems: 'center', paddingVertical: Spacing['4xl'] },
  emptyIcon: {
    width: 88, height: 88, borderRadius: 44, backgroundColor: Colors.surface,
    alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.lg,
  },
  emptyTitle: { fontSize: Typography.sizes.subheading, fontWeight: '700', color: Colors.text, marginBottom: Spacing.sm },
  emptySub: { fontSize: Typography.sizes.caption, color: Colors.textSecondary, textAlign: 'center', maxWidth: 280 },

  // Add
  addBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 16, borderRadius: BorderRadius['2xl'],
    borderWidth: 1.5, borderColor: Colors.finoraSkyBlue + '40', borderStyle: 'dashed',
    marginTop: Spacing.md,
  },
  addBtnIcon: {
    width: 36, height: 36, borderRadius: 12, backgroundColor: Colors.finoraSkyBlue + '15',
    alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md,
  },
  addBtnText: { fontSize: Typography.sizes.body, fontWeight: '600', color: Colors.finoraSkyBlue },
});

// ── Subscription Card Styles ──
const scStyles = StyleSheet.create({
  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surface, borderRadius: BorderRadius['2xl'],
    padding: Spacing.base, marginBottom: Spacing.sm,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 1,
  },
  iconWrap: {
    width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md,
  },
  cardInfo: { flex: 1 },
  cardName: { fontSize: Typography.sizes.body, fontWeight: '600', color: Colors.text },
  cardDue: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  cardRight: { alignItems: 'flex-end', marginRight: Spacing.sm },
  cardAmount: { fontSize: Typography.sizes.body, fontWeight: '700', color: Colors.text },
  cardCycle: { fontSize: 11, color: Colors.textTertiary, marginTop: 1 },
  deleteBtn: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.borderSubtle,
    alignItems: 'center', justifyContent: 'center',
  },
});

