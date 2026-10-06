import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[NYAYA_ERROR_BOUNDARY] Caught an unexpected error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  handleGoHome = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = import.meta.env.BASE_URL || '/';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[50vh] flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white rounded-2xl border border-red-200 shadow-lg p-6 text-center space-y-4">
            <div className="w-14 h-14 mx-auto rounded-full bg-red-100 flex items-center justify-center text-red-600">
              <AlertTriangle className="w-7 h-7" />
            </div>
            
            <div>
              <h2 className="text-lg font-bold text-slate-800">Something went wrong</h2>
              <p className="text-xs text-slate-500 mt-1">
                An unexpected interface error occurred. The application is still active and safe.
              </p>
            </div>

            {this.state.error?.message && (
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-left overflow-auto max-h-24">
                <code className="text-[11px] text-red-700 font-mono">
                  {this.state.error.message}
                </code>
              </div>
            )}

            <div className="flex gap-2 justify-center pt-2">
              <Button size="sm" variant="outline" onClick={this.handleReset} className="gap-1.5">
                <RefreshCw className="w-3.5 h-3.5" /> Try Again
              </Button>
              <Button size="sm" onClick={this.handleGoHome} className="gap-1.5">
                <Home className="w-3.5 h-3.5" /> Back to Home
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
