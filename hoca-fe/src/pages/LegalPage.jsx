import { FileText, ShieldCheck } from "lucide-react";

const privacySections = [
  {
    title: "Thông tin HOCA thu thập",
    body: "HOCA có thể lưu thông tin tài khoản, hồ sơ học tập, hoạt động trong phòng, nội dung bạn chủ động gửi và dữ liệu kỹ thuật cần thiết để vận hành dịch vụ.",
  },
  {
    title: "Mục đích sử dụng",
    body: "Dữ liệu được dùng để cung cấp tài khoản, đồng bộ tiến độ, vận hành phòng học, hỗ trợ người dùng, bảo vệ cộng đồng và cải thiện sản phẩm.",
  },
  {
    title: "Lưu trữ và bảo vệ dữ liệu",
    body: "HOCA áp dụng các biện pháp kỹ thuật phù hợp để hạn chế truy cập trái phép. Dữ liệu chỉ được giữ trong thời gian cần thiết cho mục đích vận hành và nghĩa vụ liên quan.",
  },
  {
    title: "Quyền của bạn",
    body: "Bạn có thể cập nhật hồ sơ, yêu cầu xem, sửa hoặc xóa dữ liệu tài khoản bằng cách sử dụng chức năng trong ứng dụng hoặc liên hệ HOCA.",
  },
  {
    title: "Liên hệ",
    body: "Mọi yêu cầu về quyền riêng tư có thể gửi tới hocavn2026@gmail.com.",
  },
];

const termsSections = [
  {
    title: "Tài khoản HOCA",
    body: "Bạn chịu trách nhiệm bảo mật thông tin đăng nhập và các hoạt động diễn ra trên tài khoản của mình. Thông tin cung cấp cần chính xác và không mạo danh người khác.",
  },
  {
    title: "Sử dụng dịch vụ",
    body: "Không sử dụng HOCA để quấy rối, phát tán nội dung bất hợp pháp, phá hoại hệ thống, xâm phạm quyền của người khác hoặc gây ảnh hưởng tiêu cực tới cộng đồng.",
  },
  {
    title: "HOCA+ và thanh toán",
    body: "Giá, thời hạn và quyền lợi của từng gói được hiển thị trước khi thanh toán. Quyền lợi được áp dụng cho đúng tài khoản hoàn tất giao dịch.",
  },
  {
    title: "Nội dung và HOCA AI",
    body: "Bạn chịu trách nhiệm với nội dung mình gửi. Câu trả lời do HOCA AI tạo ra có thể chưa chính xác và không thay thế tư vấn chuyên môn.",
  },
  {
    title: "Bảo vệ cộng đồng",
    body: "HOCA có thể hạn chế hoặc khóa tài khoản vi phạm quy tắc cộng đồng, gây rủi ro an toàn hoặc làm gián đoạn dịch vụ.",
  },
  {
    title: "Thay đổi điều khoản",
    body: "Nội dung điều khoản có thể được cập nhật khi sản phẩm thay đổi. Phiên bản mới sẽ được công bố trên trang này.",
  },
];

export default function LegalPage({ type }) {
  const isPrivacy = type === "privacy";
  const title = isPrivacy
    ? "Chính sách quyền riêng tư"
    : "Điều khoản sử dụng";
  const sections = isPrivacy ? privacySections : termsSections;
  const Icon = isPrivacy ? ShieldCheck : FileText;

  return (
    <article className="mx-auto max-w-4xl px-4 py-12 text-white sm:px-6 lg:px-8 lg:py-16">
      <Icon size={28} className="text-primary" aria-hidden="true" />
      <h1 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl">
        {title}
      </h1>
      <p className="mt-3 text-sm text-white/50">Cập nhật ngày 11/07/2026</p>

      <div className="mt-10 space-y-8">
        {sections.map((section) => (
          <section key={section.title}>
            <h2 className="text-xl font-semibold">{section.title}</h2>
            <p className="mt-3 max-w-3xl leading-7 text-white/60">
              {section.body}
            </p>
          </section>
        ))}
      </div>
    </article>
  );
}
