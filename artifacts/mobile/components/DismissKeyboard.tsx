import React from "react";
import { Keyboard, TouchableWithoutFeedback, View, StyleSheet } from "react-native";

interface Props {
  children: React.ReactNode;
  style?: object;
}

export function DismissKeyboard({ children, style }: Props) {
  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={[styles.root, style]}>{children}</View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
