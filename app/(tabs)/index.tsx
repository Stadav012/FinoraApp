import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  StyleSheet, Text, View, ScrollView, TextInput,
  TouchableOpacity, Dimensions, Image, Animated, Easing,
  ActivityIndicator, Alert, RefreshControl, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import {
  getProfile, getAccounts, getMonthSummary, getRecentTransactions,
  logTransaction, currencyFormatter,
  type UserProfile, type Account, type MonthSummary, type Transaction,
} from '../../lib/services/dashboardService';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - Spacing.xl * 2;
const CARD_HEIGHT = CARD_WIDTH * 0.6;

// ── Map category/description to an icon ──
function txIcon(tx: Transaction): string {
  const d = (tx.description + ' ' + (tx.category?.name ?? '')).toLowerCase();
  if (d.includes('coffee') || d.includes('cafe')) return 'cafe';
  if (d.includes('food') || d.includes('restaurant') || d.includes('lunch') || d.includes('dinner')) return 'restaurant';
  if (d.includes('uber') || d.includes('transport') || d.includes('gas') || d.includes('lyft')) return 'car';
  if (d.includes('grocery') || d.includes('market') || d.includes('shop')) return 'cart';
  if (d.includes('netflix') || d.includes('spotify') || d.includes('subscription')) return 'play-circle';
  if (d.includes('salary') || d.includes('income') || d.includes('deposit')) return 'cash';
  return 'pricetag';
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 60_000) return 'Just now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `Today, ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  if (diff < 172_800_000) return 'Yesterday';
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning,';
  if (h < 17) return 'Good afternoon,';
  return 'Good evening,';
}

function CardChip() {
  return (
    <View style={chipS.body}>
      <View style={chipS.lineH} />
      <View style={chipS.lineV} />
    </View>
  );
}

