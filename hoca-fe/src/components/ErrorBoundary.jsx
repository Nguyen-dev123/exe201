import { Component } from "react";
import { AlertTriangle, Home, RotateCcw } from "lucide-react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("Unhandled application error", error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <main className="app-error-page">
        <section className="app-error-panel" role="alert">
          <AlertTriangle size={34} aria-hidden="true" />
          <p className="app-error-kicker">HOCA gặp sự cố</p>
          <h1>Trang chưa thể hiển thị</h1>
          <p>
            Dữ liệu của bạn vẫn an toàn. Hãy tải lại trang hoặc quay về trang chủ để tiếp tục.
          </p>
          <div className="app-error-actions">
            <button type="button" onClick={() => window.location.reload()}>
              <RotateCcw size={18} aria-hidden="true" />
              Tải lại trang
            </button>
            <a href="/">
              <Home size={18} aria-hidden="true" />
              Về trang chủ
            </a>
          </div>
        </section>
      </main>
    );
  }
}
