import { prisma } from '../lib/prisma'
import { redis, redlock } from '../lib/redis'
import { Prisma } from '@prisma/client'
import { randomUUID } from 'crypto'

export class LedgerService {
  /**
   * Process a transaction safely using Redis distributed lock.
   * Ensures no race conditions occur when updating user balances.
   */
  public static async processTransaction(
    userId: string,
    amount: number,
    type: 'AD_REWARD' | 'GAME_WIN' | 'SHOP_PURCHASE' | 'ADMIN_ADJUST',
    referenceId?: string,
    description?: string
  ): Promise<boolean> {
    const lockKey = `lock:ledger:user:${userId}`
    let lock
    
    try {
      // Acquire lock for 5 seconds
      lock = await redlock.acquire([lockKey], 5000)

      return await prisma.$transaction(async (tx) => {
        const user = await tx.user.findUnique({
          where: { id: userId },
          select: { balance: true }
        })

        if (!user) throw new Error('User not found')

        const previousBalance = user.balance
        const newBalance = previousBalance + amount

        // Prevent negative balances for purchases
        if (newBalance < 0 && type === 'SHOP_PURCHASE') {
          throw new Error('INSUFFICIENT_BALANCE')
        }

        // 1. Update user balance
        await tx.user.update({
          where: { id: userId },
          data: { balance: newBalance }
        })

        // 2. Create immutable point log entry
        await tx.pointLog.create({
          data: {
            userId,
            amount,
            type,
            previousBalance,
            newBalance,
            referenceId,
            description
          }
        })

        return true
      }, {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable // Highest isolation for financial tx
      })
      
    } catch (error: any) {
      if (error.message === 'INSUFFICIENT_BALANCE') {
        throw error
      }
      console.error('Ledger Transaction Failed:', error)
      return false
    } finally {
      if (lock) {
        await lock.release().catch(console.error)
      }
    }
  }

  public static async getBalance(userId: string): Promise<number> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { balance: true }
    })
    return user?.balance || 0
  }
}
