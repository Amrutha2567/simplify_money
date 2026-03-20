import { Feather } from "@expo/vector-icons";
import React, { useEffect, useRef } from "react";
import {
  ActivityIndicator,
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import Colors from "@/constants/colors";
import { MetalPrice } from "@/services/api";

const METAL_COLORS: Record<string, { accent: string; dim: string }> = {
  gold: { accent: Colors.gold, dim: Colors.goldDim },
  silver: { accent: Colors.silver, dim: Colors.silverDim },
  platinum: { accent: Colors.platinum, dim: Colors.platinumDim },
  palladium: { accent: Colors.palladium, dim: Colors.palladiumDim },
};

const METAL_ICONS: Record<string, string> = {
  gold: "circle",
  silver: "disc",
  platinum: "hexagon",
  palladium: "octagon",
};

type Props = {
  metalId: string;
  data: MetalPrice | null;
  isLoading: boolean;
  error: string | null;
  onPress: () => void;
  onRetry: () => void;
};

export function MetalCard({
  metalId,
  data,
  isLoading,
  error,
  onPress,
  onRetry,
}: Props) {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (data && !isLoading) {
      Animated.spring(opacity, {
        toValue: 1,
        useNativeDriver: true,
        tension: 60,
        friction: 8,
      }).start();
    }
  }, [data, isLoading]);

  const metalColor = METAL_COLORS[metalId] || {
    accent: Colors.accent,
    dim: Colors.accentDim,
  };

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.97,
      useNativeDriver: true,
      tension: 200,
      friction: 10,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      tension: 200,
      friction: 10,
    }).start();
  };

  const isPositive = data ? data.changePercent >= 0 : true;
  const changeColor = isPositive ? Colors.up : Colors.down;
  const changeBg = isPositive ? Colors.upDim : Colors.downDim;

  return (
    <Animated.View style={[styles.wrapper, { transform: [{ scale }] }]}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={isLoading || !!error}
        style={styles.pressable}
      >
        <View
          style={[
            styles.container,
            { borderColor: isLoading ? Colors.borderSubtle : metalColor.dim },
          ]}
        >
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: metalColor.dim },
                ]}
              >
                <Feather
                  name={METAL_ICONS[metalId] as any}
                  size={18}
                  color={metalColor.accent}
                />
              </View>
              <View>
                <Text style={styles.metalName}>
                  {data?.name ?? metalId.charAt(0).toUpperCase() + metalId.slice(1)}
                </Text>
                <Text style={styles.metalSymbol}>
                  {data?.symbol ?? "—"} · {data?.purity ?? "—"}
                </Text>
              </View>
            </View>

            {isLoading ? (
              <ActivityIndicator size="small" color={metalColor.accent} />
            ) : error ? null : data ? (
              <View
                style={[styles.changeBadge, { backgroundColor: changeBg }]}
              >
                <Feather
                  name={isPositive ? "trending-up" : "trending-down"}
                  size={12}
                  color={changeColor}
                />
                <Text style={[styles.changeText, { color: changeColor }]}>
                  {isPositive ? "+" : ""}
                  {data.changePercent.toFixed(2)}%
                </Text>
              </View>
            ) : null}
          </View>

          {isLoading ? (
            <View style={styles.loadingContent}>
              <View
                style={[styles.skeleton, styles.skeletonPrice, { backgroundColor: metalColor.dim }]}
              />
              <View
                style={[styles.skeleton, styles.skeletonLabel, { backgroundColor: Colors.borderSubtle }]}
              />
            </View>
          ) : error ? (
            <View style={styles.errorContent}>
              <Feather name="wifi-off" size={20} color={Colors.textMuted} />
              <Text style={styles.errorText}>{error}</Text>
              <Pressable onPress={onRetry} style={styles.retryButton}>
                <Text style={styles.retryText}>Retry</Text>
              </Pressable>
            </View>
          ) : data ? (
            <Animated.View style={[styles.dataContent, { opacity }]}>
              <Text style={[styles.price, { color: metalColor.accent }]}>
                ₹{data.price.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </Text>
              <View style={styles.footer}>
                <Text style={styles.unit}>{data.unit}</Text>
                <Text style={styles.timestamp}>
                  {data.timestamp.toLocaleTimeString("en-IN", {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })}
                </Text>
              </View>
            </Animated.View>
          ) : null}
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: 20,
    marginBottom: 12,
  },
  pressable: {
    borderRadius: 16,
    overflow: "hidden",
  },
  container: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  metalName: {
    fontSize: 17,
    fontWeight: "700",
    color: Colors.text,
    fontFamily: "Inter_700Bold",
  },
  metalSymbol: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
    fontFamily: "Inter_400Regular",
  },
  changeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  changeText: {
    fontSize: 12,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  price: {
    fontSize: 28,
    fontWeight: "700",
    letterSpacing: -0.5,
    fontFamily: "Inter_700Bold",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 6,
  },
  unit: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontFamily: "Inter_400Regular",
  },
  timestamp: {
    fontSize: 11,
    color: Colors.textMuted,
    fontFamily: "Inter_400Regular",
  },
  loadingContent: {
    gap: 8,
  },
  skeleton: {
    borderRadius: 6,
    height: 14,
  },
  skeletonPrice: {
    height: 28,
    width: "60%",
  },
  skeletonLabel: {
    width: "40%",
  },
  dataContent: {},
  errorContent: {
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
  },
  errorText: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: "center",
    fontFamily: "Inter_400Regular",
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: Colors.accentDim,
    borderRadius: 20,
    marginTop: 4,
  },
  retryText: {
    fontSize: 13,
    color: Colors.accent,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
});
