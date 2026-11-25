import React, { useState, useMemo } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Image,
} from "react-native";
import { MaterialIcons, Feather, AntDesign } from "@expo/vector-icons";
import { AppTheme } from "../constants/theme";
import { useAppTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { DEFAULT_API_URL, updateApiBaseUrl, apiClient } from "../api/client";

export default function LoginScreen() {
  const { theme, isDark } = useAppTheme();
  const styles = useMemo(() => createStyles(theme, isDark), [theme, isDark]);
  const { login, signup } = useAuth();

  const [isLogin, setIsLogin] = useState(true);

  // Sign In state
  const [identifier, setIdentifier] = useState("");
  const [signInPassword, setSignInPassword] = useState("");
  const [showSignInPassword, setShowSignInPassword] = useState(false);
  const [keepSignedIn, setKeepSignedIn] = useState(true);

  // Sign Up state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);

  const [loading, setLoading] = useState(false);

  // Server URL configuration dialog
  const [showServerConfig, setShowServerConfig] = useState(false);
  const [customUrl, setCustomUrl] = useState(
    apiClient.defaults.baseURL || DEFAULT_API_URL,
  );

  const isSignInEmailValid = identifier.trim().length > 3 && identifier.includes("@");
  const isPhoneValid = phone.trim().length >= 10;

  // Handle Sign In submission
  const handleSignIn = async () => {
    const trimmedId = identifier.trim();
    const trimmedPass = signInPassword.trim();

    if (!trimmedId || !trimmedPass) {
      Alert.alert("Required Fields", "Please enter your username/email and password.");
      return;
    }

    setLoading(true);
    try {
      await login({ email: trimmedId, password: trimmedPass });
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        "Authentication failed. Please check your credentials or server connection.";
      Alert.alert("Sign In Failed", msg);
    } finally {
      setLoading(false);
    }
  };

  // Handle Sign Up submission
  const handleSignUp = async () => {
    const fName = firstName.trim();
    const lName = lastName.trim();
    const trimmedEmail = email.trim();
    const trimmedPhone = phone.trim();
    const trimmedPass = signUpPassword.trim();

    if (!fName || !trimmedEmail || !trimmedPass) {
      Alert.alert(
        "Required Fields",
        "Please fill in your name, email address, and password.",
      );
      return;
    }

    if (trimmedPass !== confirmPassword.trim()) {
      Alert.alert(
        "Password Mismatch",
        "Passwords do not match. Please ensure both passwords match.",
      );
      return;
    }

    if (!agreeTerms) {
      Alert.alert(
        "Terms & Conditions",
        "Please agree to the Terms & Conditions to proceed.",
      );
      return;
    }

    setLoading(true);
    try {
      const fullName = `${fName} ${lName}`.trim();
      await signup({
        name: fullName,
        email: trimmedEmail,
        password: trimmedPass,
        ...(trimmedPhone ? { phone: trimmedPhone } : {}),
      } as any);
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        "Registration failed. Please check your details or server connection.";
      Alert.alert("Registration Failed", msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    Alert.alert(
      "Google Sign-In",
      "Google OAuth can be connected with your workspace credentials. Please use your standard farm credentials for direct mobile access.",
      [{ text: "OK" }],
    );
  };

  const handleForgotPassword = () => {
    Alert.alert(
      "Reset Password",
      "Please contact your farm administrator or use the web dashboard to reset your password.",
      [{ text: "OK" }],
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.safeArea}
      behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View style={styles.container}>
          {/* Logo Section */}
          <View style={styles.logoSection}>
            <Image
              source={require("../../assets/rooster-logo.png")}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>

          {isLogin ? (
            /* =================================================== */
            /*                 SIGN IN SCREEN                      */
            /* =================================================== */
            <>
              {/* Header */}
              <View style={styles.headerSection}>
                <Text style={styles.titleText}>Let's Sign You In</Text>
                <Text style={styles.subtitleText}>Welcome back, you've been missed!</Text>
              </View>

              {/* Form */}
              <View style={styles.formContainer}>
                {/* Username or Email */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Username or Email</Text>
                  <View style={styles.inputBox}>
                    <MaterialIcons
                      name="person"
                      size={20}
                      color={theme.colors.textMuted}
                      style={styles.inputLeftIcon}
                    />
                    <TextInput
                      style={styles.textInput}
                      placeholder="marcus@flockflow.io"
                      placeholderTextColor={theme.colors.textMuted}
                      value={identifier}
                      onChangeText={setIdentifier}
                      autoCapitalize="none"
                      keyboardType="email-address"
                    />
                    {isSignInEmailValid && (
                      <MaterialIcons
                        name="check-circle"
                        size={20}
                        color="#166534"
                        style={styles.inputRightIcon}
                      />
                    )}
                  </View>
                </View>

                {/* Password */}
                <View style={styles.fieldGroup}>
                  <View style={styles.passwordLabelRow}>
                    <Text style={styles.fieldLabel}>Password</Text>
                    <TouchableOpacity onPress={handleForgotPassword} activeOpacity={0.7}>
                      <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.inputBox}>
                    <MaterialIcons
                      name="lock"
                      size={20}
                      color={theme.colors.textMuted}
                      style={styles.inputLeftIcon}
                    />
                    <TextInput
                      style={[styles.textInput, styles.passwordInput]}
                      placeholder="••••••••"
                      placeholderTextColor={theme.colors.textMuted}
                      value={signInPassword}
                      onChangeText={setSignInPassword}
                      secureTextEntry={!showSignInPassword}
                      autoCapitalize="none"
                    />
                    <TouchableOpacity
                      style={styles.eyeBtn}
                      onPress={() => setShowSignInPassword(!showSignInPassword)}
                      activeOpacity={0.7}>
                      <MaterialIcons
                        name={showSignInPassword ? "visibility-off" : "visibility"}
                        size={20}
                        color={theme.colors.textMuted}
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Keep Me Signed In */}
                <TouchableOpacity
                  style={styles.keepSignedInRow}
                  onPress={() => setKeepSignedIn(!keepSignedIn)}
                  activeOpacity={0.8}>
                  <View style={[styles.checkbox, keepSignedIn && styles.checkboxActive]}>
                    {keepSignedIn && (
                      <MaterialIcons
                        name="check"
                        size={14}
                        color="#ffffff"
                        style={{ fontWeight: "bold" }}
                      />
                    )}
                  </View>
                  <Text style={styles.keepSignedInText}>Keep me signed in</Text>
                </TouchableOpacity>

                {/* Primary CTA: SIGN IN */}
                <TouchableOpacity
                  style={[styles.ctaBtn, loading && styles.btnDisabled]}
                  onPress={handleSignIn}
                  disabled={loading}
                  activeOpacity={0.88}>
                  {loading ? (
                    <View style={styles.loadingRow}>
                      <ActivityIndicator size="small" color="#ffffff" />
                      <Text style={styles.loadingBtnText}>Signing In...</Text>
                    </View>
                  ) : (
                    <>
                      <Text style={styles.ctaBtnText}>SIGN IN</Text>
                      <MaterialIcons name="arrow-forward" size={22} color="#ffffff" />
                    </>
                  )}
                </TouchableOpacity>

                {/* Divider */}
                <View style={styles.dividerRow}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>or</Text>
                  <View style={styles.dividerLine} />
                </View>

                {/* Sign in with Google */}
                <TouchableOpacity
                  style={styles.googlePillBtn}
                  onPress={handleGoogleSignIn}
                  activeOpacity={0.85}>
                  <AntDesign
                    name="google"
                    size={18}
                    color="#4285F4"
                    style={styles.googleIcon}
                  />
                  <Text style={styles.googlePillText}>Sign in with Google</Text>
                </TouchableOpacity>
              </View>

              {/* Switch Prompt Footer */}
              <View style={styles.switchPromptFooter}>
                <Text style={styles.switchPromptText}>Don't have an account?</Text>
                <TouchableOpacity onPress={() => setIsLogin(false)} activeOpacity={0.7}>
                  <Text style={styles.switchPromptLink}>Sign up</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            /* =================================================== */
            /*                 SIGN UP SCREEN                      */
            /* =================================================== */
            <>
              {/* Header */}
              <View style={styles.headerSection}>
                <Text style={styles.titleText}>Getting Started</Text>
                <Text style={styles.subtitleText}>Create an account to continue!</Text>
              </View>

              {/* Form */}
              <View style={styles.formContainer}>
                {/* 2-Column: First Name & Last Name */}
                <View style={styles.nameRow}>
                  <View style={styles.nameCol}>
                    <Text style={styles.fieldLabel}>First Name</Text>
                    <View style={styles.inputBox}>
                      <MaterialIcons
                        name="person"
                        size={20}
                        color={theme.colors.textMuted}
                        style={styles.inputLeftIcon}
                      />
                      <TextInput
                        style={styles.textInput}
                        placeholder="First name"
                        placeholderTextColor={theme.colors.textMuted}
                        value={firstName}
                        onChangeText={setFirstName}
                        autoCapitalize="words"
                      />
                    </View>
                  </View>

                  <View style={styles.nameCol}>
                    <Text style={styles.fieldLabel}>Last Name</Text>
                    <View style={styles.inputBox}>
                      <MaterialIcons
                        name="person"
                        size={20}
                        color={theme.colors.textMuted}
                        style={styles.inputLeftIcon}
                      />
                      <TextInput
                        style={styles.textInput}
                        placeholder="Last name"
                        placeholderTextColor={theme.colors.textMuted}
                        value={lastName}
                        onChangeText={setLastName}
                        autoCapitalize="words"
                      />
                    </View>
                  </View>
                </View>

                {/* Email */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Email</Text>
                  <View style={styles.inputBox}>
                    <MaterialIcons
                      name="mail"
                      size={20}
                      color={theme.colors.textMuted}
                      style={styles.inputLeftIcon}
                    />
                    <TextInput
                      style={styles.textInput}
                      placeholder="john.wick@gmail.com"
                      placeholderTextColor={theme.colors.textMuted}
                      value={email}
                      onChangeText={setEmail}
                      autoCapitalize="none"
                      keyboardType="email-address"
                    />
                  </View>
                </View>

                {/* Phone Number with India Flag */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Phone Number</Text>
                  <View style={styles.inputBox}>
                    <View style={styles.phonePrefixRow}>
                      <Text style={styles.flagIcon}>🇮🇳</Text>
                      <Text style={styles.phoneDialCode}>+91</Text>
                      <Text style={styles.phoneDivider}>|</Text>
                    </View>
                    <TextInput
                      style={styles.textInput}
                      placeholder="Phone number"
                      placeholderTextColor={theme.colors.textMuted}
                      value={phone}
                      onChangeText={setPhone}
                      keyboardType="phone-pad"
                      maxLength={10}
                    />
                    {isPhoneValid && (
                      <MaterialIcons
                        name="check"
                        size={20}
                        color="#166534"
                        style={styles.inputRightIcon}
                      />
                    )}
                  </View>
                </View>

                {/* Password */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Password</Text>
                  <View style={styles.inputBox}>
                    <MaterialIcons
                      name="lock"
                      size={20}
                      color={theme.colors.textMuted}
                      style={styles.inputLeftIcon}
                    />
                    <TextInput
                      style={[styles.textInput, styles.passwordInput]}
                      placeholder="Create password"
                      placeholderTextColor={theme.colors.textMuted}
                      value={signUpPassword}
                      onChangeText={setSignUpPassword}
                      secureTextEntry={!showSignUpPassword}
                      autoCapitalize="none"
                    />
                    <TouchableOpacity
                      style={styles.eyeBtn}
                      onPress={() => setShowSignUpPassword(!showSignUpPassword)}
                      activeOpacity={0.7}>
                      <MaterialIcons
                        name={showSignUpPassword ? "visibility-off" : "visibility"}
                        size={20}
                        color={theme.colors.textMuted}
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Confirm Password */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Confirm Password</Text>
                  <View style={styles.inputBox}>
                    <MaterialIcons
                      name="lock-outline"
                      size={20}
                      color={theme.colors.textMuted}
                      style={styles.inputLeftIcon}
                    />
                    <TextInput
                      style={[styles.textInput, styles.passwordInput]}
                      placeholder="Confirm password"
                      placeholderTextColor={theme.colors.textMuted}
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      secureTextEntry={!showConfirmPassword}
                      autoCapitalize="none"
                    />
                    {confirmPassword.length > 0 && confirmPassword === signUpPassword && (
                      <MaterialIcons
                        name="check-circle"
                        size={20}
                        color="#166534"
                        style={{ marginRight: 4 }}
                      />
                    )}
                    <TouchableOpacity
                      style={styles.eyeBtn}
                      onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                      activeOpacity={0.7}>
                      <MaterialIcons
                        name={showConfirmPassword ? "visibility-off" : "visibility"}
                        size={20}
                        color={theme.colors.textMuted}
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Terms and Conditions */}
                <TouchableOpacity
                  style={styles.termsRow}
                  onPress={() => setAgreeTerms(!agreeTerms)}
                  activeOpacity={0.8}>
                  <View style={[styles.checkbox, agreeTerms && styles.checkboxActive]}>
                    {agreeTerms && (
                      <MaterialIcons
                        name="check"
                        size={14}
                        color="#ffffff"
                        style={{ fontWeight: "bold" }}
                      />
                    )}
                  </View>
                  <Text style={styles.termsText}>
                    By creating an account, you agree to our{" "}
                    <Text style={styles.termsHighlight}>Terms & Conditions</Text>
                  </Text>
                </TouchableOpacity>

                {/* Primary CTA: SIGN UP */}
                <TouchableOpacity
                  style={[styles.ctaBtn, loading && styles.btnDisabled]}
                  onPress={handleSignUp}
                  disabled={loading}
                  activeOpacity={0.88}>
                  {loading ? (
                    <View style={styles.loadingRow}>
                      <ActivityIndicator size="small" color="#ffffff" />
                      <Text style={styles.loadingBtnText}>Creating Account...</Text>
                    </View>
                  ) : (
                    <>
                      <Text style={styles.ctaBtnText}>SIGN UP</Text>
                      <MaterialIcons name="arrow-forward" size={22} color="#ffffff" />
                    </>
                  )}
                </TouchableOpacity>

                {/* Switch Prompt: Already have an account? Sign in */}
                <View style={styles.switchPromptFooter}>
                  <Text style={styles.switchPromptText}>Already have an account?</Text>
                  <TouchableOpacity onPress={() => setIsLogin(true)} activeOpacity={0.7}>
                    <Text style={styles.switchPromptLink}>Sign in</Text>
                  </TouchableOpacity>
                </View>

                {/* Sign in with Google */}
                <TouchableOpacity
                  style={styles.googlePillBtn}
                  onPress={handleGoogleSignIn}
                  activeOpacity={0.85}>
                  <AntDesign
                    name="google"
                    size={18}
                    color="#4285F4"
                    style={styles.googleIcon}
                  />
                  <Text style={styles.googlePillText}>Sign in with Google</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const createStyles = (theme: AppTheme, isDark: boolean) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: isDark ? "#090d16" : "#faf8ff",
    },
    scrollContent: {
      flexGrow: 1,
      justifyContent: "center",
      paddingHorizontal: 22,
      paddingVertical: 24,
    },
    container: {
      width: "100%",
      maxWidth: 420,
      alignSelf: "center",
    },
    logoSection: {
      alignItems: "center",
      justifyContent: "center",
      paddingTop: 6,
      paddingBottom: 4,
    },
    logoImage: {
      width: 120,
      height: 120,
    },
    headerSection: {
      paddingTop: 4,
      paddingBottom: 18,
    },
    titleText: {
      fontSize: 26,
      fontWeight: "700",
      color: isDark ? "#f8fafc" : "#131b2e",
      letterSpacing: -0.4,
    },
    subtitleText: {
      fontSize: 14,
      fontWeight: "500",
      color: isDark ? "#94a3b8" : "#404940",
      marginTop: 3,
    },
    formContainer: {
      gap: 14,
    },
    nameRow: {
      flexDirection: "row",
      gap: 10,
      width: "100%",
    },
    nameCol: {
      flex: 1,
      flexBasis: 0,
      minWidth: 0,
      gap: 6,
    },
    fieldGroup: {
      gap: 6,
    },
    fieldLabel: {
      fontSize: 12,
      fontWeight: "600",
      color: isDark ? "#94a3b8" : "#404940",
    },
    passwordLabelRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingRight: 2,
    },
    forgotPasswordText: {
      fontSize: 12,
      fontWeight: "600",
      color: "#166534",
    },
    /* Card input */
    inputBox: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: isDark ? "#131b2e" : "#ffffff",
      borderRadius: 12,
      paddingHorizontal: 14,
      height: 48,
      borderWidth: 1,
      borderColor: isDark ? "#1e293b" : "#bfc9bd",
    },
    inputLeftIcon: {
      marginRight: 10,
    },
    inputRightIcon: {
      marginLeft: 6,
    },
    textInput: {
      flex: 1,
      fontSize: 14,
      fontWeight: "500",
      color: isDark ? "#ffffff" : "#131b2e",
      height: "100%",
    },
    passwordInput: {
      letterSpacing: 1,
    },
    eyeBtn: {
      padding: 6,
      marginLeft: 4,
    },
    phonePrefixRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginRight: 8,
    },
    flagIcon: {
      fontSize: 16,
    },
    phoneDialCode: {
      fontSize: 12,
      fontWeight: "700",
      color: isDark ? "#ffffff" : "#131b2e",
    },
    phoneDivider: {
      color: isDark ? "#475569" : "#bfc9bd",
      fontSize: 14,
    },
    keepSignedInRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingVertical: 2,
      paddingLeft: 2,
    },
    termsRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 10,
      paddingTop: 2,
      paddingLeft: 2,
    },
    termsText: {
      flex: 1,
      fontSize: 12,
      lineHeight: 18,
      color: isDark ? "#94a3b8" : "#404940",
    },
    termsHighlight: {
      fontWeight: "700",
      color: isDark ? "#ffffff" : "#131b2e",
    },
    checkbox: {
      width: 18,
      height: 18,
      borderRadius: 4,
      backgroundColor: isDark ? "#1e293b" : "#e2e8f0",
      alignItems: "center",
      justifyContent: "center",
      marginTop: 1,
    },
    checkboxActive: {
      backgroundColor: "#166534",
    },
    keepSignedInText: {
      fontSize: 14,
      fontWeight: "500",
      color: isDark ? "#94a3b8" : "#475569",
    },
    /* Unified CTA matching template */
    ctaBtn: {
      width: "100%",
      height: 52,
      borderRadius: 9999,
      backgroundColor: "#004c22",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 24,
      marginTop: 4,
      shadowColor: "#004c22",
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.25,
      shadowRadius: 6,
      elevation: 3,
    },
    btnDisabled: {
      opacity: 0.7,
    },
    ctaBtnText: {
      flex: 1,
      textAlign: "center",
      paddingLeft: 22,
      color: "#ffffff",
      fontSize: 14,
      fontWeight: "700",
      letterSpacing: 1,
    },
    loadingRow: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
    },
    loadingBtnText: {
      color: "#ffffff",
      fontSize: 14,
      fontWeight: "700",
      letterSpacing: 0.5,
    },
    dividerRow: {
      flexDirection: "row",
      alignItems: "center",
      marginVertical: 2,
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: isDark ? "#1e293b" : "#e2e8f0",
    },
    dividerText: {
      marginHorizontal: 12,
      fontSize: 12,
      fontWeight: "600",
      color: isDark ? "#64748b" : "#94a3b8",
      textTransform: "uppercase",
      letterSpacing: 1,
    },
    googlePillBtn: {
      width: "100%",
      height: 48,
      borderRadius: 9999,
      backgroundColor: isDark ? "#131b2e" : "#ffffff",
      borderWidth: 1,
      borderColor: isDark ? "#1e293b" : "#bfc9bd",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      shadowColor: "#000000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    googleIcon: {
      marginRight: 2,
    },
    googlePillText: {
      fontSize: 13,
      fontWeight: "600",
      color: isDark ? "#f8fafc" : "#131b2e",
    },
    switchPromptFooter: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      paddingVertical: 4,
    },
    switchPromptText: {
      fontSize: 13,
      color: isDark ? "#94a3b8" : "#404940",
    },
    switchPromptLink: {
      fontSize: 13,
      fontWeight: "700",
      color: "#166534",
    },
    serverFooter: {
      alignItems: "center",
      marginTop: 14,
    },
    serverRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingVertical: 5,
      paddingHorizontal: 10,
      borderRadius: 9999,
      backgroundColor: isDark ? "#131b2e" : "#f1f4fb",
    },
    serverDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: "#10b981",
    },
    serverText: {
      fontSize: 10,
      color: theme.colors.textMuted,
      maxWidth: 220,
    },
    serverConfigCard: {
      marginTop: 10,
      width: "100%",
      backgroundColor: theme.colors.surface,
      borderRadius: 14,
      padding: 12,
      borderWidth: 1,
      borderColor: theme.colors.cardBorder,
      gap: 8,
    },
    serverConfigLabel: {
      fontSize: 11,
      fontWeight: "700",
      color: theme.colors.textSecondary,
    },
    serverConfigInput: {
      height: 40,
      backgroundColor: theme.colors.surfaceSubtle,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.colors.cardBorder,
      paddingHorizontal: 10,
      fontSize: 12,
      color: theme.colors.textPrimary,
    },
    serverSaveBtn: {
      backgroundColor: "#166534",
      paddingVertical: 8,
      borderRadius: 8,
      alignItems: "center",
    },
    serverSaveBtnText: {
      color: "#ffffff",
      fontSize: 12,
      fontWeight: "700",
    },
  });
