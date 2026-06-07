import React, { ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  // Explicitly declare props to satisfy compilation environment
  public props!: Props;

  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-100 p-4 text-center font-sans">
          <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md">
            <h1 className="text-2xl font-bold text-red-500 mb-4">عذراً، حدث خطأ ما</h1>
            <p className="text-slate-600 mb-6">واجه التطبيق مشكلة غير متوقعة.</p>
            <div className="bg-slate-50 p-4 rounded-lg text-left text-xs font-mono text-slate-500 overflow-auto max-h-40 mb-6">
              {this.state.error?.message}
            </div>
            <button 
              onClick={() => window.location.reload()}
              className="bg-blue-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-600 transition-colors"
            >
              إعادة تحميل التطبيق
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
