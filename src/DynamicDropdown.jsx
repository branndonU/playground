import React, { useEffect, useState } from 'react'
import * as d3 from 'd3'

// DynamicDropdown: loads a CSV and extracts unique values for a given key (default 'AR')
// Props:
// - csvPath: path to CSV
// - keyName: header to extract unique values from (default 'AR')
// - onChange: function(selected) called when user selects a value
// - placeholder: optional placeholder text
export default function DynamicDropdown({ csvPath = '/Data/Sankey_Input__25_rows_.csv', keyName = 'AR', onChange = () => {}, placeholder = 'Yay' }) {
  const [options, setOptions] = useState([])
  const [selected, setSelected] = useState('')

  useEffect(() => {
    let cancelled = false
    d3.csv(csvPath).then(data => {
      if (cancelled) return
      const vals = Array.from(new Set(data.map(d => (d[keyName] == null ? '' : String(d[keyName]).trim()))))
        .filter(v => v !== '')
      setOptions(vals)
    }).catch(err => {
      console.error('DynamicDropdown: failed to load CSV', err)
      setOptions([])
    })
    return () => { cancelled = true }
  }, [csvPath, keyName])

  function handleChange(e) {
    setSelected(e.target.value)
    onChange(e.target.value)
  }

  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <select value={selected} onChange={handleChange} style={{ padding: '6px 8px' }}>
        <option value="">{placeholder}</option>
        {options.map(opt => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </div>
  )
}
