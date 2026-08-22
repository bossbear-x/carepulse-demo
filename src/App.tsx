import { FormEvent, PointerEvent as ReactPointerEvent, ReactNode, useEffect, useMemo, useRef, useState } from 'react'
import { patientQrCells } from './patientQr'

type PatientType = 'new' | 'returning'
type Screen =
  | 'splash' | 'login' | 'setup' | 'nfc' | 'nfc-success' | 'first-form' | 'return-form'
  | 'home' | 'booking-date' | 'booking-review' | 'booking-success' | 'symptom'
  | 'symptom-success' | 'chat' | 'records' | 'record-detail' | 'bookings'
  | 'medication' | 'medication-ai' | 'family' | 'caregiver' | 'reminder-success'

type Appointment = {
  date: string
  time: string
  doctor: string
  clinic: string
  status: 'confirmed'
  rescheduled?: boolean
}
type BookingDraft = Pick<Appointment, 'date' | 'time' | 'doctor'>
type AppointmentsByPersona = Record<PatientType, Appointment | null>
type DoseStates = [boolean, boolean, boolean]
type VisitRecord = {
  date: string
  content: string
  detailContent?: string
  doctor: string
  payment: string
  category: string
  explanation?: string
  precautions?: string
}
type CareOverlay = null | 'checkin-start' | 'checkin-end' | 'checkin-success' | 'patient-qr'
type SelectedLanguage = 'ja' | 'en' | 'zh-CN' | 'zh-TW' | 'ko' | 'vi'
type FirstVisitData = {
  name: string
  furigana: string
  gender: '' | '男性' | '女性' | '回答しない'
  birthDate: string
  phone: string
  postalCode: string
  address: string
}

const languageOptions: ReadonlyArray<{ code: SelectedLanguage; label: string }> = [
  { code: 'ja', label: '日本語' },
  { code: 'en', label: 'English' },
  { code: 'zh-CN', label: '简体中文' },
  { code: 'zh-TW', label: '繁體中文' },
  { code: 'ko', label: '한국어' },
  { code: 'vi', label: 'Tiếng Việt' },
]

const medicationTranslations: Record<SelectedLanguage, string> = {
  ja: '【AI多言語翻訳】\n\n用法・服用方法：\n1回1錠を1日3回服用してください。\n朝・昼・夜の食後に、ぬるま湯で服用してください。\n3日間、処方された分を最後まで服用してください。\n眠くなることがありますので、車の運転はしないでください。',
  en: '【AI Multi-Language Translation】\n\nDosage & Directions:\nTake 1 tablet by mouth 3 times a day.\nTake after meals (Breakfast, Lunch, and Dinner) with warm water.\nPlease complete the full 3-day course.\nThis medicine may cause drowsiness. Do not drive.',
  'zh-CN': '【AI 多语言翻译】\n\n用法与服用方法：\n每次1片，每天3次。\n请在早、午、晚饭后用温水服用。\n请连续服用完整的3天疗程。\n本药可能引起困倦，请勿驾驶车辆。',
  'zh-TW': '【AI 多語言翻譯】\n\n用法與服用方法：\n每次1片，每天3次。\n請在早、午、晚餐後以溫水服用。\n請完成完整的3天療程。\n本藥可能引起嗜睡，請勿駕駛車輛。',
  ko: '【AI 다국어 번역】\n\n복용 방법:\n1회 1정을 하루 3회 복용해 주세요.\n아침, 점심, 저녁 식사 후 미지근한 물과 함께 복용해 주세요.\n처방된 3일분을 끝까지 복용해 주세요.\n졸음이 올 수 있으므로 운전하지 마세요.',
  vi: '【AI Dịch đa ngôn ngữ】\n\nLiều dùng và cách sử dụng:\nUống 1 viên mỗi lần, ngày 3 lần.\nUống sau bữa sáng, trưa và tối với nước ấm.\nVui lòng dùng đủ liệu trình 3 ngày.\nThuốc có thể gây buồn ngủ, không lái xe sau khi uống.',
}

const readSelectedLanguage = (): SelectedLanguage => {
  const saved = localStorage.getItem('carepulse.language')
  const legacy = languageOptions.find(option => option.label === saved)
  return languageOptions.some(option => option.code === saved) ? saved as SelectedLanguage : legacy?.code || 'en'
}

const doctor = '鈴木 健一 医師（院長）'
const clinic = 'CarePulse クリニック'
const makeDraft = (date: string, time: string): BookingDraft => ({ date, time, doctor })
const shortDate = (date: string) => date.replace(/^2026年/, '')

const assets = {
  logo: '/assets/carepulse-logo.png', login: '/assets/login-illustration.png',
  setup: '/assets/setup-illustration.png', nfc: '/assets/nfc-illustration.png',
  patient: '/assets/patient-avatar.png', family: '/assets/family-avatar.png',
}
const demoProfile = { name: 'ZHOU XIAO', furigana: 'シュウ ショウ', card: '15538', birth: '1989年 05月 20日' }
const emptyFirstVisit: FirstVisitData = { name: '', furigana: '', gender: '', birthDate: '', phone: '', postalCode: '', address: '' }
const visits: VisitRecord[] = [
  { date:'2026年5月12日（月）', content:'定期検診・歯石除去', detailContent:'定期検診・歯石除去、仮の詰め物の状態を確認', doctor:'鈴木 医師', payment:'¥3,420 (保険3割)', category:'歯科・再診', explanation:'次回の治療まで、硬いものや粘着性のある食べ物を避けてください。痛みが出た場合はすぐにクリニックに連絡してください。', precautions:'・硬いものを噛まない\n・ガムなど粘着性のあるものを避ける\n・痛みが出たら連絡する' },
  { date:'2026年3月14日（土）', content:'虫歯治療（左上奥歯・コンポジットレジン充填）', doctor:'鈴木 医師', payment:'¥2,180 (保険3割)', category:'虫歯治療' },
  { date:'2026年2月18日（水）', content:'急患対応・根管治療（右下奥歯、パノラマレントゲン検査含む）', doctor:'鈴木 医師', payment:'¥3,850 (保険3割)', category:'急患対応・根管治療' },
]

const read = <T,>(key: string, fallback: T): T => {
  try { return JSON.parse(localStorage.getItem(key) || '') as T } catch { return fallback }
}

const appointmentStorageKey = (type: PatientType) => `carepulse.booking.${type}`

const readAppointment = (type: PatientType): Appointment | null => {
  const savedForPersona = read<Partial<Appointment> | null>(appointmentStorageKey(type), null)
  const legacy = read<Partial<Appointment> | null>('carepulse.booking', null)
  const legacyMatchesPersona = type === 'new' ? legacy?.date?.includes('2月') : legacy?.date?.includes('6月')
  const saved = savedForPersona || (legacyMatchesPersona ? legacy : null)
  if (!saved?.date || !saved.time) return null
  return { date: saved.date, time: saved.time, doctor: saved.doctor || doctor, clinic: saved.clinic || clinic, status: 'confirmed', rescheduled: saved.rescheduled }
}

function StatusBar() {
  return <div className="status-bar"><b>9:41</b><div className="signals"><img src="/assets/cellular.svg"/><img src="/assets/wifi.svg"/><img className="battery" src="/assets/battery.svg"/></div></div>
}

function Header({ title, onBack, right }: { title: string; onBack?: () => void; right?: ReactNode }) {
  return <header className="app-header">
    {onBack ? <button className="icon-button back-button" onClick={onBack} aria-label="戻る"><img src="/assets/back.svg"/></button> : <span className="header-space"/>}
    <h1>{title}</h1><div className="header-right">{right}</div>
  </header>
}

const navItems = [
  ['home', 'ホーム', '/assets/nav-home.svg', '/assets/nav-home-active.svg'],
  ['medication', 'お薬', '/assets/nav-medication.svg', '/assets/nav-medication-active.svg'],
  ['family', '家族', '/assets/nav-family.svg', '/assets/nav-family-active.svg'],
  ['records', '記録', '/assets/nav-records.svg', '/assets/nav-records-active.svg'],
] as const

