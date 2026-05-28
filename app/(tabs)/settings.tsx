import React, { useEffect, useState, useCallback } from 'react';
import {
  StyleSheet, Text, View, ScrollView, TouchableOpacity,
  Switch, Alert, ActivityIndicator, Image, TextInput,
} from 'react-native';
import KeyboardAwareModal from '../../components/KeyboardAwareModal';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import {
  getFullProfile, getUserEmail, updateProfile, updatePassword,
  signOut, deleteAccount,
  type FullProfile,
} from '../../lib/services/settingsService';

const CURRENCIES = [
  { id: 'USD', symbol: '$', name: 'US Dollar' },
  { id: 'EUR', symbol: '\u20AC', name: 'Euro' },
  { id: 'GBP', symbol: '\u00A3', name: 'British Pound' },
  { id: 'CAD', symbol: '$', name: 'Canadian Dollar' },
  { id: 'AUD', symbol: '$', name: 'Australian Dollar' },
  { id: 'JPY', symbol: '\u00A5', name: 'Japanese Yen' },
];

// ── Section Row Component ──
function SettingsRow({
  icon, label, value, onPress, isDestructive, showChevron = true, rightElement,
}: {
  icon: string; label: string; value?: string; onPress?: () => void;
  isDestructive?: boolean; showChevron?: boolean; rightElement?: React.ReactNode;
}) {
  return (
    <TouchableOpacity
      style={styles.row}
      activeOpacity={onPress ? 0.6 : 1}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={[styles.rowIconWrap, isDestructive && { backgroundColor: '#ff6b6b15' }]}>
        <Ionicons
          name={icon as any}
          size={20}
          color={isDestructive ? '#ff6b6b' : Colors.textSecondary}
        />
      </View>
      <View style={styles.rowContent}>
        <Text style={[styles.rowLabel, isDestructive && { color: '#ff6b6b' }]}>{label}</Text>
        {value ? <Text style={styles.rowValue}>{value}</Text> : null}
      </View>
      {rightElement ?? null}
      {showChevron && onPress && !rightElement && (
        <Ionicons name="chevron-forward" size={18} color={Colors.textTertiary} />
      )}
    </TouchableOpacity>
  );
}

// ── Name Edit Modal ──
function EditNameModal({
  visible, currentName, onClose, onSave,
}: {
  visible: boolean; currentName: string; onClose: () => void; onSave: (name: string) => void;
}) {
  const [name, setName] = useState(currentName);
  useEffect(() => { setName(currentName); }, [currentName]);

  return (
    <KeyboardAwareModal visible={visible} onClose={onClose}>
      <Text style={modalStyles.title}>Edit Name</Text>
      <TextInput
        style={modalStyles.input}
        value={name}
        onChangeText={setName}
        placeholder="Your name"
        placeholderTextColor={Colors.textTertiary}
        autoFocus
      />
      <View style={modalStyles.actions}>
        <TouchableOpacity style={modalStyles.cancelBtn} onPress={onClose}>
          <Text style={modalStyles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[modalStyles.saveBtn, !name.trim() && { opacity: 0.4 }]}
          onPress={() => { if (name.trim()) onSave(name.trim()); }}
          disabled={!name.trim()}
        >
          <Text style={modalStyles.saveText}>Save</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAwareModal>
  );
}

// ── Currency Picker Modal ──
function CurrencyModal({
  visible, current, onClose, onSelect,
}: {
  visible: boolean; current: string; onClose: () => void; onSelect: (id: string) => void;
}) {
  return (
    <KeyboardAwareModal visible={visible} onClose={onClose}>
      <Text style={modalStyles.title}>Default Currency</Text>
      <ScrollView style={{ maxHeight: 300 }}>
        {CURRENCIES.map(c => (
          <TouchableOpacity
            key={c.id}
            style={[modalStyles.optionRow, current === c.id && modalStyles.optionSelected]}
            onPress={() => onSelect(c.id)}
          >
            <Text style={modalStyles.optionSymbol}>{c.symbol}</Text>
            <View style={{ flex: 1 }}>
              <Text style={modalStyles.optionLabel}>{c.id}</Text>
              <Text style={modalStyles.optionSub}>{c.name}</Text>
            </View>
            {current === c.id && <Ionicons name="checkmark-circle" size={22} color={Colors.finoraGreen} />}
          </TouchableOpacity>
        ))}
      </ScrollView>
      <TouchableOpacity style={modalStyles.cancelBtn} onPress={onClose}>
        <Text style={modalStyles.cancelText}>Cancel</Text>
      </TouchableOpacity>
    </KeyboardAwareModal>
  );
}

