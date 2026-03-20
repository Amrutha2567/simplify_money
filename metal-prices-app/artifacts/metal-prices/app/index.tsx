import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { MetalCard } from "@/components/MetalCard";
import Colors from "@/constants/colors";
import { METALS, MetalId, MetalPrice, fetchMetalPrice } from "@/services/api";

type MetalState = {
  data: MetalPrice | null;
  isLoading: boolean;
  error: string | null;
};

function useMetalData() {
  const [states, setStates] = useState<Record<MetalId, MetalState>>({
    gold: { data: null, isLoading: true, error: null },
    silver: { data: null, isLoading: true, error: null },
    platinum: { data: null, isLoading: true, error: null },
    palladium: { data: null, isLoading: true, error: null },
  });

  const loadMetal = useCallback(async (id: MetalId) => {
    setStates((prev) => ({
      ...prev,
      [id]: { data: prev[id].data, isLoading: true, error: null },
    }));
    try {
      const data = await fetchMetalPrice(id);
      setStates((prev) => ({
        ...prev,
        [id]: { data, isLoading: false, error: null },
      }));
    } catch (e: any) {
      setStates((prev) => ({
        ...prev,
        [id]: {
          data: null,
          isLoading: false,
          error: e.message || "Failed to fetch",
        },
      }));
    }
  }, []);

  const loadAll = useCallback(() => {
    METALS.forEach((id) => loadMetal(id));
  }, [loadMetal]);

  useEffect(() => {
    loadAll();
  }, []);

  return { states, loadMetal, loadAll };
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { states, loadMetal, loadAll } = useMetalData();
  const [refreshing, setRefreshing] = useState(false);
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const titleY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(titleY, {
        toValue: 0,
        tension: 60,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    loadAll();
    setTimeout(() => setRefreshing(false), 1600);
  }, [loadAll]);

  const allLoaded = METALS.every((id) => !states[id].isLoading);
  const totalPortfolioValue = METALS.reduce((sum, id) => {
    const d = states[id].data;
    if (!d) return sum;
    return sum + d.price;
  }, 0);

  const gainersCount = METALS.filter(
    (id) => states[id].data && states[id].data!.changePercent > 0
  ).length;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Animated.View
        style={[
          styles.header,
          { opacity: headerOpacity, transform: [{ translateY: titleY }] },
        ]}
      >
        <View>
          <Text style={styles.headerLabel}>Market Overview</Text>
          <Text style={styles.headerTitle}>Precious Metals</Text>
        </View>
        <View style={styles.headerRight}>
          <View
            style={[
              styles.liveDot,
              { backgroundColor: allLoaded ? Colors.up : Colors.gold },
            ]}
          />
          <Text
            style={[
              styles.liveText,
              { color: allLoaded ? Colors.up : Colors.gold },
            ]}
          >
            {allLoaded ? "LIVE" : "LOADING"}
          </Text>
        </View>
      </Animated.View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 24 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.gold}
            colors={[Colors.gold]}
          />
        }
      >
        {allLoaded && totalPortfolioValue > 0 && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Combined Price Index</Text>
            <Text style={styles.summaryValue}>
              ₹
              {totalPortfolioValue.toLocaleString("en-IN", {
                minimumFractionDigits: 2,
              })}
            </Text>
            <View style={styles.summaryRow}>
              <View style={styles.summaryBadge}>
                <Feather name="trending-up" size={12} color={Colors.up} />
                <Text style={styles.summaryBadgeText}>
                  {gainersCount} up today
                </Text>
              </View>
              <View
                style={[
                  styles.summaryBadge,
                  { backgroundColor: Colors.downDim },
                ]}
              >
                <Feather name="trending-down" size={12} color={Colors.down} />
                <Text
                  style={[styles.summaryBadgeText, { color: Colors.down }]}
                >
                  {METALS.length - gainersCount} down today
                </Text>
              </View>
            </View>
          </View>
        )}

        <Text style={styles.sectionTitle}>Live Prices</Text>

        {METALS.map((id) => (
          <MetalCard
            key={id}
            metalId={id}
            data={states[id].data}
            isLoading={states[id].isLoading}
            error={states[id].error}
            onPress={() =>
              states[id].data &&
              router.push({
                pathname: "/details",
                params: { id },
              })
            }
            onRetry={() => loadMetal(id)}
          />
        ))}

        <Text style={styles.disclaimer}>
          Prices are indicative and for educational purposes only. Tap any
          metal for detailed information.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingHorizontal: 20,
    paddingBottom: 16,
    paddingTop: 8,
  },
  headerLabel: {
    fontSize: 12,
    color: Colors.textMuted,
    fontFamily: "Inter_500Medium",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: Colors.text,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: Colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  liveText: {
    fontSize: 11,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.5,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 8,
  },
  summaryCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  summaryLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontFamily: "Inter_400Regular",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  summaryValue: {
    fontSize: 32,
    fontWeight: "700",
    color: Colors.text,
    fontFamily: "Inter_700Bold",
    letterSpacing: -1,
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: "row",
    gap: 8,
  },
  summaryBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: Colors.upDim,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  summaryBadgeText: {
    fontSize: 12,
    color: Colors.up,
    fontFamily: "Inter_500Medium",
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textSecondary,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginHorizontal: 20,
    marginBottom: 12,
  },
  disclaimer: {
    fontSize: 11,
    color: Colors.textMuted,
    textAlign: "center",
    paddingHorizontal: 32,
    lineHeight: 16,
    marginTop: 8,
    fontFamily: "Inter_400Regular",
  },
});
