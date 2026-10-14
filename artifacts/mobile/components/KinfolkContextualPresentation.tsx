import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import { Image, Linking, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { parseSafeSourceLink } from "@/lib/sourceLinks";

export type KinfolkStructuredContent =
  | { kind: "recipe_options"; options: Array<{ title: string; description: string; keyIngredients: string[]; timeLabel: string | null }> }
  | { kind: "recipe_instructions"; title: string; ingredients: string[]; steps: string[]; foodSafety: string[] }
  | { kind: "cultural_consensus"; subject: string; conclusion: string; criteria: string[]; evidenceFor: string[]; otherDefensibleViews: string[]; asOf: string | null }
  | { kind: "ranked_perspectives"; criteria: string[]; entries: Array<{ name: string; reason: string; evidenceSummary: string }> }
  | { kind: "entity_explorer"; canonicalName: string; overview: string; pathways: Array<{ label: string; description: string; libraryHref: string | null }> };

export type KinfolkMediaLink = {
  title: string;
  creator: string | null;
  platform: string;
  url: string;
  reason: string;
};

export type KinfolkRelatedConnection = {
  title: string;
  relationship: string;
  reason: string;
  href: string | null;
  evidenceUrl: string | null;
};

export type KinfolkResearchStatus = {
  usedInternal: boolean;
  usedLiveWeb: boolean;
  degraded: boolean;
  asOf: string;
};

/**
 * Additive response metadata selected only by the API's reviewed visual
 * registry. The client still validates the remote image host before rendering.
 */
export type KinfolkContextualVisual =
  | {
      kind: "image";
      id: string;
      title: string;
      imageUrl: string;
      alt: string;
      sourceUrl: string;
      sourceLabel: string;
      attribution: string;
      licenseLabel: string;
      licenseUrl: string;
      classification: "illustrative_photo";
    }
  | {
      kind: "external_gallery";
      id: string;
      title: string;
      description: string;
      sourceUrl: string;
      sourceLabel: string;
      safetyNote: string;
    };

type Props = {
  structuredContent?: KinfolkStructuredContent | null;
  mediaLinks?: KinfolkMediaLink[] | null;
  relatedConnections?: KinfolkRelatedConnection[] | null;
  researchStatus?: KinfolkResearchStatus | null;
  contextualVisuals?: KinfolkContextualVisual[] | null;
  color: string;
  mutedColor: string;
  borderColor: string;
  accentColor: string;
  onOpenLibrary?: (href: string) => void;
};

function safeLibraryHref(href: string | null | undefined): string | null {
  return typeof href === "string" && /^\/library\/(?:topics?|entries)\/[A-Za-z0-9_-]+(?:\/[A-Za-z0-9_-]+)*$/.test(href)
    ? href
    : null;
}

/** Never infer a research source: this label mirrors only server-returned status. */
export function kinfolkResearchStatusLabel(status: KinfolkResearchStatus): string {
  if (status.usedInternal && status.usedLiveWeb) return "Research: Library + current sources";
  if (status.usedInternal) return "Research: Library sources";
  if (status.usedLiveWeb) return "Research: current sources";
  return "Research: no linked sources used";
}

function SafeExternalLink({ title, url, color }: { title: string; url: string; color: string }) {
  const safe = parseSafeSourceLink({ title, url });
  if (!safe) return null;
  return (
    <TouchableOpacity
      accessibilityRole="link"
      accessibilityLabel={`Open source: ${safe.title}`}
      onPress={() => void Linking.openURL(safe.url).catch(() => undefined)}
      style={styles.link}
    >
      <Feather name="external-link" size={12} color={color} />
      <Text style={[styles.linkText, { color }]} numberOfLines={2}>{safe.title}</Text>
    </TouchableOpacity>
  );
}

function approvedContextualImageUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:"
      && url.hostname === "thumb.wikimedia.org"
      && url.pathname.startsWith("/wikipedia/commons/thumb/")
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}

