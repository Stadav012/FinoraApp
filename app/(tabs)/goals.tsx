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
import {
  getGoals, createGoal, addToGoal, deleteGoal, type Goal,
} from '../../lib/services/goalsService';
import { currencyFormatter, getProfile } from '../../lib/services/dashboardService';

const { width } = Dimensions.get('window');
const RING_SIZE = 160;
const RING_STROKE = 10;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

const GOAL_COLORS = ['#58cc02', '#1cb0f6', '#ffc700', '#ff6b6b', '#a570ff', '#ff9f43'];
const GOAL_ICONS = [
  { id: 'airplane', label: 'Travel' },
  { id: 'home', label: 'Home' },
  { id: 'car', label: 'Car' },
  { id: 'school', label: 'Education' },
  { id: 'medkit', label: 'Health' },
  { id: 'gift', label: 'Gift' },
  { id: 'shield-checkmark', label: 'Emergency' },
  { id: 'diamond', label: 'Luxury' },
  { id: 'flag', label: 'Other' },
];

// ── Animated SVG-like progress ring using Views ──
function ProgressRing({
  progress, size, strokeWidth, color, children,
}: {
  progress: number; size: number; strokeWidth: number; color: string;
  children?: React.ReactNode;
}) {
  const animVal = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(animVal, {
      toValue: Math.min(progress, 1),
      friction: 8,
      tension: 40,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {/* Background ring */}
      <View style={{
        position: 'absolute', width: size, height: size, borderRadius: size / 2,
        borderWidth: strokeWidth, borderColor: Colors.borderSubtle,
      }} />
      {/* Foreground — we use 4 quadrant arcs for a clean look */}
      <Animated.View style={{
        position: 'absolute', width: size, height: size, borderRadius: size / 2,
        borderWidth: strokeWidth, borderColor: color,
        borderTopColor: animVal.interpolate({
          inputRange: [0, 0.25, 1], outputRange: [Colors.borderSubtle, color, color],
        }),
        borderRightColor: animVal.interpolate({
          inputRange: [0, 0.25, 0.5, 1], outputRange: [Colors.borderSubtle, Colors.borderSubtle, color, color],
        }),
        borderBottomColor: animVal.interpolate({
          inputRange: [0, 0.5, 0.75, 1], outputRange: [Colors.borderSubtle, Colors.borderSubtle, color, color],
        }),
        borderLeftColor: animVal.interpolate({
          inputRange: [0, 0.75, 1], outputRange: [Colors.borderSubtle, Colors.borderSubtle, color],
        }),
        transform: [{ rotate: '-90deg' }],
      }} />
      {children}
    </View>
  );
}

// ── Goal Card ──
function GoalCard({
  goal, index, fmt, onAddFunds, onDelete,
}: {
  goal: Goal; index: number; fmt: (n: number) => string;
  onAddFunds: (g: Goal) => void; onDelete: (id: string) => void;
}) {
  const slideAnim = useRef(new Animated.Value(0)).current;
  const ringAnim = useRef(new Animated.Value(0)).current;
  const glowPulse = useRef(new Animated.Value(0.6)).current;
  const progress = Number(goal.current_amount) / Number(goal.target_amount);
  const percentText = Math.round(progress * 100);

  useEffect(() => {
    Animated.sequence([
      Animated.delay(index * 150),
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 1, friction: 8, tension: 45, useNativeDriver: true }),
        Animated.timing(ringAnim, {
          toValue: Math.min(progress, 1),
          duration: 1000,
          delay: 300,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }),
      ]),
    ]).start();

    // Subtle pulse on the icon glow
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowPulse, { toValue: 1, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(glowPulse, { toValue: 0.6, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const daysLeft = goal.deadline
    ? Math.max(0, Math.ceil((new Date(goal.deadline).getTime() - Date.now()) / 86_400_000))
    : null;

  const remaining = Math.max(0, Number(goal.target_amount) - Number(goal.current_amount));

  return (
    <Animated.View style={[gcStyles.card, {
      opacity: slideAnim,
      transform: [
        { translateY: slideAnim.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) },
        { scale: slideAnim.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1] }) },
      ],
    }]}>
      {/* Dark card base */}
      <View style={gcStyles.cardInner}>
        {/* Ambient blobs */}
        <Animated.View style={[gcStyles.blob1, { backgroundColor: goal.color, opacity: glowPulse }]} />
        <View style={[gcStyles.blob2, { backgroundColor: goal.color }]} />
        <View style={[gcStyles.blob3, { backgroundColor: '#fff' }]} />

        {/* Glass overlay */}
        <View style={gcStyles.glass}>
          {/* Top row: icon + name + menu */}
          <View style={gcStyles.topRow}>
            <View style={gcStyles.iconWrap}>
              <Ionicons name={goal.icon as any} size={20} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={gcStyles.name} numberOfLines={1}>{goal.name}</Text>
              <Text style={gcStyles.meta}>
                {goal.is_completed ? '✨ Goal reached' : daysLeft !== null ? `${daysLeft}d remaining` : 'Open-ended'}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                Alert.alert('Delete Goal', `Remove "${goal.name}"?`, [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Delete', style: 'destructive', onPress: () => onDelete(goal.id) },
                ]);
              }}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              style={gcStyles.menuBtn}
            >
              <Ionicons name="ellipsis-horizontal" size={16} color="rgba(255,255,255,0.4)" />
            </TouchableOpacity>
          </View>

          {/* Center: amount + mini ring */}
          <View style={gcStyles.centerRow}>
            <View style={{ flex: 1 }}>
              <Text style={gcStyles.savedAmount}>{fmt(Number(goal.current_amount))}</Text>
              <Text style={gcStyles.targetText}>of {fmt(Number(goal.target_amount))}</Text>
            </View>

            {/* Mini progress ring */}
            <View style={gcStyles.miniRingWrap}>
              <View style={gcStyles.miniRingBg} />
              <Animated.View style={[gcStyles.miniRingFg, {
                borderColor: '#fff',
                borderTopColor: ringAnim.interpolate({
                  inputRange: [0, 0.25, 1], outputRange: ['rgba(255,255,255,0.12)', '#fff', '#fff'],
                }),
                borderRightColor: ringAnim.interpolate({
                  inputRange: [0, 0.25, 0.5, 1], outputRange: ['rgba(255,255,255,0.12)', 'rgba(255,255,255,0.12)', '#fff', '#fff'],
                }),
                borderBottomColor: ringAnim.interpolate({
                  inputRange: [0, 0.5, 0.75, 1], outputRange: ['rgba(255,255,255,0.12)', 'rgba(255,255,255,0.12)', '#fff', '#fff'],
                }),
                borderLeftColor: ringAnim.interpolate({
                  inputRange: [0, 0.75, 1], outputRange: ['rgba(255,255,255,0.12)', 'rgba(255,255,255,0.12)', '#fff'],
                }),
              }]} />
              <Text style={gcStyles.ringPercent}>{percentText}%</Text>
            </View>
          </View>

          {/* Bottom: progress bar + add button */}
          <View style={gcStyles.bottomRow}>
            <View style={gcStyles.barWrap}>
              <Animated.View style={[gcStyles.barFill, {
                width: ringAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
              }]} />
            </View>
            {!goal.is_completed ? (
              <TouchableOpacity style={gcStyles.addFundsBtn} onPress={() => onAddFunds(goal)} activeOpacity={0.7}>
                <Ionicons name="add" size={14} color={goal.color} />
                <Text style={[gcStyles.addFundsText, { color: goal.color }]}>Add</Text>
              </TouchableOpacity>
            ) : (
              <View style={gcStyles.completedBadge}>
                <Ionicons name="checkmark" size={14} color="#fff" />
              </View>
            )}
          </View>
        </View>
      </View>
    </Animated.View>
  );
}


