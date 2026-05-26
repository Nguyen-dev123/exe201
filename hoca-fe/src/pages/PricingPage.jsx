import { Link } from "react-router-dom";
import { Check, X } from "lucide-react";

export default function PricingPage() {
  return (
    <div className="bg-dark text-white min-h-screen">
      {/* Pricing Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Bảng giá đơn giản
            </h1>
            <p className="text-white/60 text-lg">
              Chọn gói phù hợp với nhu cầu học tập của bạn
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Free Plan */}
            <div className="bg-dark-card border border-white/10 rounded-2xl p-8">
              <h3 className="text-2xl font-bold mb-2">Miễn phí</h3>
              <p className="text-white/60 mb-6">Dành cho mọi người bắt đầu</p>

              <div className="mb-8">
                <span className="text-5xl font-bold">0đ</span>
                <span className="text-white/60">/tháng</span>
              </div>

              <ul className="space-y-4 mb-8">
                <li className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center mt-0.5">
                    <Check size={14} className="text-green-500" />
                  </div>
                  <span className="text-white/80">
                    Tham gia phòng học công khai
                  </span>
                </li>
                <li className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center mt-0.5">
                    <Check size={14} className="text-green-500" />
                  </div>
                  <span className="text-white/80">
                    Hệ thống Streak & Badges cơ bản
                  </span>
                </li>
                <li className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center mt-0.5">
                    <Check size={14} className="text-green-500" />
                  </div>
                  <span className="text-white/80">Bảng xếp hạng cộng đồng</span>
                </li>
                <li className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center mt-0.5">
                    <Check size={14} className="text-green-500" />
                  </div>
                  <span className="text-white/80">
                    Đặt mục tiêu học tập hàng ngày
                  </span>
                </li>
                <li className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-5 h-5 rounded-full bg-white/10 flex items-center justify-center mt-0.5">
                    <X size={14} className="text-white/40" />
                  </div>
                  <span className="text-white/40">Không quảng cáo</span>
                </li>
                <li className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-5 h-5 rounded-full bg-white/10 flex items-center justify-center mt-0.5">
                    <X size={14} className="text-white/40" />
                  </div>
                  <span className="text-white/40">
                    Virtual Background cao cấp
                  </span>
                </li>
              </ul>

              <Link
                to="/register"
                className="block w-full py-3 text-center border-2 border-white/20 hover:border-white/40 rounded-lg font-semibold transition"
              >
                Bắt đầu miễn phí
              </Link>
            </div>

            {/* Premium Plan */}
            <div className="relative bg-gradient-to-br from-orange-900/40 to-yellow-900/40 border-2 border-primary rounded-2xl p-8">
              {/* Badge */}
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-primary text-white px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-wide">
                  Phổ biến nhất
                </span>
              </div>

              <h3 className="text-2xl font-bold mb-2 text-primary">HOCA+</h3>
              <p className="text-white/80 mb-6">Tăng tốc trải nghiệm học tập</p>

              <div className="mb-8">
                <span className="text-5xl font-bold text-primary">49.000đ</span>
                <span className="text-white/60">/tháng</span>
              </div>

              <ul className="space-y-4 mb-8">
                <li className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center mt-0.5">
                    <Check size={14} className="text-primary" />
                  </div>
                  <span className="text-white/90">
                    Tất cả tính năng miễn phí
                  </span>
                </li>
                <li className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center mt-0.5">
                    <Check size={14} className="text-primary" />
                  </div>
                  <span className="text-white/90">
                    Loại bỏ hoàn toàn quảng cáo
                  </span>
                </li>
                <li className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center mt-0.5">
                    <Check size={14} className="text-primary" />
                  </div>
                  <span className="text-white/90">
                    Virtual Background (Blur & Image)
                  </span>
                </li>
                <li className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center mt-0.5">
                    <Check size={14} className="text-primary" />
                  </div>
                  <span className="text-white/90">
                    Khôi phục Streak khi quên học
                  </span>
                </li>
                <li className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center mt-0.5">
                    <Check size={14} className="text-primary" />
                  </div>
                  <span className="text-white/90">
                    Huy hiệu Premium độc quyền
                  </span>
                </li>
                <li className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center mt-0.5">
                    <Check size={14} className="text-primary" />
                  </div>
                  <span className="text-white/90">
                    Phòng học riêng tư không giới hạn
                  </span>
                </li>
              </ul>

              <Link
                to="/pricing"
                className="block w-full py-3 text-center bg-primary hover:bg-primary-dark text-white rounded-lg font-bold transition"
              >
                Nâng cấp ngay
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Mission Section - Giống homepage */}
      <section className="py-20 bg-dark-lighter">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Sứ mệnh của chúng tôi
              </h2>
              <p className="text-white/70 text-lg mb-6">
                HOCA được xây dựng với niềm tin rằng học tập không nên là một
                hành trình cô đơn. Chúng tôi muốn tạo ra một không gian nơi mọi
                người có thể tìm thấy động lực, sự tập trung và cộng đồng để
                cùng nhau phát triển.
              </p>
              <p className="text-white/70 text-lg mb-8">
                Lấy cảm hứng từ các phương pháp học tập hiệu quả như Pomodoro và
                Gamification, HOCA biến việc học trở nên thú vị và gây nghiện
                theo cách tích cực nhất.
              </p>
              <div className="grid grid-cols-2 gap-6">
                <div className="border border-white/10 rounded-xl p-6">
                  <div className="text-4xl font-bold gradient-text mb-2">
                    10K+
                  </div>
                  <div className="text-white/60">Học viên tích cực</div>
                </div>
                <div className="border border-white/10 rounded-xl p-6">
                  <div className="text-4xl font-bold gradient-text mb-2">
                    1M+
                  </div>
                  <div className="text-white/60">Giờ học đã hoàn thành</div>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-square bg-dark-card rounded-2xl border border-white/10 p-12 flex flex-col items-center justify-center space-y-12">
                <div className="w-40 h-40 bg-primary/20 rounded-2xl flex items-center justify-center border border-primary/30">
                  <div className="text-center">
                    <div className="text-primary text-5xl mb-2">🎓</div>
                    <div className="text-white font-semibold">Học tập</div>
                  </div>
                </div>
                <div className="w-40 h-40 bg-blue-500/20 rounded-2xl flex items-center justify-center border border-blue-500/30">
                  <div className="text-center">
                    <div className="text-blue-400 text-5xl mb-2">👥</div>
                    <div className="text-white font-semibold">Kết nối</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Community Rules Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-primary font-semibold mb-2 uppercase tracking-wide text-sm">
              CỘNG ĐỒNG HOCA
            </p>
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Quy tắc cộng đồng
            </h2>
            <p className="text-white/60 text-lg max-w-2xl mx-auto">
              Cùng nhau xây dựng môi trường học tập tích cực và an toàn
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {communityRules.map((rule, index) => (
              <div
                key={index}
                className="bg-dark-card border border-white/10 rounded-xl p-6"
              >
                <div
                  className={`w-12 h-12 rounded-xl bg-${rule.color}-500/20 flex items-center justify-center mb-4`}
                >
                  <span className={`text-2xl text-${rule.color}-500`}>
                    {rule.icon}
                  </span>
                </div>
                <h3 className="text-lg font-bold mb-2">{rule.title}</h3>
                <p className="text-white/60 text-sm">{rule.description}</p>
              </div>
            ))}
          </div>

          <div className="text-center">
            <button className="inline-flex items-center space-x-2 px-6 py-3 border border-white/20 hover:border-white/40 rounded-lg font-semibold transition">
              <span>📄</span>
              <span>Xem chi tiết quy tắc cộng đồng</span>
            </button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-[#1e2a4a] rounded-3xl p-16 text-center border border-white/10">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Sẵn sàng bắt đầu?
            </h2>
            <p className="text-white/70 text-lg mb-10 max-w-2xl mx-auto">
              Tham gia cộng đồng học tập ngay hôm nay và nâng cao hiệu suất học
              tập của bạn
            </p>
            <Link
              to="/register"
              className="inline-block px-10 py-4 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold text-lg transition shadow-lg hover:shadow-xl"
            >
              Đăng ký miễn phí
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

const communityRules = [
  {
    icon: "💎",
    title: "Tôn trọng lẫn nhau",
    description: "Không quấy rối, bắt nạt hoặc phân biệt đối xử với bất kỳ ai",
    color: "blue",
  },
  {
    icon: "🎓",
    title: "Giữ gìn môi trường",
    description: "Sử dụng phòng học đúng mục đích, không gây tiếng ồn",
    color: "green",
  },
  {
    icon: "🛡️",
    title: "Nội dung phù hợp",
    description: "Không chia sẻ nội dung bạo lực, spam hoặc không phù hợp",
    color: "purple",
  },
  {
    icon: "⚙️",
    title: "Trung thực",
    description: "Không gian lận, mạo danh hoặc lạm dụng hệ thống",
    color: "orange",
  },
];
