import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useRedemptions } from "@/hooks/useRedemptions";
import { usePoints } from "@/hooks/usePoints";

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function PointsRedemptionModal({ visible, onClose }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { rewards, redemptions, redeem } = useRedemptions();
  const { total: pointsTotal, refresh: refreshPoints } = usePoints();
  const [redeeming, setRedeeming] = useState<string | null>(null);

  const handleRedeem = async (rewardId: string, title: string, cost: number) => {
    if (pointsTotal < cost) {
      Alert.alert("Not Enough Points", `You need ${cost} points. You have ${pointsTotal}.`);
      return;
    }
    Alert.alert(
      "Redeem Reward",
      `Redeem "${title}" for ${cost} points?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Redeem",
          style: "default",
          onPress: async () => {
            setRedeeming(rewardId);
            try {
              await redeem(rewardId);
              await refreshPoints();
              Alert.alert("🎉 Redeemed!", `Your "${title}" reward is pending fulfillment. Check your email for details.`);
            } catch (e: unknown) {
              Alert.alert("Error", e instanceof Error ? e.message : "Could not redeem reward");
            } finally {
              setRedeeming(null);
            }
          },
        },
      ],
    );
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top + 12 }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.foreground }]}>Kinfolk Points</Text>
          <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: colors.muted }]}>
            <Feather name="x" size={18} color={colors.foreground} />
          </TouchableOpacity>
        </View>

        <View style={[styles.balanceCard, { backgroundColor: "#CA922B14", borderColor: "#CA922B30" }]}>
          <Feather name="zap" size={20} color="#CA922B" />
          <View>
            <Text style={styles.balanceValue}>{pointsTotal.toLocaleString()}</Text>
            <Text style={[styles.balanceLabel, { color: colors.mutedForeground }]}>Kinfolk Points available</Text>
          </View>
        </View>

        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>AVAILABLE REWARDS</Text>

        <ScrollView
        keyboardDismissMode="on-drag" contentContainerStyle={styles.rewardList} showsVerticalScrollIndicator={false}>
          {rewards.map((reward) => {
            const canAfford = pointsTotal >= reward.pointsCost;
            const isRedeeming = redeeming === reward.id;
            return (
              <View
                key={reward.id}
                style={[styles.rewardCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <View style={styles.rewardTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.rewardTitle, { color: colors.foreground }]}>{reward.title}</Text>
                    <Text style={[styles.rewardDesc, { color: colors.mutedForeground }]}>{reward.description}</Text>
                  </View>
                  <View style={[styles.costPill, { backgroundColor: canAfford ? "#CA922B18" : colors.muted }]}>
                    <Feather name="zap" size={11} color={canAfford ? "#CA922B" : colors.mutedForeground} />
                    <Text style={[styles.costText, { color: canAfford ? "#CA922B" : colors.mutedForeground }]}>
                      {reward.pointsCost}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={[
                    styles.redeemBtn,
                    { backgroundColor: canAfford ? colors.primary : colors.muted },
                  ]}
                  onPress={() => handleRedeem(reward.id, reward.title, reward.pointsCost)}
                  disabled={!canAfford || isRedeeming}
                  activeOpacity={0.85}
                >
                  {isRedeeming ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={[styles.redeemBtnText, { color: canAfford ? "#FFFFFF" : colors.mutedForeground }]}>
                      {canAfford ? "Redeem" : `Need ${reward.pointsCost - pointsTotal} more pts`}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            );
          })}

          {redemptions.length > 0 && (
            <>
              <Text style={[styles.sectionLabel, { color: colors.mutedForeground, marginTop: 16 }]}>REDEMPTION HISTORY</Text>
              {redemptions.map((r) => (
                <View key={r.id} style={[styles.historyRow, { borderBottomColor: colors.border }]}>
                  <Text style={[styles.historyTitle, { color: colors.foreground }]}>{r.rewardTitle}</Text>
                  <View style={styles.historyRight}>
                    <Text style={[styles.historyCost, { color: "#CA922B" }]}>-{r.pointsCost} pts</Text>
                    <View style={[styles.statusPill, { backgroundColor: r.status === "fulfilled" ? "#2D7A4F18" : "#CA922B18" }]}>
                      <Text style={[styles.statusText, { color: r.status === "fulfilled" ? "#2D7A4F" : "#CA922B" }]}>
                        {r.status}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1,
  },
  title: { fontFamily: "Inter_700Bold", fontSize: 20 },
  closeBtn: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  balanceCard: {
    flexDirection: "row", alignItems: "center", gap: 12,
    marginHorizontal: 20, marginTop: 16, borderRadius: 14, borderWidth: 1.5, padding: 16,
  },
  balanceValue: { fontFamily: "Inter_700Bold", fontSize: 28, color: "#CA922B" },
  balanceLabel: { fontFamily: "Inter_400Regular", fontSize: 13 },
  sectionLabel: { fontFamily: "Inter_600SemiBold", fontSize: 11, marginHorizontal: 20, marginTop: 20, marginBottom: 8 },
  rewardList: { paddingHorizontal: 20, paddingBottom: 40, gap: 12 },
  rewardCard: {
    borderRadius: 14, borderWidth: 1, padding: 14, gap: 12,
  },
  rewardTop: { flexDirection: "row", gap: 10, alignItems: "flex-start" },
  rewardTitle: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  rewardDesc: { fontFamily: "Inter_400Regular", fontSize: 12, lineHeight: 17, marginTop: 2 },
  costPill: {
    flexDirection: "row", alignItems: "center", gap: 3,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20,
  },
  costText: { fontFamily: "Inter_700Bold", fontSize: 12 },
  redeemBtn: {
    height: 40, borderRadius: 10, alignItems: "center", justifyContent: "center",
  },
  redeemBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  historyRow: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingVertical: 10, borderBottomWidth: 1,
  },
  historyTitle: { fontFamily: "Inter_500Medium", fontSize: 13 },
  historyRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  historyCost: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  statusPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  statusText: { fontFamily: "Inter_500Medium", fontSize: 11 },
});
