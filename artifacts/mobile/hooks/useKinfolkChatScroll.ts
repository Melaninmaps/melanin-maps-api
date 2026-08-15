/**
 * useKinfolkChatScroll
 *
 * Single source of truth for all chat auto-scroll behaviour in the Kinfolk
 * chat UI.  All scroll decisions flow through here so there is no competing
 * unconditional scrollToEnd() call that could yank the user back to the
 * bottom while they are reading up-thread.
 *
 * Rules
 * ─────
 * 1. When the user is already at (or near) the bottom the list auto-scrolls
 *    as new messages arrive or the content size changes.
 * 2. When the user has scrolled up, auto-scroll is suppressed and a
 *    "Jump to latest" button appears.
 * 3. Whenever the user *sends* a message we always scroll to the bottom,
 *    regardless of scroll position.
 * 4. All consuming code must call the exposed handlers; no code outside this
 *    hook should call flatListRef.current?.scrollToEnd() directly.
 */

import { useCallback, useRef, useState } from "react";
import type { FlatList, NativeScrollEvent, NativeSyntheticEvent } from "react-native";

// Distance from the bottom of the list (in px) at which we consider the user
// to be "at the bottom" and therefore eligible for auto-scroll.
const NEAR_BOTTOM_THRESHOLD = 120;

export function useKinfolkChatScroll() {
  const flatListRef = useRef<FlatList>(null);

  // true  → user is at (or near) the bottom; auto-scroll is active
  // false → user has scrolled up; "Jump to latest" button should be visible
  const [isAtBottom, setIsAtBottom] = useState(true);

  // Used to force-scroll on the next content-size change after the user sends
  // a message, even if they happened to be scrolled up at the time of send.
  const forceSrollNextRef = useRef(false);

  /** Call this when the user sends a new message. */
  const onUserSend = useCallback(() => {
    forceSrollNextRef.current = true;
    setIsAtBottom(true);
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 50);
  }, []);

  /**
   * Wire to FlatList onScroll.  Detects whether the user has scrolled away
   * from the bottom and updates isAtBottom accordingly.
   */
  const onScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
      const distanceFromBottom =
        contentSize.height - layoutMeasurement.height - contentOffset.y;
      const nowAtBottom = distanceFromBottom <= NEAR_BOTTOM_THRESHOLD;
      setIsAtBottom(nowAtBottom);
    },
    [],
  );

  /**
   * Wire to FlatList onContentSizeChange.  Scrolls to the bottom only when
   * the user is already near the bottom, or when a forced scroll has been
   * requested (i.e., right after the user sends a message).
   */
  const onContentSizeChange = useCallback(() => {
    if (forceSrollNextRef.current || isAtBottom) {
      forceSrollNextRef.current = false;
      flatListRef.current?.scrollToEnd({ animated: true });
    }
  }, [isAtBottom]);

  /** Imperatively scroll to the bottom — used by the Jump button. */
  const scrollToBottom = useCallback((animated = true) => {
    setIsAtBottom(true);
    flatListRef.current?.scrollToEnd({ animated });
  }, []);

  return {
    flatListRef,
    isAtBottom,
    onUserSend,
    onScroll,
    onContentSizeChange,
    scrollToBottom,
  };
}