// ── Password Change Modal ──
function PasswordModal({
  visible, onClose, onSave,
}: {
  visible: boolean; onClose: () => void; onSave: (pw: string) => void;
}) {
  const [pw, setPw] = useState('');
  const [confirm, setConfirm] = useState('');
  const valid = pw.length >= 6 && pw === confirm;

  return (
    <KeyboardAwareModal visible={visible} onClose={onClose}>
      <Text style={modalStyles.title}>Change Password</Text>
      <TextInput
        style={modalStyles.input}
        value={pw}
        onChangeText={setPw}
        placeholder="New password (min 6 chars)"
        placeholderTextColor={Colors.textTertiary}
        secureTextEntry
      />
      <TextInput
        style={[modalStyles.input, { marginTop: Spacing.md }]}
        value={confirm}
        onChangeText={setConfirm}
        placeholder="Confirm new password"
        placeholderTextColor={Colors.textTertiary}
        secureTextEntry
      />
      <View style={modalStyles.actions}>
        <TouchableOpacity style={modalStyles.cancelBtn} onPress={onClose}>
          <Text style={modalStyles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[modalStyles.saveBtn, !valid && { opacity: 0.4 }]}
          onPress={() => { if (valid) onSave(pw); }}
          disabled={!valid}
        >
          <Text style={modalStyles.saveText}>Update</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAwareModal>
  );
}

// ══════════════════════════════════════════════
// MAIN SETTINGS SCREEN
// ══════════════════════════════════════════════

export default function SettingsScreen() {
  const [profile, setProfile] = useState<FullProfile | null>(null);
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Modal visibility
  const [showNameModal, setShowNameModal] = useState(false);
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [p, e] = await Promise.all([getFullProfile(), getUserEmail()]);
      setProfile(p);
      setEmail(e);
    } catch (err: any) {
      console.error('Settings load error:', err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleUpdateName = async (name: string) => {
    setShowNameModal(false);
    setIsSaving(true);
    try {
      await updateProfile({ display_name: name });
      setProfile(prev => prev ? { ...prev, display_name: name } : prev);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
    setIsSaving(false);
  };

  const handleUpdateCurrency = async (currency: string) => {
    setShowCurrencyModal(false);
    setIsSaving(true);
    try {
      await updateProfile({ currency });
      setProfile(prev => prev ? { ...prev, currency } : prev);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
    setIsSaving(false);
  };

  const handleUpdatePassword = async (pw: string) => {
    setShowPasswordModal(false);
    setIsSaving(true);
    try {
      await updatePassword(pw);
      Alert.alert('Done', 'Your password has been updated.');
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
    setIsSaving(false);
  };

  const handleToggleBackup = async (val: boolean) => {
    setIsSaving(true);
    try {
      await updateProfile({ auto_backup: val });
      setProfile(prev => prev ? { ...prev, auto_backup: val } : prev);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
    setIsSaving(false);
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out', style: 'destructive',
        onPress: async () => {
          try {
            await signOut();
            router.replace('/auth' as any);
          } catch (err: any) {
            Alert.alert('Error', err.message);
          }
        },
      },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all your data. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: () => {
            Alert.alert('Are you absolutely sure?', 'All transactions, budgets, and goals will be lost forever.', [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Yes, delete everything', style: 'destructive',
                onPress: async () => {
                  try {
                    await deleteAccount();
                    router.replace('/auth' as any);
                  } catch (err: any) {
                    Alert.alert('Error', err.message);
                  }
                },
              },
            ]);
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={Colors.finoraGreen} />
      </SafeAreaView>
    );
  }

  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : '';

  const currencyLabel = CURRENCIES.find(c => c.id === profile?.currency)?.name ?? profile?.currency ?? 'USD';

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Modals */}
      <EditNameModal
        visible={showNameModal}
        currentName={profile?.display_name ?? ''}
        onClose={() => setShowNameModal(false)}
        onSave={handleUpdateName}
      />
      <CurrencyModal
        visible={showCurrencyModal}
        current={profile?.currency ?? 'USD'}
        onClose={() => setShowCurrencyModal(false)}
        onSelect={handleUpdateCurrency}
      />
      <PasswordModal
        visible={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onSave={handleUpdatePassword}
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <Text style={styles.pageTitle}>Settings</Text>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileAvatarWrap}>
            <Image source={require('../../assets/finora-icon.png')} style={styles.profileAvatar} resizeMode="cover" />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{profile?.display_name ?? 'User'}</Text>
            <Text style={styles.profileEmail}>{email}</Text>
            <Text style={styles.profileMember}>Member since {memberSince}</Text>
          </View>
        </View>

        {/* Saving indicator */}
        {isSaving && (
          <View style={styles.savingBar}>
            <ActivityIndicator size="small" color={Colors.finoraGreen} />
            <Text style={styles.savingText}>Saving...</Text>
          </View>
        )}

        {/* Account Section */}
        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.sectionCard}>
          <SettingsRow icon="person-outline" label="Display Name" value={profile?.display_name} onPress={() => setShowNameModal(true)} />
          <View style={styles.separator} />
          <SettingsRow icon="mail-outline" label="Email" value={email} />
          <View style={styles.separator} />
          <SettingsRow icon="lock-closed-outline" label="Change Password" onPress={() => setShowPasswordModal(true)} />
        </View>

        {/* Preferences Section */}
        <Text style={styles.sectionTitle}>Preferences</Text>
        <View style={styles.sectionCard}>
          <SettingsRow icon="cash-outline" label="Default Currency" value={currencyLabel} onPress={() => setShowCurrencyModal(true)} />
          <View style={styles.separator} />
          <SettingsRow
            icon="cloud-outline"
            label="Auto Backup"
            showChevron={false}
            rightElement={
              <Switch
                value={profile?.auto_backup ?? true}
                onValueChange={handleToggleBackup}
                trackColor={{ false: Colors.border, true: Colors.finoraGreen + '50' }}
                thumbColor={profile?.auto_backup ? Colors.finoraGreen : Colors.textTertiary}
              />
            }
          />
        </View>

        {/* About Section */}
        <Text style={styles.sectionTitle}>About</Text>
        <View style={styles.sectionCard}>
          <SettingsRow icon="information-circle-outline" label="Version" value="1.0.0" showChevron={false} />
          <View style={styles.separator} />
          <SettingsRow icon="document-text-outline" label="Terms of Service" onPress={() => {}} />
          <View style={styles.separator} />
          <SettingsRow icon="shield-checkmark-outline" label="Privacy Policy" onPress={() => {}} />
        </View>

        {/* Danger Zone */}
        <Text style={styles.sectionTitle}>Danger Zone</Text>
        <View style={styles.sectionCard}>
          <SettingsRow icon="log-out-outline" label="Sign Out" onPress={handleSignOut} isDestructive />
          <View style={styles.separator} />
          <SettingsRow icon="trash-outline" label="Delete Account" onPress={handleDeleteAccount} isDestructive />
        </View>

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

  pageTitle: {
    fontSize: Typography.sizes.heading,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.xl,
  },

  // Profile card
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: Spacing.lg,
    borderRadius: BorderRadius['2xl'],
    marginBottom: Spacing['3xl'],
  },
  profileAvatarWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.background,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: Colors.finoraGreen + '30',
    marginRight: Spacing.base,
  },
  profileAvatar: { width: '100%', height: '100%' },
  profileInfo: { flex: 1 },
  profileName: { fontSize: Typography.sizes.subheading, fontWeight: '700', color: Colors.text },
  profileEmail: { fontSize: Typography.sizes.caption, color: Colors.textSecondary, marginTop: 2 },
  profileMember: { fontSize: 12, color: Colors.textTertiary, marginTop: 4 },

  // Saving bar
  savingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 8,
    marginBottom: Spacing.md,
  },
  savingText: { fontSize: 13, color: Colors.finoraGreenDark, fontWeight: '500' },

  // Section
  sectionTitle: {
    fontSize: Typography.sizes.caption,
    fontWeight: '600',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: Spacing.md,
  },
  sectionCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius['2xl'],
    overflow: 'hidden',
    marginBottom: Spacing['2xl'],
  },
  separator: {
    height: 1,
    backgroundColor: Colors.borderSubtle,
    marginLeft: 60,
  },

  // Row
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: Spacing.base,
  },
  rowIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  rowContent: { flex: 1 },
  rowLabel: { fontSize: Typography.sizes.body, fontWeight: '500', color: Colors.text },
  rowValue: { fontSize: Typography.sizes.caption, color: Colors.textSecondary, marginTop: 1 },
});

