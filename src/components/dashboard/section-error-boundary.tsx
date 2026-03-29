"use client";

import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  sectionName?: string;
}

interface State {
  hasError: boolean;
}

export class SectionErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error(`Erro na seção "${this.props.sectionName ?? "dashboard"}":`, error);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
            <p className="text-sm text-on-surface-muted">
              Erro ao carregar {this.props.sectionName ?? "esta seção"}.{" "}
              <button
                onClick={() => this.setState({ hasError: false })}
                className="text-primary hover:underline font-medium"
              >
                Tentar novamente
              </button>
            </p>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
