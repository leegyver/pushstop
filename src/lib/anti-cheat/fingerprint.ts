export class BrowserFingerprinter {
  public async getCompositeFingerprint(): Promise<{ hash: string; components: Record<string, any> }> {
    const canvasHash = this.getCanvasFingerprint()
    const webglInfo = this.getWebGLFingerprint()
    const audioHash = await this.getAudioFingerprint()
    const sysProps = this.getSystemProperties()

    const rawString = JSON.stringify({
      canvas: canvasHash,
      webgl: webglInfo,
      audio: audioHash,
      sys: sysProps
    })

    const hash = await this.sha256(rawString)
    return { hash, components: { canvasHash, webglInfo, audioHash, sysProps } }
  }

  private getCanvasFingerprint(): string {
    try {
      const canvas = document.createElement('canvas')
      canvas.width = 240
      canvas.height = 60
      const ctx = canvas.getContext('2d')
      if (!ctx) return 'no-canvas'

      ctx.textBaseline = 'top'
      ctx.font = "14px 'Arial', 'Times New Roman', 'Canvas-Font-Test'"
      ctx.fillStyle = '#f60'
      ctx.fillRect(125, 1, 62, 20)
      ctx.fillStyle = '#069'
      ctx.fillText('AntiBot-Secure-Game-v1', 2, 15)
      ctx.fillStyle = 'rgba(102, 204, 0, 0.7)'
      ctx.fillText('AntiBot-Secure-Game-v1', 4, 17)

      return canvas.toDataURL()
    } catch {
      return 'canvas-error'
    }
  }

  private getWebGLFingerprint(): { vendor: string; renderer: string; dataHash: string } {
    try {
      const canvas = document.createElement('canvas')
      const gl = (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')) as WebGLRenderingContext
      if (!gl) return { vendor: 'none', renderer: 'none', dataHash: 'none' }

      const ext = gl.getExtension('WEBGL_debug_renderer_info')
      const vendor = ext ? gl.getParameter(ext.UNMASKED_VENDOR_WEBGL) : gl.getParameter(gl.VENDOR)
      const renderer = ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER)

      const vShader = gl.createShader(gl.VERTEX_SHADER)!
      gl.shaderSource(vShader, 'attribute vec2 p;void main(){gl_Position=vec4(p,0,1);}')
      gl.compileShader(vShader)

      const fShader = gl.createShader(gl.FRAGMENT_SHADER)!
      gl.shaderSource(fShader, 'void main(){gl_FragColor=vec4(0.1,0.8,0.3,1.0);}')
      gl.compileShader(fShader)

      const program = gl.createProgram()!
      gl.attachShader(program, vShader)
      gl.attachShader(program, fShader)
      gl.linkProgram(program)
      gl.useProgram(program)

      const buffer = gl.createBuffer()
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-0.5, -0.5, 0.5, -0.5, 0.0, 0.5]), gl.STATIC_DRAW)

      const pAttr = gl.getAttribLocation(program, 'p')
      gl.enableVertexAttribArray(pAttr)
      gl.vertexAttribPointer(pAttr, 2, gl.FLOAT, false, 0, 0)

      gl.clearColor(0.0, 0.0, 0.0, 1.0)
      gl.clear(gl.COLOR_BUFFER_BIT)
      gl.drawArrays(gl.TRIANGLES, 0, 3)

      const pixels = new Uint8Array(4 * 4)
      gl.readPixels(0, 0, 2, 2, gl.RGBA, gl.UNSIGNED_BYTE, pixels)

      return { vendor: String(vendor), renderer: String(renderer), dataHash: Array.from(pixels).join(',') }
    } catch {
      return { vendor: 'error', renderer: 'error', dataHash: 'error' }
    }
  }

  private async getAudioFingerprint(): Promise<string> {
    try {
      const OfflineCtx = window.OfflineAudioContext || (window as any).webkitOfflineAudioContext
      if (!OfflineCtx) return 'no-audio'

      const context = new OfflineCtx(1, 44100, 44100)
      const osc = context.createOscillator()
      osc.type = 'triangle'
      osc.frequency.value = 10000

      const comp = context.createDynamicsCompressor()
      comp.threshold.value = -50
      comp.knee.value = 40
      comp.ratio.value = 12
      comp.attack.value = 0
      comp.release.value = 0.25

      osc.connect(comp)
      comp.connect(context.destination)
      osc.start(0)

      const buffer = await context.startRendering()
      const channelData = buffer.getChannelData(0)
      let sum = 0
      for (let i = 0; i < channelData.length; i += 100) {
        sum += Math.abs(channelData[i])
      }
      return sum.toString()
    } catch {
      return 'audio-error'
    }
  }

  private getSystemProperties() {
    return {
      ua: navigator.userAgent,
      lang: navigator.language,
      platform: navigator.platform,
      screenRes: `${window.screen.width}x${window.screen.height}x${window.screen.colorDepth}`,
      deviceMemory: (navigator as any).deviceMemory || 'unknown',
      hardwareConcurrency: navigator.hardwareConcurrency || 'unknown',
      tzOffset: new Date().getTimezoneOffset()
    }
  }

  private async sha256(str: string): Promise<string> {
    const buf = new TextEncoder().encode(str)
    const hashBuf = await crypto.subtle.digest('SHA-256', buf)
    return Array.from(new Uint8Array(hashBuf)).map(b => b.toString(16).padStart(2, '0')).join('')
  }
}
