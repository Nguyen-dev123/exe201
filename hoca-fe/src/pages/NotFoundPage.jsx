import { ArrowLeft, Home } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <main className="app-error-page">
      <section className="app-error-panel">
        <p className="app-error-code">404</p>
        <h1>Không tìm thấy trang</h1>
        <p>Đường dẫn có thể đã thay đổi hoặc không còn tồn tại.</p>
        <div className="app-error-actions">
          <Link to="/">
            <Home size={18} aria-hidden="true" />
            Về trang chủ
          </Link>
          <button type="button" onClick={() => navigate(-1)}>
            <ArrowLeft size={18} aria-hidden="true" />
            Quay lại
          </button>
        </div>
      </section>
    </main>
  );
}
