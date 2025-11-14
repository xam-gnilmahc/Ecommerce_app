import React from "react";
import { View, Text, Image, StyleSheet, Dimensions ,TouchableOpacity} from "react-native";
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
    >
    <View style={[styles.cardContainer, { marginBottom:30 }]}>
       <View style={styles.imageWrapper}>
        {imageUri && (
          <Image
            source={{ uri: imageUri }}
            style={styles.productImage}
            resizeMode="contain"
          />
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

        <View style={styles.infoRow}>
           {rating !== undefined && (
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={14} color="#F5B400" style={styles.starIcon} />
              <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
            </View>
          )}
          {amount !== undefined && (
            <Text style={styles.amountText}>Rs{amount.toFixed(2)}</Text>
          )}
        </View>
      </View>
    </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    overflow: "hidden",
    marginVertical: SPACING.space_8,
    marginHorizontal: CARD_MARGIN,
    width: CARD_WIDTH,
  },
  imageWrapper: {
    width: "100%",
    height: width * 0.55, // fills most of the width, good ratio across devices
    backgroundColor: "#ffffff",
  },
    ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  starIcon: {
    marginRight: 4,
  },
  productImage: {
    width: "100%",
    height: width * 0.5, // responsive height based on device width
    backgroundColor: "#ffffff",
  },
  textContainer: {
    backgroundColor: "#ffffff",
    paddingVertical: SPACING.space_10,
    paddingHorizontal: SPACING.space_12,
  },
  nameText: {
    fontSize: FONTSIZE.size_16,
    fontWeight: "600",
    color: "#111111",
    marginBottom: SPACING.space_4,
  },
  descriptionText: {
    fontSize: FONTSIZE.size_12,
    color: "#777777",
    marginBottom: SPACING.space_8,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  ratingText: {
    fontSize: FONTSIZE.size_12,
    color: "#444444",
    fontWeight: "600",
  },
  amountText: {
    fontSize: FONTSIZE.size_16,
    fontWeight: "700",
    color: "#111111",
  },
});

export default ProductCard;