export default function DashboardScreen() {
  // ── Live data state ──
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [summary, setSummary] = useState<MonthSummary>({ income: 0, expense: 0, balance: 0 });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // ── Chat state ──
  const [logText, setLogText] = useState('');
  const [chatState, setChatState] = useState<'idle' | 'sent' | 'processing' | 'done'>('idle');
  const [lastTxText, setLastTxText] = useState('');

  // ── Animations ──
  const bubbleAnim = useRef(new Animated.Value(0)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const cardAnim = useRef(new Animated.Value(0)).current;
  const checkScale = useRef(new Animated.Value(0)).current;
  const confettiAnims = useRef(
    Array.from({ length: 6 }, () => ({
      x: new Animated.Value(0), y: new Animated.Value(0),
      opacity: new Animated.Value(0), scale: new Animated.Value(0),
    }))
  ).current;

  // Result from the last logged transaction
  const [lastResult, setLastResult] = useState<{ description: string; amount: number; type: string; icon: string } | null>(null);

  const fmt = currencyFormatter(profile?.currency);
  const primaryAccount = accounts[0]; // The default Cash account
  const totalBalance = accounts.reduce((sum, a) => sum + Number(a.balance), 0);

  // ── Fetch all dashboard data ──
  const loadData = useCallback(async () => {
    try {
      const [p, a, s, t] = await Promise.all([
        getProfile(),
        getAccounts(),
        getMonthSummary(),
        getRecentTransactions(15),
      ]);
      setProfile(p);
      setAccounts(a);
      setSummary(s);
      setTransactions(t);
    } catch (e: any) {
      console.error('Dashboard load error:', e.message);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  // ── Animation helpers ──
  const resetAnims = () => {
    bubbleAnim.setValue(0); shimmerAnim.setValue(0); cardAnim.setValue(0); checkScale.setValue(0);
    confettiAnims.forEach(c => { c.x.setValue(0); c.y.setValue(0); c.opacity.setValue(0); c.scale.setValue(0); });
  };

  const handleSend = async () => {
    if (!logText.trim() || !primaryAccount) return;
    const text = logText;
    setLogText('');
    setLastTxText(text);
    resetAnims();

    // Stage 1: Bubble
    setChatState('sent');
    Animated.spring(bubbleAnim, { toValue: 1, friction: 7, tension: 60, useNativeDriver: true }).start();

    // Stage 2: Shimmer
    setTimeout(() => {
      setChatState('processing');
      Animated.loop(
        Animated.timing(shimmerAnim, { toValue: 1, duration: 800, easing: Easing.linear, useNativeDriver: true }),
        { iterations: 2 }
      ).start();
    }, 500);

    // Actual DB insert happens during processing
    try {
      const result = await logTransaction(text, primaryAccount.id);
      const icon = txIcon(result);
      setLastResult({ description: result.description, amount: result.amount, type: result.type, icon });

      // Stage 3: Result card
      setTimeout(() => {
        setChatState('done');
        Animated.spring(cardAnim, { toValue: 1, friction: 6, tension: 50, useNativeDriver: true }).start();

        setTimeout(() => {
          Animated.spring(checkScale, { toValue: 1, friction: 4, tension: 100, useNativeDriver: true }).start();
          confettiAnims.forEach((c) => {
            const angle = Math.random() * Math.PI * 2;
            const dist = 40 + Math.random() * 60;
            Animated.parallel([
              Animated.timing(c.opacity, { toValue: 1, duration: 100, useNativeDriver: true }),
              Animated.timing(c.scale, { toValue: 1, duration: 200, useNativeDriver: true }),
              Animated.timing(c.x, { toValue: Math.cos(angle) * dist, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
              Animated.timing(c.y, { toValue: Math.sin(angle) * dist, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
              Animated.sequence([Animated.delay(300), Animated.timing(c.opacity, { toValue: 0, duration: 200, useNativeDriver: true })]),
            ]).start();
          });
        }, 300);

        // Stage 4: Refresh data and reset
        setTimeout(() => {
          loadData();
          setChatState('idle');
          setLastResult(null);
        }, 2200);
      }, 400);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to log transaction');
      setChatState('idle');
    }
  };

  const shimmerTranslate = shimmerAnim.interpolate({ inputRange: [0, 1], outputRange: [-CARD_WIDTH, CARD_WIDTH] });

  // ScrollView ref for auto-scrolling to input
  const scrollRef = useRef<ScrollView>(null);
  const inputLayoutY = useRef(0);

  // ── Loading state ──
  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={Colors.finoraGreen} />
      </SafeAreaView>
    );
  }

  const displayName = profile?.display_name ?? 'there';
  const cardholderName = displayName.toUpperCase().split(' ')[0] + (displayName.split(' ')[1] ? ` ${displayName.split(' ')[1][0]}.` : '');

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.finoraGreen} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{getGreeting()}</Text>
            <Text style={styles.headerName}>{displayName}</Text>
          </View>
          <TouchableOpacity style={styles.avatarWrap}>
            <Image source={require('../../assets/finora-icon.png')} style={styles.avatarImg} resizeMode="cover" />
          </TouchableOpacity>
        </View>

        {/* ── Wallet Card ── */}
        <View style={styles.walletWrap}>
          <View style={[styles.backCard, styles.bc2]} />
          <View style={[styles.backCard, styles.bc1]} />
          <View style={styles.mainCard}>
            <View style={styles.blob1} />
            <View style={styles.blob2} />
            <View style={styles.blob3} />
            <View style={styles.cardGlass}>
              <View style={styles.cardTop}>
                <View style={styles.brandRow}>
                  <Image source={require('../../assets/finora-icon.png')} style={styles.brandIcon} resizeMode="contain" />
                  <Text style={styles.brandName}>Finora</Text>
                </View>
                <Ionicons name="wifi" size={18} color="rgba(255,255,255,0.5)" style={{ transform: [{ rotate: '90deg' }] }} />
              </View>
              <CardChip />
              <View style={styles.numRow}>
                {[0, 1, 2].map(i => (
                  <View key={i} style={styles.dots}>{[0, 1, 2, 3].map(j => <View key={j} style={styles.dot} />)}</View>
                ))}
                <Text style={styles.lastFour}>7842</Text>
              </View>
              <View style={styles.cardBot}>
                <View><Text style={styles.cardLabel}>CARDHOLDER</Text><Text style={styles.cardVal}>{cardholderName}</Text></View>
                <View style={{ alignItems: 'flex-end' }}><Text style={styles.cardLabel}>EXPIRES</Text><Text style={styles.cardVal}>09/28</Text></View>
              </View>
            </View>
          </View>
        </View>

        {/* Balance Row */}
        <View style={styles.balRow}>
          <View style={styles.balItem}><View style={[styles.balDot, { backgroundColor: Colors.finoraGreen }]} /><View><Text style={styles.balLabel}>Income</Text><Text style={styles.balVal}>{fmt(summary.income)}</Text></View></View>
          <View style={styles.balDiv} />
          <View style={styles.balItem}><View style={[styles.balDot, { backgroundColor: '#ff6b6b' }]} /><View><Text style={styles.balLabel}>Spent</Text><Text style={styles.balVal}>{fmt(summary.expense)}</Text></View></View>
          <View style={styles.balDiv} />
          <View style={styles.balItem}><View style={[styles.balDot, { backgroundColor: Colors.finoraSkyBlue }]} /><View><Text style={styles.balLabel}>Balance</Text><Text style={[styles.balVal, { fontWeight: '800' }]}>{fmt(totalBalance)}</Text></View></View>
        </View>

        {/* ══ AI Chat Section ══ */}
        <View style={styles.chatSection}>
          {chatState === 'idle' && (
            <View style={styles.aiBubble}>
              <Ionicons name="sparkles" size={16} color={Colors.finoraGreen} style={{ marginRight: 6 }} />
              <Text style={styles.aiBubbleText}>What did you spend on today?</Text>
            </View>
          )}

          {(chatState === 'sent' || chatState === 'processing' || chatState === 'done') && (
            <Animated.View style={[styles.userBubble, { opacity: bubbleAnim, transform: [{ translateY: bubbleAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }, { scale: bubbleAnim }] }]}>
              <Text style={styles.userBubbleText}>{lastTxText}</Text>
            </Animated.View>
          )}

          {chatState === 'processing' && (
            <View style={styles.processingWrap}>
              <View style={styles.processingBar}>
                <Animated.View style={[styles.shimmer, { transform: [{ translateX: shimmerTranslate }] }]} />
              </View>
              <Text style={styles.processingText}>Categorizing...</Text>
            </View>
          )}

          {chatState === 'done' && lastResult && (
            <Animated.View style={[styles.resultCard, { opacity: cardAnim, transform: [{ scale: cardAnim.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }) }] }]}>
              <View style={styles.resultTop}>
                <View style={styles.resultIconWrap}>
                  <Ionicons name={lastResult.icon as any} size={22} color={Colors.finoraGreen} />
                </View>
                <View style={styles.resultInfo}>
                  <Text style={styles.resultTitle}>{lastResult.description}</Text>
                  <Text style={styles.resultCat}>{lastResult.type === 'income' ? 'Income' : 'Expense'}</Text>
                </View>
                <Text style={styles.resultAmount}>{lastResult.type === 'income' ? '+' : '-'}{fmt(lastResult.amount)}</Text>
              </View>
              <View style={styles.resultBot}>
                <Animated.View style={[styles.checkCircle, { transform: [{ scale: checkScale }] }]}>
                  <Ionicons name="checkmark" size={16} color="#fff" />
                  {confettiAnims.map((c, i) => (
                    <Animated.View key={i} style={[styles.confetti, {
                      backgroundColor: ['#58cc02', '#1cb0f6', '#ffc700', '#ff6b6b', '#a570ff', '#58cc02'][i],
                      opacity: c.opacity,
                      transform: [{ translateX: c.x }, { translateY: c.y }, { scale: c.scale }],
                    }]} />
                  ))}
                </Animated.View>
                <Text style={styles.resultDoneText}>Logged successfully!</Text>
              </View>
            </Animated.View>
          )}

          <View
            style={styles.inputRow}
            onLayout={(e) => { inputLayoutY.current = e.nativeEvent.layout.y; }}
          >
            <TextInput
              style={styles.chatInput}
              placeholder={'e.g. "Spent $15 on coffee"'}
              placeholderTextColor={Colors.textTertiary}
              value={logText}
              onChangeText={setLogText}
              editable={chatState === 'idle'}
              onSubmitEditing={handleSend}
              returnKeyType="send"
              onFocus={() => {
                // Auto-scroll to keep input visible above keyboard
                setTimeout(() => {
                  scrollRef.current?.scrollToEnd({ animated: true });
                }, 300);
              }}
            />
            <TouchableOpacity
              style={[styles.sendBtn, logText.trim().length > 0 && chatState === 'idle' && styles.sendBtnActive]}
              disabled={logText.trim().length === 0 || chatState !== 'idle'}
              onPress={handleSend}
            >
              <Ionicons name="send" size={18} color={logText.trim().length > 0 && chatState === 'idle' ? '#fff' : Colors.textTertiary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Recent Activity ── */}
        <View style={styles.actSection}>
          <View style={styles.actHeader}>
            <Text style={styles.actTitle}>Recent Activity</Text>
            <TouchableOpacity><Text style={styles.seeAll}>See All</Text></TouchableOpacity>
          </View>
          {transactions.length === 0 && (
            <Text style={{ color: Colors.textTertiary, textAlign: 'center', paddingVertical: Spacing.xl }}>
              No transactions yet. Use the chat above to log your first one!
            </Text>
          )}
          {transactions.map(tx => (
            <View key={tx.id} style={styles.txRow}>
              <View style={styles.txIcon}><Ionicons name={txIcon(tx) as any} size={20} color={Colors.textSecondary} /></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.txTitle}>{tx.description}</Text>
                <Text style={styles.txDate}>{formatDate(tx.transaction_date)}</Text>
              </View>
              <Text style={[styles.txAmt, tx.type === 'income' && { color: Colors.finoraGreenDark }]}>
                {tx.type === 'income' ? '+' : '-'}{fmt(tx.amount)}
              </Text>
            </View>
          ))}
        </View>
        <View style={{ height: 100 }} />
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const chipS = StyleSheet.create({
  body: { width: 40, height: 30, borderRadius: 6, backgroundColor: '#d4af37', borderWidth: 1, borderColor: '#c9a32e', overflow: 'hidden', justifyContent: 'center', alignItems: 'center' },
  lineH: { position: 'absolute', width: '100%', height: 1, backgroundColor: '#b8942a' },
  lineV: { position: 'absolute', width: 1, height: '100%', backgroundColor: '#b8942a' },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.xl },
  greeting: { fontSize: Typography.sizes.caption, color: Colors.textSecondary, marginBottom: 2 },
  headerName: { fontSize: Typography.sizes.headingSm, fontWeight: '700', color: Colors.text },
  avatarWrap: { width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.surface, overflow: 'hidden', borderWidth: 2, borderColor: Colors.background, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 },
  avatarImg: { width: '100%', height: '100%' },

  walletWrap: { width: CARD_WIDTH, height: CARD_HEIGHT + 24, marginBottom: Spacing.xl, alignSelf: 'center' },
  backCard: { position: 'absolute', width: CARD_WIDTH, height: CARD_HEIGHT, borderRadius: 20 },
  bc2: { backgroundColor: '#e8e8e8', top: 16, transform: [{ scale: 0.92 }] },
  bc1: { backgroundColor: '#d0d0d0', top: 8, transform: [{ scale: 0.96 }] },
  mainCard: { position: 'absolute', top: 0, width: CARD_WIDTH, height: CARD_HEIGHT, borderRadius: 20, backgroundColor: '#1a1a2e', overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 16 }, shadowOpacity: 0.25, shadowRadius: 32, elevation: 12 },
  blob1: { position: 'absolute', top: -40, right: -30, width: 140, height: 140, borderRadius: 70, backgroundColor: Colors.finoraGreen, opacity: 0.35 },
  blob2: { position: 'absolute', bottom: -50, left: -20, width: 160, height: 160, borderRadius: 80, backgroundColor: Colors.finoraSkyBlue, opacity: 0.25 },
  blob3: { position: 'absolute', top: 20, left: '40%', width: 100, height: 100, borderRadius: 50, backgroundColor: Colors.finoraYellow, opacity: 0.12 },
  cardGlass: { flex: 1, padding: 20, justifyContent: 'space-between', backgroundColor: 'rgba(255,255,255,0.06)' },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  brandRow: { flexDirection: 'row', alignItems: 'center' },
  brandIcon: { width: 22, height: 22, marginRight: 6 },
  brandName: { fontSize: 15, fontWeight: '700', color: '#fff', letterSpacing: 1.5 },
  numRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  dots: { flexDirection: 'row', gap: 4 },
  dot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: 'rgba(255,255,255,0.5)' },
  lastFour: { fontSize: 17, fontWeight: '700', color: '#fff', letterSpacing: 3 },
  cardBot: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  cardLabel: { fontSize: 9, fontWeight: '500', color: 'rgba(255,255,255,0.4)', letterSpacing: 1.5, marginBottom: 2 },
  cardVal: { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.85)', letterSpacing: 1 },

  balRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: Colors.surface, padding: Spacing.base, borderRadius: BorderRadius.lg, marginBottom: Spacing['3xl'] },
  balItem: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  balDot: { width: 8, height: 8, borderRadius: 4 },
  balLabel: { fontSize: 11, color: Colors.textSecondary, marginBottom: 1 },
  balVal: { fontSize: 14, fontWeight: '600', color: Colors.text },
  balDiv: { width: 1, height: 28, backgroundColor: Colors.border, marginHorizontal: 4 },

  chatSection: { marginBottom: Spacing['4xl'] },
  aiBubble: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', backgroundColor: Colors.finoraGreen + '15', paddingVertical: 8, paddingHorizontal: 16, borderRadius: BorderRadius.pill, borderBottomLeftRadius: 4, marginBottom: Spacing.sm },
  aiBubbleText: { fontSize: Typography.sizes.caption, fontWeight: '500', color: Colors.finoraGreenDark },
  userBubble: { alignSelf: 'flex-end', backgroundColor: Colors.text, paddingVertical: 10, paddingHorizontal: 18, borderRadius: 20, borderBottomRightRadius: 4, marginBottom: Spacing.md },
  userBubbleText: { fontSize: Typography.sizes.caption, fontWeight: '500', color: '#fff' },
  processingWrap: { marginBottom: Spacing.md, alignItems: 'flex-start' },
  processingBar: { width: 120, height: 4, borderRadius: 2, backgroundColor: Colors.borderSubtle, overflow: 'hidden', marginBottom: 6 },
  shimmer: { position: 'absolute', width: 60, height: '100%', backgroundColor: Colors.finoraGreen + '40', borderRadius: 2 },
  processingText: { fontSize: 12, color: Colors.textSecondary, fontStyle: 'italic' },

  resultCard: { backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.base, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.finoraGreen + '30' },
  resultTop: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md },
  resultIconWrap: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.finoraGreen + '1A', alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md },
  resultInfo: { flex: 1 },
  resultTitle: { fontSize: Typography.sizes.body, fontWeight: '600', color: Colors.text },
  resultCat: { fontSize: Typography.sizes.caption, color: Colors.textSecondary, marginTop: 2 },
  resultAmount: { fontSize: Typography.sizes.subheading, fontWeight: '700', color: Colors.text },
  resultBot: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  checkCircle: { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.finoraGreen, alignItems: 'center', justifyContent: 'center' },
  confetti: { position: 'absolute', width: 6, height: 6, borderRadius: 3 },
  resultDoneText: { fontSize: Typography.sizes.caption, fontWeight: '600', color: Colors.finoraGreenDark },

  inputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.pill, paddingHorizontal: Spacing.base, paddingVertical: 6 },
  chatInput: { flex: 1, paddingVertical: 12, fontSize: Typography.sizes.body, color: Colors.text },
  sendBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.border, alignItems: 'center', justifyContent: 'center', marginLeft: Spacing.sm },
  sendBtnActive: { backgroundColor: Colors.finoraGreen, shadowColor: Colors.finoraGreen, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 4 },

  actSection: { marginBottom: Spacing.xl },
  actHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg },
  actTitle: { fontSize: Typography.sizes.subheading, fontWeight: '700', color: Colors.text },
  seeAll: { fontSize: Typography.sizes.caption, fontWeight: '600', color: Colors.finoraGreenDark },
  txRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.sm },
  txIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md },
  txTitle: { fontSize: Typography.sizes.body, fontWeight: '600', color: Colors.text, marginBottom: 2 },
  txDate: { fontSize: Typography.sizes.caption, color: Colors.textSecondary },
  txAmt: { fontSize: Typography.sizes.body, fontWeight: '700', color: Colors.text },
});
