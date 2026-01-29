import React, { useContext, useEffect, useState, useCallback } from "react";
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Platform,
  StatusBar,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { AuthContext } from "../context/AuthContext";
import { useNavigation } from "@react-navigation/native";
import { COLORS, SPACING, FONTSIZE } from "../theme/theme";
import Ionicons from "react-native-vector-icons/Ionicons";
import ProductCard from "../components/ProductCard";
import { supabase } from "../utils/supbase";

const { width } = Dimensions.get("window");

const BRANDS = ["Apple", "Samsung", "Google", "Nothing", "Huawei", "Sony", "Redmi", "Vivo"];

const Home = () => {
  const { fetchProducts } = useContext(AuthContext);
  const [products, setProducts] = useState<any[]>([]);
  const [productLoading, setProductLoading] = useState(true);
  const [selectedBrand, setSelectedBrand] = useState("Apple");
  const [page, setPage] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const navigation = useNavigation();

  const ITEMS_PER_PAGE = 20;

  const loadProducts = async (pageToLoad:any, reset = false) => {
    reset ? setProductLoading(true) : setLoadingMore(true);
    const from = pageToLoad * ITEMS_PER_PAGE;
    const to = from + ITEMS_PER_PAGE - 1;

    try {
      const data = await fetchProducts(selectedBrand, from, to);
      setProducts(reset ? (data || []) : (prev => [...prev, ...(data || [])]));
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setProductLoading(false);
      setLoadingMore(false);
    }
  };


  useEffect(() => {
    setPage(0);
    loadProducts(0, true);
  }, [selectedBrand]);

  const handleLoadMore = () => {
    if (!loadingMore && products.length >= (page + 1) * ITEMS_PER_PAGE) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadProducts(nextPage);
    }
  };

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (err) {
      console.error("Logout error:", err.message);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <View style={styles.headerContainer}>
        <View style={styles.searchRow}>
          <TouchableOpacity
            style={{ flex: 1 }}
            activeOpacity={0.8}
            onPress={() => navigation.navigate("Search")}
          >
            <View pointerEvents="none">
              <TextInput
                placeholder="Search products..."
                placeholderTextColor="#888"
                style={styles.searchInput}
                editable={false}
              />
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.logoutButton} onPress={logout}>
            <Ionicons name="log-out-outline" size={22} color="#333" />
          </TouchableOpacity>
        </View>

        <FlatList
          data={BRANDS}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.brandButton,
                selectedBrand === item && styles.brandButtonActive,
              ]}
              onPress={() => setSelectedBrand(item)}
            >
              <Text
                style={[
                  styles.brandText,
                  selectedBrand === item && styles.brandTextActive,
                ]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {productLoading ? (
        <>
          {[1, 2, 3].map((_, index) => (
            <View key={index} style={styles.skeletonCard}>
              <View style={styles.skeletonImage} />
              <View style={styles.skeletonTextLine} />
              <View style={[styles.skeletonTextLine, { width: "70%" }]} />
            </View>
          ))}
        </>
      ) : (
        <FlatList
          data={products}
          renderItem={({ item }) => (
            <ProductCard
              id={item.id}
              name={item.name}
              description={item.description}
              banner_url={item.banner_url}
              rating={item.rating}
              amount={item.amount}
            />
          )}
          keyExtractor={(item, index) => `${item.id}-${index}`}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            loadingMore ? <ActivityIndicator size="small" color="#967EDAFF" /> : null
          }
          contentContainerStyle={styles.productList}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1,backgroundColor: COLORS.primaryWhiteHex,paddingHorizontal: SPACING.space_12,paddingTop: Platform.OS === "ios" ? 60 : StatusBar.currentHeight},
  headerContainer: {backgroundColor: "#fff",paddingBottom: SPACING.space_10,borderBottomColor: "#f0f0f0",borderBottomWidth: 1,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: SPACING.space_12,
    width: width - 24, // make sure it takes full screen width minus padding
  },
  logoutButton: {
    marginLeft: 10,
    padding: 10,
    backgroundColor: "#f5f5f5",
    borderRadius: 10,
  },
  searchInput: {
    backgroundColor: "#f5f5f5",
    borderRadius: 10,
    paddingHorizontal: SPACING.space_12,
    paddingVertical: SPACING.space_10,
    fontSize: FONTSIZE.size_14,
    color: COLORS.primaryBlackHex,
    paddingRight: 40,
    width: "100%",
  },
  brandButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: "#f5f5f5",
    marginRight: 10,
  },
  brandButtonActive: {
    backgroundColor: "#967EDAFF",
  },
  brandText: {
    fontSize: FONTSIZE.size_14,
    color: "#555",
    fontWeight: "500",
  },
  brandTextActive: {
    color: "#fff",
    fontWeight: "600",
  },
  productList: {
    paddingHorizontal: SPACING.space_10,
    paddingTop: SPACING.space_8,
    paddingBottom: SPACING.space_20,
  },
  loadingBox: {
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 100,
  },
  lottie: {
    width: 120,
    height: 120,
  },
  emptyText: {
    textAlign: "center",
    color: "#999",
    marginTop: 50,
    fontSize: FONTSIZE.size_14,
  },
  skeletonCard: {
  backgroundColor: "#fff",
  borderRadius: 12,
  marginBottom: 16,
  padding: 12,
},
skeletonImage: {
  width: "100%",
  height: 160,
  borderRadius: 10,
  backgroundColor: "#e0e0e0",
  marginBottom: 10,
  opacity: 0.5,
},
skeletonTextLine: {
  height: 14,
  borderRadius: 6,
  backgroundColor: "#e0e0e0",
  marginBottom: 8,
  opacity: 0.5,
},

});

export default Home;
