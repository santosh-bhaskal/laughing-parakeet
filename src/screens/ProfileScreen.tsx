import React, { useState, useMemo } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Switch,
  Platform,
  Image,
  Alert,
} from "react-native";
import { MaterialIcons, Feather } from "@expo/vector-icons";
import { AppTheme } from "../constants/theme";
import { dashboardService } from "../api/services";
import AppHeader from "../components/common/AppHeader";
import { ProfileSkeleton } from "../components/common/Skeleton";
import { useQuery } from "@tanstack/react-query";
import { useAppTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";

export default function ProfileScreen() {
  const { theme, isDark, themeMode, setThemeMode } = useAppTheme();
  const styles = useMemo(() => createStyles(theme, isDark), [theme, isDark]);
  const { user: currentUser, logout, isLoading: isAuthLoading } = useAuth();

  const { data: telemetry } = useQuery({
    queryKey: ["dashboardTelemetry"],
    queryFn: dashboardService.getTelemetry,
  });

  const handleLogout = async () => {
    Alert.alert("Sign Out", "Are you sure you want to log out of your farm account?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await logout();
        },
      },
    ]);
  };

  return (
    <View style={styles.safeArea}>
      <AppHeader title="Farm Profile & Settings" />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {isAuthLoading && !currentUser ? (
          <ProfileSkeleton />
        ) : (
          <>
            {/* User Card */}
            <View style={styles.userCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : "F"}
            </Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>
              {currentUser?.name || "Farm Administrator"}
            </Text>
            <Text style={styles.userEmail}>
              {currentUser?.email || "admin@poultryfarm.com"}
            </Text>
          </View>
        </View>

        {/* Appearance & Theme Selector */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionTitleRow}>
            <MaterialIcons name="palette" size={18} color={theme.colors.primary} />
            <Text style={styles.sectionTitle}>Appearance & Display</Text>
          </View>

          {/* Quick Toggle Switch */}
          <View style={styles.switchRow}>
            <View style={styles.switchLabelRow}>
              <View
                style={[
                  styles.switchIconBox,
                  { backgroundColor: isDark ? "#1e293b" : "#ecfdf5" },
                ]}>
                <Feather
                  name={isDark ? "moon" : "sun"}
                  size={18}
                  color={theme.colors.primary}
                />
              </View>
              <View>
                <Text style={styles.switchTitle}>Dark Mode</Text>
                <Text style={styles.switchSubtitle}>
                  {themeMode === "system"
                    ? `System Default (${isDark ? "Dark" : "Light"})`
                    : isDark
                      ? "Dark mode active"
                      : "Light mode active"}
                </Text>
              </View>
            </View>
            <Switch
              value={isDark}
              onValueChange={(val) => setThemeMode(val ? "dark" : "light")}
              trackColor={{ false: "#cbd5e1", true: theme.colors.primary }}
              thumbColor={
                Platform.OS === "android" ? (isDark ? "#ffffff" : "#f8fafc") : "#ffffff"
              }
            />
          </View>

          {/* Mode Selector Chips */}
          <View style={styles.themeSelectorRow}>
            <TouchableOpacity
              style={[
                styles.themeOptionBtn,
                themeMode === "system" && styles.themeOptionBtnActive,
              ]}
              onPress={() => setThemeMode("system")}
              activeOpacity={0.7}>
              <MaterialIcons
                name="settings-brightness"
                size={16}
                color={
                  themeMode === "system" ? theme.colors.primary : theme.colors.textMuted
                }
              />
              <Text
                style={[
                  styles.themeOptionText,
                  themeMode === "system" && styles.themeOptionTextActive,
                ]}>
                System
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.themeOptionBtn,
                themeMode === "light" && styles.themeOptionBtnActive,
              ]}
              onPress={() => setThemeMode("light")}
              activeOpacity={0.7}>
              <Feather
                name="sun"
                size={16}
                color={
                  themeMode === "light" ? theme.colors.primary : theme.colors.textMuted
                }
              />
              <Text
                style={[
                  styles.themeOptionText,
                  themeMode === "light" && styles.themeOptionTextActive,
                ]}>
                Light
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.themeOptionBtn,
                themeMode === "dark" && styles.themeOptionBtnActive,
              ]}
              onPress={() => setThemeMode("dark")}
              activeOpacity={0.7}>
              <Feather
                name="moon"
                size={16}
                color={
                  themeMode === "dark" ? theme.colors.primary : theme.colors.textMuted
                }
              />
              <Text
                style={[
                  styles.themeOptionText,
                  themeMode === "dark" && styles.themeOptionTextActive,
                ]}>
                Dark
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Current Active Flock Information */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Active Flock Summary</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Active Batch ID</Text>
            <Text style={styles.infoValue}>
              {telemetry?.activeBatchId
                ? `#${telemetry.activeBatchId}`
                : "No active batch"}
            </Text>
          </View>
        </View>

        {/* Account Actions */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Feather name="log-out" size={18} color={theme.colors.rose} />
            <Text style={styles.logoutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
        </>
        )}
      </ScrollView>
    </View>
  );
}

