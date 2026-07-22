export class PoWSolver {
  private worker: Worker | null = null

  constructor() {
    if (typeof window !== 'undefined') {
      this.worker = new Worker('/pow-worker.js')
    }
  }

  public solve(seed: string, difficulty: number = 4): Promise<{ nonce: number; hash: string; durationMs: number }> {
    return new Promise((resolve, reject) => {
      if (!this.worker) {
        return reject(new Error('Worker not initialized'))
      }
      
      this.worker.onmessage = (e) => {
        if (e.data.success) {
          resolve({ nonce: e.data.nonce, hash: e.data.hash, durationMs: e.data.durationMs })
        } else {
          reject(new Error('PoW calculation failed'))
        }
      }

      this.worker.postMessage({ seed, difficulty })
    })
  }

  public terminate() {
    if (this.worker) {
      this.worker.terminate()
      this.worker = null
    }
  }
}
