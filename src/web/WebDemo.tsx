import { useState } from 'react'
import './web-demo.css'
import { HealthRecords, MedicalHistory, ClinicalInformation } from './ClinicRecords'
import WebLogin from './WebLogin'
import { Today, Notifications } from './TodayNotifications'
import { Settings, Support } from './SupportSettings'

type Screen = 'dashboard' | 'schedule' | 'detail' | 'editor' | 'health-records' | 'medical-history' | 'clinical-information' | 'today' | 'notifications' | 'support' | 'settings'
type Booking = { patient: string; category: string; treatment: string; doctor: string; date: string; time: string; room: string; memo: string }
const initialBooking: Booking = { patient: '田中 美咲　#CP-10831', category: '復診', treatment: '根管治療', doctor: '木村医師', date: '2026年7月16日（木）', time: '14:30–15:00', room: 'B / チェア03', memo: '感染根管処置の継続' }
function Asset({ name, className = '', alt = '' }: { name: string; className?: string; alt?: string }) {
  const extension = ['imgIconLogo', 'imgProfile', 'imgProfile1'].includes(name) ? 'png' : 'svg'
  return <img className={`web-asset ${className}`} src={`/web-assets/${name}.${extension}`} alt={alt} />
}
const menu = [['ダッシュボード', 'imgIconDashboard'], ['受診スケジュール', 'imgIconSchedule'], ['健康アーカイブ', 'imgVectorIconFileHeart'], ['カルテ履歴管理', 'imgVectorIconHistory'], ['診療情報管理', 'imgIconMedicalInformation']]
const menuDestinations: Record<string, Screen> = { 'ダッシュボード': 'dashboard', '受診スケジュール': 'schedule', '健康アーカイブ': 'health-records', 'カルテ履歴管理': 'medical-history', '診療情報管理': 'clinical-information' }

