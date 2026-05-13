import React, { useState, useRef } from 'react';
import {
  StyleSheet, Text, View, ScrollView, TextInput,
  TouchableOpacity, Dimensions, Image, Animated, Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - Spacing.xl * 2;
const CARD_HEIGHT = CARD_WIDTH * 0.6;

interface LoggedTx {
  id: string; title: string; amount: string; category: string; icon: string;
}

const SEED_TRANSACTIONS = [
  { id: 's1', title: 'Whole Foods Market', amount: '-$84.20', date: 'Today, 2:15 PM', icon: 'cart' },
  { id: 's2', title: 'Salary Deposit', amount: '+$3,200.00', date: 'Yesterday', icon: 'cash' },
  { id: 's3', title: 'Netflix Subscription', amount: '-$15.99', date: 'May 10', icon: 'play-circle' },
];

function parseTransaction(text: string): LoggedTx {
  const amountMatch = text.match(/\$[\d,.]+/);
  const amount = amountMatch ? amountMatch[0] : '$0';
  const lower = text.toLowerCase();
  let category = 'General';
  let icon = 'pricetag';
  if (lower.includes('coffee') || lower.includes('cafe') || lower.includes('starbucks')) { category = 'Coffee'; icon = 'cafe'; }
  else if (lower.includes('lunch') || lower.includes('dinner') || lower.includes('food') || lower.includes('restaurant')) { category = 'Food & Dining'; icon = 'restaurant'; }
  else if (lower.includes('uber') || lower.includes('lyft') || lower.includes('gas') || lower.includes('transport')) { category = 'Transport'; icon = 'car'; }
  else if (lower.includes('grocery') || lower.includes('market') || lower.includes('shop')) { category = 'Groceries'; icon = 'cart'; }
  else if (lower.includes('netflix') || lower.includes('spotify') || lower.includes('subscription')) { category = 'Subscription'; icon = 'play-circle'; }
  const title = category === 'General' ? text.replace(/spent|paid|bought/gi, '').replace(/\$[\d,.]+/g, '').replace(/on|for/gi, '').trim() || 'Transaction' : category;
  return { id: Date.now().toString(), title, amount: `-${amount}`, category, icon };
}

/* ── Card Sub-components ── */
function CardChip() {
  return (
    <View style={chipS.body}>
      <View style={chipS.lineH} />
      <View style={chipS.lineV} />
    </View>
  );
}

export default function DashboardScreen() {
  const [logText, setLogText] = useState('');
  const [chatState, setChatState] = useState<'idle' | 'sent' | 'processing' | 'done'>('idle');
  const [lastTx, setLastTx] = useState<LoggedTx | null>(null);
  const [loggedTxs, setLoggedTxs] = useState<LoggedTx[]>([]);

  // Animations
  const bubbleAnim = useRef(new Animated.Value(0)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const cardAnim = useRef(new Animated.Value(0)).current;
  const checkScale = useRef(new Animated.Value(0)).current;
  const confettiAnims = useRef(
    Array.from({ length: 6 }, () => ({
      x: new Animated.Value(0),
      y: new Animated.Value(0),
      opacity: new Animated.Value(0),
      scale: new Animated.Value(0),
    }))
  ).current;

  const resetAnims = () => {
    bubbleAnim.setValue(0);
    shimmerAnim.setValue(0);
    cardAnim.setValue(0);
    checkScale.setValue(0);
    confettiAnims.forEach(c => { c.x.setValue(0); c.y.setValue(0); c.opacity.setValue(0); c.scale.setValue(0); });
  };

  const handleSend = () => {
    if (!logText.trim()) return;
    const tx = parseTransaction(logText);
    setLastTx(tx);
    setLogText('');
    resetAnims();

    // Stage 1: User message bubble slides up
    setChatState('sent');
    Animated.spring(bubbleAnim, { toValue: 1, friction: 7, tension: 60, useNativeDriver: true }).start();

    // Stage 2: Shimmer processing
    setTimeout(() => {
      setChatState('processing');
      Animated.loop(
        Animated.timing(shimmerAnim, { toValue: 1, duration: 800, easing: Easing.linear, useNativeDriver: true }),
        { iterations: 2 }
      ).start();
    }, 500);

    // Stage 3: Result card pops in + check + confetti
    setTimeout(() => {
      setChatState('done');
      Animated.spring(cardAnim, { toValue: 1, friction: 6, tension: 50, useNativeDriver: true }).start();

      setTimeout(() => {
        Animated.spring(checkScale, { toValue: 1, friction: 4, tension: 100, useNativeDriver: true }).start();
        // Confetti burst
        confettiAnims.forEach((c) => {
          const angle = Math.random() * Math.PI * 2;
          const dist = 40 + Math.random() * 60;
          Animated.parallel([
            Animated.timing(c.opacity, { toValue: 1, duration: 100, useNativeDriver: true }),
            Animated.timing(c.scale, { toValue: 1, duration: 200, useNativeDriver: true }),
            Animated.timing(c.x, { toValue: Math.cos(angle) * dist, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
            Animated.timing(c.y, { toValue: Math.sin(angle) * dist, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
            Animated.sequence([
              Animated.delay(300),
              Animated.timing(c.opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
            ]),
          ]).start();
        });
      }, 300);

      // Stage 4: Add to list and reset
      setTimeout(() => {
        setLoggedTxs(prev => [tx, ...prev]);
        setChatState('idle');
        setLastTx(null);
      }, 2200);
    }, 1400);
  };

  const shimmerTranslate = shimmerAnim.interpolate({ inputRange: [0, 1], outputRange: [-CARD_WIDTH, CARD_WIDTH] });

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good morning,</Text>
            <Text style={styles.headerName}>Stanley</Text>
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
                <View><Text style={styles.cardLabel}>CARDHOLDER</Text><Text style={styles.cardVal}>STANLEY W.</Text></View>
                <View style={{ alignItems: 'flex-end' }}><Text style={styles.cardLabel}>EXPIRES</Text><Text style={styles.cardVal}>09/28</Text></View>
              </View>
            </View>
          </View>
        </View>

        {/* Balance Row */}
        <View style={styles.balRow}>
          <View style={styles.balItem}><View style={[styles.balDot, { backgroundColor: Colors.finoraGreen }]} /><View><Text style={styles.balLabel}>Income</Text><Text style={styles.balVal}>$4,500</Text></View></View>
          <View style={styles.balDiv} />
          <View style={styles.balItem}><View style={[styles.balDot, { backgroundColor: '#ff6b6b' }]} /><View><Text style={styles.balLabel}>Spent</Text><Text style={styles.balVal}>$1,240</Text></View></View>
          <View style={styles.balDiv} />
          <View style={styles.balItem}><View style={[styles.balDot, { backgroundColor: Colors.finoraSkyBlue }]} /><View><Text style={styles.balLabel}>Balance</Text><Text style={[styles.balVal, { fontWeight: '800' }]}>$12,450</Text></View></View>
        </View>

        {/* ══ AI Chat Section ══ */}
        <View style={styles.chatSection}>
          {chatState === 'idle' && (
            <View style={styles.aiBubble}>
              <Ionicons name="sparkles" size={16} color={Colors.finoraGreen} style={{ marginRight: 6 }} />
              <Text style={styles.aiBubbleText}>What did you spend on today?</Text>
            </View>
          )}

          {/* User message bubble */}
          {(chatState === 'sent' || chatState === 'processing' || chatState === 'done') && lastTx && (
            <Animated.View style={[styles.userBubble, { opacity: bubbleAnim, transform: [{ translateY: bubbleAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }, { scale: bubbleAnim }] }]}>
              <Text style={styles.userBubbleText}>{lastTx.amount.replace('-', '')} on {lastTx.title}</Text>
            </Animated.View>
          )}

          {/* Processing shimmer */}
          {chatState === 'processing' && (
            <View style={styles.processingWrap}>
              <View style={styles.processingBar}>
                <Animated.View style={[styles.shimmer, { transform: [{ translateX: shimmerTranslate }] }]} />
              </View>
              <Text style={styles.processingText}>Categorizing...</Text>
            </View>
          )}

          {/* Result card */}
          {chatState === 'done' && lastTx && (
            <Animated.View style={[styles.resultCard, { opacity: cardAnim, transform: [{ scale: cardAnim.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }) }] }]}>
              <View style={styles.resultTop}>
                <View style={styles.resultIconWrap}>
                  <Ionicons name={lastTx.icon as any} size={22} color={Colors.finoraGreen} />
                </View>
                <View style={styles.resultInfo}>
                  <Text style={styles.resultTitle}>{lastTx.title}</Text>
                  <Text style={styles.resultCat}>{lastTx.category}</Text>
                </View>
                <Text style={styles.resultAmount}>{lastTx.amount}</Text>
              </View>
              <View style={styles.resultBot}>
                <Animated.View style={[styles.checkCircle, { transform: [{ scale: checkScale }] }]}>
                  <Ionicons name="checkmark" size={16} color="#fff" />
                  {/* Confetti particles */}
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

          {/* Input */}
          <View style={styles.inputRow}>
            <TextInput
              style={styles.chatInput}
              placeholder={'e.g. "Spent $15 on coffee"'}
              placeholderTextColor={Colors.textTertiary}
              value={logText}
              onChangeText={setLogText}
              editable={chatState === 'idle'}
              onSubmitEditing={handleSend}
              returnKeyType="send"
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
          {loggedTxs.map(tx => (
            <View key={tx.id} style={styles.txRow}>
              <View style={styles.txIcon}><Ionicons name={tx.icon as any} size={20} color={Colors.textSecondary} /></View>
              <View style={{ flex: 1 }}><Text style={styles.txTitle}>{tx.title}</Text><Text style={styles.txDate}>Just now</Text></View>
              <Text style={styles.txAmt}>{tx.amount}</Text>
            </View>
          ))}
          {SEED_TRANSACTIONS.map(tx => (
            <View key={tx.id} style={styles.txRow}>
              <View style={styles.txIcon}><Ionicons name={tx.icon as any} size={20} color={Colors.textSecondary} /></View>
              <View style={{ flex: 1 }}><Text style={styles.txTitle}>{tx.title}</Text><Text style={styles.txDate}>{tx.date}</Text></View>
              <Text style={[styles.txAmt, tx.amount.startsWith('+') && { color: Colors.finoraGreenDark }]}>{tx.amount}</Text>
            </View>
          ))}
        </View>
        <View style={{ height: 100 }} />
      </ScrollView>
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

  // Wallet
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

  // Balance
  balRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: Colors.surface, padding: Spacing.base, borderRadius: BorderRadius.lg, marginBottom: Spacing['3xl'] },
  balItem: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  balDot: { width: 8, height: 8, borderRadius: 4 },
  balLabel: { fontSize: 11, color: Colors.textSecondary, marginBottom: 1 },
  balVal: { fontSize: 14, fontWeight: '600', color: Colors.text },
  balDiv: { width: 1, height: 28, backgroundColor: Colors.border, marginHorizontal: 4 },

  // Chat
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

  // Activity
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
