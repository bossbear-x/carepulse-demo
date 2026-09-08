import { useLayoutEffect, useRef, useState } from 'react'
import App from './App'
import WebDemo from './web/WebDemo'
import './demo-shell.css'

export default function DemoShell() {
  const viewport = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  useLayoutEffect(() => {
    const observer = new ResizeObserver(([entry]) => setScale(Math.min(1, entry.contentRect.width / 1440)))
    if (viewport.current) observer.observe(viewport.current)
    return () => observer.disconnect()
  }, [])
  return <div className="demo-shell">
    <section className="demo-patient" aria-label="Patient App demo">
      <div className="demo-label"><span>01 / PATIENT APP</span><b>患者アプリ</b></div>
      <App />
    </section>
    <section className="demo-clinic" aria-label="Clinic Web demo">
      <div className="demo-label"><span>02 / CLINIC WEB</span><b>クリニック管理</b></div>
      <div ref={viewport} className="demo-web-viewport" style={{ height: 1024 * scale }}>
        <div className="demo-web-canvas" style={{ transform: `scale(${scale})` }}><WebDemo /></div>
      </div>
    </section>
  </div>
}