function safeContextualVisuals(
  visuals: KinfolkContextualVisual[] | null | undefined,
): KinfolkContextualVisual[] {
  const safeVisuals: KinfolkContextualVisual[] = [];
  for (const visual of visuals ?? []) {
    const source = parseSafeSourceLink({ title: visual?.sourceLabel, url: visual?.sourceUrl });
    if (!source || typeof visual?.id !== "string" || typeof visual?.title !== "string") continue;
    if (visual.kind === "external_gallery") {
      if (typeof visual.description === "string" && typeof visual.safetyNote === "string") {
        safeVisuals.push({ ...visual, sourceUrl: source.url, sourceLabel: source.title });
      }
      continue;
    }
    const imageUrl = approvedContextualImageUrl(visual.imageUrl);
    const license = parseSafeSourceLink({ title: visual.licenseLabel, url: visual.licenseUrl });
    if (imageUrl && license && typeof visual.alt === "string" && typeof visual.attribution === "string"
      && visual.classification === "illustrative_photo") {
      safeVisuals.push({ ...visual, imageUrl, sourceUrl: source.url, sourceLabel: source.title, licenseUrl: license.url, licenseLabel: license.title });
    }
  }
  return safeVisuals.slice(0, 3);
}

function ContextualVisualCard({
  visual,
  color,
  mutedColor,
  accentColor,
}: {
  visual: KinfolkContextualVisual;
  color: string;
  mutedColor: string;
  accentColor: string;
}) {
  const [imageUnavailable, setImageUnavailable] = useState(false);
  if (visual.kind === "external_gallery") {
    return (
      <View testID="kinfolk-contextual-visual-gallery" style={styles.visualCard}>
        <Text style={[styles.detailTitle, { color }]}>{visual.title}</Text>
        <Text style={[styles.detailText, { color: mutedColor }]}>{visual.description}</Text>
        <SafeExternalLink title={visual.sourceLabel} url={visual.sourceUrl} color={accentColor} />
        <Text style={[styles.safetyText, { color: mutedColor }]}>{visual.safetyNote}</Text>
      </View>
    );
  }
  return (
    <View testID="kinfolk-contextual-visual-image" style={styles.visualCard}>
      <Text style={[styles.detailTitle, { color }]}>{visual.title}</Text>
      {imageUnavailable ? (
        <View testID="kinfolk-contextual-visual-fallback" style={styles.visualFallback}>
          <Text style={[styles.detailText, { color: mutedColor }]}>This educational image could not load. Its attributed source remains available below.</Text>
        </View>
      ) : (
        <Image
          source={{ uri: visual.imageUrl }}
          accessibilityLabel={visual.alt}
          style={styles.visualImage}
          resizeMode="cover"
          onError={() => setImageUnavailable(true)}
        />
      )}
      <Text style={[styles.detailText, { color: mutedColor }]}>{visual.attribution} · {visual.licenseLabel}</Text>
      <SafeExternalLink title={visual.sourceLabel} url={visual.sourceUrl} color={accentColor} />
      <SafeExternalLink title={`License: ${visual.licenseLabel}`} url={visual.licenseUrl} color={accentColor} />
    </View>
  );
}

