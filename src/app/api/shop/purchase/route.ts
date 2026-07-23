import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "../../auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"

// 임시 상품 목록 (products/route.ts와 동일하게 유지)
const MOCK_PRODUCTS = [
  { id: "prod_starbucks_1", brand: "Starbucks", name: "아메리카노 (Tall)", price: 4500 },
  { id: "prod_google_1", brand: "Google Play", name: "구글 플레이 5,000원권", price: 5000 },
  { id: "prod_naver_1", brand: "Naver Pay", name: "네이버페이 5,000원권", price: 5000 },
  { id: "prod_gs25_1", brand: "GS25", name: "GS25 모바일 상품권 3,000원", price: 3000 },
  { id: "prod_cgv_1", brand: "CGV", name: "CGV 영화 관람권 (1인)", price: 15000 }
]

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { productId } = await req.json()
    const userId = (session.user as any).id

    const product = MOCK_PRODUCTS.find(p => p.id === productId)
    if (!product) {
      return NextResponse.json({ error: "상품을 찾을 수 없습니다." }, { status: 404 })
    }

    // 1. Get current user balance
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { balance: true }
    })

    if (!user) {
      return NextResponse.json({ error: "유저 정보를 찾을 수 없습니다." }, { status: 404 })
    }

    if (user.balance < product.price) {
      return NextResponse.json({ error: "포인트가 부족합니다." }, { status: 400 })
    }

    // ==========================================
    // [TODO] TANGOCARD API 연동 스켈레톤
    // ==========================================
    // 여기에 TangoCard 발급 API를 호출하는 로직이 추가될 예정입니다.
    // const tangoRes = await fetch("https://integration-api.tangocard.com/raas/v2/orders", {
    //   method: "POST",
    //   headers: {
    //     "Authorization": `Basic ${Buffer.from(process.env.TANGO_PLATFORM_NAME + ':' + process.env.TANGO_API_KEY).toString('base64')}`,
    //     "Content-Type": "application/json"
    //   },
    //   body: JSON.stringify({
    //     "accountIdentifier": "PushStopAccount",
    //     "amount": product.price / 1000, // 예시 (가격 환산)
    //     "customerIdentifier": "PushStopCustomer",
    //     "sendEmail": true,
    //     "recipient": {
    //       "email": session.user.email,
    //       "firstName": session.user.name || "User"
    //     },
    //     "utid": "U12345" // TangoCard의 고유 상품 ID (나중에 매핑 필요)
    //   })
    // });
    // if (!tangoRes.ok) throw new Error("TangoCard API Failed")
    // ==========================================

    // 2. Transaction: Deduct points and create log
    const transactionResult = await prisma.$transaction(async (tx) => {
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          balance: { decrement: product.price }
        }
      })

      const log = await tx.pointLog.create({
        data: {
          userId,
          amount: -product.price,
          newBalance: updatedUser.balance,
          type: "SHOP_PURCHASE",
          description: `상점 교환: ${product.name}`
        }
      })

      return updatedUser
    })

    return NextResponse.json({ 
      success: true, 
      newBalance: transactionResult.balance 
    })

  } catch (error: any) {
    console.error("Purchase API Error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
