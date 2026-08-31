# Living Library Topic Page and Footer Layout Repair

## What the screenshot means

The screen shown is **one Living Library topic book**—for example, Housing & Home—not the entire Library. It should never look like a nearly empty full Library, and it should never make the footer appear to be the main page content.

This patch corrects both problems. The topic-book page has a readable header, a clear `All topics` return link, entry count, readable research cards, an honest empty-foundation state, and related topics. The full Library remains at `/library`, where the foundational collection is discoverable.

## 1. Replace the topic-book page

Mount `ReadableLibraryTopicPage` for the `/library/:slug` route. Pass the canonical topic and its source-cited entries from the existing Library API.

```tsx
<Route path="/library/:slug" element={<LibraryTopicRoute />} />

function LibraryTopicRoute() {
  const { topic } = useLoaderData() as { topic: Topic };
  return <ReadableLibraryTopicPage topic={topic} />;
}
```

Do not render a generic feather icon, placeholder card grid, or the footer inside this route.

## 2. Install the shared CSS and app shell

Import `libraryTopicPage.css` once with the page component. Apply the app-shell structure in `AppShellFooter.patch.tsx`:

```tsx
<div className="app-shell">
  <SiteHeader />
  <main className="app-shell__main">{children}</main>
  <SiteFooter />
</div>
```

The footer is normal document-flow content. It must not be `fixed`, must not reserve `40vh`, and must not be nested within a short Library topic view. A short page can still place the footer at the bottom through flex layout, but the first viewport must prioritize header and topic content.

## 3. Correct contrast

The dark MWM surface must use the supplied light cream content color. Never inherit the dark body text color into Library content. The page uses:

```css
--library-surface: #fffaf0;
--library-copy: #fff2dd;
--library-muted: #dfc6a3;
--library-gold: #d4af37;
```

The current screenshot’s near-invisible title and description indicate a dark text token has leaked into the dark Library surface; remove that override rather than merely increasing opacity.

## Required release checks

1. At 1440×900 and 2048×1203, the first viewport shows the topic title, summary, and the beginning of research content before the footer.
2. `Housing & Home` visibly identifies itself as a single **Topic book**, not the whole Library.
3. `All topics` returns to the full seeded Library home.
4. The title, summary, research cards, and related-topic controls meet readable contrast on the dark surface.
5. The footer appears only after the topic content in the document flow.
6. A topic with no entries states that it is ready to grow; it does not show blank repeated cards or a false count.
7. Mobile view keeps the hero and first content block before the footer.
