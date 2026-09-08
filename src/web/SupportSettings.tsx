import { useState } from 'react'
import './support-settings.css'

const guides = [
  ['予約管理', '予約の変更・取消・到院登録の操作方法', '予約詳細から変更・取消・到院登録を実行できます。操作後は内容をご確認ください。'],
  ['患者情報', '患者情報・診療情報の確認と更新', '患者情報と診療情報は、それぞれの管理画面から確認・更新できます。'],
  ['通知・アカウント', '通知の確認、アカウント設定', '通知は右上のベルから確認できます。アカウント設定は設定画面で変更できます。'],
]
const faqs = [
  ['予約を変更するには？', '予約詳細の「予約を変更」から日時、担当医、診療項目を更新し、「予約を確定する」を選択してください。'],
  ['患者が到院した場合は？', '予約詳細の「到院登録」を選択すると、患者を待合室へ登録できます。'],
  ['通知が届かない場合は？', '設定画面の通知設定をご確認ください。必要な通知が有効になっているかを確認できます。'],
  ['診療情報を更新するには？', 'サイドバーの「診療情報管理」から患者の診療情報を更新できます。'],
]

export function Support() {
  const [dialog, setDialog] = useState<{ title: string; body: string } | null>(null)
  const [contacted, setContacted] = useState(false)
  return <div className="support-settings support-page">
    <div className="support-settings-heading"><h2>サポート</h2><p>操作方法やよくある質問を確認できます</p></div>
    <section className="support-content">
      <h3>よく使うサポート</h3><p className="support-subtitle">日常業務でよく使う操作をすぐ確認できます</p>
      <div className="support-guides">{guides.map(([title, detail, body]) => <article key={title}><h4>{title}</h4><p>{detail}</p><button onClick={() => setDialog({ title, body })}>ガイドを見る</button></article>)}</div>
      <h3 className="support-faq-heading">よくある質問</h3><p className="support-faq-subtitle">よくある操作上の疑問</p>
      <div className="support-faqs">{faqs.map(([title, body]) => <button key={title} onClick={() => setDialog({ title, body })}><span>{title}</span><b>›</b></button>)}</div>
      <aside className="support-contact"><h3>お問い合わせ</h3><p>操作ガイドで解決しない場合は、サポートへお問い合わせください。</p><small>対応時間</small><b>平日 9:00–18:00</b><small>平均返信時間</small><b>1営業日以内</b><button className="web-primary" onClick={() => setContacted(true)}>サポートに問い合わせる</button>{contacted && <em>お問い合わせを受け付けました</em>}</aside>
      <footer>※ このデモではガイドと問い合わせ導線のみを表示しています</footer>
    </section>
    {dialog && <LightDialog title={dialog.title} onClose={() => setDialog(null)}><p>{dialog.body}</p></LightDialog>}
  </div>
}

export function Settings({ toast }: { toast: (text: string) => void }) {
  const [name, setName] = useState('高橋 香織')
  const [profileOpen, setProfileOpen] = useState(false)
  const [passwordOpen, setPasswordOpen] = useState(false)
  const [draftName, setDraftName] = useState(name)
  const [notifications, setNotifications] = useState({ '新規予約': true, '予約変更': true, 'キャンセル': true, '問診更新': true })
  const [density, setDensity] = useState('標準')
  const [language, setLanguage] = useState('日本語')
  return <div className="support-settings settings-page">
    <div className="support-settings-heading"><h2>設定</h2><p>クリニック管理画面の通知・アカウント設定</p></div>
    <section className="settings-account"><h3>アカウント情報</h3><p>現在ログイン中の医師アカウント</p><dl><dt>氏名</dt><dd>{name}</dd><dt>権限</dt><dd>医師アカウント</dd><dt>所属</dt><dd>高橋歯科クリニック</dd></dl><button onClick={() => { setDraftName(name); setProfileOpen(true) }}>プロフィールを編集</button></section>
    <section className="settings-notifications"><h3>通知設定</h3><p>業務上必要な通知の受信を設定します</p>{([['新規予約', '新しい予約が登録されたとき'], ['予約変更', '予約日時・担当医が変更されたとき'], ['キャンセル', '予約がキャンセルされたとき'], ['問診更新', '患者が来院前問診を更新したとき']] as [keyof typeof notifications, string][]).map(([label, description]) => <div className="settings-toggle" key={label}><b>{label}</b><small>{description}</small><button aria-label={label} aria-pressed={notifications[label]} className={notifications[label] ? 'on' : ''} onClick={() => setNotifications(current => ({ ...current, [label]: !current[label] }))}><i /></button></div>)}</section>
    <section className="settings-security"><h3>セキュリティ</h3><p>ログインと認証の設定</p><small>パスワード</small><b>最終更新 2026/06/01</b><button onClick={() => setPasswordOpen(true)}>パスワードを変更</button><small>最終ログイン</small><b>2026/07/15 08:42</b></section>
    <section className="settings-display"><h3>表示設定</h3><p>管理画面の表示環境</p><label>表示密度<select value={density} onChange={event => setDensity(event.target.value)}><option>標準</option><option>コンパクト</option></select></label><label>言語<select value={language} onChange={event => setLanguage(event.target.value)}><option>日本語</option><option>English</option></select></label></section>
    <section className="settings-save"><span>設定内容を保存</span><button className="web-primary" onClick={() => toast('設定を保存しました')}>変更を保存</button></section>
    {profileOpen && <LightDialog title="プロフィールを編集" onClose={() => setProfileOpen(false)}><label className="dialog-field">氏名<input value={draftName} onChange={event => setDraftName(event.target.value)} /></label><div className="dialog-actions"><button onClick={() => setProfileOpen(false)}>キャンセル</button><button className="web-primary" onClick={() => { setName(draftName); setProfileOpen(false) }}>保存</button></div></LightDialog>}
    {passwordOpen && <LightDialog title="パスワードを変更" onClose={() => setPasswordOpen(false)}><label className="dialog-field">新しいパスワード<input type="password" /></label><div className="dialog-actions"><button onClick={() => setPasswordOpen(false)}>キャンセル</button><button className="web-primary" onClick={() => setPasswordOpen(false)}>保存</button></div></LightDialog>}
  </div>
}

function LightDialog({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return <div className="support-dialog-backdrop"><section className="support-dialog" role="dialog" aria-modal="true" aria-labelledby="support-dialog-title"><h2 id="support-dialog-title">{title}</h2>{children}<button className="support-dialog-close" aria-label="閉じる" onClick={onClose}>×</button></section></div>
}
