"use client"

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'

export function useAnalytics() {
  const pathname = usePathname()
  const pageViewIdRef = useRef<string | null>(null)
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // 1. Initial Page View
    const trackPageView = async () => {
      try {
        const res = await fetch('/api/analytics/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ path: pathname })
        })
        const data = await res.json()
        if (data.pageViewId) {
          pageViewIdRef.current = data.pageViewId
        }
      } catch (e) {
        console.error('Analytics initial track failed', e)
      }
    }

    trackPageView()

    // 2. Start Heartbeat (every 10 seconds)
    heartbeatIntervalRef.current = setInterval(async () => {
      if (pageViewIdRef.current && document.visibilityState === 'visible') {
        try {
          await fetch('/api/analytics/track', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              path: pathname, 
              pageViewId: pageViewIdRef.current,
              heartbeatTime: 10 
            })
          })
        } catch (e) {
          // Ignore heartbeat failures quietly
        }
      }
    }, 10000)

    return () => {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current)
      }
    }
  }, [pathname])
}
