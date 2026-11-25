import React, { useMemo } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { MaterialIcons, Feather } from '@expo/vector-icons';
import { AppTheme } from '../../constants/theme';
import { useAppTheme } from '../../context/ThemeContext';

interface NotificationsModalProps {
  visible: boolean;
  onClose: () => void;
  feedBags: number;
  aliveBirds: number;
  mortality: number;
  latestAge: number;
  daysLeft: number;
}

export default function NotificationsModal({
  visible,
  onClose,
  feedBags,
  aliveBirds,
  mortality,
  latestAge,
  daysLeft,
}: NotificationsModalProps) {
  const { theme, isDark } = useAppTheme();
  const styles = useMemo(() => createStyles(theme, isDark), [theme, isDark]);

  const notifications: Array<{
    id: string;
    type: 'warning' | 'info' | 'success';
    title: string;
    message: string;
    time: string;
    icon: keyof typeof MaterialIcons.glyphMap;
  }> = [];

  // 1. Feed Stock Alert
  if (feedBags < 10 && aliveBirds > 0) {
    notifications.push({
      id: 'feed_low',
      type: 'warning',
      title: 'Low Feed Stock Alert',
      message: `Only ${feedBags} bags remaining in inventory. Place reorder with supplier soon.`,
      time: 'Immediate Attention',
      icon: 'inventory',
    });
  }

  // 2. Mortality Alert
  if (mortality > 20) {
    notifications.push({
      id: 'mortality_high',
      type: 'warning',
      title: 'Elevated Flock Mortality',
      message: `Cumulative flock mortality is at ${mortality} birds. Review shed ventilation & temperature.`,
      time: 'Flock Health',
      icon: 'warning',
    });
  }

  // 3. Lifecycle & Harvest Update
  if (latestAge > 0) {
    notifications.push({
      id: 'cycle_update',
      type: 'info',
      title: `Cycle Progress: Day ${latestAge}`,
      message: `${daysLeft > 0 ? `${daysLeft} days remaining until target harvest.` : 'Flock has reached harvest maturity.'}`,
      time: 'Flock Lifecycle',
      icon: 'timelapse',
    });
  }

  // 4. Daily Log Reminder
  notifications.push({
    id: 'daily_reminder',
    type: 'info',
    title: 'Daily Farm Ledger',
    message: 'Remember to record today’s feed consumption and mortality before 8:00 PM.',
    time: 'Daily Schedule',
    icon: 'edit-calendar',
  });

  // 5. System Status
  notifications.push({
    id: 'system_sync',
    type: 'success',
    title: 'Cloud Sync Active',
    message: 'All flock telemetry is continuously synchronized with production API.',
    time: 'System',
    icon: 'cloud-done',
  });

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <View style={styles.bellIconWrap}>
                <Feather name="bell" size={18} color={theme.colors.primary} />
              </View>
              <View>
                <Text style={styles.title}>Farm Notifications</Text>
                <Text style={styles.subtitle}>
                  {notifications.length} active updates & alerts
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Feather name="x" size={20} color={theme.colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* List */}
          <ScrollView style={styles.scrollList} contentContainerStyle={styles.listContent}>
            {notifications.map((item) => (
              <View
                key={item.id}
                style={[
                  styles.notificationItem,
                  item.type === 'warning' && styles.itemWarning,
                  item.type === 'success' && styles.itemSuccess,
                ]}
              >
                <View
                  style={[
                    styles.iconBox,
                    item.type === 'warning' && styles.iconBoxWarning,
                    item.type === 'success' && styles.iconBoxSuccess,
                  ]}
                >
                  <MaterialIcons
                    name={item.icon}
                    size={20}
                    color={
                      item.type === 'warning'
                        ? theme.colors.rose
                        : item.type === 'success'
                        ? theme.colors.primary
                        : theme.colors.primaryMedium
                    }
                  />
                </View>

                <View style={styles.textBox}>
                  <View style={styles.notifHeaderRow}>
                    <Text style={styles.notifTitle}>{item.title}</Text>
                    <Text style={styles.notifTime}>{item.time}</Text>
                  </View>
                  <Text style={styles.notifMessage}>{item.message}</Text>
                </View>
              </View>
            ))}
          </ScrollView>

          {/* Dismiss button */}
          <TouchableOpacity style={styles.dismissBtn} onPress={onClose}>
            <Text style={styles.dismissBtnText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (theme: AppTheme, isDark: boolean) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(15, 23, 42, 0.6)',
      justifyContent: 'flex-end',
    },
    container: {
      backgroundColor: theme.colors.surface,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      maxHeight: '80%',
      padding: 20,
      gap: 14,
      borderWidth: StyleSheet.hairlineWidth || 1,
      borderColor: theme.colors.cardBorder,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingBottom: 8,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.surfaceBorder,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    bellIconWrap: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: theme.colors.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.colors.textPrimary,
    },
    subtitle: {
      fontSize: 11,
      color: theme.colors.textMuted,
      marginTop: 1,
    },
    closeBtn: {
      padding: 6,
    },
    scrollList: {
      maxHeight: 400,
    },
    listContent: {
      gap: 10,
      paddingVertical: 4,
    },
    notificationItem: {
      flexDirection: 'row',
      padding: 12,
      borderRadius: theme.borderRadius.md,
      backgroundColor: theme.colors.surfaceSubtle,
      borderWidth: 1,
      borderColor: theme.colors.surfaceBorder,
      gap: 12,
    },
    itemWarning: {
      backgroundColor: theme.colors.roseLight,
      borderColor: theme.colors.roseBorder,
    },
    itemSuccess: {
      backgroundColor: theme.colors.primaryLight,
      borderColor: theme.colors.primaryBorder,
    },
    iconBox: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: theme.colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    iconBoxWarning: {
      backgroundColor: theme.colors.roseLight,
    },
    iconBoxSuccess: {
      backgroundColor: theme.colors.primaryLight,
    },
    textBox: {
      flex: 1,
      gap: 2,
    },
    notifHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    notifTitle: {
      fontSize: 13,
      fontWeight: '700',
      color: theme.colors.textPrimary,
    },
    notifTime: {
      fontSize: 10,
      fontWeight: '600',
      color: theme.colors.textMuted,
    },
    notifMessage: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      lineHeight: 17,
    },
    dismissBtn: {
      backgroundColor: theme.colors.primary,
      paddingVertical: 12,
      borderRadius: theme.borderRadius.md,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 4,
    },
    dismissBtnText: {
      color: '#fff',
      fontSize: 14,
      fontWeight: '700',
    },
  });