// ══════════════════════════════════════════════
// MAIN GOALS SCREEN
// ══════════════════════════════════════════════

export default function GoalsScreen() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currency, setCurrency] = useState('USD');

  // Modals
  const [showCreate, setShowCreate] = useState(false);
  const [showAddFunds, setShowAddFunds] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);

  // Create form
  const [newName, setNewName] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newIcon, setNewIcon] = useState('flag');
  const [newColor, setNewColor] = useState(GOAL_COLORS[0]);

  // Add funds
  const [fundAmount, setFundAmount] = useState('');

  // Hero animation
  const heroScale = useRef(new Animated.Value(0.8)).current;
  const heroOpacity = useRef(new Animated.Value(0)).current;

  const fmt = currencyFormatter(currency);

  const loadData = useCallback(async () => {
    try {
      const [g, p] = await Promise.all([getGoals(), getProfile()]);
      setGoals(g);
      setCurrency(p.currency);
    } catch (e: any) {
      console.error('Goals load:', e.message);
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

  // ── Actions ──
  const handleCreate = async () => {
    const amount = parseFloat(newAmount);
    if (!newName.trim() || !amount || amount <= 0) return;
    try {
      await createGoal({ name: newName.trim(), target_amount: amount, icon: newIcon, color: newColor });
      setShowCreate(false);
      setNewName(''); setNewAmount(''); setNewIcon('flag'); setNewColor(GOAL_COLORS[0]);
      loadData();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const handleAddFunds = async () => {
    const amount = parseFloat(fundAmount);
    if (!selectedGoal || !amount || amount <= 0) return;
    try {
      await addToGoal(selectedGoal.id, amount);
      setShowAddFunds(false);
      setFundAmount('');
      setSelectedGoal(null);
      loadData();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const handleDelete = async (id: string) => {
    try { await deleteGoal(id); loadData(); }
    catch (e: any) { Alert.alert('Error', e.message); }
  };

  // ── Stats ──
  const totalTarget = goals.reduce((s, g) => s + Number(g.target_amount), 0);
  const totalSaved = goals.reduce((s, g) => s + Number(g.current_amount), 0);
  const overallProgress = totalTarget > 0 ? totalSaved / totalTarget : 0;
  const completedCount = goals.filter(g => g.is_completed).length;

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={Colors.finoraGreen} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* ── Create Modal ── */}
      <KeyboardAwareModal visible={showCreate} onClose={() => setShowCreate(false)}>
        <Text style={modalS.title}>New Goal</Text>
        <TextInput
          style={modalS.input}
          placeholder="Goal name (e.g. Vacation)"
          placeholderTextColor={Colors.textTertiary}
          value={newName}
          onChangeText={setNewName}
          autoFocus
        />
        <TextInput
          style={[modalS.input, { marginTop: Spacing.md }]}
          placeholder="Target amount"
          placeholderTextColor={Colors.textTertiary}
          value={newAmount}
          onChangeText={setNewAmount}
          keyboardType="decimal-pad"
        />
        {/* Icon picker */}
        <Text style={modalS.label}>Icon</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.md }}>
          {GOAL_ICONS.map(ic => (
            <TouchableOpacity
              key={ic.id}
              style={[modalS.iconBtn, newIcon === ic.id && { backgroundColor: newColor + '20', borderColor: newColor }]}
              onPress={() => setNewIcon(ic.id)}
            >
              <Ionicons name={ic.id as any} size={20} color={newIcon === ic.id ? newColor : Colors.textSecondary} />
            </TouchableOpacity>
          ))}
        </ScrollView>
        {/* Color picker */}
        <Text style={modalS.label}>Color</Text>
        <View style={modalS.colorRow}>
          {GOAL_COLORS.map(c => (
            <TouchableOpacity
              key={c}
              style={[modalS.colorDot, { backgroundColor: c }, newColor === c && modalS.colorDotSelected]}
              onPress={() => setNewColor(c)}
            />
          ))}
        </View>
        <View style={modalS.actions}>
          <TouchableOpacity style={modalS.cancelBtn} onPress={() => setShowCreate(false)}>
            <Text style={modalS.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[modalS.saveBtn, { backgroundColor: newColor }, (!newName.trim() || !newAmount) && { opacity: 0.4 }]}
            onPress={handleCreate}
            disabled={!newName.trim() || !newAmount}
          >
            <Text style={modalS.saveText}>Create</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAwareModal>

      {/* ── Add Funds Modal ── */}
      <KeyboardAwareModal visible={showAddFunds} onClose={() => setShowAddFunds(false)}>
        <Text style={modalS.title}>Add to {selectedGoal?.name}</Text>
        <Text style={{ color: Colors.textSecondary, marginBottom: Spacing.lg }}>
          {fmt(Number(selectedGoal?.current_amount ?? 0))} saved of {fmt(Number(selectedGoal?.target_amount ?? 0))}
        </Text>
        <TextInput
          style={modalS.input}
          placeholder="Amount to add"
          placeholderTextColor={Colors.textTertiary}
          value={fundAmount}
          onChangeText={setFundAmount}
          keyboardType="decimal-pad"
          autoFocus
        />
        <View style={modalS.actions}>
          <TouchableOpacity style={modalS.cancelBtn} onPress={() => setShowAddFunds(false)}>
            <Text style={modalS.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[modalS.saveBtn, { backgroundColor: selectedGoal?.color ?? Colors.finoraGreen }, !fundAmount && { opacity: 0.4 }]}
            onPress={handleAddFunds}
            disabled={!fundAmount}
          >
            <Text style={modalS.saveText}>Add Funds</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAwareModal>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.finoraGreen} />}
      >
        <Text style={styles.pageTitle}>Goals</Text>

        {/* ── Hero Ring ── */}
        <Animated.View style={[styles.heroSection, { opacity: heroOpacity, transform: [{ scale: heroScale }] }]}>
          <ProgressRing progress={overallProgress} size={RING_SIZE} strokeWidth={RING_STROKE} color={Colors.finoraGreen}>
            <Text style={styles.heroPercent}>{Math.round(overallProgress * 100)}%</Text>
            <Text style={styles.heroLabel}>overall</Text>
          </ProgressRing>
          <View style={styles.heroStats}>
            <View style={styles.heroStat}>
              <Text style={styles.heroStatNum}>{goals.length}</Text>
              <Text style={styles.heroStatLabel}>Active</Text>
            </View>
            <View style={styles.heroStatDiv} />
            <View style={styles.heroStat}>
              <Text style={styles.heroStatNum}>{completedCount}</Text>
              <Text style={styles.heroStatLabel}>Done</Text>
            </View>
            <View style={styles.heroStatDiv} />
            <View style={styles.heroStat}>
              <Text style={[styles.heroStatNum, { color: Colors.finoraGreen }]}>{fmt(totalSaved)}</Text>
              <Text style={styles.heroStatLabel}>Saved</Text>
            </View>
          </View>
        </Animated.View>

        {/* ── Goal Cards ── */}
        {goals.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons name="flag-outline" size={48} color={Colors.textTertiary} />
            </View>
            <Text style={styles.emptyTitle}>No goals yet</Text>
            <Text style={styles.emptySubtitle}>Create your first savings goal and watch your progress come alive.</Text>
          </View>
        ) : (
          goals.map((g, i) => (
            <GoalCard
              key={g.id}
              goal={g}
              index={i}
              fmt={fmt}
              onAddFunds={(goal) => { setSelectedGoal(goal); setShowAddFunds(true); }}
              onDelete={handleDelete}
            />
          ))
        )}

        {/* ── New Goal Button ── */}
        <TouchableOpacity style={styles.newGoalBtn} onPress={() => setShowCreate(true)} activeOpacity={0.7}>
          <View style={styles.newGoalIconWrap}>
            <Ionicons name="add" size={24} color={Colors.finoraGreen} />
          </View>
          <Text style={styles.newGoalText}>Create New Goal</Text>
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

  // Hero
  heroSection: { alignItems: 'center', marginBottom: Spacing['3xl'] },
  heroPercent: { fontSize: 36, fontWeight: '800', color: Colors.text },
  heroLabel: { fontSize: 13, color: Colors.textSecondary, marginTop: -2 },
  heroStats: {
    flexDirection: 'row', alignItems: 'center', marginTop: Spacing.xl,
    backgroundColor: Colors.surface, padding: Spacing.base, borderRadius: BorderRadius['2xl'],
    width: '100%',
  },
  heroStat: { flex: 1, alignItems: 'center' },
  heroStatNum: { fontSize: Typography.sizes.subheading, fontWeight: '700', color: Colors.text },
  heroStatLabel: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  heroStatDiv: { width: 1, height: 28, backgroundColor: Colors.border },

  // Empty state
  emptyState: { alignItems: 'center', paddingVertical: Spacing['4xl'] },
  emptyIcon: {
    width: 88, height: 88, borderRadius: 44, backgroundColor: Colors.surface,
    alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.lg,
  },
  emptyTitle: { fontSize: Typography.sizes.subheading, fontWeight: '700', color: Colors.text, marginBottom: Spacing.sm },
  emptySubtitle: { fontSize: Typography.sizes.caption, color: Colors.textSecondary, textAlign: 'center', maxWidth: 260 },

  // New goal button
  newGoalBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 16, borderRadius: BorderRadius['2xl'],
    borderWidth: 1.5, borderColor: Colors.finoraGreen + '40', borderStyle: 'dashed',
    marginTop: Spacing.sm,
  },
  newGoalIconWrap: {
    width: 36, height: 36, borderRadius: 12, backgroundColor: Colors.finoraGreen + '15',
    alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md,
  },
  newGoalText: { fontSize: Typography.sizes.body, fontWeight: '600', color: Colors.finoraGreenDark },
});

