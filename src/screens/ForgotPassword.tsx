import React, { useContext, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from "react-native";
import { useForm, Controller } from "react-hook-form";
import { supabase } from "../utils/supbase";
import { ResponseNotificationContext } from "../context/ResponseNotificationContext";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";

const { width } = Dimensions.get("window");

type FormData = { email: string };

const ForgotPasswordScreen = () => {
  const navigation = useNavigation();
  const { showResponse } = useContext(ResponseNotificationContext);
  const { control, handleSubmit, formState: { errors }, reset } = useForm<FormData>();
  const [loading, setLoading] = useState(false);

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("email", data.email)
      .single();

    if (userError || !user) {
      setLoading(false);
      showResponse("No account found with that email.", "error");
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(data.email);
    setLoading(false);

    if (error) {
      showResponse(error.message, "error");
    } else {
      showResponse("Check your inbox for the password reset link.", "success");
      reset();
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.flexContainer}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.leftIcon}>
            <Ionicons name="chevron-back" size={28} color="#000" />
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>Reset Password</Text>
          
          <TouchableOpacity onPress={() => console.log("Right icon pressed")} style={styles.rightIcon}>
            <Ionicons name="settings-outline" size={28} color="#000" />
          </TouchableOpacity>
        </View>

        <Text style={styles.subtitle}>
          Enter your email to reset your password
        </Text>

        {/* Email Input */}
        <Controller
          control={control}
          name="email"
          rules={{
            required: "Email is required",
            pattern: { value: /\S+@\S+\.\S+/, message: "Enter a valid email" },
          }}
          render={({ field: { onChange, value } }) => (
            <TextInput
              style={[styles.input, errors.email && { borderColor: "#f44336" }]}
              placeholder="user@gmail.com"
              placeholderTextColor="#aaa"
              keyboardType="email-address"
              autoCapitalize="none"
              value={value}
              onChangeText={onChange}
              onSubmitEditing={handleSubmit(onSubmit)}
            />
          )}
        />
        {errors.email && <Text style={styles.error}>{errors.email.message}</Text>}

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSubmit(onSubmit)}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Submit</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

export default ForgotPasswordScreen;

const styles = StyleSheet.create({
  flexContainer: { flex: 1, backgroundColor: "#fff" },
  container: {
    flex: 1,
    paddingHorizontal: width * 0.06,
    paddingTop: Platform.OS === "ios" ? 80 : 60,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 30,
  },
  leftIcon: { padding: 8 },
  rightIcon: { padding: 8 },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#000",
    textAlign: "center",
    flex: 1,
  },
  subtitle: {
    fontSize: 15,
    color: "#666",
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    width: "100%",
    height: 50,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 10,
    fontSize: 16,
    color: "#000",
  },
  button: {
    width: "100%",
    height: 50,
    backgroundColor: "#000",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 15,
  },
  buttonDisabled: { backgroundColor: "#555" },
  buttonText: { color: "#fff", fontWeight: "600", fontSize: 16 },
  error: { color: "#f44336", fontSize: 14, marginBottom: 5 },
});
