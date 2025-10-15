import React, { useState } from 'react'
import './App.css'
import SankeyChart from './SankeyChart'

export default function App() {
  const [count, setCount] = useState(0)
  return (
    <div className="app">
      <h1>Playground React</h1>
      <p>Vite + React template — Sankey demo below</p>
      <div className="card">
        <button onClick={() => setCount(c => c + 1)}>count is {count}</button>
      </div>

      <section style={{ marginTop: '2rem' }}>
        <h2>Sankey diagram (first year)</h2>
        <SankeyChart csvPath={'/Data/sankey_first_year.csv'} width={1000} height={700} />
      </section>
    </div>
  )
}
