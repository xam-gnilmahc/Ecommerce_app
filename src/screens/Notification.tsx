import React, { useEffect, useState, useContext, useRef } from "react";
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    StyleSheet,
    StatusBar,
    useWindowDimensions,
    Platform,
    Animated,
} from "react-native";
import { AuthContext } from "../context/AuthContext";
import RenderHtml from "react-native-render-html";
import Ionicons from 'react-native-vector-icons/Ionicons';

type NotificationItem = {
    id: number;
    message: string;
    order_id: number;
    type: number;
    created_at: string;
};

const AnimatedNotification = ({
    item,
    index,
    fadeAnim,
    width,
    animatedIndexes,
}: {
    item: NotificationItem;
    index: number;
    fadeAnim: Animated.Value;
    width: number;
    animatedIndexes: React.MutableRefObject<Set<number>>;
}) => {
    useEffect(() => {
        if (!animatedIndexes.current.has(index)) {
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 400,
                delay: index * 100,
                useNativeDriver: true,
            }).start();
            animatedIndexes.current.add(index);
        }
    }, []);

    const renderType = (type: number) => {
        switch (type) {
            case 0:
                return "New Order";
            case 1:
                return "Out for Delivery";
            default:
                return "Update";
        }
    };

    // Check if notification is from today
    const isToday = new Date(item.created_at).toDateString() === new Date().toDateString();

    return (
        <Animated.View style={{ opacity: fadeAnim }}>
            <TouchableOpacity style={[styles.card, { width }]} activeOpacity={0.8}>
                <View style={styles.leftDot} />
                <View style={{ flex: 1 }}>
                    <Text style={styles.typeText}>{renderType(item.type)}</Text>
                    <RenderHtml
                        contentWidth={width}
                        source={item.message ? { html: item.message } : { html: "<p></p>" }}
                        tagsStyles={{
                            a: { color: "#0d6efd", textDecorationLine: "underline" },
                            b: { fontWeight: "700" },
                            span: { fontWeight: "600", color: "#28a745" },
                        }}
                    />
                    <Text style={styles.time}>{new Date(item.created_at).toLocaleString()}</Text>
                </View>
                {/* Right icon for today's notifications */}
                {isToday && (
                    <View style={{ justifyContent: 'center', alignItems: 'center', marginLeft: 8 }}>
                        <Ionicons name="ellipse" size={14} color="#28a745" />
                    </View>
                )}
            </TouchableOpacity>
        </Animated.View>
    );
};

const NotificationScreen = () => {
    const { fetchNotifications } = useContext(AuthContext);
    const { width } = useWindowDimensions();

    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [page, setPage] = useState(0);
    const [loading, setLoading] = useState(true);
    const [hasMore, setHasMore] = useState(false);

    const pageSize = 60;
    const fadeAnims = useRef<Animated.Value[]>([]);
    const animatedIndexes = useRef<Set<number>>(new Set());

    const loadNotifications = async (reset = false) => {
        reset ? setLoading(true) : setHasMore(true);
        const from = page * pageSize;
        const to = from + pageSize - 1;

        try {
            const data = (await fetchNotifications(from, to)) || [];
            if (reset) {
                setNotifications(data);
                fadeAnims.current = data.map(() => new Animated.Value(0));
                animatedIndexes.current.clear();
            } else {
                setNotifications((prev) => {
                    const merged = [...prev, ...data];
                    fadeAnims.current.push(...data.map(() => new Animated.Value(0)));
                    return merged;
                });
            }
        } catch (error) {
            console.error("Error fetching notifications:", error);
        } finally {
            setLoading(false);
            setHasMore(false);
        }
    };

    useEffect(() => {
        setPage(0);
        loadNotifications(true);
    }, []);

    const handleLoadMore = () => {
        if (!hasMore && notifications.length >= (page + 1) * pageSize) {
            const nextPage = page + 1;
            setPage(nextPage);
            loadNotifications();
        }
    };

    const renderSkeletonItem = (i: number) => (
        <View key={i} style={[styles.card, { width: width - 24, opacity: 0.5 }]}>
            <View style={[styles.leftDot, { backgroundColor: "#ddd" }]} />
            <View style={{ flex: 1 }}>
                <View style={styles.skeletonLine} />
                <View style={[styles.skeletonLine, { width: "70%" }]} />
                <View style={[styles.skeletonLine, { width: "50%" }]} />
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Notifications</Text>
            </View>

            {loading && notifications.length === 0 ? (
                <View>{Array.from({ length: 10 }).map((_, i) => renderSkeletonItem(i))}</View>
            ) : (
                <FlatList
                    data={notifications}
                    keyExtractor={(item, index) => `${item.id}-${index}`}
                    renderItem={({ item, index }) => (
                        <AnimatedNotification
                            item={item}
                            index={index}
                            fadeAnim={fadeAnims.current[index]}
                            width={width}
                            animatedIndexes={animatedIndexes}
                        />
                    )}
                    contentContainerStyle={{ paddingBottom: 40 }}
                    onEndReached={handleLoadMore}
                    onEndReachedThreshold={0.5}
                    showsVerticalScrollIndicator={false}
                    ListFooterComponent={
                        hasMore ? (
                            <ActivityIndicator
                                size="small"
                                color="#967EDAFF"
                                style={{ marginVertical: 12 }}
                            />
                        ) : null
                    }
                />
            )}
        </View>
    );
};

export default NotificationScreen;

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#ffffffff", paddingTop: Platform.OS === "ios" ? 60 : StatusBar.currentHeight, paddingHorizontal: 12 },
    header: { height:60,justifyContent:"center",borderBottomWidth: 1, borderBottomColor: "#eee", backgroundColor: "#fff", marginBottom: 8 , paddingBottom:10,},
    headerTitle: { fontSize: 22, fontWeight: "700", color: "#111" },
    card: { flexDirection: "row", backgroundColor: "#fff", padding: 14, borderRadius: 12, alignSelf: "center", marginBottom: 10 },
    leftDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#ff5722", marginRight: 12, marginTop: 8 },
    typeText: { fontSize: 15, fontWeight: "600", marginBottom: 4, color: "#333" },
    message: { fontSize: 14, color: "#444", marginBottom: 6, lineHeight: 20 },
    time: { fontSize: 12, color: "#999", marginTop: 4 },
    skeletonLine: { width: "90%", height: 12, backgroundColor: "#E3E3E3", borderRadius: 6, marginBottom: 8 },
});
