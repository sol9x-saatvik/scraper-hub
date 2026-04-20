import { Component, type ReactNode } from "react";
import { MapPin } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

export class MapErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, message: "" };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error) {
    console.error("[IntelligenceMap] render error:", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full min-h-[200px] rounded-lg border border-border bg-card/50 gap-3 text-muted-foreground">
          <MapPin className="h-8 w-8 opacity-40" />
          <p className="text-sm font-medium">Map failed to load</p>
          <p className="text-xs opacity-60 max-w-xs text-center">{this.state.message}</p>
          <button
            onClick={() => this.setState({ hasError: false, message: "" })}
            className="text-xs px-3 py-1.5 rounded border border-border hover:bg-accent transition-colors"
          >
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
