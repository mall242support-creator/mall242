import { Component } from 'react';

class HelmetErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Helmet Error:', error);
    console.error('Component Stack:', errorInfo.componentStack);
  }

  render() {
    if (this.state.hasError) {
      // Log the error details to console
      console.error('Empty title detected in:', this.state.error);
      // Return children anyway, the error is just a warning
      return this.props.children;
    }
    return this.props.children;
  }
}

export default HelmetErrorBoundary;