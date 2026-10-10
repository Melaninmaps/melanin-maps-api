import { describe, expect, it, vi } from "vitest";
import {
  isPrivateOrReservedNetworkAddress,
  normalizeKinfolkLinkUrl,
  understandKinfolkLink,
  type KinfolkLinkFetchResponse,
} from "../link-understanding";

const publicAddress = [{ address: "93.184.216.34", family: 4 as const }];
const htmlResponse = (body: string): KinfolkLinkFetchResponse => ({
  status: 200,
  headers: { "content-type": "text/html; charset=utf-8" },
  body,
});

const articleHtml = `<!doctype html>
<html><head>
  <title>Fallback title</title>
  <meta property="og:type" content="article">
  <meta property="og:title" content="Community garden update">
  <meta property="og:description" content="The garden added accessible beds and announced Saturday volunteer hours.">
  <meta property="og:site_name" content="Neighborhood News">
  <meta property="article:published_time" content="2026-10-10">
</head><body><article><p>This article must not be needed because the fetched description is sufficient.</p></article></body></html>`;

describe("Kinfolk link understanding", () => {
  it("normalizes only public HTTPS links and rejects credentials, IP literals, private suffixes, and hidden whitespace", () => {
    expect(normalizeKinfolkLinkUrl("www.Example.com/story#section")).toBe("https://www.example.com/story");
    expect(normalizeKinfolkLinkUrl("https://example.com/story?ref=member")).toBe("https://example.com/story?ref=member");
    expect(normalizeKinfolkLinkUrl("http://example.com/story")).toBeNull();
    expect(normalizeKinfolkLinkUrl("https://user:secret@example.com/story")).toBeNull();
    expect(normalizeKinfolkLinkUrl("https://127.0.0.1/admin")).toBeNull();
    expect(normalizeKinfolkLinkUrl("https://service.internal/metadata")).toBeNull();
    expect(normalizeKinfolkLinkUrl("https://example.com/\nprivate")).toBeNull();
  });

  it("treats loopback, private, reserved, and IPv6 local addresses as non-public", () => {
    for (const address of [
      "127.0.0.1", "10.0.0.1", "100.64.0.1", "169.254.169.254",
      "172.16.0.1", "192.168.1.1", "192.0.2.10", "198.18.0.1",
      "203.0.113.2", "::1", "fc00::1", "fe80::1", "fec0::1",
      "::ffff:127.0.0.1", "0:0:0:0:0:ffff:127.0.0.1",
    ]) {
      expect(isPrivateOrReservedNetworkAddress(address)).toBe(true);
    }
    expect(isPrivateOrReservedNetworkAddress("93.184.216.34")).toBe(false);
    expect(isPrivateOrReservedNetworkAddress("2606:2800:220:1:248:1893:25c8:1946")).toBe(false);
  });

  it("returns only an extractive, source-labelled article summary from fetched HTML", async () => {
    const fetchPage = vi.fn().mockResolvedValue(htmlResponse(articleHtml));
    const result = await understandKinfolkLink("https://news.example.com/garden#source", {
      resolveHostname: async () => publicAddress,
      fetchPage,
    });

    expect(fetchPage).toHaveBeenCalledWith(expect.objectContaining({
      url: "https://news.example.com/garden",
      hostname: "news.example.com",
      address: publicAddress[0],
    }));
    expect(result).toEqual(expect.objectContaining({
      state: "fetched",
      linkType: "article",
      source: {
        url: "https://news.example.com/garden",
        host: "news.example.com",
        title: "Community garden update",
        siteName: "Neighborhood News",
        publishedAt: "2026-10-10",
      },
      summary: {
        text: "The garden added accessible beds and announced Saturday volunteer hours.",
        method: "extractive",
        provenance: "fetched_page_content",
        claimStatus: "unverified_source_claims",
      },
      claimBoundary: "source_claims_unverified",
    }));
  });

  it("classifies fetched social pages without inventing a publisher or an independently verified claim", async () => {
    const result = await understandKinfolkLink("https://www.instagram.com/p/example/", {
      resolveHostname: async () => publicAddress,
      fetchPage: async () => htmlResponse(`
        <html><head><meta property="og:title" content="A creator post"><meta property="og:description" content="A fetched caption about an upcoming neighborhood event."></head><body></body></html>
      `),
    });

    expect(result).toEqual(expect.objectContaining({
      state: "fetched",
      linkType: "social",
      source: expect.objectContaining({ host: "www.instagram.com", title: "A creator post" }),
      summary: expect.objectContaining({
        provenance: "fetched_page_content",
        claimStatus: "unverified_source_claims",
      }),
      claimBoundary: "source_claims_unverified",
    }));
  });

  it("fails closed before any fetch when DNS resolves to a private, reserved, or mixed address", async () => {
    const fetchPage = vi.fn();
    const privateResult = await understandKinfolkLink("https://public-looking.example.com/path", {
      resolveHostname: async () => [{ address: "169.254.169.254", family: 4 }],
      fetchPage,
    });
    const mixedResult = await understandKinfolkLink("https://mixed.example.com/path", {
      resolveHostname: async () => [publicAddress[0], { address: "10.0.0.9", family: 4 }],
      fetchPage,
    });

    for (const result of [privateResult, mixedResult]) {
      expect(result).toEqual({
        state: "rejected",
        reason: "private_network",
        linkType: null,
        source: null,
        summary: null,
        claimBoundary: "unknown_without_fetched_content",
      });
    }
    expect(fetchPage).not.toHaveBeenCalled();
  });

  it("manually validates every redirect and never fetches a private redirect target", async () => {
    const resolveHostname = vi.fn(async () => publicAddress);
    const fetchPage = vi.fn().mockResolvedValue({
      status: 302,
      headers: { location: "https://127.0.0.1/admin" },
      body: "",
    });

    const result = await understandKinfolkLink("https://public.example.com/continue", {
      resolveHostname,
      fetchPage,
    });

    expect(result).toEqual(expect.objectContaining({
      state: "rejected",
      reason: "unsafe_url",
      source: null,
      summary: null,
      claimBoundary: "unknown_without_fetched_content",
    }));
    expect(resolveHostname).toHaveBeenCalledTimes(1);
    expect(fetchPage).toHaveBeenCalledTimes(1);
  });

  it("keeps a redirect source boundary: only the fetched final URL is returned", async () => {
    const resolveHostname = vi.fn(async () => publicAddress);
    const fetchPage = vi.fn()
      .mockResolvedValueOnce({ status: 302, headers: { location: "https://final.example.com/article" }, body: "" })
      .mockResolvedValueOnce(htmlResponse(articleHtml));

    const result = await understandKinfolkLink("https://start.example.com/redirect", {
      resolveHostname,
      fetchPage,
    });

    expect(result).toEqual(expect.objectContaining({
      state: "fetched",
      source: expect.objectContaining({ url: "https://final.example.com/article", host: "final.example.com" }),
    }));
    expect(resolveHostname).toHaveBeenNthCalledWith(1, "start.example.com");
    expect(resolveHostname).toHaveBeenNthCalledWith(2, "final.example.com");
    expect(fetchPage).toHaveBeenNthCalledWith(2, expect.objectContaining({ url: "https://final.example.com/article" }));
  });

  it("returns no source or summary when DNS is unavailable, the response is not HTML, or no readable content exists", async () => {
    const dnsResult = await understandKinfolkLink("https://offline.example.com/article", {
      resolveHostname: async () => { throw new Error("offline"); },
    });
    const contentTypeResult = await understandKinfolkLink("https://document.example.com/file", {
      resolveHostname: async () => publicAddress,
      fetchPage: async () => ({ status: 200, headers: { "content-type": "application/pdf" }, body: "not html" }),
    });
    const emptyResult = await understandKinfolkLink("https://empty.example.com/article", {
      resolveHostname: async () => publicAddress,
      fetchPage: async () => htmlResponse("<html><head><title>Only a title</title></head><body></body></html>"),
    });

    expect(dnsResult).toEqual(expect.objectContaining({ state: "unavailable", reason: "dns_unavailable", source: null, summary: null, claimBoundary: "unknown_without_fetched_content" }));
    expect(contentTypeResult).toEqual(expect.objectContaining({ state: "unavailable", reason: "unsupported_content_type", source: null, summary: null, claimBoundary: "unknown_without_fetched_content" }));
    expect(emptyResult).toEqual(expect.objectContaining({ state: "unavailable", reason: "no_readable_content", source: null, summary: null, claimBoundary: "unknown_without_fetched_content" }));
  });
});
