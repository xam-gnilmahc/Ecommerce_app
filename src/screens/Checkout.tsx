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
  ActivityIndicator,
} from "react-native";
import { useForm, Controller } from "react-hook-form";
import Ionicons from "react-native-vector-icons/Ionicons";
import { CardField, useStripe, usePlatformPay } from "@stripe/stripe-react-native";
import { ResponseNotificationContext } from "../context/ResponseNotificationContext";
import { RouteProp } from "@react-navigation/native";
import { useNavigation } from "@react-navigation/native";
import { useLocation } from "../hook/useLocation";
import setting from "../config/setting";
import { AuthContext } from "../context/AuthContext";

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
  const { placeOrder } = useContext(AuthContext);
  const { location, loading: locationLoading, error: locationError, getCurrentLocation } = useLocation();

  const { control, handleSubmit, watch, setValue } = useForm({
    defaultValues: {
      email: "",
      name: "",
      address1: "",
      address2: "",
      zip: "",
    },
  });

  const [shippingMethod, setShippingMethod] = useState('free');
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [loading, setLoading] = useState(false);
  const [showAllItems, setShowAllItems] = useState(false);

  const { isPlatformPaySupported } = usePlatformPay();
  const [platformPayEnabled, setPlatformPayEnabled] = useState(false);

  const deliveryFields = [
    { name: "email", placeholder: "Email" },
    { name: "name", placeholder: "Full Name" },
    { name: "address1", placeholder: "Address Line 1" },
    { name: "address2", placeholder: "Address Line 2" },
    { name: "zip", placeholder: "Zip Code" },
  ];

  // Handle location when it's successfully fetched
  React.useEffect(() => {
    if (location && !locationLoading) {
      setValue('address1', location.address);
      setValue('zip', location.zipCode);
      
      if (location.city && location.state) {
        setValue('address2', `${location.city}, ${location.state}`);
      }
      
      // showResponse('Address auto-filled from your current location!', 'success');
    }
  }, [location, locationLoading]);

  // Handle location errors - use a ref to prevent infinite loops
  const errorShownRef = React.useRef(false);

  React.useEffect(() => {
    if (locationError && !errorShownRef.current) {
      errorShownRef.current = true;
      showResponse(locationError, 'error');
      
      // Reset after 2 seconds
      setTimeout(() => {
        errorShownRef.current = false;
      }, 2000);
    }
  }, [locationError]);

  const handleGetLocation = async () => {
    try {
      const result = await getCurrentLocation();
      if (!result) {
        // Location failed, offer manual option
        showResponse('Location service unavailable. Please enter address manually.', 'error');
      }
    } catch (error) {
      console.error('Location handler error:', error);
      showResponse('Location service error', 'error');
    }
  };

  const subtotal = cart.reduce(
    (sum, item) =>
      sum + ((item.amount ?? item.products?.amount ?? 0) * item.quantity),
    0
  );
  const shipping = shippingMethod === "free" ? 0 : 30;
  const total = subtotal + shipping;

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

  // Check if Google Pay is supported
  React.useEffect(() => {
    const checkPlatformPaySupport = async () => {
      try {
        const supported = await isPlatformPaySupported({ 
          googlePay: { testEnv: true }
        });
        setPlatformPayEnabled(supported);
      } catch (error) {
        console.log("Google Pay not supported:", error);
        setPlatformPayEnabled(false);
      }
    };

    checkPlatformPaySupport();
  }, []);

  const handleGooglePay = async () => {
    if (!validateFields()) return;
    setLoading(true);

    try {
      // Convert amount to cents (Stripe requires integer amount in smallest currency unit)
      const amountInCents = Math.round(total * 100);

      // Create payment method directly - this will show the Google Pay sheet
      const { paymentMethod, error } = await stripe.createPlatformPayPaymentMethod({
        googlePay: {
          testEnv: true,
          merchantCountryCode: 'US',
          currencyCode: 'USD',
          amount: amountInCents,
        },
      });

      if (error) {
        showResponse(error.message, "error");
      } else if (paymentMethod) {
        // Success! You get the payment method token here

        const response = await sendPaymentToServer(paymentMethod.id, "paymentMethodId");

        if(response == true){
          showResponse("Google Pay payment successful!", "success");
          navigation.goBack();
          return;
        }
        showResponse("Payment Failed", "error");
      }
    } catch (err: any) {
      const message = typeof err === "string" ? err : err?.message || "Payment failed";
      showResponse(message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCardPayment = async (data: any) => {
    if (!validateFields()) return;
    setLoading(true);
    
    try {
      const result = await stripe.createToken({ type: "Card" });

      if (result.error) {
        showResponse(result.error.message, "error");
        setLoading(false);
        return;
      }

      // Success! You get the card token here
      const token = result.token?.id;
      if (token) {
        const response = await sendPaymentToServer(token, "token");
        if(response == true){
          showResponse("Card payment successful!", "success");
            navigation.goBack();
          return;
        }
        showResponse("Payment Failed", "error");
      }
      
    } catch (err: any) {
      const message = typeof err === "string" ? err : err?.message || "Payment failed";
      showResponse(message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCashOnDelivery = async (data: any) => {
    if (!validateFields()) return;
    setLoading(true);


    try {
      // Simulate processing delay
      // await new Promise(resolve => setTimeout(resolve, 1500));

      showResponse("Cash on delivery not available at this moment.", "error");

    } catch (err: any) {
      const message = typeof err === "string" ? err : err?.message || "Order failed";
      showResponse(message, "error");
    } finally {
      setLoading(false);
    }
  };

  const sendPaymentToServer = async (id: string, type: "token" | "paymentMethodId") => {
      const totalAmount = Math.round(subtotal + shipping);

      const address = {
        addressLine1: deliveryValues.addressLine1,
        addressLine2: deliveryValues.addressLine2,
        country: "US",
        state: deliveryValues.state,
        zipCode: deliveryValues.zip,
      };

      const paymentData = {
        [type]: id, // dynamically send token or paymentMethodId
        amount: totalAmount,
        name: deliveryValues.name,
        email: deliveryValues.email,
        address,
        comment: "Payment for order",
      };

      try {
        const response = await fetch(
          "https://fzliiwigydluhgbuvnmr.supabase.co/functions/v1/smart-handler",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${setting.SUPABASE_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(paymentData),
          }
        );      

        const result = await response.json();


        if (result.message != "Payment successful") {
          return false;;
        }

        const orderId = await placeOrder({ 
          ...paymentData, 
          payment_status: "success",
          shipping_method: shipping,
        }, result);

        if (orderId) {
          return true;
        }
        console.log("Order placement failed after payment");
        return false;
      } catch (err: any) {
        console.log("server error:", err);
        return false;
      }
    };

  const handlePayment = async (data: any) => {
    if (paymentMethod === "googlepay") {
      await handleGooglePay();
    } else if (paymentMethod === "card") {
      await handleCardPayment(data);
    } else if (paymentMethod === "cod") {
      await handleCashOnDelivery(data);
    }
  };

  const getSubmitButtonText = () => {
    if (loading) return "Processing...";
    
    switch (paymentMethod) {
      case "googlepay":
        return "Pay with Google Pay";
      case "card":
        return "Pay with Card";
      case "cod":
        return "Place Order (Cash on Delivery)";
      default:
        return "Submit Payment";
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
        <View style={styles.deliveryContainer}>
        <Text style={styles.sectionTitle}>Delivery Information</Text>
        <View style={styles.locationButtonsContainer}>          
              <TouchableOpacity 
                style={[
                  styles.locationButton,
                  locationLoading && styles.locationButtonDisabled
                ]}
                onPress={handleGetLocation}
                disabled={locationLoading}
              >
                {locationLoading ? (
                  <ActivityIndicator size="small" color="#3B82F6" />
                ) : (
                  <Ionicons name="location" size={16} color="#3B82F6" />
                )}
              </TouchableOpacity>
            </View>
        </View>

        <View style={styles.fieldsContainer}>
          {deliveryFields.map((item, index) => (
            <View key={index} style={styles.fieldWrapper}>
              <Controller
                control={control}
                name={item.name}
                render={({ field: { value, onChange } }) => (
                  <TextInput
                    placeholder={item.placeholder}
                    style={styles.input}
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
        <View style={styles.shippingContainer}>
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

        {/* PAYMENT METHODS */}
        <Text style={styles.sectionTitle}>Payment Method</Text>
        
        {/* Cash on Delivery */}
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
        </View>

        {/* Card Payment */}
        <View style={styles.paymentRow}>
          <TouchableOpacity
            style={styles.paymentOption}
            onPress={() => setPaymentMethod("card")}
          >
            <Ionicons
              name={paymentMethod === "card" ? "radio-button-on" : "radio-button-off"}
              size={18}
              color="#000"
            />
            <Text style={styles.payLabel}>Credit/Debit Card</Text>
          </TouchableOpacity>
        </View>

        {paymentMethod === "card" && (
          <View style={styles.cardBox}>
            <CardField
              postalCodeEnabled={false}
              placeholders={{ number: "4242 4242 4242 4242" }}
              cardStyle={{ backgroundColor: "#ffffff", textColor: "#000000" }}
              style={styles.cardField}
            />
          </View>
        )}

        {/* Google Pay */}
        {platformPayEnabled && (
          <View style={styles.paymentRow}>
            <TouchableOpacity
              style={styles.paymentOption}
              onPress={() => setPaymentMethod("googlepay")}
            >
              <Ionicons
                name={paymentMethod === "googlepay" ? "radio-button-on" : "radio-button-off"}
                size={20}
                color="#111"
              />
              <View style={{ flexDirection: "row", alignItems: "center", marginLeft: 10 }}>
                <Ionicons name="logo-google" size={20} color="#EA4335" />
                <Text style={styles.payLabel}>  Google Pay</Text>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {paymentMethod === "googlepay" && (
          <View style={styles.gpayBox}>
            <Ionicons name="logo-google" size={22} color="#EA4335" />
            <Text style={styles.gpayText}>Fast & secure Google Pay checkout</Text>
          </View>
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
              <View style={styles.cartItemDetails}>
                <Text style={styles.cartName}>{item.products?.name ?? "Product"}</Text>
                <View style={styles.cartItemRow}>
                  <Text style={styles.cartQty}>Qty: {item.quantity}</Text>
                  <Text style={styles.cartPrice}>
                    ${((item.amount ?? item.products?.amount ?? 0) * item.quantity).toFixed(2)}
                  </Text>
                </View>
              </View>
            </View>
          ))}

          {cart.length > 3 && !showAllItems && (
            <TouchableOpacity onPress={() => setShowAllItems(true)} style={styles.moreButton}>
              <Text style={styles.moreText}>+ More</Text>
            </TouchableOpacity>
          )}

          {showAllItems && cart.length > 3 && (
            <TouchableOpacity onPress={() => setShowAllItems(false)} style={styles.moreButton}>
              <Text style={styles.moreText}>Less</Text>
            </TouchableOpacity>
          )}

          <View style={styles.sumRow}>
            <Text style={styles.sumText}>Subtotal</Text>
            <Text style={styles.sumText}>${subtotal.toFixed(2)}</Text>
          </View>

          <View style={styles.sumRow}>
            <Text style={styles.sumText}>Shipping</Text>
            <Text style={styles.sumText}>${shipping}</Text>
          </View>

          <View style={styles.sumRow}>
            <Text style={styles.sumTotal}>Total</Text>
            <Text style={styles.sumTotal}>${(subtotal + shipping).toFixed(2)}</Text>
          </View>
        </View>
      </ScrollView>

      {/* PAYMENT BUTTON */}
      <View style={styles.fixedBottom}>
        <TouchableOpacity
          style={[
            styles.submitBtn,
            loading && styles.submitBtnDisabled
          ]}
          onPress={handleSubmit(handlePayment)}
          disabled={loading}
        >
          <Text style={styles.submitText}>
            {getSubmitButtonText()}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default Checkout;

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    paddingTop: Platform.OS === "ios" ? 60 : StatusBar.currentHeight,
  },
  deliveryContainer: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  /* HEADER */
  header: {
    height: 60,
    alignItems: "center",
    justifyContent: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    backgroundColor: "#fff",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
  },
locationButtonsContainer: {
    alignItems: 'flex-end',
    gap: 8,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3B82F6',
    justifyContent: 'center',
  },
  locationButtonDisabled: {
    opacity: 0.6,
  },
  locationButtonText: {
    color: '#3B82F6',
    fontWeight: '600',
    marginLeft: 6,
    fontSize: 14,
  },
  /* TITLES */
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginVertical: 14,
    color: "#111827",
  },

  /* INPUTS */
  fieldsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  gpayBox: {
  flexDirection: "row",
  alignItems: "center",
  padding: 14,
  borderRadius: 12,
  backgroundColor: "#FFF8F6",
  borderWidth: 1,
  borderColor: "#FEE2E2",
  marginTop: 8,
},
gpayText: {
  fontSize: 15,
  marginLeft: 10,
  color: "#B91C1C",
  fontWeight: "600",
},
  fieldWrapper: {
    width: "48%",
    marginBottom: 14,
  },
  input: {
    padding: 14,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    fontSize: 15,
    color: "#111827",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  /* SHIPPING */
  shippingContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  shipOption: {
    padding: 16,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    flex: 1,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  shipSelected: {
    borderColor: "#3B82F6",
    backgroundColor: "#EFF6FF",
  },
  shipTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111827",
  },
  shipCost: {
    fontSize: 16,
    fontWeight: "700",
    marginTop: 4,
    color: "#111827",
  },
  shipSub: {
    marginTop: 4,
    color: "#6B7280",
    fontSize: 13,
  },

  /* PAYMENT */
  paymentRow: {
    marginVertical: 6,
  },
  paymentOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
  },
  payLabel: {
    fontSize: 16,
    marginLeft: 8,
    color: "#111827",
    fontWeight: "500",
  },

  cardBox: {
    padding: 14,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginTop: 10,
  },
  cardField: {
    height: 50,
  },

  platformPayInfo: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 12,
    backgroundColor: "#F0F9FF",
    borderWidth: 1,
    borderColor: "#BAE6FD",
    marginTop: 8,
  },
  platformPayText: {
    fontSize: 15,
    marginLeft: 8,
    color: "#0C4A6E",
    fontWeight: "600",
  },

  /* ORDER SUMMARY BOX */
  summaryBox: {
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 25,
  },

  cartItem: {
    flexDirection: "row",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
  },
  cartImage: {
    width: 70,
    height: 70,
    resizeMode: "contain",
  },
  cartItemDetails: {
    flex: 1,
    marginLeft: 14,
  },
  cartName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  cartItemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  cartQty: {
    color: "#6B7280",
  },
  cartPrice: {
    color: "#111827",
    fontWeight: "700",
  },

  moreButton: {
    marginTop: 10,
    alignItems: "center",
  },
  moreText: {
    color: "#2563EB",
    fontWeight: "700",
  },

  /* SUMMARY TOTALS */
  sumRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  sumText: {
    fontSize: 16,
    color: "#374151",
  },
  sumTotal: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    marginTop: 6,
  },

  /* TOKEN DISPLAY */
  tokenContainer: {
    padding: 14,
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    marginBottom: 20,
  },
  tokenTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 4,
  },
  tokenText: {
    fontSize: 13,
    color: "#6B7280",
  },

  /* SUBMIT BUTTON */
  fixedBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 18,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderColor: "#E5E7EB",
  },
  submitBtn: {
    backgroundColor: "#2563EB",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  submitBtnDisabled: {
    backgroundColor: "#93C5FD",
  },
  submitText: {
    fontSize: 17,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
