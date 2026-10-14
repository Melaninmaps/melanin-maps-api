import React from "react";
import {
  Linking,
  StyleSheet,
  Text,
  type StyleProp,
  type TextStyle,
  View,
  type ViewStyle,
} from "react-native";
import { parseSafeSourceLink } from "@/lib/sourceLinks";
import { kinfolkAnswerBlocks } from "@/lib/kinfolkAnswerBlocks";

function InlineKinfolkText({ text, color, linkColor }: { text: string; color: string; linkColor: string }) {
  const tokens = text.split(/(\[[^\]]+\]\(https?:\/\/[^\s)]+\)|\*\*[^*]+\*\*)/g);
  return tokens.filter(Boolean).map((token, index) => {
    const markdownLink = token.match(/^\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)$/);
    if (markdownLink) {
      const safe = parseSafeSourceLink({ title: markdownLink[1], url: markdownLink[2] });
      return safe ? (
        <Text
          key={`${safe.url}-${index}`}
          style={{ color: linkColor, textDecorationLine: "underline", fontFamily: "Inter_600SemiBold" }}
          accessibilityRole="link"
          onPress={() => void Linking.openURL(safe.url).catch(() => undefined)}
        >
          {safe.title}
        </Text>
      ) : <Text key={index} style={{ color }}>{markdownLink[1]}</Text>;
    }

    const bold = token.match(/^\*\*([^*]+)\*\*$/);
    return bold ? (
      <Text key={index} style={{ color, fontFamily: "Inter_700Bold" }}>{bold[1]}</Text>
    ) : <Text key={index} style={{ color }}>{token}</Text>;
  });
}

export function KinfolkAnswerText({
  content,
  color,
  linkColor,
  textStyle,
  containerStyle,
  selectable = true,
}: {
  content: string;
  color: string;
  linkColor: string;
  textStyle?: StyleProp<TextStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  selectable?: boolean;
}) {
  const blocks = kinfolkAnswerBlocks(content);
  if (blocks.length === 0) return null;

  return (
    <View testID="kinfolk-answer-text" style={[styles.container, containerStyle]}>
      {blocks.map((block, index) => {
        if (block.kind === "bullets" || block.kind === "steps") {
          return (
            <View
              key={`${block.kind}-${index}`}
              accessibilityRole="list"
              style={styles.list}
            >
              {block.items.map((item, itemIndex) => (
                <View key={`${item}-${itemIndex}`} accessible accessibilityLabel={item} style={styles.listRow}>
                  <Text selectable={selectable} style={[styles.marker, textStyle, { color }]}>{block.kind === "bullets" ? "•" : `${itemIndex + 1}.`}</Text>
                  <Text selectable={selectable} style={[styles.body, textStyle, { color }]}><InlineKinfolkText text={item} color={color} linkColor={linkColor} /></Text>
                </View>
              ))}
            </View>
          );
        }
        if (block.kind === "code") {
          return <Text key={`code-${index}`} selectable={selectable} style={[styles.code, textStyle]}>{block.text}</Text>;
        }
        return <Text key={`paragraph-${index}`} selectable={selectable} style={[styles.body, textStyle, { color }]}><InlineKinfolkText text={block.text} color={color} linkColor={linkColor} /></Text>;
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 10 },
  body: { fontFamily: "Inter_400Regular", fontSize: 14, lineHeight: 21 },
  list: { gap: 5 },
  listRow: { flexDirection: "row", alignItems: "flex-start", gap: 7 },
  marker: { minWidth: 17, fontFamily: "Inter_600SemiBold", fontSize: 14, lineHeight: 21, textAlign: "right" },
  code: { borderRadius: 8, backgroundColor: "#2B1507", color: "#F5EBD8", padding: 10, fontFamily: "monospace", fontSize: 12, lineHeight: 18 },
});
