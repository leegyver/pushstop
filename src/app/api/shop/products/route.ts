import { NextResponse } from "next/server"

// 임시 상품 목록 (나중에 어드민 또는 데이터베이스에서 관리 가능)
const MOCK_PRODUCTS = [
  {
    id: "prod_starbucks_1",
    brand: "Starbucks",
    name: "아메리카노 (Tall)",
    description: "전국 스타벅스 매장에서 사용 가능한 아메리카노 교환권입니다.",
    price: 4500,
    imageUrl: "/images/shop/starbucks.png" // 추후 실제 이미지 추가
  },
  {
    id: "prod_google_1",
    brand: "Google Play",
    name: "구글 플레이 5,000원권",
    description: "구글 플레이 스토어에서 유료 앱 구매 및 인앱 결제 시 사용 가능합니다.",
    price: 5000,
    imageUrl: "/images/shop/google_play.png"
  },
  {
    id: "prod_naver_1",
    brand: "Naver Pay",
    name: "네이버페이 5,000원권",
    description: "네이버페이 가맹점에서 현금처럼 사용할 수 있는 포인트 쿠폰입니다.",
    price: 5000,
    imageUrl: "/images/shop/naver_pay.png"
  },
  {
    id: "prod_gs25_1",
    brand: "GS25",
    name: "GS25 모바일 상품권 3,000원",
    description: "전국 GS25 편의점에서 현금처럼 결제 가능한 모바일 상품권입니다.",
    price: 3000,
    imageUrl: "/images/shop/gs25.png"
  },
  {
    id: "prod_cgv_1",
    brand: "CGV",
    name: "CGV 영화 관람권 (1인)",
    description: "CGV 2D 일반 영화 관람이 가능한 모바일 티켓입니다.",
    price: 15000,
    imageUrl: "/images/shop/cgv.png"
  }
]

export async function GET() {
  try {
    return NextResponse.json({ success: true, products: MOCK_PRODUCTS })
  } catch (error) {
    console.error("Shop Products API Error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
