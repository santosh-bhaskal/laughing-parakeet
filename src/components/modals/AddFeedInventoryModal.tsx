import React, { useState, useMemo } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { MaterialIcons, Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '../../context/ThemeContext';
import { AppTheme } from '../../constants/theme';
import { inventoryService } from '../../api/services';
import DatePickerField from '../common/DatePickerField';

interface AddFeedInventoryModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddFeedInventoryModal({
  visible,
  onClose,
  onSuccess,
}: AddFeedInventoryModalProps) {
  const { theme, isDark } = useAppTheme();
  const styles = useMemo(() => createStyles(theme, isDark), [theme, isDark]);

  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [feedName, setFeedName] = useState('Starter Feed');
  const [bagsCount, setBagsCount] = useState('');
  const [driverName, setDriverName] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const feedOptions = ['Pre-Starter Feed', 'Starter Feed', 'Finisher Feed', 'Broiler Crumble'];

  const handleSubmit = async () => {
    if (!bagsCount.trim() || Number(bagsCount) <= 0) {
      Alert.alert('Required', 'Please enter a valid count of feed bags.');
      return;
    }

    setLoading(true);
    try {
      const parsedDate = date.trim() ? new Date(date.trim()) : new Date();
      const isoDate = isNaN(parsedDate.getTime()) ? new Date().toISOString() : parsedDate.toISOString();

      await inventoryService.createFeedInventory({
        date: isoDate,
        feedName,
        bagsArrivedCount: Number(bagsCount),
        driverName: driverName.trim() || 'Logistics Driver',
        driverPhoneNumber: driverPhone.trim() || 'N/A',
      });

      Alert.alert('Success', `Feed shipment saved: ${bagsCount} bags recorded.`);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setBagsCount('');
      setDriverName('');
      setDriverPhone('');
      setDate(new Date().toISOString().split('T')[0]);
      onSuccess();
      onClose();
    } catch (err: any) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const msg = err.response?.data?.message || err.message || 'Failed to add feed inventory.';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <MaterialIcons name="inventory" size={22} color={theme.colors.primary} />
              <Text style={styles.title}>Log Feed Delivery</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Feather name="x" size={20} color={theme.colors.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollForm} contentContainerStyle={styles.form}>
            {/* Delivery Date */}
            <DatePickerField
              label="DELIVERY DATE"
              value={date}
              onChange={setDate}
            />

            {/* Feed Type Selection Pills */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>SELECT FEED TYPE</Text>
              <View style={styles.pillRow}>
                {feedOptions.map((opt) => (
                  <TouchableOpacity
                    key={opt}
                    style={[styles.pill, feedName === opt && styles.pillActive]}
                    onPress={() => setFeedName(opt)}
                  >
                    <Text style={[styles.pillText, feedName === opt && styles.pillTextActive]}>
                      {opt}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Bags Count */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>BAGS ARRIVED (50KG/BAG)</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                placeholder="e.g. 100 bags"
                placeholderTextColor={theme.colors.textMuted}
                value={bagsCount}
                onChangeText={setBagsCount}
              />
            </View>

            {/* Driver Name & Phone */}
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>DRIVER NAME</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Optional"
                  placeholderTextColor={theme.colors.textMuted}
                  value={driverName}
                  onChangeText={setDriverName}
                />
              </View>

              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>CONTACT NUMBER</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="phone-pad"
                  placeholder="Optional"
                  placeholderTextColor={theme.colors.textMuted}
                  value={driverPhone}
                  onChangeText={setDriverPhone}
                />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.submitText}>Save Feed Delivery</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
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
      padding: 20,
      gap: 16,
      borderWidth: 1,
      borderColor: theme.colors.cardBorder,
    },
    scrollForm: {
      maxHeight: 520,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    title: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.colors.textPrimary,
    },
    closeButton: {
      padding: 6,
      borderRadius: 9999,
      backgroundColor: theme.colors.surfaceSubtle,
    },
    form: {
      gap: 14,
    },
    inputGroup: {
      gap: 6,
    },
    label: {
      fontSize: 11,
      fontWeight: '700',
      color: theme.colors.textMuted,
      letterSpacing: 0.4,
    },
    pillRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
    },
    pill: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 999,
      backgroundColor: theme.colors.surfaceSubtle,
      borderWidth: 1,
      borderColor: theme.colors.cardBorder,
    },
    pillActive: {
      backgroundColor: theme.colors.primaryLight,
      borderColor: theme.colors.primaryBorder,
    },
    pillText: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      fontWeight: '600',
    },
    pillTextActive: {
      color: theme.colors.primary,
      fontWeight: '700',
    },
    row: {
      flexDirection: 'row',
      gap: 12,
    },
    input: {
      borderWidth: 1,
      borderColor: theme.colors.cardBorder,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 14,
      color: theme.colors.textPrimary,
      backgroundColor: theme.colors.surfaceSubtle,
    },
    submitButton: {
      backgroundColor: theme.colors.primary,
      paddingVertical: 14,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 6,
    },
    submitButtonDisabled: {
      opacity: 0.6,
    },
    submitText: {
      color: '#fff',
      fontSize: 15,
      fontWeight: '700',
    },
  });
