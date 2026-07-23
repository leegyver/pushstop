"use client"
import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"
import { Loader2, Coins, Gift, ShoppingCart, ArrowRight, X, CheckCircle2, AlertCircle } from "lucide-react"

export default function ShopPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  const [products, setProducts] = useState<any[]>([])
  const [userBalance, setUserBalance] = useState<number>(0)
  const [loading, setLoading] = useState(true)

  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [purchaseLoading, setPurchaseLoading] = useState(false)
  const [purchaseResult, setPurchaseResult] = useState<{success: boolean, message: string} | null>(null)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/")
    } else if (status === "authenticated") {
      fetchData()
    }
  }, [status, router])

  const fetchData = async () => {
    try {
      const [profileRes, productsRes] = await Promise.all([
        fetch("/api/profile"),
        fetch("/api/shop/products")
      ])
      
      if (profileRes.ok) {
        const profileData = await profileRes.json()
        setUserBalance(profileData.user.balance)
      }
      
      if (productsRes.ok) {
        const productsData = await productsRes.json()
        setProducts(productsData.products)
      }
    } catch (error) {
      console.error("Failed to fetch shop data", error)
    } finally {
      setLoading(false)
    }
  }

  const handlePurchase = async () => {
    if (!selectedProduct) return
    setPurchaseLoading(true)
    
    try {
      const res = await fetch("/api/shop/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: selectedProduct.id })
      })
      
      const data = await res.json()
      
      if (res.ok) {
        setUserBalance(data.newBalance)
        setPurchaseResult({ success: true, message: "구매가 성공적으로 완료되었습니다!" })
      } else {
        setPurchaseResult({ success: false, message: data.error || "구매에 실패했습니다." })
      }
    } catch (error) {
      setPurchaseResult({ success: false, message: "네트워크 오류가 발생했습니다." })
    } finally {
      setPurchaseLoading(false)
    }
  }

  const closePurchaseModal = () => {
    if (purchaseResult?.success) {
      // Refresh or do something on success if needed
    }
    setSelectedProduct(null)
    setPurchaseResult(null)
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-[var(--accent-primary)] animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 pt-32 pb-20">
      
      <div className="flex flex-col md:flex-row justify-between items-end mb-12">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <h1 className="text-4xl md:text-5xl font-black text-white mb-4 flex items-center gap-4">
            <Gift className="w-10 h-10 text-[var(--accent-primary)]" />
            기프트 교환소
          </h1>
          <p className="text-[var(--text-secondary)] text-lg">모은 포인트로 다양한 기프트카드를 교환하세요 (TangoCard 연동 대기중)</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mt-6 md:mt-0 p-6 bg-black/40 rounded-2xl border border-[var(--accent-primary)]/30 flex items-center gap-6 shadow-[0_0_20px_rgba(255,107,0,0.15)]"
        >
          <div className="text-right">
            <div className="text-[var(--text-secondary)] text-sm font-bold uppercase tracking-wider mb-1">내 보유 포인트</div>
            <div className="text-3xl font-black text-[var(--accent-primary)]">{userBalance.toLocaleString()} P</div>
          </div>
          <div className="w-12 h-12 rounded-full bg-[var(--accent-primary)]/20 flex items-center justify-center">
            <Coins className="w-6 h-6 text-[var(--accent-primary)]" />
          </div>
        </motion.div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {products.map((product, idx) => (
          <motion.div 
            key={product.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.05 }}
            className="group bg-[var(--panel-bg)] border border-[var(--panel-border)] hover:border-[var(--accent-primary)] rounded-3xl overflow-hidden transition-all duration-300 hover:shadow-[0_0_30px_rgba(255,107,0,0.2)] flex flex-col"
          >
            <div className="h-48 bg-gradient-to-br from-black/60 to-black/20 p-6 flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 bg-[var(--accent-primary)]/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              {/* Product Placeholder Image */}
              <div className="w-32 h-32 rounded-xl bg-black/50 border border-white/10 shadow-xl flex items-center justify-center transform group-hover:scale-105 transition-transform duration-300">
                <Gift className="w-12 h-12 text-white/50" />
              </div>
            </div>
            
            <div className="p-6 flex-1 flex flex-col">
              <div className="text-xs font-bold text-[var(--accent-secondary)] uppercase tracking-wider mb-2">
                {product.brand}
              </div>
              <h3 className="text-xl font-bold text-white mb-2">{product.name}</h3>
              <p className="text-sm text-[var(--text-secondary)] mb-6 flex-1 line-clamp-2">
                {product.description}
              </p>
              
              <div className="flex items-center justify-between mt-auto">
                <div className="text-2xl font-black text-[var(--accent-primary)]">
                  {product.price.toLocaleString()} <span className="text-sm">P</span>
                </div>
                <button 
                  onClick={() => setSelectedProduct(product)}
                  className="px-6 py-3 bg-white/5 hover:bg-[var(--accent-primary)] text-white rounded-xl font-bold transition-colors flex items-center gap-2 group/btn"
                >
                  교환 <ShoppingCart className="w-4 h-4 opacity-50 group-hover/btn:opacity-100" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Purchase Modal */}
      <AnimatePresence>
        {selectedProduct && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={purchaseLoading ? undefined : closePurchaseModal}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[var(--panel-bg)] border border-[var(--panel-border)] rounded-3xl p-8 w-full max-w-md shadow-2xl relative z-10 overflow-hidden"
            >
              {!purchaseResult ? (
                <>
                  <button 
                    onClick={closePurchaseModal}
                    disabled={purchaseLoading}
                    className="absolute top-4 right-4 text-[var(--text-secondary)] hover:text-white disabled:opacity-50"
                  >
                    <X className="w-5 h-5" />
                  </button>
                  
                  <div className="text-center mb-8">
                    <div className="w-20 h-20 bg-[var(--accent-primary)]/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-[var(--accent-primary)]/30">
                      <Gift className="w-10 h-10 text-[var(--accent-primary)]" />
                    </div>
                    <h2 className="text-2xl font-black text-white mb-2">상품 교환 확인</h2>
                    <p className="text-[var(--text-secondary)]">선택하신 기프트카드를 포인트로 교환하시겠습니까?</p>
                  </div>
                  
                  <div className="bg-black/50 rounded-2xl p-6 border border-white/5 mb-8">
                    <div className="flex justify-between mb-4">
                      <span className="text-[var(--text-secondary)]">선택 상품</span>
                      <span className="font-bold text-white text-right">{selectedProduct.name}</span>
                    </div>
                    <div className="flex justify-between mb-4">
                      <span className="text-[var(--text-secondary)]">차감 포인트</span>
                      <span className="font-black text-red-400">-{selectedProduct.price.toLocaleString()} P</span>
                    </div>
                    <div className="h-px bg-white/10 w-full mb-4"></div>
                    <div className="flex justify-between">
                      <span className="text-[var(--text-secondary)]">교환 후 잔여 포인트</span>
                      <span className="font-bold text-[var(--accent-primary)]">
                        {(userBalance - selectedProduct.price).toLocaleString()} P
                      </span>
                    </div>
                  </div>
                  
                  {userBalance < selectedProduct.price ? (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3 text-red-400 mb-6">
                      <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                      <div className="text-sm font-medium">보유한 포인트가 부족하여 교환할 수 없습니다.</div>
                    </div>
                  ) : null}

                  <div className="flex gap-4">
                    <button 
                      onClick={closePurchaseModal}
                      disabled={purchaseLoading}
                      className="flex-1 py-4 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold transition-colors disabled:opacity-50"
                    >
                      취소
                    </button>
                    <button 
                      onClick={handlePurchase}
                      disabled={purchaseLoading || userBalance < selectedProduct.price}
                      className="flex-1 py-4 bg-[var(--accent-primary)] hover:bg-[var(--accent-secondary)] text-white rounded-xl font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {purchaseLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "교환하기"}
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  {purchaseResult.success ? (
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-500/30"
                    >
                      <CheckCircle2 className="w-12 h-12 text-green-400" />
                    </motion.div>
                  ) : (
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/30"
                    >
                      <AlertCircle className="w-12 h-12 text-red-400" />
                    </motion.div>
                  )}
                  
                  <h2 className="text-2xl font-black text-white mb-4">
                    {purchaseResult.success ? "교환 성공!" : "교환 실패"}
                  </h2>
                  <p className="text-[var(--text-secondary)] mb-8">{purchaseResult.message}</p>
                  
                  <button 
                    onClick={closePurchaseModal}
                    className="w-full py-4 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold transition-colors"
                  >
                    확인
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  )
}
