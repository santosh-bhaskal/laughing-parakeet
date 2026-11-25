import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { useAppTheme } from '../../context/ThemeContext';
import { AppTheme } from '../../constants/theme';
import { authService, dashboardService, dailyRecordService } from '../../api/services';
import NotificationsModal from '../modals/NotificationsModal';

interface AppHeaderProps {
  title?: string;
  showActions?: boolean;
  onNotificationsPress?: () => void;
  hasNotificationDot?: boolean;
}

export default function AppHeader({
  title = 'Daily Poultry',
  showActions = true,
  onNotificationsPress,
  hasNotificationDot,
}: AppHeaderProps) {
  const { theme, isDark } = useAppTheme();
  const styles = useMemo(() => createStyles(theme, isDark), [theme, isDark]);
  const navigation = useNavigation();

  const [isInternalNotificationsOpen, setIsInternalNotificationsOpen] = useState(false);

  // Fetch current user (cached by react-query)
  const { data: currentUser } = useQuery({
    queryKey: ['current-user'],
    queryFn: authService.getCurrentUser,
  });

  // Fetch live telemetry (cached by react-query)
  const { data: telemetry } = useQuery({
    queryKey: ['dashboard-telemetry'],
    queryFn: dashboardService.getTelemetry,
  });

  // Fetch live daily records for notifications calculations
  const { data: dailyRecordsRes } = useQuery({
    queryKey: ['daily-records'],
    queryFn: dailyRecordService.getAll,
  });

  const aliveBirds = Number(telemetry?.totalAliveBirds ?? 0);
  const mortality = Number(telemetry?.totalMortality ?? 0);
  const feedBags = Number(telemetry?.totalFeedBagsAvailable ?? 0);

  const rawRecords: any[] = Array.isArray(dailyRecordsRes)
    ? dailyRecordsRes
    : Array.isArray((dailyRecordsRes as any)?.data)
      ? (dailyRecordsRes as any).data
      : [];

  const sortedRecords = [...rawRecords].sort((a: any, b: any) => {
    const timeA = new Date(a.date).getTime() || 0;
    const timeB = new Date(b.date).getTime() || 0;
    return timeB - timeA;
  });

  const latestAge = sortedRecords[0]?.birdAgeInDays
    ? Number(sortedRecords[0].birdAgeInDays)
    : 0;
  const targetCycleDays = 42;
  const daysLeft = latestAge > 0 ? Math.max(0, targetCycleDays - latestAge) : 0;

  const showDot =
    hasNotificationDot !== undefined
      ? hasNotificationDot
      : feedBags < 10 && aliveBirds > 0;

  const userInitial = currentUser?.name
    ? currentUser.name.charAt(0).toUpperCase()
    : 'P';

  const handleOpenNotifications = () => {
    if (onNotificationsPress) {
      onNotificationsPress();
    } else {
      setIsInternalNotificationsOpen(true);
    }
  };

  return (
    <>
      <View style={styles.header}>
        <View style={styles.headerBrand}>
          <View style={styles.logoBadge}>
            <Image
              source={require('../../../assets/navbar-logo.png')}
              style={styles.brandLogoImage}
              resizeMode="contain"
            />
          </View>
          <View style={styles.titleContainer}>
            <Text style={styles.brandTitle} numberOfLines={1} ellipsizeMode="tail">
              {title}
            </Text>
          </View>
        </View>

        {showActions && (
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={handleOpenNotifications}
              activeOpacity={0.7}
            >
              <Feather name="bell" size={20} color="#ffffff" />
              {showDot && <View style={styles.notificationDot} />}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.profileAvatar}
              onPress={() => navigation.navigate('Profile' as never)}
              activeOpacity={0.7}
            >
              <Text style={styles.avatarText}>{userInitial}</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Internal Notifications Modal when not controlled externally */}
      {!onNotificationsPress && (
        <NotificationsModal
          visible={isInternalNotificationsOpen}
          onClose={() => setIsInternalNotificationsOpen(false)}
          feedBags={feedBags}
          aliveBirds={aliveBirds}
          mortality={mortality}
          latestAge={latestAge}
          daysLeft={daysLeft}
        />
      )}
    </>
  );
}

const createStyles = (theme: AppTheme, _isDark: boolean) =>
  StyleSheet.create({
    header: {
      height: 56,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      backgroundColor: theme.colors.headerBg,
      borderBottomWidth: 0,
    },
    headerBrand: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginRight: 8,
    },
    logoBadge: {
      width: 42,
      height: 42,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 0,
      backgroundColor: 'transparent',
    },
    brandLogoImage: {
      width: 60,
      height: 60,
    },
    titleContainer: {
      flex: 1,
      justifyContent: 'center',
    },
    brandTitle: {
      fontSize: 17,
      fontWeight: '700',
      color: '#ffffff',
    },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    iconButton: {
      position: 'relative',
      padding: 6,
      borderRadius: 9999,
      backgroundColor: 'rgba(255, 255, 255, 0.15)',
    },
    notificationDot: {
      position: 'absolute',
      top: 6,
      right: 6,
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: theme.colors.amber,
      borderWidth: 1.5,
      borderColor: '#fff',
    },
    profileAvatar: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: theme.colors.primaryMedium,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: {
      color: '#fff',
      fontSize: 13,
      fontWeight: '700',
    },
  });