function BottomNav({ active, go }: { active: string; go: (s: Screen) => void }) {
  return <nav className="bottom-nav">{navItems.map(([id, label, icon, activeIcon]) =>
    <button key={id} className={active === id ? 'active' : ''} onClick={() => go(id as Screen)}>
      <img src={active === id ? activeIcon : icon}/><span>{label}</span>
    </button>)}</nav>
}

function PrimaryButton({ children, onClick, tone = 'primary', type = 'button', disabled = false, form }: {
  children: ReactNode; onClick?: () => void; tone?: 'primary' | 'bright' | 'soft'; type?: 'button' | 'submit'; disabled?: boolean; form?: string
}) {
  return <button className={`primary-button ${tone}`} onClick={onClick} type={type} disabled={disabled} form={form}>{children}</button>
}

function Card({ children, className = '', onClick }: { children: ReactNode; className?: string; onClick?: () => void }) {
  return <div className={`card ${className}`} onClick={onClick}>{children}</div>
}

function SuccessIcon({ large = false }: { large?: boolean }) { return <div className={`success-icon ${large ? 'large' : ''}`}><img src="/assets/success-check.svg" alt=""/></div> }

function App() {
  const [screen, setScreen] = useState<Screen>('splash')
  const [history, setHistory] = useState<Screen[]>([])
  const [patientType, setPatientType] = useState<PatientType>(() => read('carepulse.patientType', 'new'))
  const [profile, setProfile] = useState(() => read('carepulse.profile', demoProfile))
  const [appointmentsByPersona, setAppointmentsByPersona] = useState<AppointmentsByPersona>(() => ({
    new: readAppointment('new'),
    returning: readAppointment('returning'),
  }))
  const [bookingDraft, setBookingDraft] = useState<BookingDraft>(() => makeDraft('2026年2月17日（水）', '10:30'))
  const [rescheduling, setRescheduling] = useState(false)
  const [symptoms, setSymptoms] = useState(() => localStorage.getItem('carepulse.symptoms') || '')
  const [doseStates, setDoseStates] = useState<DoseStates>([true, true, false])
  const [selectedLanguage, setSelectedLanguage] = useState<SelectedLanguage>(readSelectedLanguage)
  const [languageOpen, setLanguageOpen] = useState(false)
  const [familyOpen, setFamilyOpen] = useState(false)
  const [familyRemoved, setFamilyRemoved] = useState(() => read('carepulse.familyRemoved', false))
  const [dateOpen, setDateOpen] = useState(false)
  const [birthDate, setBirthDate] = useState('1989年 05月 20日')
  const [firstVisitData, setFirstVisitData] = useState<FirstVisitData>(emptyFirstVisit)
  const [careOverlay, setCareOverlay] = useState<CareOverlay>(null)
  const [selectedVisit, setSelectedVisit] = useState<VisitRecord>(visits[0])
  const appointment = appointmentsByPersona[patientType]

  const go = (next: Screen) => { setHistory(h => [...h, screen]); setScreen(next); window.scrollTo(0, 0) }
  const back = () => setHistory(h => { const next = h.at(-1); if (next) { setScreen(next); window.scrollTo(0, 0) } return h.slice(0, -1) })

  useEffect(() => { if (screen === 'splash') { const id = window.setTimeout(() => go('login'), 1350); return () => window.clearTimeout(id) } }, [screen])
  useEffect(() => { if (screen === 'nfc') { const id = window.setTimeout(() => go('nfc-success'), 1700); return () => window.clearTimeout(id) } }, [screen])
  useEffect(() => {
    if (careOverlay === 'checkin-start') {
      const id = window.setTimeout(() => setCareOverlay('checkin-end'), 1350)
      return () => window.clearTimeout(id)
    }
    if (careOverlay === 'checkin-end') {
      const id = window.setTimeout(() => setCareOverlay('checkin-success'), 450)
      return () => window.clearTimeout(id)
    }
  }, [careOverlay])

  const setPersonaAppointment = (type: PatientType, next: Appointment | null) => {
    setAppointmentsByPersona(current => ({ ...current, [type]: next }))
    if (next) localStorage.setItem(appointmentStorageKey(type), JSON.stringify(next))
    else localStorage.removeItem(appointmentStorageKey(type))
  }
  const resetReturningScenario = () => {
    setPersonaAppointment('returning', null)
    setDoseStates([true, true, false])
    localStorage.removeItem('carepulse.eveningTaken')
  }
  const setTypeAndHome = (type: PatientType) => {
    setPatientType(type); localStorage.setItem('carepulse.patientType', JSON.stringify(type)); go('home')
  }
  const enterNewPatientHome = () => {
    setTypeAndHome('new')
  }
  const enterReturningPatientHome = () => {
    setProfile(demoProfile)
    localStorage.setItem('carepulse.profile', JSON.stringify(demoProfile))
    resetReturningScenario()
    setTypeAndHome('returning')
  }
  const startBooking = (isReschedule = false) => {
    setRescheduling(isReschedule)
    const next = isReschedule && appointment
      ? { date: appointment.date, time: appointment.time, doctor: appointment.doctor }
      : patientType === 'new'
        ? makeDraft('2026年2月17日（水）', '10:30')
        : makeDraft('2026年6月15日（月）', '15:00')
    setBookingDraft(next); go('booking-date')
  }
  const confirmBooking = () => {
    const next: Appointment = { ...bookingDraft, clinic, status: 'confirmed', rescheduled: rescheduling }
    setPersonaAppointment(patientType, next)
    go('booking-success')
  }
  const confirmAiBooking = () => {
    const next: Appointment = { ...makeDraft('2026年2月18日（水）', '10:30'), clinic, status: 'confirmed' }
    setPersonaAppointment('new', next)
  }
  const openVisit = (visit: VisitRecord) => { setSelectedVisit(visit); go('record-detail') }

  const main = (() => {
    switch (screen) {
      case 'splash': return <Splash onSkip={() => go('login')}/>
      case 'login': return <Login onContinue={enterReturningPatientHome} onRegister={() => go('setup')}/>
      case 'setup': return <Setup back={back} first={() => go('first-form')} nfc={() => go('nfc')}/>
      case 'nfc': return <Nfc back={back}/>
      case 'nfc-success': return <NfcSuccess next={() => { setProfile(demoProfile); localStorage.setItem('carepulse.profile', JSON.stringify(demoProfile)); enterNewPatientHome() }}/>
      case 'first-form': return <PatientForm mode="new" birthDate={firstVisitData.birthDate} openDate={() => setDateOpen(true)} back={back} switchMode={() => go('return-form')} submit={(name) => { const next = { ...profile, name: name || demoProfile.name, furigana: firstVisitData.furigana || demoProfile.furigana, birth: firstVisitData.birthDate }; setProfile(next); localStorage.setItem('carepulse.profile', JSON.stringify(next)); enterNewPatientHome() }} firstVisitData={firstVisitData} setFirstVisitData={setFirstVisitData}/>
      case 'return-form': return <PatientForm mode="returning" birthDate={birthDate} openDate={() => setDateOpen(true)} back={back} switchMode={() => go('first-form')} submit={(_,card) => { const next = { ...profile, name: demoProfile.name, card: card || demoProfile.card }; setProfile(next); localStorage.setItem('carepulse.profile', JSON.stringify(next)); resetReturningScenario(); setTypeAndHome('returning') }}/>
      case 'home': return <Home type={patientType} profile={profile} appointment={appointment} startBooking={startBooking} go={go} checkIn={() => setCareOverlay('checkin-start')} showQr={() => setCareOverlay('patient-qr')}/>
      case 'booking-date': return <BookingDate draft={bookingDraft} type={patientType} rescheduling={rescheduling} setDraft={setBookingDraft} back={back} next={() => go('booking-review')}/>
      case 'booking-review': return <BookingReview draft={bookingDraft} type={patientType} back={back} edit={() => go('booking-date')} confirm={confirmBooking}/>
      case 'booking-success': return appointment ? <BookingSuccess appointment={appointment} rescheduled={rescheduling} chat={() => go('chat')} manual={() => go('symptom')} home={() => go('home')}/> : null
      case 'symptom': return <Symptom type={patientType} value={symptoms} setValue={setSymptoms} back={back} submit={() => { localStorage.setItem('carepulse.symptoms', symptoms); go(patientType === 'returning' ? 'symptom-success' : 'home') }}/>
      case 'symptom-success': return <SimpleSuccess text="お医者さんに提出しました" next={() => go('home')}/>
      case 'chat': return <Chat type={patientType} booked={Boolean(appointment)} back={back} confirmAiBooking={confirmAiBooking}/>
      case 'records': return <Records type={patientType} tab="visits" go={go} selectedVisit={selectedVisit} openVisit={openVisit}/>
      case 'bookings': return <Records type={patientType} tab="bookings" go={go} appointment={appointment} selectedVisit={selectedVisit} openVisit={openVisit} reschedule={() => startBooking(true)}/>
      case 'record-detail': return <RecordDetail visit={selectedVisit} appointment={appointmentsByPersona.returning} back={back}/>
      case 'medication': return <Medication taken={doseStates} toggle={index => setDoseStates(current => current.map((value, doseIndex) => doseIndex === index ? !value : value) as DoseStates)} explain={() => go('medication-ai')} go={go}/>
      case 'medication-ai': return <MedicationAi selectedLanguage={selectedLanguage} openLanguages={() => setLanguageOpen(true)} back={back} home={() => go('home')}/>
      case 'family': return <Family removed={familyRemoved} back={back} go={go} openActions={() => setFamilyOpen(true)}/>
      case 'caregiver': return <Caregiver back={back} remind={() => go('reminder-success')}/>
      case 'reminder-success': return <SimpleSuccess text="服薬リマインドを送りました" next={() => go('home')} variant="reminder"/>
    }
  })()

  return <main className="device-shell">{main}
    {dateOpen && <DatePicker
      value={birthDate}
      cancel={() => setDateOpen(false)}
      done={(date) => { setBirthDate(date); if (screen === 'first-form') setFirstVisitData(current => ({ ...current, birthDate: date })); setDateOpen(false) }}
    />}
    {languageOpen && <LanguageModal value={selectedLanguage} choose={(value) => { setSelectedLanguage(value); localStorage.setItem('carepulse.language', value); setLanguageOpen(false) }} cancel={() => setLanguageOpen(false)}/>} 
    {familyOpen && <ActionSheet cancel={() => setFamilyOpen(false)} remove={() => { setFamilyRemoved(true); localStorage.setItem('carepulse.familyRemoved', 'true'); setFamilyOpen(false) }}/>} 
    {careOverlay && <CarePulseOverlay kind={careOverlay} close={() => setCareOverlay(null)}/>} 
  </main>
}

