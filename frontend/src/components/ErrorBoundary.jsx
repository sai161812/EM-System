import React from 'react';
import { AlertTriangle } from 'lucide-react';

/**
 * EDGE-06: React Error Boundary — catches any uncaught render-time exception
 * in its subtree and renders a friendly fallback instead of white-screening
 * the entire app.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary] Caught error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[300px] p-8 text-center">
          <AlertTriangle className="w-10 h-10 text-red-400 mb-4" />
          <h2 className="text-lg font-semibold text-slate-800 mb-2">Something went wrong</h2>
          <p className="text-sm text-slate-500 max-w-sm mb-4">
            This section encountered an unexpected error. The rest of the app is still working.
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="border border-slate-200 rounded-lg px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
