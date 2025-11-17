import React, { useState, useContext } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Modal,
  Dimensions,
  StyleSheet,
  StatusBar,
  Platform,
} from "react-native";
import { useForm, Controller } from "react-hook-form";
import Ionicons from "react-native-vector-icons/Ionicons";
import { CardField, useStripe } from "@stripe/stripe-react-native";
import { ResponseNotificationContext } from "../context/ResponseNotificationContext";
import { RouteProp } from "@react-navigation/native";
import { useNavigation } from "@react-navigation/native";

const { width } = Dimensions.get("screen");

interface Product {
  name: string;
  amount: number;
  banner_url: string;
}

interface CartItem {
  id: number | string;
  quantity: number;
  amount?: number;
  products?: Product;
}

type RootStackParamList = {
  Checkout: { cart: CartItem[] };
};

type CheckoutRouteProp = RouteProp<RootStackParamList, "Checkout">;

interface CheckoutProps {
  route: CheckoutRouteProp;
}

const STORAGE_BASE_URL =
  "https://fzliiwigydluhgbuvnmr.supabase.co/storage/v1/object/public/productimages/";

const Checkout: React.FC<CheckoutProps> = ({ route }) => {
  const stripe = useStripe();
  const cart = route.params?.cart || [];
  const navigation = useNavigation();

  const { showResponse } = useContext(ResponseNotificationContext);

  const { control, handleSubmit, watch } = useForm({
    defaultValues: {
      email: "",
      name: "",
      address1: "",
      address2: "",
      zip: "",
    },
  });

  const [shippingMethod, setShippingMethod] = useState("free");
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showAllItems, setShowAllItems] = useState(false);

  const [showMoreInfo, setShowMoreInfo] = useState(false);

  const deliveryFields = [
    { name: "email", placeholder: "Email" },
    { name: "name", placeholder: "Full Name" },
    { name: "address1", placeholder: "Address Line 1" },
    { name: "address2", placeholder: "Address Line 2" },
    { name: "zip", placeholder: "Zip Code" },
  ];

  const shownFields = showMoreInfo ? deliveryFields : deliveryFields.slice(0, 5);

  const subtotal = cart.reduce(
    (sum, item) =>
      sum + ((item.amount ?? item.products?.amount ?? 0) * item.quantity),
    0
  );
  const shipping = shippingMethod === "free" ? 0 : 30;

  const getImageUrl = (banner_url?: string) =>
    banner_url
      ? banner_url.startsWith("http")
        ? banner_url
        : `${STORAGE_BASE_URL}${banner_url}`
      : undefined;

  const deliveryValues: any = watch();

  const validateFields = () => {
    for (let field of deliveryFields) {
      const value = deliveryValues[field.name]?.trim();

      if (!value) {
        showResponse(`${field.placeholder} is required`, "error");
        return false;
      }

      if (field.name === "email") {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          showResponse("Please enter a valid email", "error");
          return false;
        }
      }

      if (field.name === "zip") {
        const zipRegex = /^[0-9]{4,10}$/;
        if (!zipRegex.test(value)) {
          showResponse("Please enter a valid zip code", "error");
          return false;
        }
      }
    }
    return true;
  };

  const handlePayment = async (data: any) => {
    if (!validateFields()) return;
    setLoading(true);
    try {
      if (paymentMethod === "card") {
        const result = await stripe.createToken({ type: "Card" });

        if (result.error) {
          showResponse(result.error.message, "error");
          setLoading(false);
          return;
        }
        //console.log("✔ Token Created:", result.token?.id);
        showResponse("Payment successful!", "success");
      } else {
        showResponse("Cash on Delivery is currently not available. Please use Card.", "error");
      }
    } catch (err: any) {
      const message = typeof err === "string" ? err : err?.message || "Payment failed";
      showResponse(message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.wrapper}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" translucent />

      <View style={styles.header}>
        <TouchableOpacity style={{ position: "absolute", left: 16 }} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={26} color="#000" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Checkout</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 80 }}
      >
        <Text style={styles.sectionTitle}>Delivery Information</Text>

        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            justifyContent: "space-between",
          }}
        >
          {shownFields.map((item, index) => (
            <View key={index} style={{ width: "48%", marginBottom: 12 }}>
              <Controller
                control={control}
                name={item.name}
                render={({ field: { value, onChange } }) => (
                  <TextInput
                    placeholder={item.placeholder}
                    style={styles.inputTwo}
                    placeholderTextColor="#888"
                    value={value}
                    onChangeText={onChange}
                  />
                )}
              />
            </View>
          ))}
        </View>

        {/* SHIPPING */}
        <Text style={styles.sectionTitle}>Shipping Method</Text>
        <View style={{ flexDirection: "row", gap: 10, marginBottom: 10 }}>
          <TouchableOpacity
            style={[
              styles.shipOption,
              shippingMethod === "free" && styles.shipSelected,
            ]}
            onPress={() => setShippingMethod("free")}
          >
            <Text style={styles.shipTitle}>Free Shipping</Text>
            <Text style={styles.shipCost}>$0</Text>
            <Text style={styles.shipSub}>7–20 Days</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.shipOption,
              shippingMethod === "express" && styles.shipSelected,
            ]}
            onPress={() => setShippingMethod("express")}
          >
            <Text style={styles.shipTitle}>Express</Text>
            <Text style={styles.shipCost}>$30</Text>
            <Text style={styles.shipSub}>1–3 Days</Text>
          </TouchableOpacity>
        </View>

        {/* PAYMENT */}
        <Text style={styles.sectionTitle}>Payment Method</Text>
        <View style={styles.paymentRow}>
          <TouchableOpacity
            style={styles.paymentOption}
            onPress={() => setPaymentMethod("cod")}
          >
            <Ionicons
              name={paymentMethod === "cod" ? "radio-button-on" : "radio-button-off"}
              size={18}
              color="#000"
            />
            <Text style={styles.payLabel}>Cash on Delivery</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.paymentOption}
            onPress={() => setPaymentMethod("card")}
          >
            <Ionicons
              name={paymentMethod === "card" ? "radio-button-on" : "radio-button-off"}
              size={18}
              color="#000"
            />
            <Text style={styles.payLabel}>Card</Text>
          </TouchableOpacity>
        </View>

        {paymentMethod === "card" && (
          <>
            <View style={styles.cardBox}>
              <CardField
                postalCodeEnabled={false}
                placeholders={{ number: "4242 4242 4242 4242" }}
                cardStyle={{ backgroundColor: "#ffffff", textColor: "#000000" }}
                style={styles.cardField}
              />
            </View>

          </>
        )}
        {/* ORDER SUMMARY */}
        <Text style={styles.sectionTitle}>Order Summary</Text>
        <View style={styles.summaryBox}>
          {(showAllItems ? cart : cart.slice(0, 3)).map((item) => (
            <View key={item.id} style={styles.cartItem}>
              <Image
                source={{ uri: getImageUrl(item.products?.banner_url) }}
                style={styles.cartImage}
              />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.cartName}>{item.products?.name ?? "Product"}</Text>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    marginTop: 6,
                  }}
                >
                  <Text style={styles.cartQty}>Qty: {item.quantity}</Text>
                  <Text style={styles.cartPrice}>
                    Rs
                    {(
                      (item.amount ?? item.products?.amount ?? 0) * item.quantity
                    ).toFixed(2)}
                  </Text>
                </View>
              </View>
            </View>
          ))}

          {cart.length > 3 && !showAllItems && (
            <TouchableOpacity
              onPress={() => setShowAllItems(true)}
              style={{ marginTop: 8 }}
            >
              <Text style={{ color: "#000", fontWeight: "600" }}>+ More</Text>
            </TouchableOpacity>
          )}

          {showAllItems && cart.length > 3 && (
            <TouchableOpacity
              onPress={() => setShowAllItems(false)}
              style={{ marginTop: 8 }}
            >
              <Text style={{ color: "#000", fontWeight: "600" }}>Less</Text>
            </TouchableOpacity>
          )}

          <View style={styles.sumRow}>
            <Text style={styles.sumText}>Subtotal</Text>
            <Text style={styles.sumText}>Rs{subtotal.toFixed(2)}</Text>
          </View>

          <View style={styles.sumRow}>
            <Text style={styles.sumText}>Shipping</Text>
            <Text style={styles.sumText}>Rs{shipping}</Text>
          </View>

          <View style={styles.sumRow}>
            <Text style={styles.sumTotal}>Total</Text>
            <Text style={styles.sumTotal}>
              Rs{(subtotal + shipping).toFixed(2)}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* SUBMIT */}
      <View style={styles.fixedBottom}>
        <TouchableOpacity
          style={styles.submitBtn}
          onPress={handleSubmit(handlePayment)}
          disabled={loading}
        >
          <Text style={styles.submitText}>
            {loading ? "Processing..." : "Submit Payment"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* SUCCESS MODAL */}
      {/* <Modal visible={success} transparent animationType="fade">
        <View style={styles.modalWrap}>
          <View style={styles.modalBox}>
            <Ionicons name="checkmark-circle" size={60} color="#00aa00" />
            <Text style={styles.modalText}>Order Placed Successfully</Text>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => setSuccess(false)}
            >
              <Text style={styles.closeText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal> */}
    </View>
  );
};