const createStyles = (theme: AppTheme, isDark: boolean) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      height: 56,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      backgroundColor: theme.colors.headerBg,
      borderBottomWidth: 0,
    },
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    headerLogo: {
      width: 42,
      height: 42,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: "#ffffff",
    },
    scrollView: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    content: {
      padding: 16,
      gap: 14,
    },
    userCard: {
      backgroundColor: theme.colors.surface,
      padding: 18,
      borderRadius: theme.borderRadius.lg,
      borderWidth: 1,
      borderColor: theme.colors.cardBorder,
      flexDirection: "row",
      alignItems: "center",
      gap: 16,
    },
    avatar: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: theme.colors.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    avatarText: {
      fontSize: 24,
      fontWeight: "800",
      color: "#fff",
    },
    userInfo: {
      flex: 1,
      gap: 4,
    },
    userName: {
      fontSize: 17,
      fontWeight: "700",
      color: theme.colors.textPrimary,
    },
    userEmail: {
      fontSize: 13,
      color: theme.colors.textMuted,
    },
    roleBadge: {
      alignSelf: "flex-start",
      backgroundColor: theme.colors.primaryLight,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: theme.borderRadius.sm,
      marginTop: 4,
    },
    roleText: {
      fontSize: 10,
      fontWeight: "700",
      color: theme.colors.primary,
      letterSpacing: 0.5,
    },
    sectionCard: {
      backgroundColor: theme.colors.surface,
      padding: 16,
      borderRadius: theme.borderRadius.lg,
      borderWidth: 1,
      borderColor: theme.colors.cardBorder,
      gap: 12,
    },
    sectionTitleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    sectionTitle: {
      fontSize: 13,
      fontWeight: "700",
      color: theme.colors.textPrimary,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    switchRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 6,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.surfaceBorder,
      paddingBottom: 12,
    },
    switchLabelRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    switchIconBox: {
      width: 36,
      height: 36,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
    },
    switchTitle: {
      fontSize: 14,
      fontWeight: "700",
      color: theme.colors.textPrimary,
    },
    switchSubtitle: {
      fontSize: 12,
      color: theme.colors.textMuted,
      marginTop: 1,
    },
    themeSelectorRow: {
      flexDirection: "row",
      backgroundColor: theme.colors.surfaceSubtle,
      borderRadius: theme.borderRadius.md,
      padding: 4,
      gap: 4,
    },
    themeOptionBtn: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      paddingVertical: 10,
      borderRadius: theme.borderRadius.sm,
    },
    themeOptionBtnActive: {
      backgroundColor: theme.colors.surface,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.15,
      shadowRadius: 2,
      elevation: 2,
    },
    themeOptionText: {
      fontSize: 12,
      fontWeight: "600",
      color: theme.colors.textMuted,
    },
    themeOptionTextActive: {
      color: theme.colors.primary,
      fontWeight: "700",
    },
    infoRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 4,
    },
    infoLabel: {
      fontSize: 13,
      color: theme.colors.textSecondary,
    },
    infoValue: {
      fontSize: 13,
      fontWeight: "600",
      color: theme.colors.textPrimary,
    },
    infoValueGreen: {
      fontSize: 13,
      fontWeight: "700",
      color: theme.colors.primary,
    },
    infoSubText: {
      fontSize: 12,
      color: theme.colors.textMuted,
    },
    actionsContainer: {
      marginTop: 8,
    },
    logoutButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      backgroundColor: theme.colors.roseLight,
      paddingVertical: 14,
      borderRadius: theme.borderRadius.md,
      borderWidth: 1,
      borderColor: theme.colors.roseBorder,
    },
    logoutText: {
      fontSize: 14,
      fontWeight: "700",
      color: theme.colors.rose,
    },
    loginButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      backgroundColor: theme.colors.primary,
      paddingVertical: 14,
      borderRadius: theme.borderRadius.md,
    },
    loginText: {
      fontSize: 14,
      fontWeight: "700",
      color: "#fff",
    },
  });
