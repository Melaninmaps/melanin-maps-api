import { createRoot } from "react-dom/client";
import posthog from "posthog-js";
import { Component, type ReactNode, type ErrorInfo } from "react";
import App from "./App";
import "./index.css";

const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY as string | undefined;
const POSTHOG_HOST = import.meta.env.VITE_POSTHOG_HOST as string | undefined ?? "https://us.i.posthog.com";

if (POSTHOG_KEY) {
  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    person_profiles: "identified_only",
    capture_pageview: true,
    capture_pageleave: true,
  });
}

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("App crashed:", error, info);
  }
  render() {
    if (this.state.error) {
      const err = this.state.error as Error;
      return (
        <div style={{ padding: 32, fontFamily: "monospace", background: "#1a0a00", color: "#f5ebd8", minHeight: "100vh" }}>
          <h2 style={{ color: "#CA922B", marginBottom: 16 }}>Mapping With Melanin™ — App Error</h2>
          <p style={{ color: "#ff6b6b", marginBottom: 8 }}><strong>{err.name}:</strong> {err.message}</p>
          <pre style={{ fontSize: 12, color: "#aaa", whiteSpace: "pre-wrap", borderTop: "1px solid #333", paddingTop: 16 }}>{err.stack}</pre>
          <button onClick={() => this.setState({ error: null })} style={{ marginTop: 24, padding: "8px 20px", background: "#CA922B", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer" }}>
            Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