export default Checkout;

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: "#ffffff",
    paddingTop: Platform.OS === "ios" ? 60 : StatusBar.currentHeight,
  },
  header: {
    height: 60,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    backgroundColor: "#fff",
    flexDirection: "row",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#000",
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginVertical: 12,
    color: "#000",
  },

  inputTwo: {
    padding: 14,
    borderRadius: 10,
    backgroundColor: "#f1f1f1",
    fontSize: 15,
    color: "#000",
  },

  shipOption: {
    padding: 14,
    borderRadius: 12,
    backgroundColor: "#f5f5f5",
    flex: 1,
  },
  shipSelected: { backgroundColor: "#dcdcdc" },

  shipTitle: { fontSize: 16, fontWeight: "600", color: "#000" },
  shipCost: { fontSize: 16, fontWeight: "700", color: "#000" },
  shipSub: { color: "#888" },

  paymentRow: { flexDirection: "row", marginTop: 12, marginBottom: 10 },
  paymentOption: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 20,
  },
  payLabel: { fontSize: 15, marginLeft: 6, color: "#000" },

  cardBox: {
    padding: 10,
    backgroundColor: "#f8f8f8",
    borderRadius: 12,
    marginTop: 10,
  },
  cardField: { height: 50 },

  summaryBox: {
    padding: 14,
    backgroundColor: "#fafafa",
    borderRadius: 12,
    marginBottom: 20,
  },
  cartItem: {
    flexDirection: "row",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  cartImage: { width: 60, height: 60, borderRadius: 8, resizeMode: "contain" },
  cartName: { fontSize: 15, fontWeight: "600", color: "#000" },
  cartQty: { color: "#777" },
  cartPrice: { color: "#000", fontWeight: "600" },

  sumRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 6,
  },
  sumText: { fontSize: 16, color: "#000" },
  sumTotal: { fontSize: 18, fontWeight: "700", color: "#000" },

  fixedBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderColor: "#ddd",
  },
  submitBtn: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#000",
    alignItems: "center",
  },
  submitText: { color: "#fff", fontSize: 17, fontWeight: "600" },

  modalWrap: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBox: {
    width: width * 0.8,
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 14,
    alignItems: "center",
  },
  modalText: { marginTop: 12, fontSize: 18, fontWeight: "600", color: "#000" },
  closeBtn: {
    marginTop: 18,
    paddingVertical: 10,
    paddingHorizontal: 30,
    backgroundColor: "#000",
    borderRadius: 8,
  },
  closeText: { color: "#fff", fontSize: 16 },
});
