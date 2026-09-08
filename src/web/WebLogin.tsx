import { useEffect, useRef, useState } from 'react'
import './web-login.css'

export default function WebLogin({ onComplete }: { onComplete: () => void }) {
  const [account, setAccount] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])
  const completed = useRef(false)
  const complete = useRef(onComplete)
  const cancel = () => { timers.current.forEach(clearTimeout); timers.current = [] }
  const finish = () => {
    if (completed.current) return
    completed.current = true
    cancel()
    complete.current()
  }
  useEffect(() => {
    completed.current = false
    const schedule = (delay: number, action: () => void) => timers.current.push(setTimeout(action, delay))
    const demoAccount = 'CP-STAFF-001'
    for (let index = 1; index <= demoAccount.length; index++) schedule(500 + (index - 1) * 65, () => setAccount(demoAccount.slice(0, index)))
    for (let index = 1; index <= 10; index++) schedule(1450 + (index - 1) * 70, () => setPassword('•'.repeat(index)))
    schedule(2550, () => setLoading(true))
    schedule(2950, finish)
    return cancel
  }, [])
  return <div className="web-demo web-login" data-web-screen="login" data-figma-node="189:3234">
    <form className="web-login-form" onSubmit={event => { event.preventDefault(); finish() }}>
      <div className="web-login-brand"><span><img src="/web-login-assets/logo.png" alt="" width="43" height="43" /></span><b>CarePulse クリニック</b></div>
      <div className="web-login-fields">
        <label className="web-login-field"><img src="/web-login-assets/user.svg" alt="" width="24" height="24" /><input aria-label="職員ID または メールアドレス" placeholder="職員ID または メールアドレス" value={account} readOnly autoComplete="off" /></label>
        <div className="web-login-password"><label className="web-login-field"><img src="/web-login-assets/lock.svg" alt="" width="24" height="24" /><input aria-label="パスワード" value={password} readOnly autoComplete="off" /><img src="/web-login-assets/eye-closed.svg" alt="" width="24" height="24" /></label><p>パスワードをお忘れの方</p></div>
      </div>
      <button className={`web-primary web-login-button${loading ? ' is-loading' : ''}`} type="submit" aria-busy={loading}>ログイン</button>
      <p className="web-login-help">アカウントの新規発行・パスワードの再発行は、院内のシステム管理者へお問い合わせください。</p>
    </form>
  </div>
}
