import React, { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'
import { sankey, sankeyLinkHorizontal } from 'd3-sankey'

// Simple CSV parser to produce nodes and links for sankey
function buildSankeyData(rows, stages) {
  // rows: array of raw CSV row objects
  // stages: optional array of column names representing multi-stage flow
  if (stages && Array.isArray(stages) && stages.length > 1) {
    // build nodes keyed by "Stage:Value" to keep identical values in different stages separate
    const nodeMap = new Map()
    const linkCount = new Map()

    rows.forEach(r => {
      for (let i = 0; i < stages.length - 1; i++) {
        const a = stages[i]
        const b = stages[i + 1]
        const aval = r[a] == null ? '' : String(r[a]).trim()
        const bval = r[b] == null ? '' : String(r[b]).trim()
        const src = aval === '' ? 'Unknown' : aval
        const tgt = bval === '' ? 'Unknown' : bval
        const srcId = `${a}:${src}`
        const tgtId = `${b}:${tgt}`

        if (!nodeMap.has(srcId)) nodeMap.set(srcId, { id: srcId, label: src, stage: a })
        if (!nodeMap.has(tgtId)) nodeMap.set(tgtId, { id: tgtId, label: tgt, stage: b })

        const key = `${srcId}||${tgtId}`
        linkCount.set(key, (linkCount.get(key) || 0) + 1)
      }
    })

    const nodes = Array.from(nodeMap.values()).map(n => ({ name: n.id, label: n.label, stage: n.stage }))
    const links = Array.from(linkCount.entries()).map(([k, v]) => {
      const [s, t] = k.split('||')
      return { source: s, target: t, value: v }
    })
    return { nodes, links }
  }

  // fallback: two-column CSV mapping (source/target/value)
  const nodeMap = new Map()
  const links = []

  rows.forEach(r => {
    const source = r.Crime_type == null ? '' : String(r.Crime_type).trim()
    const target = r.outcome_summary == null ? '' : String(r.outcome_summary).trim()
    const value = Number(r.index) || 0
    if (!nodeMap.has(source)) nodeMap.set(source, { name: source })
    if (!nodeMap.has(target)) nodeMap.set(target, { name: target })
    links.push({ source, target, value })
  })

  const nodesArr = Array.from(nodeMap.values())
  // map names to indices
  const nameToIndex = new Map(nodesArr.map((n, i) => [n.name, i]))
  // ensure an 'Unknown' node exists for remapping missing names
  if (!nameToIndex.has('Unknown')) {
    const unknownIndex = nodesArr.length
    nodesArr.push({ name: 'Unknown' })
    nameToIndex.set('Unknown', unknownIndex)
  }
  // produce links using names so they match sankey.nodeId(d => d.name)
  const sankeyLinks = links.map(l => ({ source: l.source, target: l.target, value: l.value, __raw: l }))
  // remap any missing source/target names to 'Unknown' and keep positive-value links
  const cleaned = sankeyLinks
    .map(l => {
      const src = nameToIndex.has(l.source) ? l.source : 'Unknown'
      const tgt = nameToIndex.has(l.target) ? l.target : 'Unknown'
      return { source: src, target: tgt, value: l.value, __raw: l.__raw }
    })
    .filter(l => l.value > 0)
  const dropped = sankeyLinks.length - cleaned.length
  if (dropped > 0) {
    console.warn(`buildSankeyData: remapped ${dropped} links to 'Unknown' or dropped due to non-positive value`)
    const sample = sankeyLinks.filter(l => l.value <= 0 || !nameToIndex.has(l.source) || !nameToIndex.has(l.target)).slice(0,5).map(d => d.__raw)
    console.warn('Sample problematic rows (up to 5):', sample)
  }
  const cleanLinks = cleaned.map(({ source, target, value }) => ({ source, target, value }))
  return { nodes: nodesArr.map(n => ({ name: n.name })), links: cleanLinks }
}

export default function SankeyChart({ csvPath = '/Data/sankey_first_year.csv', width = 1000, height = 600, sourceKey = 'Crime_type', targetKey = 'outcome_summary', valueKey = 'index', delimiter = ',', stages = null, filter = null }) {
  const ref = useRef(null)
  const [error, setError] = useState(null)
  const [legendItems, setLegendItems] = useState([])

  useEffect(() => {
    let cancelled = false
    // try loading CSV; if fetch fails, this will go to catch and set a helpful error
    d3.csv(csvPath).then(data => {
      if (cancelled) return
      // map incoming CSV rows. If stages is provided we need raw rows keyed by header names
      let raw
      if (stages && Array.isArray(stages) && stages.length > 1) {
        raw = data.map(d => Object.assign({}, d))
      } else {
        raw = data.map(d => ({ Crime_type: d[sourceKey], outcome_summary: d[targetKey], index: +d[valueKey] }))
      }

      // apply optional filter (e.g. { key: 'AR', value: 'T828' }) to restrict rows
      if (filter && filter.key && (filter.value || filter.value === 0)) {
        const fk = String(filter.key)
        const fv = String(filter.value)
        const beforeCount = raw.length
        raw = raw.filter(r => {
          try {
            return String(r[fk] == null ? '' : r[fk]).trim() === fv.trim()
          } catch (err) {
            return false
          }
        })
        console.debug(`SankeyChart: filtered rows by ${fk}=${fv}: ${beforeCount} -> ${raw.length}`)
      }
      // defensive: ensure we actually have rows
      if (!raw || raw.length === 0) {
        throw new Error(`CSV loaded but contains no rows (path: ${csvPath})`)
      }
  const graph = buildSankeyData(raw, stages)
      // debug: log small sample to help diagnose missing node issues
      console.debug('Sankey graph nodes:', graph.nodes.length)
      console.debug('Sankey graph links:', graph.links.length)
      if (graph.links.length > 0) {
        console.debug('sample link[0]:', graph.links[0])
      }
      if (!graph.links || graph.links.length === 0) {
        throw new Error('No valid links produced from CSV — check headers and numeric values')
      }
      const svg = d3.select(ref.current)
      svg.selectAll('*').remove()

      // ensure parent container can position an absolute tooltip
      const container = d3.select(ref.current.parentNode)
      container.style('position', container.style('position') || 'relative')

      // remove any existing tooltip then create one
      container.selectAll('.sankey-tooltip').remove()
      const tooltip = container.append('div')
        .attr('class', 'sankey-tooltip')
        .style('position', 'absolute')
        .style('pointer-events', 'none')
        .style('background', 'rgba(0,0,0,0.8)')
        .style('color', 'white')
        .style('padding', '6px 8px')
        .style('border-radius', '4px')
        .style('font-size', '12px')
        .style('display', 'none')
        .style('z-index', 1000)

      const { nodes, links } = sankey()
        .nodeId(d => (d && d.name != null ? String(d.name) : String(d)))
        .nodeWidth(20)
        .nodePadding(8)
        .extent([[1, 1], [width - 1, height - 6]])({ nodes: graph.nodes.map(d => Object.assign({}, d)), links: graph.links.map(d => Object.assign({}, d)) })

      const color = d3.scaleOrdinal(d3.schemeTableau10)

      // build legend items. If stages are provided, show stage swatches; otherwise derive from left-side nodes
      if (stages && Array.isArray(stages) && stages.length > 0) {
        setLegendItems(stages.map(s => ({ name: s, color: color(s) })))
      } else {
        const sources = nodes.filter(n => n.x0 < width / 2).map(n => n.name)
        const uniqueSources = Array.from(new Set(sources))
        setLegendItems(uniqueSources.map(name => ({ name, color: color(name) })))
      }

      // compute total for percent calculations
      const totalValue = d3.sum(graph.links, l => l.value)

      // links
      const linkPaths = svg.append('g')
        .attr('fill', 'none')
        .attr('stroke-opacity', 0.5)
        .selectAll('path')
        .data(links)
        .join('path')
        .attr('d', sankeyLinkHorizontal())
        .attr('stroke', d => {
          const srcName = d && d.source && d.source.name ? d.source.name : ''
          const stage = srcName.indexOf(':') > -1 ? srcName.split(':')[0] : srcName
          return color(stage)
        })
        .attr('stroke-width', d => Math.max(1, d.width))
        .on('mousemove', (event, d) => {
          const pct = totalValue ? ((d.value / totalValue) * 100).toFixed(2) : '0'
          const getLabel = node => (node && node.label) ? node.label : (node && node.name && node.name.indexOf(':') > -1 ? node.name.split(':').slice(1).join(':') : (node && node.name))
          const sLabel = getLabel(d.source)
          const tLabel = getLabel(d.target)
          tooltip.style('display', 'block')
            .html(`<strong>${sLabel} → ${tLabel}</strong><div>Value: ${d.value}</div><div>${pct}% of total</div>`)
            .style('left', (event.offsetX + 12) + 'px')
            .style('top', (event.offsetY + 12) + 'px')
        })
        .on('mouseleave', () => tooltip.style('display', 'none'))

      // nodes
      const node = svg.append('g')
        .selectAll('g')
        .data(nodes)
        .join('g')
        .attr('transform', d => `translate(${d.x0},${d.y0})`)
        .on('mousemove', (event, d) => {
          // compute sum of incoming+outgoing for this node
          const incoming = d.targetLinks ? d3.sum(d.targetLinks, l => l.value) : 0
          const outgoing = d.sourceLinks ? d3.sum(d.sourceLinks, l => l.value) : 0
          const nodeTotal = incoming + outgoing
          const pct = totalValue ? ((nodeTotal / totalValue) * 100).toFixed(2) : '0'
          const getLabel = node => (node && node.label) ? node.label : (node && node.name && node.name.indexOf(':') > -1 ? node.name.split(':').slice(1).join(':') : (node && node.name))
          tooltip.style('display', 'block')
            .html(`<strong>${getLabel(d)}</strong><div>Total: ${nodeTotal}</div><div>${pct}% of total</div>`)
            .style('left', (event.offsetX + 12) + 'px')
            .style('top', (event.offsetY + 12) + 'px')
        })
        .on('mouseleave', () => tooltip.style('display', 'none'))

      node.append('rect')
        .attr('height', d => Math.max(1, d.y1 - d.y0))
        .attr('width', d => Math.max(1, d.x1 - d.x0))
        .attr('fill', d => {
          const nm = d && d.name ? d.name : ''
          const stage = nm.indexOf(':') > -1 ? nm.split(':')[0] : nm
          return color(stage)
        })
        .attr('stroke', '#000')

      node.append('text')
        .attr('x', d => d.x0 < width / 2 ? (d.x1 - d.x0) + 6 : -6)
        .attr('y', d => (d.y1 - d.y0) / 2)
        .attr('dy', '0.35em')
        .attr('text-anchor', d => d.x0 < width / 2 ? 'start' : 'end')
        .text(d => (d.label ? d.label : (d.name && d.name.indexOf(':') > -1 ? d.name.split(':').slice(1).join(':') : d.name)))
        .style('font-size', '11px')

    }).catch(err => {
      console.error('Error loading sankey CSV or building graph:', err)
      setError(err && err.message ? err.message : String(err))
    })

    return () => { cancelled = true }
  }, [csvPath, width, height, stages, sourceKey, targetKey, valueKey])

  if (error) return <div>Error loading Sankey CSV: {error}</div>

  return (
    <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
      <div style={{ overflow: 'auto' }}>
        <svg ref={ref} width={width} height={height} />
      </div>
      {legendItems && legendItems.length > 0 && (
        <div className="sankey-legend" style={{ maxWidth: 220 }}>
          <h4 style={{ margin: '0 0 8px 0' }}>Legend</h4>
          {legendItems.map(item => (
            <div key={item.name} className="sankey-legend-item" style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
              <div style={{ width: 14, height: 14, background: item.color, borderRadius: 3, border: '1px solid rgba(0,0,0,0.2)' }} />
              <div style={{ fontSize: 12, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
