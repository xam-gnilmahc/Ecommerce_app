import React, { useEffect, useState, useContext } from "react";
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
  Animated,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { AuthContext } from "../context/AuthContext";

const STORAGE_BASE_URL =
  "https://fzliiwigydluhgbuvnmr.supabase.co/storage/v1/object/public/productimages/";


type ProductDetailRouteProp = {
  params: {
    id: number;
  };
};
const { width } = Dimensions.get("window");

const ProductDetail = () => {
  const route = useRoute() as ProductDetailRouteProp;
  const navigation = useNavigation();
  const { id } = route.params;
  const { fetchProductDetail } = useContext(AuthContext);
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const animatedValue = new Animated.Value(0);
  useEffect(() => {
    Animated.loop(
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  useEffect(() => {
    const loadDetail = async () => {
      try {
        const data = await fetchProductDetail(id);
        setProduct(data);
      } catch (error) {
        console.error("Error loading product detail:", error);
      } finally {
        setLoading(false);
      }
    };
    loadDetail();
  }, [id]);

  const shimmerOpacity = animatedValue.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.3, 1, 0.3],
  });

  return (
    <View style={styles.wrapper}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" translucent />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back-outline" size={24} color="#000" />
        </TouchableOpacity>

        <View style={styles.headerIcons}>
          <TouchableOpacity>
            <Ionicons name="share-outline" size={22} color="#000" />
          </TouchableOpacity>
          <TouchableOpacity style={{ marginLeft: 20 }}>
            <Ionicons name="heart-outline" size={22} color="#000" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      {loading ? (
        <View style={{ flex: 1 }}>
          <Animated.View style={[styles.imageSkeleton, { opacity: shimmerOpacity }]} />
          <View style={styles.skeletonContent}>
            <Animated.View style={[styles.skeletonTextLarge, { opacity: shimmerOpacity }]} />
            <Animated.View style={[styles.skeletonTextMedium, { opacity: shimmerOpacity }]} />
            <Animated.View style={[styles.skeletonTextSmall, { opacity: shimmerOpacity }]} />
          </View>
        </View>
      ) : !product ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <Text style={styles.errorText}>Product not found.</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.imageContainer}>
            <Image
              source={{
                uri: product.banner_url?.startsWith("http")
                  ? product.banner_url
                  : `${STORAGE_BASE_URL}${product.banner_url}`,
              }}
              style={styles.image}
            />
          </View>

          <View style={styles.divider} />
          <Text style={styles.productTitle}>{product.name}</Text>
          <Text style={styles.productSub}>{product.brand || "—"}</Text>
          <Text style={styles.productPrice}>${product.amount?.toFixed(2)}</Text>

          {product.description && (
            <Text style={styles.warningText}>
              ⚠️ <Text style={styles.warningBold}>WARNING:</Text> {product.description}
            </Text>
          )}
        </ScrollView>
      )}

      <View style={styles.bottomButtonContainer}>
        <TouchableOpacity style={styles.addButton}>
          <Text style={styles.addButtonText}>Add to bag</Text>
        </TouchableOpacity>
      </View>
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  headerIcons: {
    flexDirection: "row",
    alignItems: "center",
  },
  imageContainer: {
    alignItems: "center",
    justifyContent: "center",
    width: width * 1,
    height: width * 1,
  },
  image: {
    width: width * 0.7,
    height: width * 0.7,
    resizeMode: "contain",
  },
  divider: {
    height: 2,
    width: "20%",
    backgroundColor: "#000",
    marginTop: 10,
    marginBottom: 15,
    marginHorizontal:20,
  },
  productTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#000",
    paddingHorizontal:20,
  },
  productSub: {
    color: "#555",
    fontSize: 14,
    marginTop: 2,
    paddingHorizontal:20,
  },
  productPrice: {
    fontSize: 22,
    fontWeight: "700",
    color: "#000",
    marginTop: 10,
    paddingHorizontal:20,
  },
  warningText: {
    marginTop: 15,
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
    paddingHorizontal:20,
  },
  warningBold: {
    fontWeight: "700",
  },
  bottomButtonContainer: {
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === "ios" ? 30 : 20,
    backgroundColor: "#fff",
  },
  addButton: {
    backgroundColor: "#0e1216ff",
    borderRadius: 30,
    paddingVertical: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  addButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  // Skeleton
  imageSkeleton: {
    width: "100%",
    height: width * 0.7,
    backgroundColor: "#e0e0e0",
  },
  skeletonContent: {
    padding: 20,
  },
  skeletonTextLarge: {
    width: "70%",
    height: 20,
    borderRadius: 6,
    backgroundColor: "#e0e0e0",
    marginBottom: 10,
  },
  skeletonTextMedium: {
    width: "50%",
    height: 16,
    borderRadius: 6,
    backgroundColor: "#e0e0e0",
    marginBottom: 10,
  },
  skeletonTextSmall: {
    width: "30%",
    height: 16,
    borderRadius: 6,
    backgroundColor: "#e0e0e0",
  },
  errorText: {
    color: "red",
    textAlign: "center",
  },
});

export default ProductDetail;