function Splash({ onSkip }: { onSkip: () => void }) {
  return <section className="screen splash" onClick={onSkip}><div className="splash-content"><h1>いつも近くに、<br/>安心の医療を。</h1><div className="splash-logo"><img src="/assets/splash-tooth.png" alt="CarePulse ロゴ"/></div></div></section>
}

function Login({ onContinue, onRegister }: { onContinue: () => void; onRegister: () => void }) {
  return <section className="screen login-screen"><StatusBar/><div className="login-content"><div className="brand"><img src={assets.logo}/>CarePulse クリニック</div><img className="hero-illustration" src={assets.login}/><div className="login-actions"><div className="button-row"><PrimaryButton onClick={onContinue}>LINEでログイン</PrimaryButton><PrimaryButton onClick={onRegister}>新規登録</PrimaryButton></div><p>再診の方は「LINEでログイン」へ</p></div></div></section>
}

function Setup({ back, first, nfc }: { back: () => void; first: () => void; nfc: () => void }) {
  return <section className="screen setup-screen"><StatusBar/><Header title="アカウント連携" onBack={back}/><div className="page-intro"><h2>ご利用の確認</h2><p>当院を受診されるのは初めてですか？</p></div><img className="hero-illustration centered" src={assets.setup}/><div className="stack-actions"><div className="setup-first-choice"><button className="choice-card" onClick={first}><b>当院が初めての方</b></button><span>自動入力されません</span></div><PrimaryButton onClick={nfc}>マイナンバーカードでスピード登録</PrimaryButton></div></section>
}

function Nfc({ back }: { back: () => void }) {
  return <section className="screen nfc-screen"><StatusBar/><Header title="アカウント連携" onBack={back}/><div className="page-intro"><h2>マイナンバーカードの読み取り</h2></div><img className="nfc-illustration" src={assets.nfc}/><p className="nfc-helper">カードをスマートフォンの背面にかざしてください</p><p className="center-note">電子証明書を読み取り中...</p></section>
}

function NfcSuccess({ next }: { next: () => void }) {
  return <section className="screen success-screen nfc-success-screen"><StatusBar/><div className="success-center"><SuccessIcon large/><h2>認証が完了しました</h2><p>ご入力の手間が省かれました。</p></div><div className="fixed-action"><PrimaryButton onClick={next}>確認する</PrimaryButton></div><div className="home-indicator"/></section>
}

