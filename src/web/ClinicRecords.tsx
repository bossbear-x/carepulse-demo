import './clinic-records.css'

// Content coordinates are relative to the existing 1120px Web content area.
export function HealthRecords() {
  return <div className="clinic-records clinic-health" data-figma-node="202:7689">
    <div className="web-page-heading"><h2>健康アーカイブ</h2><p>患者ごとの健康推移・生活習慣・リスクを一元管理</p></div>
    <div className="clinic-search"><span>患者名・診察券番号で検索</span><span>担当医：すべて　　期間：直近12か月</span></div>
    <section className="web-panel clinic-health-patient"><h3>佐藤 花子</h3><p className="clinic-patient-id">診察券 #CP-10482　68歳</p><p className="clinic-patient-risk">高血圧　｜　アレルギー：なし</p>
      <dl>{[['血圧', '132 / 82 mmHg'], ['HbA1c', '6.4 %'], ['体重', '56.8 kg'], ['服薬遵守率', '92 %']].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
    </section>
    <section className="web-panel clinic-health-risk"><h3>注意が必要な変化</h3><p>直近3か月で HbA1c が0.5ポイント上昇しています。次回受診時に生活習慣と服薬状況を確認してください。</p><div className="clinic-task-button">確認タスクを作成</div></section>
    <section className="web-panel clinic-health-trends"><h3>主要指標の推移</h3><img src="/web-record-assets/imgChartHbA1CTrend.svg" width="680" height="130" alt="HbA1c の推移" /><div className="clinic-trend-months">{['1月', '3月', '5月', '7月'].map((month, index) => <span key={month} style={{ left: [72, 240, 412, 580][index] }}>{month}</span>)}</div></section>
    <section className="web-panel clinic-health-timeline"><h3>健康記録タイムライン</h3><p>07/10　血液検査結果を登録</p><p>06/18　服薬内容を更新</p><p>05/02　定期健診を実施</p></section>
  </div>
}

const medicalRows = [
  ['07/14', '佐藤 花子', '定期健診・血液検査', '鈴木 医師', '確定'],
  ['07/13', '田中 美咲', '根管治療', '木村 医師', '要承認'],
  ['07/11', '山本 健', '再診・処方更新', '鈴木 医師', '確定'],
  ['07/09', '高橋 葵', '初診・問診', '中村 医師', '下書き'],
  ['07/08', '伊藤 翔', '画像診断', '木村 医師', '確定'],
  ['07/04', '渡辺 蓮', '定期健診', '中村 医師', '確定'],
]

export function MedicalHistory() {
  return <div className="clinic-records clinic-medical" data-figma-node="202:7774">
    <div className="web-page-heading"><h2>カルテ履歴管理</h2><p>診療記録の検索、確認、承認、監査ログを管理</p></div>
    <div className="clinic-search"><span>患者名・診察券番号・病名で検索</span><span>診療科：すべて　担当医：すべて　期間：過去1年</span></div>
    <section className="web-panel clinic-medical-table" aria-label="カルテ履歴"><div role="table"><div className="clinic-medical-columns" role="row">{['受診日', '患者', '診療内容', '担当医', '状態'].map(label => <span role="columnheader" key={label}>{label}</span>)}</div>
      {medicalRows.map((row, index) => <div className={`clinic-medical-row${index === 1 ? ' clinic-medical-selected' : ''}`} role="row" key={row[0]} style={{ top: [56, 136, 220, 300, 384, 464][index] }}>{row.map((cell, cellIndex) => <span role="cell" key={cellIndex}>{cell}</span>)}</div>)}
    </div></section>
    <section className="web-panel clinic-medical-detail"><h3>カルテ詳細</h3><div className="clinic-medical-person"><b>田中 美咲　#CP-10831</b><p>2026/07/13　歯科保存科</p><p>主訴：右下奥歯の自発痛</p></div><div className="clinic-medical-treatment"><b>診断：慢性根尖性歯周炎</b><p>処置：根管拡大・洗浄</p><p>処方：鎮痛薬 3日分</p><p>次回：根管充填予定</p></div><div className="web-primary clinic-approve">内容を確認して承認</div><p className="clinic-updated">最終更新：木村医師 07/13 18:42</p></section>
  </div>
}

export function ClinicalInformation() {
  return <div className="clinic-records clinic-information" data-figma-node="202:7859">
    <div className="web-page-heading"><h2>診療情報管理</h2><p>患者の診療情報を確認し、記録を安全に更新します</p></div>
    <section className="web-panel clinic-information-patient"><h3>佐藤 花子</h3><p>68歳　診察券 #CP-10482　担当：鈴木医師</p><b>高血圧　｜　ペニシリン注意</b></section>
    <div className="clinic-information-tabs">診療サマリー　　処方・服薬　　検査結果　　添付資料</div>
    <section className="web-panel clinic-information-summary"><h3>今回の診療サマリー</h3><dl>{[['主訴', '右上臼歯部の咬合痛'], ['所見', '打診痛あり、動揺なし'], ['診断', '歯髄炎の疑い'], ['処置', '咬合調整、経過観察'], ['次回計画', '2週間後に再評価']].map(([label, value], index) => <div key={label}><dt style={{ top: 60 + index * 84 }}>{label}</dt><dd style={{ top: 60 + index * 84 }}>{value}</dd></div>)}</dl></section>
    <section className="web-panel clinic-information-actions"><h3>記録と連携</h3><div className="clinic-action-list">{[['Prescription', '処方：ロキソプロフェン 3日分'], ['Image', '検査：パノラマ画像 1件'], ['Signature', '同意書：署名済み'], ['Share', '共有：家族アプリへ送信済み']].map(([icon, label]) => <div className="clinic-action" key={icon}><img className="clinic-action-background" src="/web-record-assets/imgIconBackground.svg" width="32" height="32" alt="" /><img className="clinic-action-icon" src={`/web-record-assets/imgVectorIconClinical${icon}.svg`} width="20" height="20" alt="" /><span>{label}</span><img className="clinic-action-chevron" src="/web-record-assets/imgVectorIconClinicalChevron.svg" width="16" height="16" alt="" /></div>)}</div><div className="web-primary clinic-save">変更内容を保存</div><p>保存時に監査ログが自動作成されます</p></section>
  </div>
}
