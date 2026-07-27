import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import React, { useRef } from "react";
import {
  Alert,
  Animated,
  Linking,
  Modal,
  Platform,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { useColors } from "@/hooks/useColors";

interface ShareModalProps {
  visible: boolean;
  onClose: () => void;
  businessId: string;
  businessName: string;
  city: string;
  state: string;
  category: string;
}

export function ShareModal({ visible, onClose, businessId, businessName, city, state, category }: ShareModalProps) {
  const colors = useColors();
  const slideAnim = useRef(new Animated.Value(300)).current;
  const profileUrl = `https://mappingwithmelanin.com/business/${businessId}`;

  React.useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 80,
        friction: 12,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 300,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const caption = `🖤 Check out ${businessName} on Mapping With Melanin!\n📍 ${city}, ${state} — ${category}\n👉 ${profileUrl}\n\n#MappingWithMelanin #BlackOwned #SupportBlackBusinesses #BlackExcellence`;

  const copyAndOpen = async (url: string, appName: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await Clipboard.setStringAsync(caption);
    onClose();
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
    } else {
      Alert.alert(
        `${appName} not installed`,
        `Your caption has been copied to clipboard. Download ${appName} and paste it in your post!`,
        [{ text: "OK" }]
      );
    }
  };

  const handleInstagram = () => copyAndOpen("instagram://camera", "Instagram");
  const handleTikTok = () => copyAndOpen("tiktok://", "TikTok");

  const handleCopyLink = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await Clipboard.setStringAsync(caption);
    onClose();
    Alert.alert("Copied!", "Caption copied to clipboard.", [{ text: "OK" }]);
  };

  const handleNativeShare = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
    try {
      await Share.share({ message: caption, url: profileUrl, title: businessName });
    } catch {}
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop} />
      </TouchableWithoutFeedback>

      <Animated.View
        style={[
          styles.sheet,
          { backgroundColor: colors.card, transform: [{ translateY: slideAnim }] },
        ]}
      >
        <View style={[styles.handle, { backgroundColor: colors.border }]} />

        <Text style={[styles.title, { color: colors.foreground }]}>Share this business</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Caption copied automatically when you tap an app
        </Text>

        <View style={styles.grid}>
          <TouchableOpacity style={styles.appBtn} onPress={handleInstagram} activeOpacity={0.8}>
            <View style={[styles.appIcon, styles.instagramGradient]}>
              <Text style={styles.appIconText}>📸</Text>
            </View>
            <Text style={[styles.appLabel, { color: colors.foreground }]}>Instagram</Text>
            <Text style={[styles.appSublabel, { color: colors.mutedForeground }]}>Story / Post</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.appBtn} onPress={handleTikTok} activeOpacity={0.8}>
            <View style={[styles.appIcon, styles.tiktokBg]}>
              <Text style={styles.appIconText}>🎵</Text>
            </View>
            <Text style={[styles.appLabel, { color: colors.foreground }]}>TikTok</Text>
            <Text style={[styles.appSublabel, { color: colors.mutedForeground }]}>Video / Post</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.appBtn} onPress={handleCopyLink} activeOpacity={0.8}>
            <View style={[styles.appIcon, { backgroundColor: colors.secondary }]}>
              <Text style={styles.appIconText}>📋</Text>
            </View>
            <Text style={[styles.appLabel, { color: colors.foreground }]}>Copy</Text>
            <Text style={[styles.appSublabel, { color: colors.mutedForeground }]}>Caption</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.appBtn} onPress={handleNativeShare} activeOpacity={0.8}>
            <View style={[styles.appIcon, { backgroundColor: colors.secondary }]}>
              <Text style={styles.appIconText}>↗️</Text>
            </View>
            <Text style={[styles.appLabel, { color: colors.foreground }]}>More</Text>
            <Text style={[styles.appSublabel, { color: colors.mutedForeground }]}>Options</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.captionPreview, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
          <Text style={[styles.captionLabel, { color: colors.mutedForeground }]}>Caption preview</Text>
          <Text style={[styles.captionText, { color: colors.foreground }]} numberOfLines={3}>
            {caption}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.cancelBtn, { borderColor: colors.border }]}
          onPress={onClose}
          activeOpacity={0.7}
        >
          <Text style={[styles.cancelText, { color: colors.mutedForeground }]}>Cancel</Text>
        </TouchableOpacity>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: Platform.OS === "ios" ? 36 : 24,
    gap: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 20,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 4,
  },
  title: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
    textAlign: "center",
  },
  subtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    textAlign: "center",
    marginTop: -8,
  },
  grid: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 4,
  },
  appBtn: {
    alignItems: "center",
    gap: 6,
    minWidth: 70,
  },
  appIcon: {
    width: 60,
    height: 60,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  instagramGradient: {
    backgroundColor: "#C13584",
  },
  tiktokBg: {
    backgroundColor: "#010101",
  },
  appIconText: {
    fontSize: 26,
  },
  appLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
  },
  appSublabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    marginTop: -4,
  },
  captionPreview: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    gap: 4,
  },
  captionLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  captionText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    lineHeight: 18,
  },
  cancelBtn: {
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 14,
    alignItems: "center",
  },
  cancelText: {
    fontFamily: "Inter_500Medium",
    fontSize: 15,
  },
});