function PatientForm({ mode, birthDate, openDate, back, switchMode, submit, firstVisitData, setFirstVisitData }: { mode: PatientType; birthDate: string; openDate: () => void; back: () => void; switchMode: () => void; submit: (name: string, card: string) => void; firstVisitData?: FirstVisitData; setFirstVisitData?: (data: FirstVisitData) => void }) {
  const [card, setCard] = useState('')
  const data = firstVisitData ?? emptyFirstVisit
  const dataRef = useRef(data)
  const manuallyEdited = useRef(new Set<keyof FirstVisitData>())
  useEffect(() => { dataRef.current = data }, [data])
  useEffect(() => {
    if (mode !== 'new' || !setFirstVisitData) return
    const steps: Array<[keyof FirstVisitData, FirstVisitData[keyof FirstVisitData]]> = [
      ['name', 'ZHOU XIAO'],
      ['furigana', 'シュウ ショウ'],
      ['gender', '女性'],
      ['birthDate', '1989年05月20日'],
      ['phone', '09012345678'],
      ['postalCode', '1660004'],
      ['address', '東京都杉並区阿佐谷南'],
    ]
    const timers = steps.map(([key, value], index) => window.setTimeout(() => {
      if (manuallyEdited.current.has(key) || dataRef.current[key]) return
      const next = { ...dataRef.current, [key]: value } as FirstVisitData
      dataRef.current = next
      setFirstVisitData(next)
    }, 500 + index * 400))
    return () => timers.forEach(window.clearTimeout)
  }, [mode, setFirstVisitData])
  const markManual = (key: keyof FirstVisitData) => manuallyEdited.current.add(key)
  const updateFirstVisit = (next: Partial<FirstVisitData>) => {
    const updated = { ...dataRef.current, ...next }
    dataRef.current = updated
    setFirstVisitData?.(updated)
  }
  const formId = mode === 'new' ? 'first-patient-form' : 'returning-patient-form'
  const onSubmit = (e: FormEvent) => { e.preventDefault(); submit(data.name,card) }
  return <section className={`screen patient-entry ${mode === 'new' ? 'first-patient' : 'returning-patient'}`}>
    <StatusBar/>
    <Header title="" onBack={back} right={<button className="text-button" onClick={() => submit(data.name,card)}>スキップ</button>}/>
    {mode === 'returning' && <div className="segmented wide">
      <button onClick={switchMode}>当院が初めての方</button>
      <button className="active">診察券をお持ちの方</button>
    </div>}
    <form id={formId} className="patient-form" onSubmit={onSubmit}>
      {mode === 'new' ? <>
        <div className="form-intro"><h2>初診情報の入力</h2><p>院内でのカルテ作成のため、以下の情報をご入力ください。</p></div>
        <div className="input-fields-group">
          <Field label="お名前"><input value={data.name} onFocus={() => markManual('name')} onChange={e => updateFirstVisit({ name: e.target.value })} placeholder="例：山田 太郎"/></Field>
          <Field label="フリガナ"><input value={data.furigana} onFocus={() => markManual('furigana')} onChange={e => updateFirstVisit({ furigana: e.target.value })} placeholder="例：ヤマダ タロウ"/></Field>
          <Field label="性別"><div className="radio-row">
            {(['男性', '女性', '回答しない'] as const).map(gender => <label key={gender}><input type="radio" name="gender" checked={data.gender === gender} onChange={() => { markManual('gender'); updateFirstVisit({ gender }) }}/><span className="radio-mark"/>{gender}</label>)}
          </div></Field>
          <Field label="生年月日"><button type="button" className="field-button" onClick={() => { markManual('birthDate'); openDate() }}><span>{birthDate || '生年月日を選択'}</span><img src="/assets/chevron-down.svg"/></button></Field>
          <Field label="電話番号"><input inputMode="tel" value={data.phone} onFocus={() => markManual('phone')} onChange={e => updateFirstVisit({ phone: e.target.value })} placeholder="例：09012345678"/></Field>
          <Field label="郵便番号"><input value={data.postalCode} onFocus={() => markManual('postalCode')} onChange={e => updateFirstVisit({ postalCode: e.target.value })} placeholder="例：1660004"/></Field>
          <button type="button" className="address-button" onClick={() => { markManual('postalCode'); markManual('address'); updateFirstVisit({ postalCode: dataRef.current.postalCode.trim() || '1660004', address: '東京都杉並区阿佐谷南' }) }}>住所検索</button>
          <Field label="住所"><input value={data.address} onFocus={() => markManual('address')} onChange={e => updateFirstVisit({ address: e.target.value })}/></Field>
        </div>
      </> : <>
        <div className="form-intro title-only"><h2>診察券番号</h2></div>
        <div className="input-fields-group">
          <Field label="診察券番号"><div className="input-with-icon"><input value={card} onChange={e => setCard(e.target.value)} placeholder="例：15538"/><button type="button" onClick={() => setCard('')} aria-label="診察券番号をクリア"><img src="/assets/clear-circle.svg"/></button></div></Field>
          <Field label="生年月日"><button type="button" className="field-button" onClick={openDate}><span>{birthDate}</span><img src="/assets/chevron-down.svg"/></button></Field>
        </div>
      </>}
    </form>
    <div className="entry-fixed-action"><PrimaryButton type="submit" form={formId}>{mode === 'new' ? '確認する' : '連携してはじめる'}</PrimaryButton></div>
  </section>
}

function Field({ label, children }: { label: string; children: ReactNode }) { return <label className="field"><b>{label} <em>必須</em></b>{children}</label> }

function Home({ type, profile, appointment, startBooking, go, checkIn, showQr }: { type: PatientType; profile: {name:string;card:string}; appointment: Appointment | null; startBooking: (r?: boolean) => void; go: (s: Screen) => void; checkIn: () => void; showQr: () => void }) {
  const returning = type === 'returning'
  const stateClass = returning ? appointment ? 'home-returning home-returning-booked' : 'home-returning home-returning-default' : appointment ? 'home-new-booked' : 'home-new-default'
  const aiCopy = returning ? '再診の予約や変更、医師についてAIに相談できます。' : appointment ? '予約内容の確認や変更、医師についてAIに相談できます。' : '予約可能な日時や医師について、AIに相談できます。'
  const enabled = returning || Boolean(appointment)
  return <section className={`screen app-screen home-screen ${stateClass}`}><StatusBar/><div className="home-hero"><div><p>おはようございます</p><h1>CarePulse クリニック</h1></div><img src={assets.patient}/></div><div className="home-content"><h2>{profile.name}様</h2><p className="patient-number">{enabled ? `診察券番号：${profile.card}` : '初診受付中'}</p><div className="button-row"><button disabled={!enabled} className={enabled?'checkin-action':'muted-action'} onClick={enabled ? checkIn : undefined}>チェックイン</button><button disabled={!enabled} className="muted-action" onClick={enabled ? showQr : undefined}>QRコード</button></div>
  {!returning && !appointment && <><p className="caption eligibility-note">※初診受付完了後にご利用いただけます</p><div className="home-block reservation-block"><SectionTitle>次回の予約</SectionTitle><Card><p>初診のご予約がまだ完了していません。ご希望の日時を選択して、最初の診察を予約してください。</p><div className="card-action"><PrimaryButton onClick={() => startBooking(false)}>初診の予約をとる</PrimaryButton></div></Card></div><div className="home-block tasks-block"><SectionTitle>今日やること</SectionTitle><Card><p>マイナンバーカード（または保険証）を用意する<br/>お薬手帳を確認<br/>予約や医師の相談は、下の「AI」から。</p></Card></div></>}
  {!returning && appointment && <><div className="home-block history-block"><SectionTitle>通院履歴</SectionTitle><Card><p>現在、履歴はありません。</p></Card></div><div className="home-block reservation-block"><SectionTitle>次回の予約</SectionTitle><Card><p>{appointment.date.replace('（',' (').replace('）',')')} {appointment.time}</p></Card></div><div className="home-block tasks-block"><SectionTitle>今日やること</SectionTitle><Card><p>01. 健康保険証の確認<br/>02. マイナンバーカードの持参</p></Card></div><div className="family-shortcuts"><SectionTitle>家族管理</SectionTitle><div><img src="/assets/person-add.svg"/><img src="/assets/person-add.svg"/><img src="/assets/person-add.svg"/><img src="/assets/tune.svg"/></div></div></>}
  {returning && <><div className="home-block history-block"><SectionTitle>通院履歴</SectionTitle><Card><p>前回の受診：2026年5月12日<br/>診療内容：定期検診</p><button className="inline-link" onClick={() => go('records')}>履歴一覧</button></Card></div><div className="home-block reservation-block"><SectionTitle>次回の通院</SectionTitle>{appointment ? <button type="button" className="card booked-appointment-card" onClick={() => go('bookings')}><span>{appointment.date} {appointment.time}</span></button> : <Card><p>現在、次回のご予約はありません。</p><div className="card-action"><PrimaryButton onClick={() => startBooking(false)}>再診の予約をとる</PrimaryButton></div></Card>}</div><div className="home-block tasks-block"><SectionTitle>今日やること</SectionTitle><Card><p>01、診察券を確認<br/>02、保険証を確認<br/>03、お薬手帳を確認</p></Card></div>{appointment && <div className="returning-family-shortcuts"><SectionTitle>家族管理</SectionTitle><button type="button" onClick={() => go('family')} aria-label="家族管理を開く"><span><img src={assets.family}/><small>招待済み</small></span><span><img src={assets.family}/><small>招待済み</small></span><span><img src="/assets/person-add.svg"/><small>家族を追加</small></span><span><img src="/assets/tune.svg"/><small>家族を管理</small></span></button></div>}</>}
  <div className="ai-support-block"><SectionTitle>AIサポート</SectionTitle><Card><p>{aiCopy}</p><div className="card-action"><PrimaryButton onClick={() => go('chat')}>AIに相談する</PrimaryButton></div></Card></div>
  <div className="home-scroll-spacer" aria-hidden="true"/>
  </div><BottomNav active="home" go={go}/></section>
}

function SectionTitle({ children }: { children: ReactNode }) { return <h3 className="section-title">{children}</h3> }

