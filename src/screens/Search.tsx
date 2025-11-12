import React, { useState, useEffect, useRef } from "react";
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";
import { COLORS, SPACING, FONTSIZE } from "../theme/theme";

const SEARCH_HISTORY_KEY = "SEARCH_HISTORY";
const { width } = Dimensions.get("window");

const Search = () => {
  const navigation = useNavigation();
  const [searchText, setSearchText] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    const stored = await AsyncStorage.getItem(SEARCH_HISTORY_KEY);
    if (stored) setHistory(JSON.parse(stored));
  };

  const saveHistory = async (term: string) => {
    let updatedHistory = [term, ...history.filter((h) => h !== term)];
    if (updatedHistory.length > 10) updatedHistory = updatedHistory.slice(0, 10);
    setHistory(updatedHistory);
    await AsyncStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updatedHistory));
  };

  const handleSearch = () => {
    const term = searchText.trim();
    if (!term) return;

    saveHistory(term);
    setSearchText("");
    inputRef.current?.focus();
  };

  const handleHistoryPress = (term: string) => {
    setSearchText(term);
    inputRef.current?.focus();
  };

  const handleClearAll = async () => {
    setHistory([]);
    await AsyncStorage.removeItem(SEARCH_HISTORY_KEY);
  };

  return (
    <KeyboardAvoidingView
      style={styles.flexContainer}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.leftIcon}
          >
            <Ionicons name="chevron-back" size={28} color="#000" />
          </TouchableOpacity>

          <TextInput
            ref={inputRef}
            placeholder="Search products..."
            placeholderTextColor="#888"
            style={styles.searchInput}
            value={searchText}
            onChangeText={setSearchText}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
            autoFocus
            blurOnSubmit={false}
          />
        </View>

        <View style={styles.historyHeaderRow}>
          <Text style={styles.historyTitle}>Recent Searches</Text>
          {history.length > 0 && (
            <TouchableOpacity onPress={handleClearAll}>
              <Text style={styles.clearAllText}>Clear All</Text>
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.historyWrapper}>
        <FlatList
          data={history}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item}
          contentContainerStyle={styles.historyList}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.historyItem}
              onPress={() => handleHistoryPress(item)}
            >
              <Text style={styles.historyText} numberOfLines={1}>
                {item}
              </Text>
            </TouchableOpacity>
          )}
        />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  flexContainer: { flex: 1, backgroundColor: "#fff" },
  container: {
    flex: 1,
    paddingHorizontal: width * 0.06,
    paddingTop: Platform.OS === "ios" ? 80 : 60,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.space_16,
  },
  historyWrapper: { height: 50, marginBottom: SPACING.space_16, },
  leftIcon: { marginRight: SPACING.space_8 },
  searchInput: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    borderRadius: 10,
    paddingHorizontal: SPACING.space_12,
    paddingVertical: SPACING.space_10,
    fontSize: FONTSIZE.size_14,
    color: COLORS.primaryBlackHex,
  },
  historyHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.space_8,
  },
  historyTitle: {
    fontSize: FONTSIZE.size_14,
    fontWeight: "600",
    color: "#555",
  },
  clearAllText: {
    fontSize: FONTSIZE.size_12,
    color: "red",
    fontWeight: "500",
  },
  historyList: {
    paddingVertical: SPACING.space_4,
  },
  historyItem: {
    backgroundColor: "#f5f5f5",
    paddingHorizontal: SPACING.space_12,
    paddingVertical: SPACING.space_8,
    borderRadius: 20,
    marginRight: SPACING.space_10,
    justifyContent: "center",
    alignItems: "center",
    width: 120,
  },
  historyText: {
    fontSize: FONTSIZE.size_14,
    color: "#333",
  },
});

export default Search;
