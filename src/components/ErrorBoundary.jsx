import React from 'react';
import { ShieldAlert, RefreshCw, Home, AlertTriangle } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[Pulse ErrorBoundary caught an error]:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '/home';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback({
          error: this.state.error,
          resetErrorBoundary: this.handleReset,
        });
      }

      return (
        <div className="min-h-[400px] w-full flex items-center justify-center p-6 bg-navy-950 text-slate-100">
          <div className="max-w-lg w-full bg-navy-900 border border-emergency-500/30 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-emergency-600/10 rounded-full blur-2xl pointer-events-none"></div>

            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-emergency-900/40 border border-emergency-500/40 flex items-center justify-center text-emergency-400">
                <AlertTriangle className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white tracking-wide">Something Went Wrong</h2>
                <p className="text-xs text-slate-400">The application encountered an unexpected runtime error</p>
              </div>
            </div>

            <div className="bg-navy-950/80 border border-slate-800 rounded-xl p-4 mb-6 text-sm font-mono text-emergency-300 overflow-x-auto max-h-40">
              <p className="font-semibold">{this.state.error?.message || 'Unknown runtime error'}</p>
              {this.state.errorInfo?.componentStack && (
                <pre className="text-[11px] text-slate-500 mt-2 font-mono whitespace-pre-wrap">
                  {this.state.errorInfo.componentStack.slice(0, 300)}...
                </pre>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={this.handleReload}
                className="flex-1 flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl bg-emergency-600 hover:bg-emergency-500 text-white font-semibold text-sm transition-colors shadow-lg shadow-emergency-600/30"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reload Page</span>
              </button>
              <button
                onClick={this.handleGoHome}
                className="flex-1 flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl bg-navy-800 hover:bg-navy-700 text-slate-200 border border-slate-700 font-semibold text-sm transition-colors"
              >
                <Home className="w-4 h-4" />
                <span>Campus Home</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
