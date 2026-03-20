import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors from "@/constants/colors";
import { MetalId, MetalPrice, fetchMetalPrice } from "@/services/api";

const METAL_COLORS: Record<string, { accent: string; dim: string }> = {
  gold: { accent: Colors.gold, dim: Colors.goldDim },
  silver: { accent: Colors.silver, dim: Colors.silverDim },
  platinum: { accent: Colors.platinum, dim: Colors.platinumDim },
  palladium: { accent: Colors.palladium, dim: Colors.palladiumDim },
};

function StatRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: string;
}) {
  return (
    <View style={statStyles.row}>
      <Text style={statStyles.label}>{label}</Text>
      <Text style={[statStyles.value, highlight ? { color: highlight } : {}]}>
        {value}
      </Text>
    </View>
  );
}

const statStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
  },
  label: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontFamily: "Inter_400Regular",
  },
  value: {
    fontSize: 14,
    color: Colors.text,
    fontFamily: "Inter_600SemiBold",
    fontWeight: "600",
  },
});

export default function DetailsScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: MetalId }>();
  const [data, setData] = useState<MetalPrice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const contentOpacity = useRef(new Animated.Value(0)).current;
  const contentY = useRef(new Animated.Value(30)).current;

  const metalColor = METAL_COLORS[id ?? "gold"] ?? {
    accent: Colors.accent,
    dim: Colors.accentDim,
  };

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await fetchMetalPrice(id as MetalId);
      setData(result);
      Animated.parallel([
        Animated.timing(contentOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(contentY, {
          toValue: 0,
          tension: 60,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    } catch (e: any) {
      setError(e.message || "Failed to load data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const isPositive = data ? data.changePercent >= 0 : true;
  const changeColor = isPositive ? Colors.up : Colors.down;
  const changeBg = isPositive ? Colors.upDim : Colors.downDim;

  const now = new Date();
  const dateStr = now.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const timeStr = now.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  return (
    <View
      style={[styles.container, { paddingTop: insets.top }]}
    >
      <View style={styles.navbar}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backButton}
          hitSlop={12}
        >
          <Feather name="arrow-left" size={22} color={Colors.text} />
        </Pressable>
        <Text style={styles.navTitle}>
          {data?.name ?? id?.charAt(0).toUpperCase() + (id?.slice(1) ?? "")}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={metalColor.accent} />
          <Text style={styles.loadingText}>Fetching live price...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <View
            style={[styles.errorIcon, { backgroundColor: Colors.downDim }]}
          >
            <Feather name="wifi-off" size={32} color={Colors.down} />
          </View>
          <Text style={styles.errorTitle}>Something went wrong</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <Pressable onPress={loadData} style={styles.retryBtn}>
            <Feather name="refresh-cw" size={16} color={Colors.text} />
            <Text style={styles.retryBtnText}>Try Again</Text>
          </Pressable>
        </View>
      ) : data ? (
        <Animated.ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 32 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            style={{
              opacity: contentOpacity,
              transform: [{ translateY: contentY }],
            }}
          >
            <View style={styles.heroCard}>
              <View
                style={[
                  styles.metalIconLarge,
                  { backgroundColor: metalColor.dim },
                ]}
              >
                <Text
                  style={[styles.metalSymbolText, { color: metalColor.accent }]}
                >
                  {data.symbol}
                </Text>
              </View>

              <Text style={styles.metalNameLarge}>{data.name}</Text>
              <Text style={styles.purityText}>
                {data.purity} · {data.unit}
              </Text>

              <Text
                style={[styles.priceHero, { color: metalColor.accent }]}
              >
                ₹
                {data.price.toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                })}
              </Text>

              <View style={[styles.changePill, { backgroundColor: changeBg }]}>
                <Feather
                  name={isPositive ? "trending-up" : "trending-down"}
                  size={14}
                  color={changeColor}
                />
                <Text style={[styles.changeHeroText, { color: changeColor }]}>
                  {isPositive ? "+" : ""}
                  {data.change.toFixed(2)} ({isPositive ? "+" : ""}
                  {data.changePercent.toFixed(2)}%)
                </Text>
              </View>

              <Text style={styles.timestampHero}>
                Updated at {timeStr}
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Price Details</Text>
              <View style={styles.card}>
                <StatRow
                  label="Current Price"
                  value={`₹${data.price.toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                  })}`}
                  highlight={metalColor.accent}
                />
                <StatRow
                  label="Previous Open"
                  value={`₹${data.prevOpen.toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                  })}`}
                />
                <StatRow
                  label="Previous Close"
                  value={`₹${data.prevClose.toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                  })}`}
                />
                <StatRow
                  label="24H High"
                  value={`₹${data.high24h.toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                  })}`}
                  highlight={Colors.up}
                />
                <View
                  style={[statStyles.row, { borderBottomWidth: 0 }]}
                >
                  <Text style={statStyles.label}>24H Low</Text>
                  <Text style={[statStyles.value, { color: Colors.down }]}>
                    ₹
                    {data.low24h.toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                    })}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Change</Text>
              <View style={styles.card}>
                <StatRow
                  label="Change (₹)"
                  value={`${isPositive ? "+" : ""}₹${Math.abs(data.change).toFixed(2)}`}
                  highlight={changeColor}
                />
                <View
                  style={[statStyles.row, { borderBottomWidth: 0 }]}
                >
                  <Text style={statStyles.label}>Change (%)</Text>
                  <Text
                    style={[statStyles.value, { color: changeColor }]}
                  >
                    {isPositive ? "+" : ""}
                    {data.changePercent.toFixed(2)}%
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Session Info</Text>
              <View style={styles.card}>
                <StatRow label="Date" value={dateStr} />
                <StatRow label="Time" value={timeStr} />
                <StatRow label="Metal" value={data.name} />
                <StatRow label="Symbol" value={data.symbol} />
                <View
                  style={[statStyles.row, { borderBottomWidth: 0 }]}
                >
                  <Text style={statStyles.label}>Purity</Text>
                  <Text style={statStyles.value}>{data.purity}</Text>
                </View>
              </View>
            </View>

            <View style={styles.disclaimerBox}>
              <Feather
                name="info"
                size={14}
                color={Colors.textMuted}
                style={{ marginTop: 1 }}
              />
              <Text style={styles.disclaimerText}>
                Prices are indicative only and for educational purposes. Not
                financial advice.
              </Text>
            </View>
          </Animated.View>
        </Animated.ScrollView>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  navbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  navTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: Colors.text,
    fontFamily: "Inter_600SemiBold",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontFamily: "Inter_400Regular",
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    gap: 12,
  },
  errorIcon: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.text,
    fontFamily: "Inter_700Bold",
  },
  errorMessage: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: "center",
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
  },
  retryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.accent,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 14,
    marginTop: 8,
  },
  retryBtnText: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.text,
    fontFamily: "Inter_600SemiBold",
  },
  scrollContent: {
    paddingTop: 8,
  },
  heroCard: {
    marginHorizontal: 20,
    marginBottom: 24,
    backgroundColor: Colors.surface,
    borderRadius: 24,
    padding: 28,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  metalIconLarge: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  metalSymbolText: {
    fontSize: 18,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  metalNameLarge: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.text,
    fontFamily: "Inter_700Bold",
    marginBottom: 4,
  },
  purityText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontFamily: "Inter_400Regular",
    marginBottom: 16,
  },
  priceHero: {
    fontSize: 40,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    letterSpacing: -1,
    marginBottom: 12,
  },
  changePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 24,
    marginBottom: 12,
  },
  changeHeroText: {
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  timestampHero: {
    fontSize: 11,
    color: Colors.textMuted,
    fontFamily: "Inter_400Regular",
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.textSecondary,
    fontFamily: "Inter_600SemiBold",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  disclaimerBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginHorizontal: 20,
    marginTop: 8,
    padding: 14,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 11,
    color: Colors.textMuted,
    fontFamily: "Inter_400Regular",
    lineHeight: 16,
  },
});