function BookingDate({ draft, type, rescheduling, setDraft, back, next }: { draft: BookingDraft; type: PatientType; rescheduling: boolean; setDraft: (b: BookingDraft) => void; back: () => void; next: () => void }) {
  const dateStripRef = useRef<HTMLDivElement>(null)
  const dateDrag = useRef({ active: false, moved: false, axis: '' as '' | 'x' | 'y', startX: 0, startY: 0, startScroll: 0 })
  const suppressDateClick = useRef(false)
  const currentDay = Number(draft.date.match(/月(\d+)日/)?.[1] || 17)
  const days = rescheduling && currentDay >= 17 ? [17,18,19,20,21,22,23,24,25] : [13,14,15,16,17,18,19,20,21]
  const month = type === 'new' ? '2026年 2月' : '2026年 6月'
  const selectedDay = currentDay
  const times = rescheduling ? ['09:00 ○','09:30 ○','10:00 △','10:30 ×','11:00 △','11:30 ○','12:00 △','14:00 ○','14:30 △','15:00 ○','15:30 ○','16:00 ○','16:30 ×','17:00 △','17:30 ○','18:00 △'] : ['09:00 ×','09:30 ×','10:00 △','10:30 ○','11:00 △','11:30 ○','12:00 ×','14:00 ○','14:30 △','15:00 △','15:30 ○','16:00 ○','16:30 ×','17:00 △','17:30 ×','18:00 ×']
  const weekdayForDay = (day: number) => ['土','日','月','火','水','木','金'][((day - 13) % 7 + 7) % 7]
  const stopDateDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!dateDrag.current.active) return
    const didDrag = dateDrag.current.moved
    if (didDrag) {
      suppressDateClick.current = true
      window.setTimeout(() => { suppressDateClick.current = false }, 120)
    }
    dateDrag.current.active = false
    const strip = dateStripRef.current
    if (strip && didDrag) {
      const items = Array.from(strip.querySelectorAll<HTMLButtonElement>('button'))
      const stripCenter = strip.scrollLeft + strip.clientWidth / 2
      const closest = items.reduce<HTMLButtonElement | null>((best, item) => {
        if (!best) return item
        const itemCenter = item.offsetLeft + item.offsetWidth / 2
        const bestCenter = best.offsetLeft + best.offsetWidth / 2
        return Math.abs(itemCenter - stripCenter) < Math.abs(bestCenter - stripCenter) ? item : best
      }, null)
      if (closest) strip.scrollTo({ left: closest.offsetLeft + closest.offsetWidth / 2 - strip.clientWidth / 2, behavior: 'smooth' })
    }
    try { event.currentTarget.releasePointerCapture(event.pointerId) } catch { /* capture may already be released */ }
  }
  return <section className={`screen booking-screen ${rescheduling?'reschedule-screen':''}`}><StatusBar/><Header title="日時を選択" onBack={back}/><div className="booking-body"><h2>{month}</h2><div ref={dateStripRef} className="date-strip" onPointerDown={event => {
    if (event.pointerType === 'touch') return
    if (event.pointerType === 'mouse' && event.button !== 0) return
    dateDrag.current = { active: true, moved: false, axis: '', startX: event.clientX, startY: event.clientY, startScroll: event.currentTarget.scrollLeft }
  }} onPointerMove={event => {
    const drag = dateDrag.current
    if (!drag.active) return
    const dx = event.clientX - drag.startX
    const dy = event.clientY - drag.startY
    if (!drag.axis && Math.max(Math.abs(dx), Math.abs(dy)) > 6) drag.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y'
    if (drag.axis === 'y') { drag.active = false; return }
    if (drag.axis === 'x') {
      if (!drag.moved) {
        drag.moved = true
        event.currentTarget.setPointerCapture(event.pointerId)
      }
      event.preventDefault()
      event.currentTarget.scrollLeft = drag.startScroll - dx
    }
  }} onPointerUp={stopDateDrag} onPointerCancel={stopDateDrag}>{days.map((d,i) => {const weekday=weekdayForDay(d);const disabled=i < 2 || (weekday === '木' && !(type === 'new' && d === 18));return <button key={d} disabled={disabled} className={`${d === selectedDay ? 'active' : ''} ${disabled?'unavailable-day':''}`} onClick={() => {
    if (suppressDateClick.current) return
    setDraft({...draft, date:`2026年${type === 'new' ? 2 : 6}月${d}日（${weekday}）`})
  }}><span>{weekday}</span><b>{d}</b></button>})}</div><p className="closed-note">※休診日：木曜日</p><SectionTitle>予約可能時間</SectionTitle><div className="time-grid">{times.map(t => { const raw=t.slice(0,5); const unavailable=t.includes('×'); return <button key={t} disabled={unavailable} className={draft.time === raw ? 'active' : unavailable ? 'unavailable' : ''} onClick={() => setDraft({...draft,time:raw})}>{t}</button> })}</div><p className="caption">○ 予約可能 / △ 残りわずか / × 空きなし（選択不可）</p></div><div className="fixed-action"><PrimaryButton onClick={next}>次へ進む</PrimaryButton></div></section>
}

function BookingReview({ draft, type, back, edit, confirm }: { draft: BookingDraft; type: PatientType; back: () => void; edit: () => void; confirm: () => void }) {
  return <section className={`screen booking-review-screen ${type==='new'?'new-review':'returning-review'}`}><StatusBar/><Header title="予約内容の確認" onBack={back}/><div className="booking-review"><div className="page-intro"><h2>{type === 'new' ? '初診' : '再診'}</h2><p>ご予約情報</p></div><Card><b className="booking-date">{draft.date} {draft.time}</b><hr/><p>受診CarePulse クリニック</p><p>お名前<br/>ZHOU XIAO 様</p><button className="inline-link" onClick={edit}>予約日時を変更する</button></Card><div className="notice-list"><p>ご来院の際は、健康保険証またはマイナンバーカードをご持参ください。</p><p>キャンセルの場合は、前日の診療時間内までにお手続きをお願いいたします。</p></div></div><div className="fixed-action"><PrimaryButton onClick={confirm}>予約を確定する</PrimaryButton></div></section>
}

function BookingSuccess({ appointment, rescheduled, chat, manual, home }: { appointment: Appointment; rescheduled: boolean; chat: () => void; manual: () => void; home: () => void }) {
  return <section className={`screen success-screen booking-success-screen ${rescheduled?'rescheduled-success':''}`}><StatusBar/><div className="booking-success"><SuccessIcon/><h2>{rescheduled ? 'ご予約の変更が完了しました' : 'ご予約が完了しました'}</h2><h1>{shortDate(appointment.date)} {appointment.time}<br/>ZHOU XIAO 様</h1><p className="caption">※当日の診察をよりスムーズにするため、事前に症状の伝達にご協力をお願いします。</p><div className="success-actions"><PrimaryButton tone="bright" onClick={chat}>AIチャットで伝える</PrimaryButton><p>質問に答えるだけで、簡単に症状を整理できます。</p><PrimaryButton onClick={manual}>自分でテキストを入力する</PrimaryButton><p>自由記入欄に、直接テキストで症状を入力します。</p><PrimaryButton tone="soft" onClick={home}>今は入力せずにホームへ</PrimaryButton></div></div></section>
}

