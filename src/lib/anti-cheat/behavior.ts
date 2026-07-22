export interface MouseTelemetry {
  trajectory: { x: number; y: number; t: number }[]
  dwellTimeMs: number
  velocityVariance: number
  curvatureEntropy: number
  isTrusted: boolean
  pointerMeta: {
    pointerType: string
    pressure: number
    width: number
    height: number
  }
}

export class BehavioralTracker {
  private points: { x: number; y: number; t: number }[] = []
  private mousedownTime: number = 0
  private maxPoints = 50

  constructor(private targetElement: HTMLElement) {
    this.initListeners()
  }

  private initListeners(): void {
    window.addEventListener('mousemove', (e: MouseEvent) => {
      this.points.push({
        x: e.clientX,
        y: e.clientY,
        t: performance.now()
      })
      if (this.points.length > this.maxPoints) {
        this.points.shift()
      }
    })

    this.targetElement.addEventListener('pointerdown', (e: PointerEvent) => {
      this.mousedownTime = performance.now()
    })
  }

  public getTelemetryOnSubmit(e: PointerEvent): MouseTelemetry {
    const mouseupTime = performance.now()
    const dwellTimeMs = this.mousedownTime > 0 ? mouseupTime - this.mousedownTime : 0

    const velocityVariance = this.calculateVelocityVariance()
    const curvatureEntropy = this.calculateCurvatureEntropy()

    return {
      trajectory: [...this.points],
      dwellTimeMs,
      velocityVariance,
      curvatureEntropy,
      isTrusted: e.isTrusted,
      pointerMeta: {
        pointerType: e.pointerType || 'mouse',
        pressure: e.pressure || 0,
        width: e.width || 0,
        height: e.height || 0
      }
    }
  }

  private calculateVelocityVariance(): number {
    if (this.points.length < 3) return 0
    const velocities: number[] = []

    for (let i = 1; i < this.points.length; i++) {
      const dx = this.points[i].x - this.points[i - 1].x
      const dy = this.points[i].y - this.points[i - 1].y
      const dt = this.points[i].t - this.points[i - 1].t
      if (dt > 0) {
        const speed = Math.sqrt(dx * dx + dy * dy) / dt
        velocities.push(speed)
      }
    }

    if (velocities.length === 0) return 0
    const mean = velocities.reduce((a, b) => a + b, 0) / velocities.length
    const variance = velocities.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / velocities.length
    return variance
  }

  private calculateCurvatureEntropy(): number {
    if (this.points.length < 3) return 0
    let directionChanges = 0

    for (let i = 2; i < this.points.length; i++) {
      const v1 = { x: this.points[i - 1].x - this.points[i - 2].x, y: this.points[i - 1].y - this.points[i - 2].y }
      const v2 = { x: this.points[i].x - this.points[i - 1].x, y: this.points[i].y - this.points[i - 1].y }
      
      const angle1 = Math.atan2(v1.y, v1.x)
      const angle2 = Math.atan2(v2.y, v2.x)
      const diff = Math.abs(angle2 - angle1)

      if (diff > 0.05) directionChanges++
    }

    return directionChanges / (this.points.length - 2)
  }
}
