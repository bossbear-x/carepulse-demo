import { type CSSProperties, useLayoutEffect, useRef, useState } from 'react'
import App from './App'
import WebDemo from './web/WebDemo'
import './demo-shell.css'

const APP_SCALE = 0.75
const APP_LAYOUT_HEIGHT = 690.46
const WEB_MAX_SCALE = 1.1
const WEB_WIDTH = 1440
const WEB_HEIGHT = 1024

export default function DemoShell() {
  const webArea = useRef<HTMLElement>(null)
  const [webScale, setWebScale] = useState(1)

  useLayoutEffect(() => {
    const element = webArea.current
    if (!element) return

    const updateScale = (width: number) => {
      const nextScale = Math.min(WEB_MAX_SCALE, width / WEB_WIDTH)
      setWebScale(current => Math.abs(current - nextScale) < 0.001 ? current : nextScale)
    }
    const observer = new ResizeObserver(([entry]) => updateScale(entry.contentRect.width))
    observer.observe(element)
    updateScale(element.getBoundingClientRect().width)
    return () => observer.disconnect()
  }, [])

  const webVisualWidth = WEB_WIDTH * webScale
  const webVisualHeight = WEB_HEIGHT * webScale

  return <main className="demo-shell" style={{ '--app-scale': APP_SCALE } as CSSProperties}>
    <section className="demo-patient" aria-label="Patient App demo">
      <div className="demo-label"><span>01 / PATIENT APP</span><b>患者アプリ</b></div>
      <div className="demo-app-scale-box" style={{ height: APP_LAYOUT_HEIGHT }}>
        <div className="demo-app-canvas"><App /></div>
      </div>
    </section>

    <div className="demo-divider" aria-hidden="true" style={{ height: Math.max(APP_LAYOUT_HEIGHT, webVisualHeight) }} />

    <section ref={webArea} className="demo-clinic" aria-label="Clinic Web demo">
      <div className="demo-label"><span>02 / CLINIC WEB</span><b>クリニック管理</b></div>
      <div className="demo-web-scale-box" style={{ width: webVisualWidth, height: webVisualHeight }}>
        <div className="demo-web-viewport" style={{ transform: `scale(${webScale})` }}>
          <div className="demo-web-canvas"><WebDemo /></div>
        </div>
      </div>
    </section>
  </main>
}