function Symptom({ type, value, setValue, back, submit }: { type: PatientType; value: string; setValue: (v:string)=>void; back:()=>void; submit:()=>void }) {
  const [photos, setPhotos] = useState<string[]>([])
  const cameraInput = useRef<HTMLInputElement>(null)
  const additionalInput = useRef<HTMLInputElement>(null)
  const selectPhoto = (file: File | undefined, index: number) => {
    if (!file || !file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = () => setPhotos(current => {
      const next = [...current]
      next[index] = String(reader.result)
      return next
    })
    reader.readAsDataURL(file)
  }
  return <section className={`screen symptom-screen ${type==='new'?'new-symptom':'returning-symptom'}`}><StatusBar/><Header title="症状の入力" onBack={back}/><div className="symptom-form"><div className="page-intro"><h2>{type === 'new' ? '初診' : '再診'}</h2></div><label className="textarea-field"><b>具体的な症状 <em>任意</em></b><textarea value={value} onChange={e=>setValue(e.target.value)} placeholder="例：2日前から右下の奥歯が冷たいものにしみる、噛むと痛むなど、気になる症状を自由にご記入ください。"/></label><div className="textarea-field photo-field"><b>患部の写真を添付する <em>任意</em></b><button type="button" className={`upload-button ${photos[0] ? 'has-preview' : ''}`} onClick={() => cameraInput.current?.click()} aria-label="患部の写真を選択">{photos[0] ? <img className="upload-preview" src={photos[0]} alt="選択した患部の写真"/> : <span className="upload-icon"><img src="/assets/camera.svg" alt=""/></span>}</button><input ref={cameraInput} className="photo-input" type="file" accept="image/*" onChange={event => selectPhoto(event.target.files?.[0], 0)}/></div><button type="button" className={`upload-button additional-photo ${photos[1] ? 'has-preview' : ''}`} onClick={() => additionalInput.current?.click()} aria-label="別の患部の写真を追加">{photos[1] ? <img className="upload-preview" src={photos[1]} alt="追加した患部の写真"/> : <span className="upload-icon"><img src="/assets/plus.svg" alt=""/></span>}</button><input ref={additionalInput} className="photo-input" type="file" accept="image/*" onChange={event => selectPhoto(event.target.files?.[0], 1)}/><div className="notice-list"><p>入力内容はカルテ作成と事前の診療準備に使用します。</p></div></div><div className="fixed-action"><PrimaryButton onClick={submit}>症状の入力を完了する</PrimaryButton></div></section>
}

type ChatRole = 'user' | 'ai' | 'confirmed'

function Chat({ type, booked, back, confirmAiBooking }: { type: PatientType; booked: boolean; back: () => void; confirmAiBooking: () => void }) {
  const script = useMemo<[ChatRole, string][]>(() => type === 'new' ? [
    ['user','来週の木曜日か金曜日の午前中、空いている時間で初诊の予約を入れたいです。'],
    ['ai','かしこまりました。来週の午前中の空き状況を検索しました。以下の枠がご案内可能です。'],
    ['ai','2月18日（水） [ 09:30 ○ ]  [ 10:30 ○ ]\n2月20日（金） [ 10:00 ○ ]  [ 11:30 ○ ]'],
    ['user','鈴木医師の経歴も見せてくれますか？'],
    ['ai','当院の鈴木医師のプロフィールカードを呼び出しました。ご参考ください。'],
    ['ai','鈴木 健一 医師（院長）\n［審美歯科］［歯周病専門医］\n\n【経歴】\n2010年 東京中央歯科大学/歯学部/卒業\n2010年〜2018年/東京総合病院/勤務\n2018年 CarePulse クリニック/開院\n\n【資格】\n日本歯周病学会 専門医'],
    ['user','鈴木医師にお願いしたいです。さっきの2月18日（水）10:30で予約を入れてもらえますか？'],
    ['ai','かしこまりました。鈴木医師の担当枠で2月18日（水）10:30の初診予約を仮押さえしました。内容をご確認の上、「予約を確定する」ボタンを押してください。'],
    ['ai','【初診予約のご確認】\n\n日時：2026年2月18日（水） 10:30 〜\n医師：鈴木 健一 医師（院長）\n医院：CarePulse クリニック'],
  ] : [
    ['user','次回の予約を6月19日（金）の午後に変更したいです。'],
    ['ai','承知しました。6月19日（金）の午後の空き状況を確認します。希望の医師はありますか？'],
    ['user','前回と同じ鈴木医師でお願いしたいです。'],
    ['ai','鈴木医師は14:00と16:30に空きがあります。どちらをご希望ですか？'],
    ['user','16:30でお願いします。'],
    ['ai','かしこまりました。6月19日（金）16:30で変更内容を準備しました。予約内容をご確認ください。'],
  ], [type])
  const [messages, setMessages] = useState<[ChatRole,string][]>([])
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const [aiConfirmed, setAiConfirmed] = useState(false)
  const messagesRef = useRef<HTMLDivElement>(null)
  const responseTimer = useRef(0)
  const shouldAutoScroll = useRef(false)
  useEffect(() => {
    setMessages([])
    shouldAutoScroll.current = false
    window.requestAnimationFrame(() => messagesRef.current?.scrollTo({ top: 0 }))
    let nextIndex = 0
    let timer = 0
    const revealNext = () => {
      setMessages(script.slice(0, nextIndex + 1))
      nextIndex += 1
      if (nextIndex < script.length) timer = window.setTimeout(revealNext, 600)
    }
    timer = window.setTimeout(revealNext, 500)
    return () => { window.clearTimeout(timer); window.clearTimeout(responseTimer.current) }
  }, [script])
  useEffect(() => {
    if (!shouldAutoScroll.current) return
    messagesRef.current?.scrollTo({ top: messagesRef.current.scrollHeight, behavior: 'smooth' })
    shouldAutoScroll.current = false
  }, [messages.length, typing])
  const send = () => {
    if (!input.trim() || messages.length < script.length || typing) return
    const value = input.trim()
    shouldAutoScroll.current = true
    setMessages(current => [...current, ['user', value]])
    setInput('')
    setTyping(true)
    responseTimer.current = window.setTimeout(() => {
      shouldAutoScroll.current = true
      setMessages(current => [...current, ['ai', type === 'new'
        ? 'ご相談ありがとうございます。ご希望の内容を確認し、予約情報と照合しました。'
        : 'ご相談ありがとうございます。内容を確認し、次回の診察に向けて申し送りへ追加しました。']])
      setTyping(false)
    }, 650)
  }
  const confirm = () => {
    confirmAiBooking()
    setAiConfirmed(true)
    shouldAutoScroll.current = true
    setMessages(current => [...current, ['confirmed', '予約が確定しました。2月18日 (水) 10:30〜、鈴木健一医師。お待ちしております。']])
  }
  const complete = messages.length >= script.length
  return <section className={`screen chat-screen ${type==='new'?'new-chat':'returning-chat'}`}><StatusBar/><Header title="AI 助手" onBack={back}/><div className="chat-intro"><h2>ZHOU XIAO様、こんにちは。</h2><p>{type === 'new' ? '当院の予約や変更、医師のプロフィール紹介、過去の受診記録の確認など、何でもお気軽に申し付けください。' : '次回の予約確認や変更、医師についてお気軽にご相談ください。'}</p></div><div className="messages" ref={messagesRef}>{messages.map(([role,text],i)=><div key={i} className={`bubble ${role} chat-reveal`}>{text}</div>)}{typing && <div className="bubble ai typing-bubble"><i/><i/><i/></div>}{type === 'new' && !booked && !aiConfirmed && complete && <div className="chat-confirm-action chat-reveal"><PrimaryButton tone="bright" onClick={confirm}>予約を確定する</PrimaryButton></div>}</div><div className="chat-input"><input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&send()} placeholder="メッセージを入力..."/><button onClick={send} aria-label="送信"><img src="/assets/voice.svg" alt=""/></button></div></section>
}

function Records({ type, tab, go, appointment, selectedVisit, openVisit, reschedule }: { type: PatientType; tab: 'visits'|'bookings'; go:(s:Screen)=>void; appointment?:Appointment|null; selectedVisit:VisitRecord; openVisit:(visit:VisitRecord)=>void; reschedule?:()=>void }) {
  return <section className={`screen app-screen records-screen ${tab}-records`}><StatusBar/><Header title="ZHOU XIAO様の受診の記録" onBack={()=>go('home')}/><div className="segmented"><button className={tab==='visits'?'active':''} onClick={()=>go('records')}>通院履歴</button><button className={tab==='bookings'?'active':''} onClick={()=>go('bookings')}>予約履歴</button></div><div className="record-list">{tab==='visits' ? (type==='new' ? <Card><b>現在、履歴はありません。</b><p>初診完了後、受診記録がここに表示されます。</p></Card> : visits.map((visit,i)=><Card key={visit.date} className={`visit-record visit-record-${i+1} ${visit.date===selectedVisit.date?'selected':''}`} onClick={()=>openVisit(visit)}><div className="card-title"><h2>{visit.date}</h2><span>受診完了</span></div><p>内容：{visit.content}<br/>担当：{visit.doctor}<br/>お会計：{visit.payment}</p></Card>)) : <BookingHistory appointment={appointment} reschedule={reschedule} openVisit={openVisit}/>}</div><BottomNav active="records" go={go}/></section>
}