export default function WebDemo() {
  const [showLogin, setShowLogin] = useState(true)
  const [screen, setScreen] = useState<Screen>('dashboard')
  const [booking, setBooking] = useState<Booking>(initialBooking)
  const [draft, setDraft] = useState<Booking>(initialBooking)
  const [editing, setEditing] = useState(false)
  const [status, setStatus] = useState('予約確定')
  const [history, setHistory] = useState<string[]>([])
  const [day, setDay] = useState(16)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [confirmedNotifications, setConfirmedNotifications] = useState<string[]>([])
  const unreadCount = 4 - confirmedNotifications.length
  const navigate = (next: Screen) => { setScreen(next); setMessage('') }
  const editor = (edit: boolean) => { setEditing(edit); setDraft(edit ? { ...booking } : { ...initialBooking }); navigate('editor') }
  const patientName = booking.patient.split(/[ 　#]/)[0]
  if (showLogin) return <WebLogin onComplete={() => setShowLogin(false)} />
  return <div className="web-demo" data-web-screen={screen}>
    <aside className="web-sidebar">
      <div className="web-brand"><Asset name="imgIconLogo" /><b>CarePulse クリニック</b></div>
      <nav className="web-main-nav" aria-label="クリニック メインメニュー"><small>メインメニュー</small>
        {menu.map(([label, icon]) => <button key={label} className={menuDestinations[label] === (screen === 'detail' || screen === 'editor' ? 'schedule' : screen === 'today' || screen === 'notifications' ? 'dashboard' : screen) ? 'selected' : ''} onClick={() => navigate(menuDestinations[label])}><Asset name={icon} /><span>{label}</span></button>)}
      </nav>
      <div className="web-other-nav"><small>その他</small>{([['通知', 'imgVectorIconNotification', 'notifications'], ['サポート', 'imgIconSupport', 'support'], ['設定', 'imgIconSetting', 'settings']] as [string, string, Screen][]).map(([label, icon, destination]) => <button key={label} className={screen === destination ? 'selected' : ''} onClick={() => navigate(destination)}><Asset name={icon} /><span>{label}</span></button>)}</div>
      <div className="web-user"><Asset name="imgProfile1" /><div><b>高橋 香織</b><b>医師アカウント</b></div><Asset name="imgSmallRight" /></div>
    </aside>
    <header className="web-topbar"><button className="web-today-link" aria-label="本日の診療状況" onClick={() => navigate('today')} /><div><h1>本日の診療状況</h1><p>{screen === 'dashboard' || screen === 'today' || screen === 'notifications' ? '2026年7月15日（水）' : '2026年2月18日（水）'}</p></div><div className="web-top-actions" onClick={event => event.stopPropagation()}><button className="web-search-control" aria-label="検索"><Asset name="imgIconSearch" /></button><button className="web-notifications-link" aria-label="通知を開く" onClick={() => navigate('notifications')}><Asset name="imgVectorIconNotification" />{unreadCount > 0 && <img className="web-header-unread" src="/web-notification-assets/header-dot.svg" width="10" height="10" alt="" />}</button><button className="web-profile-control" aria-label="プロフィール"><Asset name="imgProfile" /></button></div></header>
    <main className={`web-content web-${screen}`}>
      {screen === 'today' && <Today openDetail={() => navigate('detail')} />}
      {screen === 'notifications' && <Notifications navigate={navigate} confirmed={confirmedNotifications} onConfirm={time => setConfirmedNotifications(current => current.includes(time) ? current : [...current, time])} />}
      {screen === 'support' && <Support />}
      {screen === 'settings' && <Settings toast={text => { setMessage(text); window.setTimeout(() => setMessage(''), 1800) }} />}
      {screen === 'health-records' && <HealthRecords />}
      {screen === 'medical-history' && <MedicalHistory />}
      {screen === 'clinical-information' && <ClinicalInformation />}
      {screen === 'dashboard' && <Dashboard schedule={() => navigate('schedule')} />}
      {screen === 'schedule' && <>
        <div className="web-page-heading"><h2>受診スケジュール</h2><p>院内の予約状況と担当医の稼働を確認できます</p></div>
        <div className="web-schedule-toolbar"><b>2026年 7月</b><button className="web-primary" onClick={() => editor(false)}>＋ 新規予約を登録</button></div>
        <div className="web-calendar" aria-label="2026年7月の予約"><div className="web-calendar-grid">{Array.from({ length: 31 }, (_, index) => index + 1).map(date => <button key={date} className={date === day ? 'selected' : ''} onClick={() => setDay(date)} aria-pressed={date === day}><span>{date}</span>{date === 16 ? <span className="web-calendar-appointment" onClick={event => { event.stopPropagation(); navigate('detail') }}>{booking.time.slice(0, 5)} {patientName}</span> : [2, 4, 7, 10, 18, 23, 29].includes(date) ? <em>予約 {[2, 10, 18].includes(date) ? 3 : date === 4 ? 1 : date === 29 ? 2 : 4}件</em> : null}</button>)}</div></div>
        <section className="web-day-list"><h3>7月{day}日（{['火', '水', '木', '金', '土', '日', '月'][day % 7]}）</h3>{day === 16 ? <>
          <div className="web-day-item">09:00 佐藤 花子｜定期健診<span>予約確定</span></div>
          <div className="web-day-item">10:30 鈴木 一郎｜初診<span>予約確定</span></div>
          <button className="web-day-item selected" onClick={() => navigate('detail')}>{booking.time.slice(0, 5)} {booking.patient.split('　')[0]}｜治療<span className="purple">{status === '予約確定' ? '受付済み' : status}</span></button>
          <div className="web-day-item">16:00 山本 健｜再診<span>予約確定</span></div>
        </> : <p className="web-empty">この日の予約詳細はデモ対象外です。</p>}</section>
      </>}
      {screen === 'detail' && <>
        <div className="web-page-heading"><h2>予約詳細</h2><span className="web-breadcrumb">予約管理 / AP-260716-042</span><p>予約状況を確認し、改期・取消・到院処理を行います</p><span className={`web-status${status === 'キャンセル済み' ? ' cancelled' : ''}`}>● {status}</span></div>
        <section className="web-patient-card web-panel"><h3>患者情報</h3><p className="web-muted">診察券 #CP-10831　42歳　090-1234-5678</p><strong>{booking.patient.split('　')[0]}</strong><p className="web-accent">注意：ペニシリン系アレルギー</p><b className="web-linked">患者アプリ連携済み</b></section>
        <section className="web-visit-card web-panel"><h3>予約内容</h3><dl>{[['日時', `${booking.date} ${booking.time}`], ['区分', `${booking.category}・${booking.treatment}`], ['担当', `${booking.doctor} / 歯科保存科`], ['チェア', `診療室 ${booking.room}`], ['来院目的', booking.memo]].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl></section>
        <section className="web-history-card web-panel"><h3>変更・連絡履歴</h3>{[['07/10 11:24', '前台创建预约'], ['07/10 11:31', '患者APP确认'], ['07/15 14:30', '已发送前一天提醒'], ['07/16 09:10', '患者查看提醒'], ...history.map(item => ['今回', item])].map(([date, text], index) => <p key={index}><span>{date}</span><span>{text}</span></p>)}</section>
        <section className="web-reception web-panel"><h3>受付操作</h3><p className="web-muted">受付・医療事務</p><div className="web-reception-actions">
          <button className={`web-primary${status === '到院済み' ? ' completed' : ''}`} disabled={status !== '予約確定'} onClick={() => { setStatus('到院済み'); setHistory([...history, '到院登録']); setMessage('到院登録しました'); window.setTimeout(() => setMessage(''), 1800) }}><b>{status === '到院済み' ? '到院登録済み' : '到院登録'}</b><small>患者が到着したら待合室へ登録</small></button>
          <button className="web-edit-action" disabled={status === 'キャンセル済み'} onClick={() => editor(true)}><b>予約を変更</b><small>日時・担当医・診療項目を変更</small></button>
          <button className={`web-cancel-action${status === 'キャンセル済み' ? ' cancelled' : ''}`} disabled={status === 'キャンセル済み'} onClick={() => setCancelOpen(true)}><b>{status === 'キャンセル済み' ? 'キャンセル済み' : '予約を取消'}</b><small>{status === 'キャンセル済み' ? '予約枠は空き枠へ戻りました' : '理由を記録し空き枠へ戻す'}</small></button>
        </div><div className="web-policy"><b>取消ポリシー</b><p>予約24時間以内の取消はキャンセルとして集計されます。理由と連絡方法を必ず記録してください。</p></div><p className="web-related">関連：診療情報 / 過去の予約 / 患者アプリ</p></section>
      </>}
      {screen === 'editor' && <>
        <div className="web-page-heading"><h2>{editing ? '予約を変更' : '新規予約を登録'}</h2><span className="web-breadcrumb">予約管理 / {editing ? '予約変更' : '新規予約'}</span><p>患者・診療内容・空き枠を確認して予約を確定します</p></div>
        <div className="web-steps">{[['患者', '完了'], ['診療内容・日時', '入力中'], ['確認', '未完了']].map(([label, state], index) => <div key={label}><span><Asset name={index === 2 ? 'imgStep3' : 'imgStep1'} /><b>{index + 1}</b></span><p><b>{label}</b><small>{state}</small></p></div>)}</div>
        <form id="web-booking-form" className="web-editor-form web-panel" onSubmit={event => { event.preventDefault(); setBooking({ ...draft }); setStatus('予約確定'); setHistory([...history, editing ? '予約内容を変更' : '新規予約を登録']); navigate('detail'); if (editing) { setMessage('予約を変更しました'); window.setTimeout(() => setMessage(''), 1800) } }}>
          <h3>予約情報</h3><div className="web-fields">{([['patient', '患者'], ['category', '診療区分'], ['treatment', '診療項目'], ['doctor', '担当医'], ['date', '予約日'], ['time', '時間'], ['room', '診療室'], ['memo', 'メモ']] as [keyof Booking, string][]).map(([key, label]) => <label key={key}>{label}<input required value={draft[key]} onChange={event => setDraft({ ...draft, [key]: event.target.value })} /></label>)}</div>
          <div className="web-reminders"><b>提醒设置</b><p>予約完了時に通知　前日にリマインド　変更・キャンセル時に通知</p></div>
        </form>
        <section className="web-editor-summary web-panel"><h3>予約詳細</h3><p className="web-accent">{draft.category} / {draft.treatment}</p><h4>{draft.patient.split('　')[0]}</h4><div className="web-summary-time"><p>{draft.date.replace('2026年', '')}</p><strong>{draft.time}</strong><small>{draft.doctor}・{draft.room}</small></div><div className="web-availability"><b>空き枠を確認済み</b><p>同時間帯の残り枠：1<br />患者アプリへ即時反映されます</p></div><button className="web-primary web-confirm" form="web-booking-form">予約を確定する</button></section>
      </>}
    </main>
    {message && <div className="web-toast" role="status"><span className="web-toast-check"><img src="/assets/check.svg" alt="" /></span>{message}</div>}
    {cancelOpen && <div className="web-modal-backdrop"><div className="web-cancel-dialog" role="dialog" aria-modal="true" aria-labelledby="web-cancel-title"><h2 id="web-cancel-title">予約をキャンセルしますか？</h2><p>この予約をキャンセルし、予約枠を空き枠へ戻します。</p><div><button type="button" onClick={() => setCancelOpen(false)}>戻る</button><button type="button" className="web-cancel-action" onClick={() => { setStatus('キャンセル済み'); setHistory([...history, 'キャンセル処理完了']); setCancelOpen(false); setMessage('予約をキャンセルしました'); window.setTimeout(() => setMessage(''), 1800) }}>予約を取消</button></div></div></div>}
  </div>
}

function Dashboard({ schedule }: { schedule: () => void }) {
  const [period, setPeriod] = useState('2026年7月14日–20日')
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [month, setMonth] = useState(new Date(2026, 6, 1))
  const [range, setRange] = useState<[Date | null, Date | null]>([new Date(2026, 6, 14), new Date(2026, 6, 20)])
  const [draftRange, setDraftRange] = useState<[Date | null, Date | null]>(range)
  const formatDate = (date: Date) => `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`
  const sameDate = (first: Date | null, second: Date | null) => !!first && !!second && first.getTime() === second.getTime()
  const selectDate = (day: number) => {
    const selected = new Date(month.getFullYear(), month.getMonth(), day)
    if (!draftRange[0] || draftRange[1]) return setDraftRange([selected, null])
    setDraftRange(selected < draftRange[0] ? [selected, draftRange[0]] : [draftRange[0], selected])
  }
  const openCalendar = () => { setDraftRange(range); setMonth(new Date((range[0] || month).getFullYear(), (range[0] || month).getMonth(), 1)); setCalendarOpen(true) }
  const applyRange = () => {
    if (!draftRange[0] || !draftRange[1]) return
    setRange(draftRange); setPeriod(`${formatDate(draftRange[0])}–${draftRange[1].getMonth() === draftRange[0].getMonth() && draftRange[1].getFullYear() === draftRange[0].getFullYear() ? draftRange[1].getDate() + '日' : formatDate(draftRange[1])}`); setCalendarOpen(false)
  }
  const exportReport = () => {
    const data = '\uFEFF項目,値\n今週の患者数,128\n初診患者,46\n復診患者,82\n予約キャンセル,9\n見込売上,3840000\n'
    const url = URL.createObjectURL(new Blob([data], { type: 'text/csv;charset=utf-8' }))
    const link = document.createElement('a'); link.href = url; link.download = 'carepulse-clinic-report.csv'; link.click(); URL.revokeObjectURL(url)
  }
  return <>
    <div className="web-page-heading"><h2>クリニック分析</h2><p>診療実績と予約動向を把握し、次の運営アクションにつなげます</p><div className="web-dashboard-actions"><button className="web-date-range-control" aria-haspopup="dialog" aria-expanded={calendarOpen} onClick={openCalendar}>{period}</button><button className="web-primary" onClick={exportReport}>レポートを書き出す</button></div></div>
    <div className="web-kpis">{[['今週の患者数', '128', '前週比 +12.3%'], ['初診患者', '46', '構成比 35.9%'], ['復診患者', '82', '構成比 64.1%'], ['予約キャンセル', '9', 'キャンセル率 7.0%'], ['見込売上', '¥3.84M', '前週比 +8.6%']].map(([label, number, detail], index) => <section key={label}><div className="web-kpi-icon"><Asset name={index === 1 ? 'imgIndicator1' : 'imgIndicator'} /><Asset name={index === 1 ? 'imgIndicatorDot1' : 'imgIndicatorDot'} /></div><span>{label}</span><strong>{number}</strong><small className={index === 1 ? 'web-purple' : ''}>{detail}</small></section>)}</div>
    <section className="web-trend web-panel"><h3>週間受診トレンド</h3><p className="web-muted">初診と復診の推移</p><div className="web-chart-legend"><span>●</span> 復診 <span>●</span> 初診</div><Asset className="web-trend-chart" name="imgChartWeeklyConsultations" alt="週間の初診と復診の推移" /><div className="web-weekdays">{'月火水木金土日'.split('').map(day => <span key={day}>{day}</span>)}</div></section>
    <section className="web-mix web-panel"><h3>患者構成</h3><p className="web-muted">今週の初診・復診</p><Asset className="web-mix-chart" name="imgChartNewReturnMix" alt="初診35.9%、復診64.1%" /><strong className="web-mix-total">128</strong><div className="web-mix-labels"><p>初診<br /><b>46人 <em>35.9%</em></b></p><p>復診<br /><b>82人 <em>64.1%</em></b></p></div></section>
    <section className="web-performance web-panel"><h3>診療項目別パフォーマンス</h3><p className="web-muted">診療件数と売上から、重点施策を把握</p><table><thead><tr>{['項目', '件数', '構成比', '売上', '前週比'].map(label => <th key={label}>{label}</th>)}</tr></thead><tbody>{[['定期健診', '42', '32.8%', '¥0.62M', '+16%'], ['根管治療', '27', '21.1%', '¥1.08M', '+9%'], ['歯周治療', '24', '18.8%', '¥0.86M', '+13%'], ['充填・補綴', '21', '16.4%', '¥0.74M', '+4%'], ['抜歯', '14', '10.9%', '¥0.54M', '-3%']].map(([name, count, ratio, revenue, change], index) => <tr key={name}><td>{name}</td><td>{count}</td><td><div className="web-ratio"><i><span style={{ width: `${parseFloat(ratio) * 2.9}%`, background: ['#7878d3', '#a954d7', '#5a5a9e', '#8942b8', '#a954d7'][index] }} /></i>{ratio}</div></td><td>{revenue}</td><td>{change}</td></tr>)}</tbody></table></section>
    <section className="web-operations web-panel"><h3>今日の運営アクション</h3><p className="web-muted">優先度順に対応</p><button onClick={schedule}><div><b>予約キャンセル</b><small>再連絡して空き枠を補充</small></div><strong>3件</strong></button><button onClick={schedule}><div><b>次回予約未確定</b><small>診療終了前に受付で確認</small></div><strong>6人</strong></button><button className="web-primary" onClick={schedule}>すべてのタスクを確認</button></section>
    {calendarOpen && <div className="web-date-overlay-backdrop"><section className="web-date-overlay" role="dialog" aria-modal="true" aria-labelledby="web-date-overlay-title"><h3 id="web-date-overlay-title">期間を選択</h3><p>開始日と終了日を選択してください</p><div className="web-date-month"><button type="button" aria-label="前の月" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}>‹</button><b>{month.getFullYear()}年{month.getMonth() + 1}月</b><button type="button" aria-label="次の月" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}>›</button></div><div className="web-date-weekdays">{'月火水木金土日'.split('').map(day => <span key={day}>{day}</span>)}</div><div className="web-date-days">{Array.from({ length: new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate() }, (_, index) => index + 1).map(day => { const date = new Date(month.getFullYear(), month.getMonth(), day); const inRange = !!draftRange[0] && !!draftRange[1] && date > draftRange[0] && date < draftRange[1]; return <button type="button" key={day} className={`${sameDate(date, draftRange[0]) ? 'range-start' : ''} ${sameDate(date, draftRange[1]) ? 'range-end' : ''} ${inRange ? 'range-middle' : ''}`} onClick={() => selectDate(day)}>{day}</button> })}</div><p className="web-date-selected">選択中：{draftRange[0] ? formatDate(draftRange[0]) : '開始日'}〜{draftRange[1] ? `${draftRange[1].getMonth() === draftRange[0]?.getMonth() && draftRange[1].getFullYear() === draftRange[0]?.getFullYear() ? draftRange[1].getDate() + '日' : formatDate(draftRange[1])}` : '終了日'}</p><div className="web-date-actions"><button type="button" onClick={() => setCalendarOpen(false)}>キャンセル</button><button type="button" className="web-primary" onClick={applyRange}>適用する</button></div></section></div>}
  </>
}