function StructuredDetails({
  content,
  color,
  mutedColor,
  accentColor,
  onOpenLibrary,
}: {
  content: KinfolkStructuredContent;
  color: string;
  mutedColor: string;
  accentColor: string;
  onOpenLibrary?: (href: string) => void;
}) {
  if (content.kind === "recipe_options") {
    return (
      <View style={styles.stack}>
        {content.options.slice(0, 4).map((option) => (
          <View key={option.title} style={styles.detailBlock}>
            <Text style={[styles.detailTitle, { color }]}>{option.title}</Text>
            <Text style={[styles.detailText, { color: mutedColor }]}>{option.description}</Text>
            <Text style={[styles.detailText, { color: mutedColor }]}>{[option.timeLabel, option.keyIngredients.slice(0, 4).join(", ")].filter(Boolean).join(" · ")}</Text>
          </View>
        ))}
      </View>
    );
  }
  if (content.kind === "recipe_instructions") {
    return (
      <View style={styles.stack}>
        <Text style={[styles.detailTitle, { color }]}>{content.title}</Text>
        <Text style={[styles.detailText, { color: mutedColor }]}>Ingredients: {content.ingredients.slice(0, 8).join(", ")}</Text>
        {content.steps.slice(0, 6).map((step, index) => <Text key={`${index}-${step}`} style={[styles.detailText, { color: mutedColor }]}>{index + 1}. {step}</Text>)}
        {content.foodSafety.slice(0, 3).map((note) => <Text key={note} style={[styles.safetyText, { color }]}>{note}</Text>)}
      </View>
    );
  }
  if (content.kind === "cultural_consensus") {
    return (
      <View style={styles.stack}>
        <Text style={[styles.detailTitle, { color }]}>{content.subject}</Text>
        <Text style={[styles.detailText, { color: mutedColor }]}>{content.conclusion}</Text>
        {content.criteria.slice(0, 5).map((criterion) => <Text key={criterion} style={[styles.detailText, { color: mutedColor }]}>• {criterion}</Text>)}
      </View>
    );
  }
  if (content.kind === "ranked_perspectives") {
    return (
      <View style={styles.stack}>
        {content.criteria.slice(0, 5).map((criterion) => (
          <Text key={criterion} style={[styles.detailText, { color: mutedColor }]}>• {criterion}</Text>
        ))}
        {content.entries.slice(0, 5).map((entry, index) => (
          <View key={entry.name} style={styles.detailBlock}>
            <Text style={[styles.detailTitle, { color }]}>{index + 1}. {entry.name}</Text>
            <Text style={[styles.detailText, { color: mutedColor }]}>{entry.reason}</Text>
            <Text style={[styles.detailText, { color: mutedColor }]}>{entry.evidenceSummary}</Text>
          </View>
        ))}
      </View>
    );
  }
  return (
    <View style={styles.stack}>
      <Text style={[styles.detailTitle, { color }]}>{content.canonicalName}</Text>
      <Text style={[styles.detailText, { color: mutedColor }]}>{content.overview}</Text>
      {content.pathways.slice(0, 5).map((pathway) => {
        const libraryHref = safeLibraryHref(pathway.libraryHref);
        return (
          <View key={`${pathway.label}-${pathway.libraryHref ?? ""}`} style={styles.detailBlock}>
            <Text style={[styles.detailTitle, { color }]}>{pathway.label}</Text>
            <Text style={[styles.detailText, { color: mutedColor }]}>{pathway.description}</Text>
            {libraryHref && onOpenLibrary ? (
              <TouchableOpacity accessibilityRole="link" onPress={() => onOpenLibrary(libraryHref)} style={styles.link}>
                <Feather name="book-open" size={12} color={accentColor} />
                <Text style={[styles.linkText, { color: accentColor }]}>Open Library context</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

export function KinfolkContextualPresentation({
  structuredContent,
  mediaLinks,
  relatedConnections,
  researchStatus,
  contextualVisuals,
  color,
  mutedColor,
  borderColor,
  accentColor,
  onOpenLibrary,
}: Props) {
  const safeMedia = (mediaLinks ?? []).filter((link) => Boolean(parseSafeSourceLink({ title: link.title, url: link.url }))).slice(0, 5);
  const safeConnections = (relatedConnections ?? []).slice(0, 5);
  const safeVisuals = safeContextualVisuals(contextualVisuals);
  if (!structuredContent && safeMedia.length === 0 && safeConnections.length === 0 && safeVisuals.length === 0 && !researchStatus) return null;

  return (
    <View testID="kinfolk-contextual-presentation" style={[styles.container, { borderColor }]}>
      {structuredContent ? (
        <View style={styles.section}>
          <Text style={[styles.heading, { color }]}>Evidence-backed details</Text>
          <StructuredDetails
            content={structuredContent}
            color={color}
            mutedColor={mutedColor}
            accentColor={accentColor}
            onOpenLibrary={onOpenLibrary}
          />
        </View>
      ) : null}
      {safeMedia.length > 0 ? (
        <View style={styles.section}>
          <Text style={[styles.heading, { color }]}>Referenced media</Text>
          {safeMedia.map((link) => (
            <View key={link.url} style={styles.detailBlock}>
              <SafeExternalLink title={link.title} url={link.url} color={accentColor} />
              <Text style={[styles.detailText, { color: mutedColor }]}>{[link.creator, link.platform, link.reason].filter(Boolean).join(" · ")}</Text>
            </View>
          ))}
        </View>
      ) : null}
      {safeConnections.length > 0 ? (
        <View style={styles.section}>
          <Text style={[styles.heading, { color }]}>Related context</Text>
          {safeConnections.map((connection) => {
            const libraryHref = safeLibraryHref(connection.href);
            const evidence = connection.evidenceUrl ? parseSafeSourceLink({ title: connection.title, url: connection.evidenceUrl }) : null;
            return (
              <View key={`${connection.title}-${connection.relationship}`} style={styles.detailBlock}>
                <Text style={[styles.detailTitle, { color }]}>{connection.title}</Text>
                <Text style={[styles.detailText, { color: mutedColor }]}>{connection.relationship}: {connection.reason}</Text>
                {libraryHref && onOpenLibrary ? (
                  <TouchableOpacity accessibilityRole="link" onPress={() => onOpenLibrary(libraryHref)} style={styles.link}>
                    <Feather name="book-open" size={12} color={accentColor} />
                    <Text style={[styles.linkText, { color: accentColor }]}>Open related Library context</Text>
                  </TouchableOpacity>
                ) : evidence ? <SafeExternalLink title={evidence.title} url={evidence.url} color={accentColor} /> : null}
              </View>
            );
          })}
        </View>
      ) : null}
      {safeVisuals.length > 0 ? (
        <View testID="kinfolk-contextual-visuals" style={styles.section}>
          <Text style={[styles.heading, { color }]}>Relevant visual references</Text>
          {safeVisuals.map((visual) => (
            <ContextualVisualCard
              key={visual.id}
              visual={visual}
              color={color}
              mutedColor={mutedColor}
              accentColor={accentColor}
            />
          ))}
        </View>
      ) : null}
      {researchStatus ? (
        <Text testID="kinfolk-research-status" style={[styles.researchStatus, { color: mutedColor }]}>
          {kinfolkResearchStatusLabel(researchStatus)}
          {researchStatus.degraded ? " · some current details may need a fresh check" : ""}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { borderWidth: 1, borderRadius: 12, padding: 10, marginTop: 8, gap: 10 },
  section: { gap: 6 },
  heading: { fontFamily: "Inter_700Bold", fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5 },
  stack: { gap: 5 },
  detailBlock: { gap: 2 },
  visualCard: { gap: 6, borderRadius: 10, borderWidth: 1, borderColor: "#3A1F0E1A", backgroundColor: "#FFFFFF", padding: 8 },
  visualImage: { width: "100%", height: 176, borderRadius: 8, backgroundColor: "#FAF6EF" },
  visualFallback: { minHeight: 88, justifyContent: "center", borderRadius: 8, backgroundColor: "#FAF6EF", padding: 8 },
  detailTitle: { fontFamily: "Inter_700Bold", fontSize: 12, lineHeight: 17 },
  detailText: { fontFamily: "Inter_400Regular", fontSize: 11, lineHeight: 16 },
  safetyText: { fontFamily: "Inter_600SemiBold", fontSize: 11, lineHeight: 16 },
  researchStatus: { fontFamily: "Inter_400Regular", fontSize: 10, lineHeight: 15 },
  link: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start", paddingVertical: 2 },
  linkText: { fontFamily: "Inter_600SemiBold", fontSize: 11, lineHeight: 16, textDecorationLine: "underline", flexShrink: 1 },
});
