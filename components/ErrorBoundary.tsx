"use client";
import { Component, ReactNode } from "react";

interface Props { children: ReactNode; fallback?: ReactNode; }
interface State { hasError: boolean; }

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error("[ErrorBoundary]", error.message);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div style={{ padding: "40px 20px", textAlign: "center" }}>
          <p style={{ color: "#ef4444", fontWeight: 700, marginBottom: 12 }}>
            Xəta baş verdi
          </p>
          <button
            onClick={() => this.setState({ hasError: false })}
            style={{ padding: "8px 20px", borderRadius: 10, border: "1px solid #e2e8f0", cursor: "pointer" }}
          >
            Yenidən cəhd et
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
