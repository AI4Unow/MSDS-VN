import Link from "next/link";
import { Flame, Check } from "@phosphor-icons/react/dist/ssr";

const tiers = [
  {
    name: "Free",
    price: "0",
    unit: "",
    sds: "5",
    cards: "0",
    chat: "0 tin nhắn",
    seats: "1",
    cta: "Tham gia waitlist",
  },
  {
    name: "Starter",
    price: "499.000",
    unit: "đ/tháng",
    sds: "50",
    cards: "20/tháng",
    chat: "100 tin nhắn",
    seats: "2",
    cta: "Tham gia waitlist",
  },
  {
    name: "Pro",
    price: "2.490.000",
    unit: "đ/tháng",
    sds: "Không giới hạn",
    cards: "Không giới hạn",
    chat: "1.000 tin nhắn",
    seats: "5",
    cta: "Tham gia waitlist",
    highlight: true,
  },
  {
    name: "Business",
    price: "7.900.000",
    unit: "đ/tháng",
    sds: "Không giới hạn",
    cards: "Không giới hạn",
    chat: "Không giới hạn",
    seats: "10 + API",
    cta: "Liên hệ",
  },
  {
    name: "Enterprise",
    price: "Liên hệ",
    unit: "",
    sds: "—",
    cards: "—",
    chat: "—",
    seats: "—",
    cta: "Liên hệ",
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
        <Link href="/" className="flex items-center gap-2">
          <Flame size={28} weight="fill" className="text-amber-600" />
          <span className="font-bold text-lg">MSDS Platform</span>
        </Link>
        <Link
          href="/login"
          className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 transition-colors"
        >
          Đăng nhập
        </Link>
      </nav>

      {/* Header */}
      <section className="max-w-6xl mx-auto px-6 py-16 text-center">
        <h1 className="text-3xl font-bold">Bảng giá</h1>
        <p className="mt-4 text-gray-600 max-w-[62ch] mx-auto">
          Giải pháp quản lý an toàn hóa chất phù hợp mọi quy mô doanh nghiệp.
          Tất cả gói đều bao gồm trích xuất AI và wiki quy định.
        </p>
      </section>

      {/* Pricing grid */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`rounded-xl border p-6 flex flex-col ${
                tier.highlight
                  ? "border-amber-600 bg-amber-50/50 shadow-sm"
                  : "border-gray-200"
              }`}
            >
              <h3 className="font-semibold text-lg">{tier.name}</h3>
              <div className="mt-3 mb-6">
                {tier.price !== "Liên hệ" ? (
                  <>
                    <span className="text-2xl font-bold">{tier.price}</span>
                    <span className="text-sm text-gray-500 ml-1">
                      {tier.unit}
                    </span>
                  </>
                ) : (
                  <span className="text-2xl font-bold text-gray-500">
                    {tier.price}
                  </span>
                )}
              </div>

              <ul className="space-y-2 text-sm flex-1">
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-amber-600 shrink-0" />
                  {tier.sds} SDS
                </li>
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-amber-600 shrink-0" />
                  {tier.cards} phiếu an toàn
                </li>
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-amber-600 shrink-0" />
                  {tier.chat}
                </li>
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-amber-600 shrink-0" />
                  {tier.seats} người dùng
                </li>
              </ul>

              <Link
                href="/waitlist"
                className={`mt-6 block text-center rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                  tier.highlight
                    ? "bg-amber-600 text-white hover:bg-amber-700"
                    : "border border-gray-300 hover:bg-gray-50"
                }`}
              >
                {tier.cta}
              </Link>
            </div>
          ))}
        </div>

        <p className="mt-8 text-center text-xs text-gray-400">
          Chưa tích hợp thanh toán. Gói Free sử dụng trong giai đoạn MVP.
        </p>
      </section>
    </div>
  );
}
