import React, { useState } from 'react'
import './App.css'

export default function App() {
  const [count, setCount] = useState(0)
  return (
    <div className="app">
      <h1>Playground React</h1>
      <p>Vite + React template</p>
      <div className="card">
        <button onClick={() => setCount(c => c + 1)}>count is {count}</button>
      </div>
    </div>
  )
}
