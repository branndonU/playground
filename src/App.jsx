import React, { useState, useEffect } from 'react'
import './App.css'
import SankeyChart from './SankeyChart'
import DynamicDropdown from './DynamicDropdown'

export default function App() {
  const [csvPath, setCsvPath] = useState('')
  const [readyToGenerate, setReadyToGenerate] = useState(false)
  const [stages, setStages] = useState(null)
  const [selectedAR, setSelectedAR] = useState('')
  // always ask on refresh: do not persist consent
  const [consentGiven, setConsentGiven] = useState(false)

  function handleGenerate() {
    // switch the chart to use the 25-row Sankey input file
    setCsvPath('/Data/Sankey_Input__25_rows_.csv')
    setReadyToGenerate(true)
    setStages(['AR','Cook','Ban','Senses','Satisfaction','Source'])
  }

  return (
    <div className="app">
      <div className="classification-banner" role="banner">TOP SECRET!</div>
      <h1>Playground</h1>
  <div className="main-grid three-col">
        <aside className="about-card">
          <h3>About this site</h3>
          <p>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Quisque sit amet accumsan tortor.
            Praesent volutpat, nibh id pretium vestibulum, nunc urna tristique eros, vitae
            vulputate sapien lectus a nunc. Pellentesque habitant morbi tristique senectus et netus et
            malesuada fames ac turpis egestas.
          </p>
          <p>
            Gibberish placeholder: fj3n4v9-zzxq lorem-flip 12345 — edit this later.
          </p>
        </aside>

        <main className="center-area">
          <section>
            <h2>Sankey diagram</h2>
            {readyToGenerate ? (
              <SankeyChart csvPath={csvPath} width={800} height={700} stages={stages} filter={{ key: 'AR', value: selectedAR }} />
            ) : (
              <div style={{ color: '#64748b', fontStyle: 'italic' }}>Select an AR and click Generate to render the Sankey.</div>
            )}
          </section>
        </main>

        <aside className="select-card">
          <h4>Filter & generate</h4>
          <div style={{ marginTop: 8 }}>
            <DynamicDropdown csvPath={'/Data/Sankey_Input__25_rows_.csv'} keyName={'AR'} onChange={v => setSelectedAR(v)} />
          </div>
          <div style={{ marginTop: 12 }}>
            <button onClick={handleGenerate} disabled={!selectedAR} style={{ width: '100%', background: selectedAR ? '#16a34a' : '#ef4444', color: 'white', padding: '8px 12px', border: 'none', borderRadius: 6 }}>
              Generate
            </button>
          </div>
          {readyToGenerate && <div style={{ marginTop: 8, fontSize: 13, color: '#0f172a' }}>Using Sankey_Input__25_rows_.csv (AR: {selectedAR})</div>}
        </aside>
      </div>

      {/* Consent overlay: block access until user agrees */}
      {!consentGiven && (
        <div className="consent-overlay" role="dialog" aria-modal="true" aria-label="Consent dialog">
          <div className="consent-card">
            <h3>Before you continue</h3>
            <p>
              Gibberish placeholder copy for consent: zyxq-77 foo-bar lorem ipsum dolor sit amet, consectetur
              adipiscing elit. This is a placeholder — replace with your real consent text later.
            </p>
            <p>
              More placeholder gibberish: 1234-zzqx, consent-required, site usage agreement. Click Agree to proceed.
            </p>
            <div className="consent-actions">
              <button className="agree" onClick={() => setConsentGiven(true)}>Agree</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