// ── Premium Goal Card Styles ──
const gcStyles = StyleSheet.create({
  card: {
    marginBottom: Spacing.lg,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 8,
  },
  cardInner: {
    borderRadius: 20,
    backgroundColor: '#1a1a2e',
    overflow: 'hidden',
    minHeight: 180,
  },
  blob1: {
    position: 'absolute', top: -30, right: -20,
    width: 120, height: 120, borderRadius: 60, opacity: 0.35,
  },
  blob2: {
    position: 'absolute', bottom: -40, left: -15,
    width: 100, height: 100, borderRadius: 50, opacity: 0.15,
  },
  blob3: {
    position: 'absolute', top: 30, left: '45%',
    width: 60, height: 60, borderRadius: 30, opacity: 0.04,
  },
  glass: {
    flex: 1, padding: 20, justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  topRow: {
    flexDirection: 'row', alignItems: 'center', marginBottom: 16,
  },
  iconWrap: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center', justifyContent: 'center',
    marginRight: 12,
  },
  name: {
    fontSize: 16, fontWeight: '700', color: '#fff', letterSpacing: 0.3,
  },
  meta: {
    fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 2,
  },
  menuBtn: {
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center', justifyContent: 'center',
  },
  centerRow: {
    flexDirection: 'row', alignItems: 'center', marginBottom: 16,
  },
  savedAmount: {
    fontSize: 28, fontWeight: '800', color: '#fff', letterSpacing: -0.5,
  },
  targetText: {
    fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 2,
  },
  miniRingWrap: {
    width: 52, height: 52, alignItems: 'center', justifyContent: 'center',
  },
  miniRingBg: {
    position: 'absolute', width: 52, height: 52, borderRadius: 26,
    borderWidth: 3, borderColor: 'rgba(255,255,255,0.12)',
  },
  miniRingFg: {
    position: 'absolute', width: 52, height: 52, borderRadius: 26,
    borderWidth: 3, transform: [{ rotate: '-90deg' }],
  },
  ringPercent: {
    fontSize: 13, fontWeight: '700', color: '#fff',
  },
  bottomRow: {
    flexDirection: 'row', alignItems: 'center',
  },
  barWrap: {
    flex: 1, height: 4, backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2, overflow: 'hidden', marginRight: 12,
  },
  barFill: {
    height: '100%', borderRadius: 2, backgroundColor: '#fff',
  },
  addFundsBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingVertical: 6, paddingHorizontal: 12, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  addFundsText: {
    fontSize: 12, fontWeight: '700',
  },
  completedBadge: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
});