// ── Modal Styles ──
const modalStyles = StyleSheet.create({
  title: {
    fontSize: Typography.sizes.headingSm,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.xl,
  },
  input: {
    fontSize: Typography.sizes.body,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.base,
    paddingVertical: 14,
    backgroundColor: Colors.surface,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.md,
    marginTop: Spacing.xl,
  },
  cancelBtn: {
    paddingVertical: 12,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.pill,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cancelText: { fontSize: Typography.sizes.body, fontWeight: '500', color: Colors.text },
  saveBtn: {
    paddingVertical: 12,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.pill,
    backgroundColor: Colors.finoraGreen,
  },
  saveText: { fontSize: Typography.sizes.body, fontWeight: '600', color: '#ffffff' },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: Spacing.base,
    borderRadius: BorderRadius.lg,
    marginBottom: 4,
  },
  optionSelected: {
    backgroundColor: Colors.finoraGreen + '10',
  },
  optionSymbol: {
    width: 36,
    fontSize: Typography.sizes.subheading,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
    marginRight: Spacing.md,
  },
  optionLabel: { fontSize: Typography.sizes.body, fontWeight: '600', color: Colors.text },
  optionSub: { fontSize: Typography.sizes.caption, color: Colors.textSecondary, marginTop: 1 },
});
