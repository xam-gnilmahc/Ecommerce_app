import React, { useEffect, useState, useContext, useRef } from "react";
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
import { ResponseNotificationContext } from "../context/ResponseNotificationContext";

const STORAGE_BASE_URL =
  "https://fzliiwigydluhgbuvnmr.supabase.co/storage/v1/object/public/productimages/";

type ProductDetailRouteProp = { params: { id: number } };
const { width } = Dimensions.get("window");

const colors = ["#FF0000", "#00FF00", "#0000FF", "#FFA500"];
const sizes = ["S", "M", "L", "XL"];

const ProductDetail = () => {
  const route = useRoute() as ProductDetailRouteProp;
  const navigation = useNavigation();
  const { id } = route.params;
  const { fetchProductDetail, addToCart } = useContext(AuthContext);
  const { showResponse } = useContext(ResponseNotificationContext);

  const [product, setProduct] = useState<any>(null);
  const [mergedImages, setMergedImages] = useState<any[]>([]);
  const [mainImage, setMainImage] = useState("");
  const [loading, setLoading] = useState(true);
  const [buttonLoading, setButtonLoading] = useState(false);

  const [selectedColor, setSelectedColor] = useState(colors[0]);
  const [selectedSize, setSelectedSize] = useState(sizes[0]);

  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const fadeScaleAnim = useRef(new Animated.Value(0)).current;

  // Shimmer loader animation
  useEffect(() => {
    Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  // Load product details
  useEffect(() => {
    const loadDetail = async () => {
      try {
        const data = await fetchProductDetail(id);
        setProduct(data);

        const tempArr: any[] = [];

        // Add banner image FIRST if exists
        if (data?.banner_url) {
          const banner = data.banner_url.startsWith("http")
            ? data.banner_url
            : `${STORAGE_BASE_URL}${data.banner_url}`;

          tempArr.push({ id: "banner", url: banner });
        }

        if (data?.product_images?.length > 0) {
          data.product_images.forEach((img: any) => {
            tempArr.push({
              id: img.id,
              url: img.image_url.startsWith("http")
                ? img.image_url
                : `${STORAGE_BASE_URL}${img.image_url}`,
            });
          });
        }

        setMergedImages(tempArr);

        // Set main image (banner if exists, else first product image)
        if (tempArr.length > 0) {
          setMainImage(tempArr[0].url);
        }

        Animated.timing(fadeScaleAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }).start();
      } catch (error) {
        showResponse("Error loading product details", "error");
      } finally {
        setLoading(false);
      }
    };

    loadDetail();
  }, [id]);

  const shimmerOpacity = shimmerAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.3, 1, 0.3],
  });

  const handleAddToCart = async () => {
    if (!product) return;
    setButtonLoading(true);
    try {
      const result = await addToCart(product.id);
      showResponse(result.message, result.success ? "success" : "error");
    } catch {
      showResponse("Something went wrong", "error");
    } finally {
      setButtonLoading(false);
    }
  };

  return (
    <View style={styles.wrapper}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" translucent />

      {/* Header */}
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

      {/* Loading State */}
      {loading ? (
        <View style={{ flex: 1 }}>
          <Animated.View
            style={[styles.imageSkeleton, { opacity: shimmerOpacity }]}
          />
          <View style={styles.skeletonContent}>
            <Animated.View
              style={[styles.skeletonTextLarge, { opacity: shimmerOpacity }]}
            />
            <Animated.View
              style={[styles.skeletonTextMedium, { opacity: shimmerOpacity }]}
            />
            <Animated.View
              style={[styles.skeletonTextSmall, { opacity: shimmerOpacity }]}
            />
          </View>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          <Animated.View
            style={{
              opacity: fadeScaleAnim,
              transform: [
                {
                  scale: fadeScaleAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.95, 1],
                  }),
                },
              ],
            }}
          >
            {/* MAIN IMAGE */}
            <View style={styles.imageContainer}>
              <View style={styles.mainImageFrame}>
                <Image
                  source={{ uri: mainImage }}
                  style={styles.mainImage}
                />
              </View>
            </View>

            {/* MERGED THUMBNAILS */}
            {mergedImages.length > 0 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ marginTop: 14, paddingHorizontal: 20 }}
              >
                {mergedImages.map((img) => {
                  const isSelected = img.url === mainImage;

                  return (
                    <TouchableOpacity
                      key={img.id}
                      activeOpacity={0.8}
                      onPress={() => setMainImage(img.url)}
                      style={{ marginRight: 14 }}
                    >
                      <View
                        style={[
                          styles.thumbBox,
                          {
                            borderColor: isSelected ? "#787676ff" : "#ddd",
                            borderWidth: isSelected ? 2.2 : 1,
                            transform: [{ scale: isSelected ? 0.93 : 1 }],
                          },
                        ]}
                      >
                        <Image
                          source={{ uri: img.url }}
                          style={{
                            width: "100%",
                            height: "100%",
                            resizeMode: "contain",
                            opacity: isSelected ? 0.85 : 1,
                          }}
                        />
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}

            <View style={styles.divider} />

            {/* PRODUCT INFO */}
            <Text style={styles.productTitle}>{product.name}</Text>
            <Text style={styles.productSub}>{product.brand || "—"}</Text>
            <Text style={styles.productPrice}>
              ${product.amount?.toFixed(2)}
            </Text>

            {/* COLORS */}
            {/* <View style={styles.selectorWrapper}>
              <Text style={styles.selectorTitle}>Choose Color</Text>
              <View style={styles.selectorRow}>
                {colors.map((color) => (
                  <TouchableOpacity
                    key={color}
                    onPress={() => setSelectedColor(color)}
                    style={[
                      styles.colorCircle,
                      { backgroundColor: color },
                      selectedColor === color && styles.colorSelected,
                    ]}
                  />
                ))}
              </View>
            </View> */}

            {/* SIZES */}
            {/* <View style={styles.selectorWrapper}>
              <Text style={styles.selectorTitle}>Choose Size</Text>
              <View style={styles.selectorRow}>
                {sizes.map((size) => (
                  <TouchableOpacity
                    key={size}
                    onPress={() => setSelectedSize(size)}
                    style={[
                      styles.sizeBox,
                      selectedSize === size && styles.sizeSelected,
                    ]}
                  >
                    <Text style={{ fontWeight: "600" }}>{size}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View> */}

            {/* DESCRIPTION */}
            {product.description && (
              <Text style={styles.warningText}>
                {product?.description || ""}
              </Text>
            )}
          </Animated.View>
        </ScrollView>
      )}

      {/* ADD TO CART */}
      <View style={styles.bottomButtonContainer}>
        <TouchableOpacity
          style={[styles.addButton, buttonLoading && { opacity: 0.6 }]}
          onPress={handleAddToCart}
          disabled={buttonLoading}
        >
          <Text style={styles.addButtonText}>
            {buttonLoading ? "Adding..." : "Add to bag"}
          </Text>
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

  // MAIN IMAGE
  imageContainer: {
    alignItems: "center",
    justifyContent: "center",
    width: width,
    marginTop: 10,
  },
  mainImageFrame: {
    width: width * 0.9,
    height: width * 0.9,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  mainImage: {
    width: "85%",
    height: "85%",
    resizeMode: "contain",
  },

  // THUMBNAILS
  thumbBox: {
    width: width * 0.2,
    height: width * 0.2,
    borderRadius: 14,
    overflow: "hidden",
    padding:4,
  },

  divider: {
    height: 2,
    width: "20%",
    backgroundColor: "#000",
    marginTop: 18,
    marginBottom: 15,
    marginHorizontal: 20,
  },

  productTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#000",
    paddingHorizontal: 20,
  },
  productSub: {
    color: "#555",
    fontSize: 14,
    marginTop: 2,
    paddingHorizontal: 20,
  },
  productPrice: {
    fontSize: 22,
    fontWeight: "700",
    color: "#000",
    marginTop: 10,
    paddingHorizontal: 20,
  },

  selectorWrapper: {
    paddingHorizontal: 20,
    marginTop: 18,
  },
  selectorTitle: {
    fontWeight: "700",
    marginBottom: 8,
  },
  selectorRow: {
    flexDirection: "row",
    gap: 12,
  },

  colorCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#417caaff",
  },
  colorSelected: {
    borderColor: "#000",
    borderWidth: 3,
  },

  sizeBox: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ccc",
  },
  sizeSelected: {
    borderColor: "#000",
    backgroundColor: "#eee",
  },

  warningText: {
    marginTop: 15,
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
    paddingHorizontal: 20,
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

  // Skeletons
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
});

export default ProductDetail;
