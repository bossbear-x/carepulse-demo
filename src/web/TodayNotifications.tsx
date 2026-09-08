import { useState } from 'react'
import './today-notifications.css'

const appointments = [
  ['09:00', '山田 花子', '定期健診', '完了', '診療記録'],
  ['09:30', '佐藤 健', '初診', '完了', '診療記録'],
  ['10:00', '鈴木 美咲', '根管治療', '完了', '診療記録'],
  ['10:30', '高橋 翔', '定期健診', '完了', '診療記録'],
  ['11:00', '中村 彩', '充填・補綴', '完了', '診療記録'],
  ['11:30', '伊藤 大輔', '歯周治療', '診療中', '診療を開く'],
  ['13:30', '小林 直子', '初診', '待機中', '患者情報'],
  ['14:30', '加藤 遥', '定期健診', '待機中', '患者情報'],
]

export function Today({ openDetail }: { openDetail: () => void }) {
  return <div className="web-today-view" data-figma-node="503:641">
    <h2>本日の診療</h2><p className="web-tn-subtitle">2026年7月15日（水）・高橋香織 医師　担当 8件　現在 11:30</p>
    <div className="web-today-kpis">{[['待機中', '2件'], ['診療中', '1件'], ['完了', '5件']].map(([label, count]) => <section key={label}><p>{label}</p><strong>{count}</strong></section>)}</div>
    <section className="web-today-list"><h3>診療リスト</h3><p>時間順・担当患者のみ表示</p>
      <div className="web-today-columns">{['時間', '患者', '診療内容', '状態', 'アクション'].map(label => <span key={label}>{label}</span>)}</div>
      {appointments.map((row, index) => {
        const contents = row.map((value, column) => <span key={column}>{value}</span>)
        const style = { top: 118 + index * 56 }
        return index < 5
          ? <div className="web-today-row done" key={row[0]} style={style}>{contents}</div>
          : <button className={`web-today-row ${index === 5 ? 'active' : 'waiting'}`} key={row[0]} onClick={openDetail} style={style}>{contents}</button>
      })}
    </section>
  </div>
}

type NotificationDestination = 'detail' | 'schedule' | 'clinical-information'
// Destinations read from the reactions inside Figma 503:879, including row/action links.
const notifications: { time: string; category: string; text: string; destination: NotificationDestination; unread: boolean }[] = [
  { time: '10:42', category: '予約変更', text: '山田 花子さんの予約が 15:30 → 16:00 に変更されました', destination: 'detail', unread: true },
  { time: '09:18', category: '新規予約', text: '佐藤 健さんの初診予約が追加されました', destination: 'detail', unread: true },
  { time: '08:55', category: 'キャンセル', text: '鈴木 美咲さんの予約がキャンセルされました', destination: 'schedule', unread: true },
  { time: '08:20', category: '問診更新', text: '高橋 翔さんが来院前問診を更新しました', destination: 'detail', unread: true },
  { time: '昨日 17:36', category: '診療情報', text: '中村 彩さんの診療情報が更新されました', destination: 'clinical-information', unread: false },
]

export function Notifications({ navigate, confirmed, onConfirm }: { navigate: (screen: NotificationDestination) => void; confirmed: string[]; onConfirm: (time: string) => void }) {
  const [unreadOnly, setUnreadOnly] = useState(false)
  const [confirming, setConfirming] = useState<string[]>([])
  const unreadCount = notifications.filter(item => item.unread && !confirmed.includes(item.time)).length
  const confirm = (time: string) => {
    if (confirmed.includes(time) || confirming.includes(time)) return
    setConfirming(current => [...current, time])
    if (unreadOnly) window.setTimeout(() => onConfirm(time), 500)
    else onConfirm(time)
  }
  return <div className="web-notifications-view" data-figma-node="503:879">
    <h2>通知</h2><p className="web-tn-subtitle">予約・問診・患者対応に関する最新のお知らせ</p>
    <div className="web-notification-tabs" role="tablist" aria-label="通知の表示"><button role="tab" aria-selected={!unreadOnly} onClick={() => setUnreadOnly(false)}>すべて</button><button role="tab" aria-selected={unreadOnly} onClick={() => setUnreadOnly(true)}>未読 {unreadCount}{unreadCount > 0 && <img src="/web-notification-assets/alert.svg" alt="" width="8" height="8" />}</button></div>
    <section className="web-notification-list" role="tabpanel" aria-label={unreadOnly ? '未読の通知' : 'すべての通知'}>
      {notifications.filter(item => !unreadOnly || (item.unread && !confirmed.includes(item.time))).map((item, index) => { const isUnread = item.unread && !confirmed.includes(item.time); const isConfirming = confirming.includes(item.time); return <div className={`web-notification-item${isUnread && !isConfirming ? '' : ' read'}`} key={item.time} onClick={() => navigate(item.destination)} style={{ top: 20 + index * 116 }}>
        <img className="web-notification-dot" src={`/web-notification-assets/${isUnread && !isConfirming ? 'unread' : 'read'}.svg`} alt="" width="10" height="10" /><span className="web-notification-time">{item.time}</span><span className={`web-notification-category category-${notifications.indexOf(item)}`}>{item.category}</span><strong>{item.text}</strong><button className="web-notification-action" disabled={!isUnread || isConfirming} onClick={event => { event.stopPropagation(); confirm(item.time) }}>{isUnread && !isConfirming ? '確認する' : '確認済み'}</button>
      </div> })}
    </section>
  </div>
}
