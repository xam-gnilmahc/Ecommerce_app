import React, { useState, useContext, useRef} from "react";
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
  StatusBar,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../utils/supbase";
import { ResponseNotificationContext } from "../context/ResponseNotificationContext";
import { useForm, Controller } from "react-hook-form";
import {
  GoogleSignin,
} from '@react-native-google-signin/google-signin';

const { width, height } = Dimensions.get("window");

export default function Login() {
  const navigation = useNavigation();
  const { showResponse } = useContext(ResponseNotificationContext);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const passwordRef = useRef<TextInput>(null);
  const [userInfo, setUserInfo] = useState<any>(null);

  const { control, handleSubmit } = useForm({
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (data: { email: string; password: string }) => {
    const { email, password } = data;
    if (loading) return;
    setLoading(true);

    if (!email || !password) {
      showResponse("Please fill all fields", "error");
      return;
    }

    try {
      const { data: userData, error } = await supabase.auth.signInWithPassword({
        email:"alinariya18@gmail.com",
        password:"Maxrai123@",
      });

      if (error) {
        showResponse(error.message, "error");
      } else {
        showResponse(`Welcome, ${email}!`, "success");
      }
    } catch (err) {
      showResponse("Something went wrong during login", "error");
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    if (googleLoading) return;
    setGoogleLoading(true);

    try {

      await GoogleSignin.signOut();
      const response: any = await GoogleSignin.signIn();
      setUserInfo(response);

      const idToken = response.data.idToken;
      if (!idToken) {
        showResponse("Google login failed", "error");
        return;
      }

      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: "google",
        token: idToken,
      });

      if (error) {
        showResponse("Login failed: " + error.message, "error");
        return;
      }

      showResponse(`Logged in successfully as ${data.user?.email}`, "success");
    } catch (err: any) {
      showResponse("Something went wrong", "error");
    } finally {
      setGoogleLoading(false);
    }
  };


  return (
    <View style={styles.container}>
    <StatusBar barStyle="dark-content" backgroundColor="#A18CD1" />
    <LinearGradient colors={["#A18CD1", "#FBC2EB"]} 
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradientBackground}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
            <View style={styles.mainContainer}>
              <View style={styles.header}>
                <Text style={styles.headerText}>New to Joma?</Text>
                <TouchableOpacity style={styles.glassyButton} onPress={() => navigation.navigate('SignUp')}>
                  <Text style={styles.glassyText}>Create Account</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.logo}>Joma</Text>

              <View style={styles.card}>
                <Text style={styles.title}>Login to Continue</Text>
                <Text style={styles.subtitle}>Enjoy shopping with a fresh experience</Text>

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
                        value={value}
                        onChangeText={onChange}
                        secureTextEntry={!showPassword}
                        returnKeyType="done"
                        onSubmitEditing={handleSubmit(onSubmit)}
                      />
                      <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.iconContainer}>
                        <Ionicons name={showPassword ? "eye-off" : "eye"} size={22} color="#666" />
                      </TouchableOpacity>
                    </View>
                  )}
                />

                {/* Login Button */}
                <TouchableOpacity
                  style={[styles.button, loading && { opacity: 0.6 }]}
                  onPress={handleSubmit(onSubmit)}
                  disabled={loading}
                >
                  <LinearGradient
                    colors={["#A18CD1", "#FBC2EB"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.gradientButton}
                  >
                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Sign In</Text>}
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
                  <Text style={styles.forgot}>Forgot your password?</Text>
                </TouchableOpacity>

                <Text style={styles.or}>Or continue with</Text>

                <View style={styles.socialContainer}>
                  <TouchableOpacity
                    style={[styles.socialButton, googleLoading && { opacity: 0.6 }]}
                    onPress={loginWithGoogle}
                    disabled={googleLoading}
                  >
                    <Ionicons name="logo-google" size={20} color="#EA4335" />
                    <Text style={styles.socialText}>Google</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.socialButton, googleLoading && { opacity: 0.6 }]}
                    onPress={loginWithGoogle}
                    disabled={googleLoading}
                  >
                    <Ionicons name="logo-facebook" size={20} color="#000000ff" />
                    <Text style={styles.socialText}>Facebook</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: "relative",
    backgroundColor: "#A18CD1", // fallback in case gradient fails
  },
   gradientBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: "100%",
    height: "100%",
  },
  safeArea: {
    flex: 1,
    backgroundColor: "transparent",
  },
  mainContainer: {
    flex: 1,
    justifyContent: "flex-start",
    paddingTop: height * 0.12,
  },
  header: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: width * 0.06,
    marginBottom: height * 0.02,
  },
  headerText: {
    color: "#4a4a4a",
    fontSize: width * 0.035,
    marginRight: 6,
  },
  glassyButton: {
    backgroundColor: "#6D5DFB",
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
  },
  glassyText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: width * 0.035,
  },
  logo: {
    color: "#fff",
    fontSize: width * 0.14,
    fontWeight: "800",
    textAlign: "center",
    letterSpacing: 2,
    marginBottom: height * 0.02
  },
  tagline: {
    textAlign: "center",
    color: "#fff",
    fontStyle: "italic",
    fontSize: width * 0.045,
    marginTop: 4,
    marginBottom: height * 0.03,
  },
  card: {
    flex: 1,
    backgroundColor: "#fff",
    borderTopLeftRadius: 35,
    borderTopRightRadius: 35,
    padding: width * 0.07,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 6,
    minHeight: height * 0.65,
  },
  title: {
    fontSize: width * 0.065,
    fontWeight: "700",
    color: "#333",
    textAlign: "center",
    marginBottom: 5,
  },
  subtitle: {
    textAlign: "center",
    color: "#777",
    fontSize: width * 0.04,
    marginBottom: 25,
  },
  input: {
    height: 52,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    paddingHorizontal: 15,
    fontSize: width * 0.04,
    color: "#333",
    marginBottom: 15,
    backgroundColor: "#f9f9f9",
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    marginBottom: 20,
    paddingRight: 10,
    backgroundColor: "#f9f9f9",
  },
  iconContainer: {
    paddingHorizontal: 5,
  },
  button: {
    marginTop: 10,
    marginBottom: 15,
  },
  gradientButton: {
    borderRadius: 12,
    height: 52,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: width * 0.045,
    fontWeight: "700",
  },
  forgot: {
    textAlign: "center",
    color: "#6D5DFB",
    marginTop: 10,
    marginBottom: 20,
    fontSize: width * 0.038,
    fontWeight: "500",
  },
  or: {
    textAlign: "center",
    color: "#999",
    marginVertical: 15,
    fontSize: width * 0.038,
  },
  socialContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  socialButton: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    flex: 1,
    justifyContent: "center",
    marginHorizontal: 5,
    backgroundColor: "#fff",
  },
  socialText: {
    marginLeft: 8,
    color: "#333",
    fontWeight: "600",
    fontSize: width * 0.035,
  },
});