function BookingHistory({ appointment, reschedule, openVisit }: { appointment?: Appointment|null; reschedule?:()=>void; openVisit:(visit:VisitRecord)=>void }) {
  const rows = [
    appointment ? { date:appointment.date, status:'予約確定', kind:'confirmed', content:'歯科・再診（経過観察・詰め物の確認）', cardNumber:1, action:reschedule } : null,
    { date:'2026年6月17日（水）', status:'キャンセル', kind:'cancelled', content:'歯科・再診', reason:'理由：アプリからの変更による取り消し', cardNumber:2 },
    ...visits.map((visit,index) => ({ date:visit.date, status:'来院済み', kind:'visited', content:visit.content, cardNumber:index + 3, action:() => openVisit(visit) })),
  ].filter(Boolean) as Array<{date:string;status:string;kind:string;content:string;cardNumber:number;reason?:string;action?:()=>void}>
  return <>{rows.map(row=><Card key={`${row.kind}-${row.date}`} className={`booking-record booking-record-${row.cardNumber} ${row.kind === 'confirmed' && row.action ? 'reschedule-target' : ''}`} onClick={row.action}><div className="card-title"><h2>{row.date}</h2><span className={`status-badge ${row.kind}`}>{row.status}</span></div><p>内容：{row.content}<br/>担当：鈴木 医師{row.reason&&<><br/>{row.reason}</>}</p></Card>)}</>
}

function RecordDetail({ visit, appointment, back }: { visit:VisitRecord;appointment:Appointment|null;back:()=>void }) { return <section className="screen visit-detail-screen"><StatusBar/><Header title="ZHOU XIAO様の通院記録" onBack={back}/><div className="detail-list"><Detail title="今回の受診情報">{visit.date} / {visit.category} / CarePulse クリニック</Detail><Detail title="診察内容">{visit.detailContent || visit.content}</Detail><Detail title="医師からの説明">{visit.explanation || <>担当：{visit.doctor}<br/>お会計：{visit.payment}</>}</Detail><Detail title="次回までに注意すること">{visit.precautions || <>診療内容：{visit.content}</>}</Detail><Detail title="次回予約">{appointment ? `${appointment.date}${appointment.time}` : '現在、次回のご予約はありません。'}</Detail></div></section> }

function Detail({title,children}:{title:string;children:ReactNode}) { return <div><h3>{title}</h3><Card><p>{children}</p></Card></div> }

function Medication({ taken, toggle, explain, go }: { taken:DoseStates;toggle:(index:number)=>void;explain:()=>void;go:(s:Screen)=>void }) { return <section className="screen app-screen medication-screen"><StatusBar/><Header title="今日のお薬" onBack={()=>go('home')}/><div className="medication-body"><div className="med-info"><SectionTitle>薬の情報</SectionTitle><Card><p>処方：痛み止め<br/>1日3回・毎食後・3日分<br/>服薬期間：5月12日〜5月14日</p></Card></div>{['朝（朝食後）','昼（昼食後）','夕（夕食後）'].map((label,i)=><div className="med-row" key={label}><h3>{label}</h3><div><Card>ロキソニン錠 60mg（1回1錠）</Card><button className={taken[i]?'taken':'take'} onClick={()=>toggle(i)}>{taken[i]?'服用済み':'服用する'}</button></div></div>)}</div><div className="medication-cta"><PrimaryButton onClick={explain}>薬の説明をやさしくする</PrimaryButton></div><p className="translation-note">Translation &amp; Easy Explanations Available / 支持多语言翻译</p><BottomNav active="medication" go={go}/></section> }

function MedicationAi({selectedLanguage,openLanguages,back,home}:{selectedLanguage:SelectedLanguage;openLanguages:()=>void;back:()=>void;home:()=>void}) { const easy='朝・昼・夜の ごはんのあとに のみます（3日間）。\nねむくなることがあるので、くるまのうんてんは しないでください。'; const languageLabel=languageOptions.find(option=>option.code===selectedLanguage)?.label || 'English'; return <section className="screen medication-ai-screen"><StatusBar/><Header title="薬の説明をやさしくする" onBack={back}/><div className="med-ai-content"><Detail title="薬の情報">処方：痛み止め<br/>1日3回・毎食後・3日分<br/>服薬期間：5月12日〜5月14日</Detail><Detail title="AI 結果">{easy}</Detail><div className="language-result"><button className="language-button" onClick={openLanguages}><span><img src="/assets/globe.svg"/>{languageLabel}</span><i><img src="/assets/chevron-down.svg"/></i></button><Card><p>{medicationTranslations[selectedLanguage]}</p></Card></div></div><div className="fixed-action"><PrimaryButton onClick={home}>ホームへ</PrimaryButton></div><p className="translation-note">薬の変更や中止は、医師・薬剤師に確認してください</p></section> }

const familyVisits=[['2026年5月28日（木）','抜歯手術・止血確認（左下奥歯の抜歯、歯肉縫合および消炎処置）','佐藤 医師','¥2,980（保険3割）'],['2026年4月22日（水）','歯周病治療・精密検査（重度歯周炎のレーザー治療、歯石徹底除去）','佐藤 医師','¥1,850（保険3割）'],['2026年3月17日（火）','初診・歯口清掃（歯ぐきの腫れによる急性消炎処置）','高橋 医師','¥3,610（保険3割）']]
function Family({removed,back,go,openActions}:{removed:boolean;back:()=>void;go:(s:Screen)=>void;openActions:()=>void}) { return <section className="screen app-screen family-screen"><StatusBar/><Header title="家族管理" onBack={back} right={!removed&&<button className="icon-button" onClick={openActions}><span className="more-icon"><img src="/assets/more.svg"/></span></button>}/><div className="family-profile">{removed?<div className="empty-avatar">＋</div>:<button onClick={()=>go('caregiver')}><img src={assets.family}/><i>!</i></button>}</div><div className="record-list"><SectionTitle>通院履歴</SectionTitle>{removed?<Card><b>家族メンバーが登録されていません</b><p>家族を追加すると、受診記録や服薬状況を共有できます。</p></Card>:familyVisits.map((v,i)=><Card key={v[0]} className={`family-record family-record-${i+1} ${i===0?'danger-selected':''}`} onClick={()=>i===0&&go('caregiver')}><div className="card-title"><h2>{v[0]}</h2><span>受診完了</span></div><p>内容：{v[1]}<br/>担当：{v[2]}<br/>お会計：{v[3]}</p></Card>)}</div><BottomNav active="family" go={go}/></section> }

function Caregiver({back,remind}:{back:()=>void;remind:()=>void}) { return <section className="screen caregiver-screen"><StatusBar/><Header title="お母さんの受診の記録" onBack={back}/><div className="caregiver-body"><h1>2026年5月28日（木）受診分</h1><Detail title="診察結果">左下奥歯の抜歯手術が無事に終了しました。傷口の炎症や二次感染を効果的に抑え、術後の痛みを和らげるため、処方された抗生物質と痛み止めは、毎食後にセットで必ず指示通り（2日間）正しく服用させてください。<br/><br/>次回（6/29）は傷口の回復状態をチェックし、新しい入れ歯の型取りを開始します。</Detail><Detail title="処方薬の詳細">お薬名：アモキシシリンカプセル 250mg（抗生物質）<br/>処方量：1回1カプセル ／ 1日3回（毎食後）<br/>期間：5月28日〜5月30日（3日分）<br/><br/>お薬名：カロナール錠 300mg（解熱鎮痛薬・痛み止め）</Detail><Detail title="今日のお薬">朝（朝食後）服用済み<br/>昼（昼食後）服用済み<br/>夕（夕食後）⭕ 未服用</Detail><Detail title="次回の通院">日時：2026年6月29日（月）10:30〜<br/>内容：歯科・義歯作成<br/>医院：CarePulse クリニック</Detail></div><div className="fixed-action"><PrimaryButton onClick={remind}>服薬リマインドを送る</PrimaryButton></div></section> }

