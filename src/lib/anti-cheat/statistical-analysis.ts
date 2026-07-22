export class StatisticalBotDetector {
  /**
   * Analyzes an array of timing deltas across multiple game rounds.
   */
  public static analyzeTimingDistribution(deltasMs: number[]): {
    isBot: boolean
    reason: string
    mean: number
    stdDev: number
    chiSquarePValue: number
  } {
    const n = deltasMs.length
    if (n < 8) {
      return { isBot: false, reason: 'insufficient_sample_size', mean: 0, stdDev: 0, chiSquarePValue: 1 }
    }

    const mean = deltasMs.reduce((a, b) => a + b, 0) / n
    const variance = deltasMs.reduce((sum, d) => sum + Math.pow(d - mean, 2), 0) / n
    const stdDev = Math.sqrt(variance)

    // 1. Check for suspiciously low variance (Fixed Macro)
    if (stdDev < 4.0) {
      return { isBot: true, reason: `too_perfect_timing_stdDev_${stdDev.toFixed(2)}ms`, mean, stdDev, chiSquarePValue: 0 }
    }

    // 2. Chi-Square Test for Normality (detecting uniform random noise)
    const chiSquareScore = this.calculateGaussianChiSquare(deltasMs, mean, stdDev)

    // High Chi-Square score indicates departure from Normal distribution (e.g. Uniform distribution used by bots)
    const isUniformOrSynthetic = chiSquareScore > 15.51 // Critical value for df=5 at alpha=0.05

    if (isUniformOrSynthetic) {
      return { isBot: true, reason: `synthetic_uniform_distribution_chi2_${chiSquareScore.toFixed(2)}`, mean, stdDev, chiSquarePValue: chiSquareScore }
    }

    return { isBot: false, reason: 'human_distribution_validated', mean, stdDev, chiSquarePValue: chiSquareScore }
  }

  private static calculateGaussianChiSquare(data: number[], mean: number, stdDev: number): number {
    const bins = 6
    const counts = new Array(bins).fill(0)
    const minVal = mean - 3 * stdDev
    const maxVal = mean + 3 * stdDev
    
    if (minVal === maxVal) return 999 // Avoid division by zero
    
    const binWidth = (maxVal - minVal) / bins

    data.forEach(val => {
      let binIndex = Math.floor((val - minVal) / binWidth)
      if (binIndex < 0) binIndex = 0
      if (binIndex >= bins) binIndex = bins - 1
      counts[binIndex]++
    })

    // Expected frequencies assuming normal distribution
    const expected = counts.map((_, i) => {
      const z1 = (-3 + i * 1)
      const z2 = (-3 + (i + 1) * 1)
      const prob = this.normalCDF(z2) - this.normalCDF(z1)
      return prob * data.length
    })

    let chiSquare = 0
    for (let i = 0; i < bins; i++) {
      const exp = expected[i] > 0 ? expected[i] : 1
      chiSquare += Math.pow(counts[i] - exp, 2) / exp
    }

    return chiSquare
  }

  private static normalCDF(z: number): number {
    return 0.5 * (1 + this.erf(z / Math.SQRT2))
  }

  private static erf(x: number): number {
    const a1 =  0.254829592, a2 = -0.284496736, a3 = 1.421413741
    const a4 = -1.453152027, a5 =  1.061405429, p  = 0.3275911
    const sign = x < 0 ? -1 : 1
    const absX = Math.abs(x)
    const t = 1.0 / (1.0 + p * absX)
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-absX * absX)
    return sign * y
  }
}