const modalS = StyleSheet.create({
  title: { fontSize: Typography.sizes.headingSm, fontWeight: '700', color: Colors.text, marginBottom: Spacing.xl },
  label: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary, marginBottom: Spacing.sm, marginTop: Spacing.md },
  input: {
    fontSize: Typography.sizes.body, color: Colors.text, borderWidth: 1, borderColor: Colors.border,
    borderRadius: BorderRadius.lg, paddingHorizontal: Spacing.base, paddingVertical: 14, backgroundColor: Colors.surface,
  },
  iconBtn: {
    width: 44, height: 44, borderRadius: 12, borderWidth: 1.5, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center', marginRight: Spacing.sm,
  },
  colorRow: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.md },
  colorDot: { width: 32, height: 32, borderRadius: 16 },
  colorDotSelected: { borderWidth: 3, borderColor: Colors.text },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: Spacing.md, marginTop: Spacing.xl },
  cancelBtn: {
    paddingVertical: 12, paddingHorizontal: Spacing.xl, borderRadius: BorderRadius.pill,
    borderWidth: 1, borderColor: Colors.border,
  },
  cancelText: { fontSize: Typography.sizes.body, fontWeight: '500', color: Colors.text },
  saveBtn: { paddingVertical: 12, paddingHorizontal: Spacing.xl, borderRadius: BorderRadius.pill },
  saveText: { fontSize: Typography.sizes.body, fontWeight: '600', color: '#fff' },
});
