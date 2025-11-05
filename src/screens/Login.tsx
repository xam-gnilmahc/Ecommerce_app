import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
  ActivityIndicator,
  ScrollView,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useNavigation } from '@react-navigation/native';


const { width, height } = Dimensions.get("window");

export default function Login() {
  const navigation = useNavigation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = () => {
    setLoading(true);

    if (!email || !password) {
      setLoading(false);
      Alert.alert("Error", "Please fill all fields");
      return;
    }
    
    setTimeout(() => {
      setLoading(false);
      Alert.alert("Success", `Welcome, ${email}!`);
    }, 2000);
  };

  return (
    <LinearGradient
      colors={["#A18CD1", "#FBC2EB"]}
      style={styles.gradientContainer}
    >
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={{ flexGrow: 1 }}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.mainContainer}>
              {/* Header */}
              <View style={styles.header}>
                <Text style={styles.headerText}>New to Joma?</Text>
                <TouchableOpacity style={styles.glassyButton} onPress={() => navigation.navigate('SignUp')}>
                  <Text style={styles.glassyText}>Create Account</Text>
                </TouchableOpacity>
              </View>

              {/* Logo */}
              <Text style={styles.logo}>Joma</Text>
              {/* Card */}
              <View style={styles.card}>
                <Text style={styles.title}>Login to Continue</Text>
                <Text style={styles.subtitle}>
                  Enjoy shopping with a fresh experience
                </Text>

                <TextInput
                  style={styles.input}
                  placeholder="Email Address"
                  placeholderTextColor="#aaa"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />

                <View style={styles.passwordContainer}>
                  <TextInput
                    style={[styles.input, { flex: 1, marginBottom: 0, borderWidth: 0 }]}
                    placeholder="Password"
                    placeholderTextColor="#aaa"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.iconContainer}
                  >
                    <Ionicons
                      name={showPassword ? "eye-off" : "eye"}
                      size={22}
                      color="#666"
                    />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={[styles.button, loading && { opacity: 0.6 }]}
                  onPress={handleLogin}
                  disabled={loading}
                >
                  <LinearGradient
                    colors={["#A18CD1", "#FBC2EB"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.gradientButton}
                  >
                    {loading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.buttonText}>Sign In</Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity>
                  <Text style={styles.forgot}>Forgot your password?</Text>
                </TouchableOpacity>

                <Text style={styles.or}>Or continue with</Text>

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
  gradientContainer: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
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
