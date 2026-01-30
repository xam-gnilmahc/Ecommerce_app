import React from "react";
import { View, Text, Image, StyleSheet, Dimensions, TouchableOpacity } from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { COLORS, FONTSIZE, SPACING } from "../theme/theme";
import { useNavigation } from "@react-navigation/native";

type ProductCardProps = {
  name: string;
  description?: string;
  banner_url?: string;
  rating?: number;
  id?: number;
  amount?: number;
};

const STORAGE_BASE_URL =
  "https://fzliiwigydluhgbuvnmr.supabase.co/storage/v1/object/public/productimages/";

const { width } = Dimensions.get("window");
const CARD_MARGIN = SPACING.space_10;
const CARD_WIDTH = width - CARD_MARGIN * 2;

const ProductCard = ({
  name,
  description,
  banner_url,
  rating,
  id,
  amount,
}: ProductCardProps) => {
  const navigation = useNavigation();
  const imageUri = banner_url ? `${STORAGE_BASE_URL}${banner_url}` : undefined;

  return (
    <TouchableOpacity
      key={id}
      activeOpacity={0.8}
      onPress={() => navigation.navigate("ProductDetail", { id })}
      style={{ width: "100%" }}
    >
      <View style={[styles.cardContainer, { marginBottom: 30 }]}>
        <View style={styles.imageWrapper}>
          {imageUri && (
            <Image
              source={{ uri: imageUri }}
              style={styles.productImage}
              resizeMode="contain"
            />
          )}

          {/* Price Badge */}
          {amount !== undefined && (
            <View style={styles.priceBadge}>
              <Text style={styles.priceText}>${amount}</Text>
            </View>
          )}

          {/* Rating Badge */}
          {rating !== undefined && (
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={12} color="#F5B400" />
              <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
            </View>
          )}
        </View>

        <View style={styles.textContainer}>
          <Text style={styles.nameText} numberOfLines={2}>
            {name}
          </Text>

          {description && (
            <Text style={styles.descriptionText} numberOfLines={2}>
              {description}
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    overflow: "hidden",
    width: "100%",
  },
  imageWrapper: {
    width: "100%",
    aspectRatio: 16 / 9, // keeps responsive height based on width
  },
  productImage: {
    width: "100%",
    height: "100%",
  },
  priceBadge: {
    position: "absolute",
    top: 8,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 6,
    backgroundColor: "rgba(18, 47, 65, 0.82)", // subtle overlay for visibility
  },
  priceText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: FONTSIZE.size_14,
  },
  ratingBadge: {
    position: "absolute",
    top: 8,
    right: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 6,
    backgroundColor: "rgba(255,255,255,0.9)",
  },
  ratingText: {
    marginLeft: 4,
    color: "#444",
    fontSize: FONTSIZE.size_12,
    fontWeight: "600",
  },
  textContainer: {
    paddingVertical: SPACING.space_10,
  },
  nameText: {
    fontSize: FONTSIZE.size_16,
    fontWeight: "600",
    color: "#111",
    marginBottom: SPACING.space_4,
  },
  descriptionText: {
    fontSize: FONTSIZE.size_12,
    color: "#777",
  },
});

export default ProductCard;