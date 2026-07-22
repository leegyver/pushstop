self.onmessage = async function(e) {
  const { seed, difficulty } = e.data
  const targetPrefix = '0'.repeat(difficulty)
  let nonce = 0

  const encoder = new TextEncoder()
  const startTime = performance.now()

  while (true) {
    const text = seed + nonce
    const data = encoder.encode(text)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

    if (hashHex.startsWith(targetPrefix)) {
      self.postMessage({
        success: true,
        nonce: nonce,
        hash: hashHex,
        durationMs: performance.now() - startTime
      })
      break
    }
    nonce++
  }
}
