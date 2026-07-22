export interface EnvironmentReport {
  isAutomation: boolean
  isHeadless: boolean
  isDevToolsOpen: boolean
  isVirtualMachine: boolean
  flags: string[]
}

export class EnvironmentDetector {
  public static inspect(): EnvironmentReport {
    const flags: string[] = []

    // 1. WebDriver check
    if (navigator.webdriver) {
      flags.push('navigator.webdriver_true')
    }

    // 2. Selenium / Puppeteer CDC variables
    const windowKeys = Object.keys(window)
    const cdcKey = windowKeys.find(key => key.match(/^(cdc_|__selenium|__nightmare|__puppeteer)/i))
    if (cdcKey) {
      flags.push(`automation_global_found:${cdcKey}`)
    }

    // 3. Headless Chrome Detection
    const isHeadlessUserAgent = /HeadlessChrome/i.test(navigator.userAgent)
    const hasZeroDimensions = window.outerWidth === 0 && window.outerHeight === 0
    const missingChromeObject = !(window as any).chrome || !(window as any).chrome.runtime

    if (isHeadlessUserAgent) flags.push('ua_headless')
    if (hasZeroDimensions) flags.push('zero_outer_dimensions')
    if (missingChromeObject) flags.push('missing_chrome_runtime')

    // 4. Software WebGL Renderer (VM / Headless)
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl')
    if (gl) {
      const ext = gl.getExtension('WEBGL_debug_renderer_info')
      const renderer = ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : ''
      if (/SwiftShader|llvmpipe|VirtualBox|VMware|Software Adapter|Mesa/i.test(renderer)) {
        flags.push(`vm_software_renderer:${renderer}`)
      }
    }

    // 5. DevTools Open Check
    const devToolsOpen = (window.outerWidth - window.innerWidth > 160) || 
                         (window.outerHeight - window.innerHeight > 160)
    if (devToolsOpen) flags.push('devtools_dimension_delta')

    return {
      isAutomation: flags.some(f => f.startsWith('navigator.webdriver') || f.startsWith('automation_global')),
      isHeadless: isHeadlessUserAgent || hasZeroDimensions,
      isDevToolsOpen: devToolsOpen,
      isVirtualMachine: flags.some(f => f.startsWith('vm_software_renderer')),
      flags
    }
  }
}