function SimpleSuccess({text,next,variant}:{text:string;next:()=>void;variant?:'reminder'}) { return <section className={`screen success-screen simple-success-screen ${variant === 'reminder' ? 'reminder-success-screen' : ''}`}><StatusBar/><div className="success-center"><SuccessIcon large/><h2>{text}</h2></div><div className="fixed-action"><PrimaryButton onClick={next}>ホームへ</PrimaryButton></div><div className="home-indicator"/></section> }

function CarePulseOverlay({ kind, close }: { kind: Exclude<CareOverlay, null>; close: () => void }) {
  const scanner = kind === 'checkin-start' || kind === 'checkin-end'
  return <div className="care-overlay-backdrop" onMouseDown={close}>
    <section className={`care-overlay-sheet ${scanner ? 'scanner-sheet' : kind === 'checkin-success' ? 'checkin-success-sheet' : 'patient-qr-sheet'}`} onMouseDown={event => event.stopPropagation()}>
      <header className="care-overlay-header"><h2>{kind === 'patient-qr' ? '受付用QRコード' : 'チェックイン'}</h2><button type="button" onClick={close}>閉じる</button></header>
      {scanner && <>
        <h3>受付QRコードを読み取ってください</h3>
        <p>枠内にQRコードを合わせてください</p>
        <div className="scanner-frame" aria-label="QRコード読み取り枠">
          <i className="scan-corner top-left"/><i className="scan-corner top-right"/><i className="scan-corner bottom-left"/><i className="scan-corner bottom-right"/>
          <span className={`scan-line ${kind === 'checkin-end' ? 'at-end' : 'moving'}`}/>
        </div>
        <strong className="scan-status">スキャン中…</strong>
      </>}
      {kind === 'checkin-success' && <div className="checkin-success-content">
        <SuccessIcon/>
        <h3>チェックインが完了しました</h3>
        <p>受付が完了しました。診察券をお持ちください。</p>
        <PrimaryButton onClick={close}>閉じる</PrimaryButton>
      </div>}
      {kind === 'patient-qr' && <div className="patient-qr-content">
        <h3>受付端末にかざしてください</h3>
        <div className="patient-qr-frame" aria-label="受付用QRコード"><div className="patient-qr-code">{patientQrCells.map(([x,y], index) => <i key={index} style={{ left: x, top: y }}/>)}</div></div>
        <strong>診察券番号 15538</strong>
        <p>画面の明るさを上げて、受付端末に提示してください。</p>
        <PrimaryButton onClick={close}>閉じる</PrimaryButton>
      </div>}
    </section>
  </div>
}

function Modal({children,onClose,className=''}:{children:ReactNode;onClose:()=>void;className?:string}) { return <div className="modal-backdrop" onMouseDown={onClose}><div className={`modal-sheet ${className}`} onMouseDown={e=>e.stopPropagation()}>{children}</div></div> }
const WHEEL_ITEM_STEP = 44

function WheelColumn({ label, values, selected, onChange }: { label: string; values: string[]; selected: string; onChange: (value: string) => void }) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const drag = useRef({ active: false, startY: 0, startScroll: 0 })
  const valuesKey = values.join('|')

  useEffect(() => {
    const index = Math.max(0, values.indexOf(selected))
    window.requestAnimationFrame(() => scrollRef.current?.scrollTo({ top: index * WHEEL_ITEM_STEP }))
  }, [valuesKey])

  const updateCenteredValue = () => {
    const wheel = scrollRef.current
    if (!wheel) return
    const index = Math.max(0, Math.min(values.length - 1, Math.round(wheel.scrollTop / WHEEL_ITEM_STEP)))
    if (values[index] !== selected) onChange(values[index])
  }
  const finishDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!drag.current.active) return
    drag.current.active = false
    updateCenteredValue()
    const wheel = scrollRef.current
    if (wheel) wheel.scrollTo({ top: Math.round(wheel.scrollTop / WHEEL_ITEM_STEP) * WHEEL_ITEM_STEP, behavior: 'smooth' })
    try { event.currentTarget.releasePointerCapture(event.pointerId) } catch { /* capture may already be released */ }
  }

  return <div className="wheel-group"><span className="wheel-label">{label}</span><div ref={scrollRef} className="wheel-scroll" role="listbox" aria-label={label} onScroll={updateCenteredValue} onPointerDown={event => {
    if (event.pointerType === 'touch') return
    drag.current = { active: true, startY: event.clientY, startScroll: event.currentTarget.scrollTop }
    event.currentTarget.setPointerCapture(event.pointerId)
  }} onPointerMove={event => {
    if (!drag.current.active) return
    event.preventDefault()
    event.currentTarget.scrollTop = drag.current.startScroll + drag.current.startY - event.clientY
  }} onPointerUp={finishDrag} onPointerCancel={finishDrag}>{values.map((item, index) => <button type="button" role="option" aria-selected={item === selected} key={item} className={item === selected ? 'selected' : ''} onClick={() => scrollRef.current?.scrollTo({ top: index * WHEEL_ITEM_STEP, behavior: 'smooth' })}>{item}</button>)}</div></div>
}

function DatePicker({value,cancel,done}:{value:string;cancel:()=>void;done:(v:string)=>void}) {
  const parts=value.match(/\d+/g)||['1989','05','20']
  const [y,setY]=useState(parts[0]),[m,setM]=useState(parts[1]),[d,setD]=useState(parts[2])
  const years=useMemo(()=>Array.from({length:201},(_,index)=>String(1900+index)),[])
  const months=useMemo(()=>Array.from({length:12},(_,index)=>String(index+1).padStart(2,'0')),[])
  const days=useMemo(()=>Array.from({length:new Date(Number(y),Number(m),0).getDate()},(_,index)=>String(index+1).padStart(2,'0')),[y,m])
  const clampDay=(year:string,month:string)=>String(Math.min(Number(d),new Date(Number(year),Number(month),0).getDate())).padStart(2,'0')
  return <Modal onClose={cancel} className="date-picker"><div className="modal-head"><button onClick={cancel}>キャンセル</button><button className="done" onClick={()=>done(`${y}年 ${m}月 ${d}日`)}>完了</button></div><div className="wheel-columns"><WheelColumn label="年" values={years} selected={y} onChange={value=>{setY(value);setD(clampDay(value,m))}}/><WheelColumn label="月" values={months} selected={m} onChange={value=>{setM(value);setD(clampDay(y,value))}}/><WheelColumn label="日" values={days} selected={d} onChange={setD}/></div></Modal>
}
function LanguageModal({value,choose,cancel}:{value:SelectedLanguage;choose:(v:SelectedLanguage)=>void;cancel:()=>void}) { return <Modal onClose={cancel} className="language-modal"><div className="language-head">言語 / Language</div><div className="option-list">{languageOptions.map(option=><button className={option.code===value?'selected':''} onClick={()=>choose(option.code)} key={option.code}><span>{option.label}</span>{option.code===value&&<img src="/assets/check.svg"/>}</button>)}</div></Modal> }
function ActionSheet({cancel,remove}:{cancel:()=>void;remove:()=>void}) { return <Modal onClose={cancel} className="family-actions"><div className="modal-head"><button onClick={cancel}>キャンセル</button><span/></div><button className="delete-option" onClick={remove}><span>家族から削除</span><img src="/assets/delete.svg"/></button></Modal> }

export default App
