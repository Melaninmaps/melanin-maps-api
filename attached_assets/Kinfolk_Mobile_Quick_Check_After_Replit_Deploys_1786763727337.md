# Kinfolk Mobile Quick Check After Replit Deploys

Test at 375 px width and on an actual phone before calling the patch complete.

| Check | Pass result |
| --- | --- |
| Long Kinfolk text | Every word stays inside the screen. |
| Long URL/source link | The link wraps; it does not create horizontal scrolling. |
| Message cards and buttons | They fit within the phone width and remain tappable. |
| Reading old messages | Scroll upward, wait for a reply, and confirm the page does not jump to the bottom. |
| New message below | A **Jump to latest** button appears instead of forcing the user downward. |
| Sending a message | The chat then follows the newly sent message and Kinfolk’s response. |
| iPhone keyboard | Composer stays visible above the keyboard/browser controls. |
| Bottom navigation | It does not cover message text or the composer. |

> If the app still jumps while the reader is up-thread, there is another unconditional `scrollTop`, `scrollIntoView`, or `window.scrollTo` call left in the project. Search for all three and route all chat scrolling through `useKinfolkChatScroll` only.
