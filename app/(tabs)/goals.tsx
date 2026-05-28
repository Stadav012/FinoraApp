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
  const barAnim = useRef(new Animated.Value(0)).current;
  const progress = Number(goal.current_amount) / Number(goal.target_amount);

  useEffect(() => {
    Animated.sequence([
      Animated.delay(index * 120),
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 1, friction: 8, tension: 50, useNativeDriver: true }),
        Animated.timing(barAnim, {
          toValue: Math.min(progress, 1),
          duration: 800,
          delay: 200,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }),
      ]),
    ]).start();
  }, []);

  const daysLeft = goal.deadline
    ? Math.max(0, Math.ceil((new Date(goal.deadline).getTime() - Date.now()) / 86_400_000))
    : null;

  return (
    <Animated.View style={[styles.goalCard, {
      opacity: slideAnim,
      transform: [{ translateY: slideAnim.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) }],
    }]}>
      {/* Color accent */}
      <View style={[styles.cardAccent, { backgroundColor: goal.color }]} />

      <View style={styles.cardBody}>
        <View style={styles.cardTop}>
          <View style={[styles.cardIconWrap, { backgroundColor: goal.color + '18' }]}>
            <Ionicons name={goal.icon as any} size={22} color={goal.color} />
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.cardName}>{goal.name}</Text>
            <Text style={styles.cardMeta}>
              {goal.is_completed ? '🎉 Completed!' : daysLeft !== null ? `${daysLeft} days left` : 'No deadline'}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => {
              Alert.alert('Delete Goal', `Remove "${goal.name}"?`, [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: () => onDelete(goal.id) },
              ]);
            }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="ellipsis-horizontal" size={20} color={Colors.textTertiary} />
          </TouchableOpacity>
        </View>

        {/* Progress bar */}
        <View style={styles.progressBarBg}>
          <Animated.View style={[styles.progressBarFill, {
            backgroundColor: goal.color,
            width: barAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
          }]} />
        </View>

        <View style={styles.cardBottom}>
          <Text style={styles.cardAmount}>
            <Text style={{ color: goal.color, fontWeight: '800' }}>{fmt(Number(goal.current_amount))}</Text>
            <Text style={{ color: Colors.textTertiary }}> / {fmt(Number(goal.target_amount))}</Text>
          </Text>
          {!goal.is_completed && (
            <TouchableOpacity style={[styles.addBtn, { backgroundColor: goal.color }]} onPress={() => onAddFunds(goal)}>
              <Ionicons name="add" size={18} color="#fff" />
            </TouchableOpacity>
          )}
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

  // Goal card
  goalCard: {
    flexDirection: 'row', backgroundColor: Colors.surface, borderRadius: BorderRadius['2xl'],
    marginBottom: Spacing.md, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 2,
  },
  cardAccent: { width: 4, borderTopLeftRadius: BorderRadius['2xl'], borderBottomLeftRadius: BorderRadius['2xl'] },
  cardBody: { flex: 1, padding: Spacing.base },
  cardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md },
  cardIconWrap: {
    width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md,
  },
  cardInfo: { flex: 1 },
  cardName: { fontSize: Typography.sizes.body, fontWeight: '600', color: Colors.text },
  cardMeta: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  progressBarBg: {
    height: 6, backgroundColor: Colors.borderSubtle, borderRadius: 3, marginBottom: Spacing.sm, overflow: 'hidden',
  },
  progressBarFill: { height: '100%', borderRadius: 3 },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardAmount: { fontSize: Typography.sizes.caption },
  addBtn: {
    width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center',
  },

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
