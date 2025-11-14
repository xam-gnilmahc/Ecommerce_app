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

const Cart = () => {
  const { fetchCart } = useContext(AuthContext);
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={{ paddingBottom: 160 }}>
        {loading
          ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
          : cartItems.length === 0
          ? <Text style={styles.message}>Your cart is empty.</Text>
          : cartItems.map((item: any) => (
              <View key={item.id} style={styles.cartRow}>
                <Image
                  source={{ uri: getImageUrl(item.products?.banner_url) }}
                  style={styles.productImage}
                />
                <View style={styles.productInfo}>
                  <Text style={styles.productName} numberOfLines={2}>
                    {item.products?.name || "Product not found"}
                  </Text>
                  <View style={styles.row}>
                    <Text style={styles.productQuantity}>Qty: {item.quantity}</Text>
                    <Text style={styles.productAmount}>
                      ${(item.amount || item.products?.amount || 0 * item.quantity).toFixed(2)}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
      </ScrollView>

      {cartItems.length > 0 && !loading && (
        <View style={styles.checkoutContainer}>
          <Text style={styles.totalText}>Total: ${totalAmount.toFixed(2)}</Text>
          <TouchableOpacity style={styles.checkoutButton}>
            <Text style={styles.checkoutButtonText}>Checkout</Text>
          </TouchableOpacity>
        </View>
      )}
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
    height: 60,
    justifyContent: "center",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    backgroundColor: "#fff",
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
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingBottom: 12,
  },
  productImage: {
    width: width * 0.3,
    height: width * 0.3,
    resizeMode: "contain",
    marginRight: 14,
    borderRadius: 12,
  },
  productInfo: {
    flex: 1,
    justifyContent: "space-between",
  },
  productName: {
    fontSize: width < 360 ? 13 : 15,
    fontWeight: "600",
    marginBottom: 6,
    color: "#0e1216",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  productQuantity: {
    fontSize: width < 360 ? 12 : 14,
    color: "#555",
  },
  productAmount: {
    fontSize: width < 360 ? 14 : 16,
    fontWeight: "700",
    color: "#0e1216",
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
