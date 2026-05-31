import { Link } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import {
  Users,
  Target,
  TrendingUp,
  Award,
  Video,
  Clock,
  Shield,
  Zap,
  FileText,
  CheckCircle,
  XCircle,
} from "lucide-react";

export default function HomePage() {
  const { user } = useAuthStore();
  const ctaTarget = user ? "/dashboard" : "/register";
  return (
    <div className="bg-dark text-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
          {/* Badge */}
          <div className="flex justify-center mb-8 animate-fadeIn">
            <div className="badge">
              <span className="w-2 h-2 bg-primary rounded-full animate-pulse-slow"></span>
              Hơn 1,000+ học sinh đang sử dụng
            </div>
          </div>

          {/* Main Heading */}
          <div className="text-center max-w-4xl mx-auto animate-fadeIn">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              Học tập hiệu quả với{" "}
              <span className="gradient-text">Phòng học ảo</span>
            </h1>
            <p className="text-lg md:text-xl text-white/70 mb-8 max-w-2xl mx-auto">
              HOCA giúp bạn tập trung học tập cùng bạn bè trong các phòng học
              ảo. Theo dõi tiến độ, duy trì chuỗi học tập và đạt được mục tiêu
              của bạn.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                to={ctaTarget}
                className="btn-primary flex items-center space-x-2"
              >
                <Zap size={20} />
                <span>{user ? "Vào học ngay" : "Bắt đầu ngay - Miễn phí"}</span>
              </Link>
              <Link
                to="/leaderboard"
                className="btn-secondary flex items-center space-x-2"
              >
                <TrendingUp size={20} />
                <span>Xem bảng xếp hạng</span>
              </Link>
            </div>
          </div>

          {/* Video Call Preview */}
          <div className="mt-16 max-w-5xl mx-auto animate-fadeIn">
            <div className="relative rounded-2xl border-2 border-white/10 bg-dark-card p-8">
              <div className="grid grid-cols-3 gap-4 mb-6">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="aspect-video bg-dark-lighter rounded-xl border border-white/10 flex flex-col items-center justify-center"
                  >
                    <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mb-2">
                      <Users className="text-white/50" size={24} />
                    </div>
                    <span className="text-xs text-white/50">Học viên {i}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-center space-x-4">
                <button className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 transition">
                  <Video size={20} />
                </button>
                <button className="w-12 h-12 bg-dark-lighter rounded-full flex items-center justify-center hover:bg-dark transition">
                  <Video size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-dark-lighter">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-primary font-semibold mb-2 uppercase tracking-wide text-sm">
              TẠI SAO CHỌN HOCA?
            </p>
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Tính năng nổi bật
            </h2>
            <p className="text-white/60 text-lg max-w-2xl mx-auto">
              Mọi thứ bạn cần để học tập hiệu quả hơn, được thiết kế đẹp mắt và
              dễ sử dụng
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Link
                key={index}
                to={user ? feature.to : "/register"}
                className="card-feature card-hover block"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div
                  className={`icon-container mb-4 ${colorMap[feature.color].bg}`}
                >
                  <feature.icon
                    size={24}
                    className={colorMap[feature.color].text}
                  />
                </div>
                <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                <p className="text-white/60">{feature.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Bảng giá đơn giản
            </h2>
            <p className="text-white/60 text-lg">
              Chọn gói phù hợp với nhu cầu học tập của bạn
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free Plan */}
            <div className="card-feature">
              <h3 className="text-2xl font-bold mb-2">Miễn phí</h3>
              <p className="text-white/60 mb-6">Dành cho mọi người bắt đầu</p>
              <div className="mb-6">
                <span className="text-5xl font-bold">0đ</span>
                <span className="text-white/60">/tháng</span>
              </div>
              <ul className="space-y-3 mb-8">
                {freePlanFeatures.map((feature, i) => (
                  <li key={i} className="flex items-start space-x-3">
                    <CheckCircle
                      size={20}
                      className="text-green-500 flex-shrink-0 mt-0.5"
                    />
                    <span className="text-white/80">{feature}</span>
                  </li>
                ))}
                {freePlanLimits.map((limit, i) => (
                  <li key={i} className="flex items-start space-x-3">
                    <XCircle
                      size={20}
                      className="text-white/30 flex-shrink-0 mt-0.5"
                    />
                    <span className="text-white/40">{limit}</span>
                  </li>
                ))}
              </ul>
              <Link
                to="/register"
                className="btn-secondary w-full text-center block"
              >
                Bắt đầu miễn phí
              </Link>
            </div>

            {/* Premium Plan */}
            <div className="card-feature border-primary relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-primary text-white px-4 py-1 rounded-full text-sm font-semibold">
                  PHỔ BIẾN NHẤT
                </span>
              </div>
              <h3 className="text-2xl font-bold mb-2">HOCA+</h3>
              <p className="text-white/60 mb-6">Tăng tốc trải nghiệm học tập</p>
              <div className="mb-6">
                <span className="text-5xl font-bold gradient-text">
                  49.000đ
                </span>
                <span className="text-white/60">/tháng</span>
              </div>
              <ul className="space-y-3 mb-8">
                {premiumPlanFeatures.map((feature, i) => (
                  <li key={i} className="flex items-start space-x-3">
                    <CheckCircle
                      size={20}
                      className="text-primary flex-shrink-0 mt-0.5"
                    />
                    <span className="text-white/80">{feature}</span>
                  </li>
                ))}
              </ul>
              <Link
                to="/pricing"
                className="btn-primary w-full text-center block"
              >
                Nâng cấp ngay
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 bg-dark-lighter">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-5xl font-bold mb-6">
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
                <div>
                  <div className="text-4xl font-bold gradient-text mb-2">
                    1K+
                  </div>
                  <div className="text-white/60">Học viên tích cực</div>
                </div>
                <div>
                  <div className="text-4xl font-bold gradient-text mb-2">
                    10K+
                  </div>
                  <div className="text-white/60">Giờ học đã hoàn thành</div>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-square bg-dark-card rounded-2xl border border-white/10 p-8 flex flex-col items-center justify-center space-y-8">
                <div className="w-32 h-32 bg-primary/20 rounded-2xl flex items-center justify-center">
                  <Target size={64} className="text-primary" />
                </div>
                <div className="w-32 h-32 bg-accent-blue/20 rounded-2xl flex items-center justify-center">
                  <Users size={64} className="text-accent-blue" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Community Section */}
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

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {communityRules.map((rule, index) => (
              <Link
                to="/community"
                key={index}
                className="card-feature card-hover text-center block"
              >
                <div
                  className={`icon-container mx-auto mb-4 ${colorMap[rule.color].bg}`}
                >
                  <rule.icon size={24} className={colorMap[rule.color].text} />
                </div>
                <h3 className="text-lg font-bold mb-2">{rule.title}</h3>
                <p className="text-white/60 text-sm">{rule.description}</p>
              </Link>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link
              to="/community"
              className="btn-secondary inline-flex items-center space-x-2"
            >
              <FileText size={20} />
              <span>Xem chi tiết quy tắc cộng đồng</span>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-primary/20 to-accent-purple/20 rounded-2xl border border-primary/30 p-12 text-center">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Sẵn sàng bắt đầu?
            </h2>
            <p className="text-white/70 text-lg mb-8 max-w-2xl mx-auto">
              Tham gia cộng đồng học tập ngay hôm nay và nâng cao hiệu suất học
              tập của bạn
            </p>
            <Link to={ctaTarget} className="btn-primary inline-block">
              {user ? "Vào học ngay" : "Đăng ký miễn phí"}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

const colorMap = {
  blue: { bg: "bg-blue-500/10", text: "text-blue-500" },
  green: { bg: "bg-green-500/10", text: "text-green-500" },
  orange: { bg: "bg-orange-500/10", text: "text-orange-500" },
  purple: { bg: "bg-purple-500/10", text: "text-purple-500" },
};

const features = [
  {
    icon: Users,
    title: "Phòng học ảo",
    description:
      "Học cùng bạn bè trong các phòng video call với giao diện hiện đại",
    color: "blue",
    to: "/rooms",
  },
  {
    icon: Target,
    title: "Chuỗi học tập",
    description: "Duy trì động lực với hệ thống streak như Duolingo",
    color: "green",
    to: "/dashboard",
  },
  {
    icon: TrendingUp,
    title: "Bảng xếp hạng",
    description: "Thi đua cùng cộng đồng và leo hạng liên tục",
    color: "orange",
    to: "/leaderboard",
  },
  {
    icon: Award,
    title: "Huy hiệu thành tích",
    description: "Mở khóa huy hiệu khi đạt được các mốc quan trọng",
    color: "purple",
    to: "/badges",
  },
  {
    icon: Video,
    title: "Virtual Background",
    description: "Xóa phông và thay nền chuyên nghiệp với AI",
    color: "blue",
    to: "/pricing",
  },
  {
    icon: Clock,
    title: "Mục tiêu học tập",
    description: "Đặt mục tiêu hàng ngày và theo dõi tiến độ",
    color: "green",
    to: "/dashboard",
  },
];

const freePlanFeatures = [
  "Tham gia phòng học công khai",
  "Hệ thống Streak & Badges cơ bản",
  "Bảng xếp hạng cộng đồng",
  "Đặt mục tiêu học tập hàng ngày",
];

const freePlanLimits = ["Không quảng cáo", "Virtual Background cao cấp"];

const premiumPlanFeatures = [
  "Tất cả tính năng miễn phí",
  "Loại bỏ hoàn toàn quảng cáo",
  "Virtual Background (Blur & Image)",
  "Khôi phục Streak khi quên học",
  "Huy hiệu Premium độc quyền",
  "Phòng học riêng tư không giới hạn",
];

const communityRules = [
  {
    icon: Shield,
    title: "Tôn trọng lẫn nhau",
    description: "Không quấy rối, bắt nạt hoặc phân biệt đối xử với bất kỳ ai",
    color: "blue",
  },
  {
    icon: CheckCircle,
    title: "Giữ gìn môi trường",
    description: "Sử dụng phòng học mục đích, không gây tiếng ồn",
    color: "green",
  },
  {
    icon: XCircle,
    title: "Nội dung phù hợp",
    description: "Không chia sẻ nội dung bạo lực, spam hoặc không phù hợp",
    color: "purple",
  },
  {
    icon: Award,
    title: "Trung thực",
    description: "Không gian lận, mạo danh hoặc lạm dụng hệ thống",
    color: "orange",
  },
];
