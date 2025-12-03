import React, { useContext, useState, useCallback } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Platform,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { AuthContext } from "../context/AuthContext";
import Feather from "react-native-vector-icons/Feather";
import { useNavigation } from "@react-navigation/native";
import { ResponseNotificationContext } from "../context/ResponseNotificationContext";

const { width } = Dimensions.get("window");
const STORAGE_BASE_URL =
  "https://fzliiwigydluhgbuvnmr.supabase.co/storage/v1/object/public/productimages/";

// Skeleton loader for cart items
const SkeletonRow = () => (
  <View style={styles.cartRow}>
    <View style={[styles.productImage, { backgroundColor: "#e0e0e0" }]} />
    <View style={styles.productInfo}>
      <View style={{ height: 18, backgroundColor: "#e0e0e0", marginBottom: 8, borderRadius: 4 }} />
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <View style={{ width: 60, height: 16, backgroundColor: "#e0e0e0", borderRadius: 4 }} />
        <View style={{ width: 70, height: 16, backgroundColor: "#e0e0e0", borderRadius: 4 }} />
      </View>
    </View>
  </View>
);

const SkeletonCheckout = () => (
  <View style={styles.checkoutContainer}>
    <View style={{ width: 100, height: 20, backgroundColor: "#e0e0e0", borderRadius: 4 }} />
    <View style={{ width: 120, height: 40, backgroundColor: "#e0e0e0", borderRadius: 20 }} />
  </View>
);

const Cart = () => {
  const { fetchCart, addToCartQuantity, deleteFromCart } = useContext(AuthContext);
  const { showResponse } = useContext(ResponseNotificationContext);
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const navigation = useNavigation();

  const loadCart = async () => {
    setLoading(true);
    try {
      const data = await fetchCart();
      setCartItems(data);
    } catch (err) {
      console.error("Error loading cart:", err);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadCart();
    }, [])
  );

  const getImageUrl = (banner_url?: string) =>
    banner_url ? (banner_url.startsWith("http") ? banner_url : `${STORAGE_BASE_URL}${banner_url}`) : "";

  const totalAmount = cartItems.reduce(
    (sum, item) => sum + ((item.amount || item.products?.amount || 0) * item.quantity),
    0
  );

  return (
    <View style={styles.wrapper}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" translucent />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Cart</Text>

        <Feather name="shopping-cart" size={22} color="#0E1216" />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={{ paddingBottom: 130 }}>
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
          : cartItems.length === 0
            ? <Text style={styles.message}>Your cart is empty.</Text>
            : cartItems.map((item: any) => (
              <View key={item.id} style={styles.cartRow}>
                <Image
                  source={{ uri: getImageUrl(item.products?.banner_url) }}
                  style={styles.productImage}
                />
                <View style={styles.productInfo}>
                  <Text style={styles.productName} numberOfLines={3}>
                    {item.products?.name || "Product not found"}
                  </Text>
                  <View style={styles.row}>
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                      <TouchableOpacity
                        disabled={updatingId === item.id}
                        onPress={async () => {
                          if (item.quantity <= 1) return;

                          const updated = cartItems.map(c =>
                            c.id === item.id ? { ...c, quantity: c.quantity - 1 } : c
                          );
                          setCartItems(updated);
                          setUpdatingId(item.id);

                          try {
                            const result = await addToCartQuantity(item.products.id, -1);
                            showResponse(result.message, result.success ? "success" : "error");

                            if (!result.success) {
                              setCartItems(cartItems);
                            }
                          } catch (err: any) {
                            showResponse(err?.message || "Failed to update cart", "error");
                            setCartItems(cartItems);
                          } finally {
                            setUpdatingId(null);
                          }
                        }}
                      >
                        <Feather name="minus-circle" size={22} color="#0e1216" />
                      </TouchableOpacity>

                      <Text style={{ marginHorizontal: 10, fontSize: 16, fontWeight: "600", color: "#0e1216" }}>
                        {item.quantity}
                      </Text>

                      <TouchableOpacity
                        disabled={updatingId === item.id}
                        onPress={async () => {
                          const updated = cartItems.map(c =>
                            c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c
                          );
                          setCartItems(updated);
                          setUpdatingId(item.id);

                          try {
                            const result = await addToCartQuantity(item.products.id, 1);
                            showResponse(result.message, result.success ? "success" : "error");

                            if (!result.success) {
                              setCartItems(cartItems);
                            }
                          } catch (err: any) {
                            showResponse(err?.message || "Failed to update cart", "error");
                            setCartItems(cartItems);
                          } finally {
                            setUpdatingId(null);
                          }
                        }}
                      >
                        <Feather name="plus-circle" size={22} color="#0e1216" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={{ marginLeft: 12 }}
                        disabled={updatingId === item.id}
                        onPress={async () => {
                          setUpdatingId(item.id);
                          try {
                            const result = await deleteFromCart(item.id);
                            showResponse(result.message, result.success ? "success" : "error");
                            if (result.success) {
                              setCartItems(cartItems.filter(c => c.id !== item.id));
                            }
                          } catch (err: any) {
                            showResponse(err?.message || "Failed to delete item", "error");
                          } finally {
                            setUpdatingId(null);
                          }
                        }}
                      >
                        <Feather name="trash-2" size={20} color="red" />
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.productAmount}>
                      Rs{((item.amount || item.products?.amount || 0) * item.quantity).toFixed(2)}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
      </ScrollView>

      {loading
        ? <SkeletonCheckout />
        : cartItems.length > 0 && (
          <View style={styles.checkoutContainer}>
            <Text style={styles.totalText}>Total: Rs{totalAmount.toFixed(2)}</Text>
            <TouchableOpacity
              style={styles.checkoutButton}
              onPress={() =>
                navigation.navigate("Checkout", {
                  cart: cartItems
                })
              }
            >
              <Text style={styles.checkoutButtonText}>Checkout</Text>
            </TouchableOpacity>
          </View>
        )
      }
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: Platform.OS === "ios" ? 60 : StatusBar.currentHeight,
  },
  header: {
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    backgroundColor: "#fff",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom:10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0e1216",
  },
  scroll: {
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  message: {
    textAlign: "center",
    marginTop: 40,
    fontSize: 16,
    color: "#555",
  },
  cartRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    // borderBottomWidth: 1,
    // borderBottomColor: "#eee",
    paddingBottom: 12,
  },
  productImage: {
    width: width * 0.25,     // smaller for better layout
    height: width * 0.25,
    resizeMode: "contain",
    marginRight: 14,
    borderRadius: 12,
  },
  productInfo: {
    flex: 1,
    justifyContent: "space-between",
    paddingBottom: 4,
  },
  productName: {
    fontSize: width < 360 ? 11 : 12, // auto adjusts
    fontWeight: "600",
    marginBottom: 6,
    color: "#0e1216",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },

  productQuantity: {
    fontSize: width < 360 ? 12 : 14,
    color: "#555",
  },
  productAmount: {
    fontSize: width < 360 ? 13 : 15, // slightly smaller fits perfect
    fontWeight: "700",
    color: "#0e1216",
    minWidth: 70,                    // ensures perfect right alignment
    textAlign: "right",
  },

  checkoutContainer: {
    position: "absolute",
    bottom: Platform.OS === "ios" ? 80 : 70,
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#eee",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  totalText: {
    fontSize: 17,
    fontWeight: "700",
    color: "#0e1216",
  },
  checkoutButton: {
    backgroundColor: "#0e1216",
    borderRadius: 30,
    paddingHorizontal: 28,
    paddingVertical: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  checkoutButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});

export default Cart;
