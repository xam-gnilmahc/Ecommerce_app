import React, { useState, useContext, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useNavigation, NavigationProp } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../utils/supbase";
import { ResponseNotificationContext } from "../context/ResponseNotificationContext";
import { useForm, Controller } from "react-hook-form";

type RootStackParamList = {
  Login: undefined;
  SignUp: undefined;
  Home: undefined;
};

const { width, height } = Dimensions.get("window");

export default function SignUpScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { showResponse } = useContext(ResponseNotificationContext);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const passwordRef = useRef<TextInput>(null);
  const confirmPasswordRef = useRef<TextInput>(null);

  const { control, handleSubmit, watch } = useForm({
    defaultValues: { email: "", password: "", confirmPassword: "" },
  });

  const onSubmit = async (data: { email: string; password: string; confirmPassword: string }) => {
    const { email, password, confirmPassword } = data;

    setLoading(true);
    if (!email || !password || !confirmPassword) {
      setLoading(false);
      showResponse("Please fill all fields", "error");
      return;
    }

    if (password !== confirmPassword) {
      setLoading(false);
      showResponse("Passwords do not match", "error");
      return;
    }

    try {
      const { data: userData, error } = await supabase.auth.signUp({ email, password });
      if (error) {
        showResponse(error.message, "error");
      } else {
        showResponse("Account created!", "success");
        navigation.navigate("Login");
      }
    } catch {
      showResponse("Something went wrong. Try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={["#FBC2EB", "#A18CD1"]} style={styles.gradientContainer}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
            <View style={styles.mainContainer}>
              <View style={styles.header}>
                <Text style={styles.headerText}>Already have an account?</Text>
                <TouchableOpacity style={styles.glassyButton} onPress={() => navigation.navigate("Login")}>
                  <Text style={styles.glassyText}>Login</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.logo}>Joma</Text>
              <Text style={styles.tagline}>Sign up to start shopping</Text>

              <View style={styles.card}>
                <Text style={styles.title}>Create Account</Text>

                <Controller
                  control={control}
                  name="email"
                  rules={{ required: true }}
                  render={({ field: { onChange, value } }) => (
                    <TextInput
                      style={styles.input}
                      placeholder="Email Address"
                      placeholderTextColor="#aaa"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      value={value}
                      onChangeText={onChange}
                      returnKeyType="next"
                      onSubmitEditing={() => passwordRef.current?.focus()}
                    />
                  )}
                />

                <Controller
                  control={control}
                  name="password"
                  rules={{ required: true }}
                  render={({ field: { onChange, value } }) => (
                    <View style={styles.passwordContainer}>
                      <TextInput
                        ref={passwordRef}
                        style={[styles.input, { flex: 1, marginBottom: 0, borderWidth: 0 }]}
                        placeholder="Password"
                        placeholderTextColor="#aaa"
                        secureTextEntry={!showPassword}
                        value={value}
                        onChangeText={onChange}
                        returnKeyType="next"
                        onSubmitEditing={() => confirmPasswordRef.current?.focus()}
                      />
                      <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.iconContainer}>
                        <Ionicons name={showPassword ? "eye-off" : "eye"} size={22} color="#666" />
                      </TouchableOpacity>
                    </View>
                  )}
                />

                <Controller
                  control={control}
                  name="confirmPassword"
                  rules={{ required: true }}
                  render={({ field: { onChange, value } }) => (
                    <TextInput
                      ref={confirmPasswordRef}
                      style={styles.input}
                      placeholder="Confirm Password"
                      placeholderTextColor="#aaa"
                      secureTextEntry
                      value={value}
                      onChangeText={onChange}
                      returnKeyType="done"
                      onSubmitEditing={handleSubmit(onSubmit)} // Enter triggers signup
                    />
                  )}
                />

                <TouchableOpacity
                  style={[styles.button, loading && { opacity: 0.6 }]}
                  onPress={handleSubmit(onSubmit)}
                  disabled={loading}
                >
                  <LinearGradient
                    colors={["#6D5DFB", "#A18CD1"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.gradientButton}
                  >
                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Sign Up</Text>}
                  </LinearGradient>
                </TouchableOpacity>

                <Text style={styles.or}>Or sign up with</Text>

                <View style={styles.socialContainer}>
                  <TouchableOpacity style={styles.socialButton}>
                    <Ionicons name="logo-google" size={20} color="#EA4335" />
                    <Text style={styles.socialText}>Google</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.socialButton}>
                    <Ionicons name="logo-apple" size={20} color="#000" />
                    <Text style={styles.socialText}>Apple</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}


const styles = StyleSheet.create({
  gradientContainer: { flex: 1 },
  safeArea: { flex: 1 },
  mainContainer: { flex: 1, justifyContent: "flex-start", paddingTop: height * 0.12 },
  header: { flexDirection: "row", justifyContent: "flex-end", paddingHorizontal: width * 0.06, marginBottom: height * 0.02 },
  headerText: { color: "#fff", fontSize: width * 0.035, marginRight: 6 },
  glassyButton: { backgroundColor: "#fff", paddingVertical: 6, paddingHorizontal: 14, borderRadius: 20 },
  glassyText: { color: "#6D5DFB", fontWeight: "700", fontSize: width * 0.035 },
  logo: { color: "#fff", fontSize: width * 0.14, fontWeight: "800", textAlign: "center", letterSpacing: 2, marginBottom: height * 0.005 },
  tagline: { textAlign: "center", color: "#fff", fontStyle: "italic", fontSize: width * 0.045, marginBottom: height * 0.03 },
  card: { flex: 1, backgroundColor: "#fff", borderTopLeftRadius: 35, borderTopRightRadius: 35, padding: width * 0.07, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 10, elevation: 6, minHeight: height * 0.65 },
  title: { fontSize: width * 0.065, fontWeight: "700", color: "#333", textAlign: "center", marginBottom: 15 },
  input: { height: 52, borderWidth: 1, borderColor: "#ddd", borderRadius: 12, paddingHorizontal: 15, fontSize: width * 0.04, color: "#333", marginBottom: 15, backgroundColor: "#f9f9f9" },
  passwordContainer: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: "#ddd", borderRadius: 12, marginBottom: 20, paddingRight: 10, backgroundColor: "#f9f9f9" },
  iconContainer: { paddingHorizontal: 5 },
  button: { marginTop: 10, marginBottom: 15 },
  gradientButton: { borderRadius: 12, height: 52, justifyContent: "center", alignItems: "center" },
  buttonText: { color: "#fff", fontSize: width * 0.045, fontWeight: "700" },
  or: { textAlign: "center", color: "#999", marginVertical: 15, fontSize: width * 0.038 },
  socialContainer: { flexDirection: "row", justifyContent: "space-between" },
  socialButton: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: "#eee", borderRadius: 12, paddingVertical: 12, paddingHorizontal: 20, flex: 1, justifyContent: "center", marginHorizontal: 5, backgroundColor: "#fff" },
  socialText: { marginLeft: 8, color: "#333", fontWeight: "600", fontSize: width * 0.035 },
});
