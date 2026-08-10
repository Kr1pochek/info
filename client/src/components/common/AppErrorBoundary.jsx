import { Component } from 'react';
import { RefreshCw, TriangleAlert } from 'lucide-react';

export default class AppErrorBoundary extends Component {
  state = { failed: false };

  componentDidCatch(error) {
    console.error('Application render failed', error);
    this.reloadTimer = window.setTimeout(() => window.location.reload(), 10000);
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentWillUnmount() {
    window.clearTimeout(this.reloadTimer);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return <main className="app-recovery" role="alert"><TriangleAlert /><h1>Интерфейс временно недоступен</h1><p>Киоск автоматически перезапустится через несколько секунд.</p><button type="button" onClick={() => window.location.reload()}><RefreshCw />Перезапустить сейчас</button></main>;
  }
}
