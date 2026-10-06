import { useNavigation } from "expo-router";
import { Alert } from "react-native";
import { useEffect, useRef } from "react";

export interface UnsavedKinfolkExitGuardOptions {
  dirty: boolean;
  saving: boolean;
  screenLabel: string;
  onSave: () => Promise<boolean>;
  onDiscard: () => void;
}

/**
 * Protects every normal React Navigation exit path: header back, Android Back,
 * iOS swipe-back, modal close, and a programmatic route replacement. The guard
 * intentionally owns no draft state; a failed save leaves ownership with the
 * calling screen so the member can retry without losing an explicit choice.
 */
export function useUnsavedKinfolkExitGuard({
  dirty,
  saving,
  screenLabel,
  onSave,
  onDiscard,
}: UnsavedKinfolkExitGuardOptions): void {
  const navigation = useNavigation();
  const dirtyRef = useRef(dirty);
  const savingRef = useRef(saving);
  const saveRef = useRef(onSave);
  const discardRef = useRef(onDiscard);
  const promptOpenRef = useRef(false);
  const allowExitRef = useRef(false);

  useEffect(() => { dirtyRef.current = dirty; }, [dirty]);
  useEffect(() => { savingRef.current = saving; }, [saving]);
  useEffect(() => { saveRef.current = onSave; }, [onSave]);
  useEffect(() => { discardRef.current = onDiscard; }, [onDiscard]);

  useEffect(() => {
    const unsubscribe = navigation.addListener("beforeRemove", (event) => {
      if (allowExitRef.current) {
        allowExitRef.current = false;
        return;
      }
      if (!dirtyRef.current) return;

      event.preventDefault();
      if (promptOpenRef.current) return;

      if (savingRef.current) {
        Alert.alert(
          "Saving changes",
          `${screenLabel} is still saving. Keep this screen open until that finishes.`,
          [{ text: "Keep editing", style: "cancel" }],
        );
        return;
      }

      promptOpenRef.current = true;
      const completeExit = () => {
        allowExitRef.current = true;
        navigation.dispatch(event.data.action);
      };

      Alert.alert(
        "Save changes?",
        `You have unsaved changes in ${screenLabel}.`,
        [
          {
            text: "Discard changes",
            style: "destructive",
            onPress: () => {
              discardRef.current();
              promptOpenRef.current = false;
              completeExit();
            },
          },
          {
            text: "Keep editing",
            style: "cancel",
            onPress: () => { promptOpenRef.current = false; },
          },
          {
            text: "Save changes",
            onPress: () => {
              void saveRef.current()
                .then((saved) => {
                  promptOpenRef.current = false;
                  if (saved) completeExit();
                })
                .catch(() => {
                  // The screen owns the recovery UI and has kept the draft.
                  promptOpenRef.current = false;
                });
            },
          },
        ],
      );
    });

    return unsubscribe;
  }, [navigation, screenLabel]);
}
