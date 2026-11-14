// Vrais PDF A6 : texte et cadres dessinés directement (nets), à partir d'un élément de l'écran
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

const A6_W = 297.64
const A6_H = 419.53

const num = (v) => { const f = parseFloat(v); return isNaN(f) ? 0 : f }

function parseColor(c) {
  if (!c || c === 'transparent') return [0, 0, 0, 0]
  const s = String(c)
  const m = s.match(/-?[\d.]+/g)
  if (!m || m.length < 3) return [0, 0, 0, 0]
  const f = s.startsWith('color(') ? 255 : 1
  return [Math.round(+m[0] * f), Math.round(+m[1] * f), Math.round(+m[2] * f), m.length > 3 ? +m[3] : 1]
}

const pdfText = (s) => String(s)
  .replace(/[\u00a0\u2007\u2009\u200a\u202f]/g, ' ')
  .replace(/[\u2013\u2014\u2212]/g, '-')
  .replace(/[\u2018\u2019\u02bc]/g, "'")
  .replace(/[\u201c\u201d]/g, '"')
  .replace(/\u2026/g, '...')
  .replace(/\u2192/g, '>')
  .replace(/\u2022/g, '\u00b7')
  .replace(/\u20ac/g, 'EUR')
  .replace(/\u20a6/g, 'NGN')
  .replace(/\u20b5/g, 'GHS')
  .replace(/[^\x20-\x7E\xA0-\xFF]/g, '')

function radiusPx(cs, rect) {
  const v = cs.borderTopLeftRadius
  if (!v) return 0
  const f = parseFloat(v)
  if (isNaN(f)) return 0
  return String(v).includes('%') ? (f / 100) * Math.min(rect.width, rect.height) : f
}

function roundPath(c, x, y, w, h, r) {
  r = Math.max(0, Math.min(r, w / 2, h / 2))
  c.beginPath()
  c.moveTo(x + r, y)
  c.arcTo(x + w, y, x + w, y + h, r)
  c.arcTo(x + w, y + h, x, y + h, r)
  c.arcTo(x, y + h, x, y, r)
  c.arcTo(x, y, x + w, y, r)
  c.closePath()
}

function textLines(node, cs) {
  const txt = node.nodeValue || ''
  const range = document.createRange()
  const lines = []
  let cur = null
  for (let i = 0; i < txt.length; i++) {
    range.setStart(node, i)
    range.setEnd(node, i + 1)
    const rs = range.getClientRects()
    if (!rs.length) continue
    const r = rs[0]
    let ch = txt[i]
    if (r.width === 0 && /\s/.test(ch)) continue
    if (cs.textTransform === 'uppercase') ch = ch.toUpperCase()
    else if (cs.textTransform === 'lowercase') ch = ch.toLowerCase()
    if (cur && Math.abs(r.top - cur.top) < r.height * 0.5 && r.left >= cur.right - 1) {
      cur.chars.push({ ch, left: r.left, right: r.right })
      cur.right = Math.max(cur.right, r.right)
    } else {
      if (cur) lines.push(cur)
      cur = { top: r.top, bottom: r.bottom, left: r.left, right: r.right, chars: [{ ch, left: r.left, right: r.right }] }
    }
  }
  if (cur) lines.push(cur)
  return lines
    .map((l) => {
      const ch = l.chars.slice()
      while (ch.length && /\s/.test(ch[ch.length - 1].ch)) ch.pop()
      while (ch.length && /\s/.test(ch[0].ch)) ch.shift()
      if (!ch.length) return null
      return { text: ch.map((c) => c.ch).join(''), left: ch[0].left, right: ch[ch.length - 1].right, top: l.top, bottom: l.bottom }
    })
    .filter(Boolean)
}

async function vectorPDF(root) {
  const rr = root.getBoundingClientRect()
  if (!rr.width || !rr.height) throw new Error('élément vide')
  const k = A6_W / rr.width
  const ox = rr.left
  const oy = rr.top
  const pageH = Math.max(A6_H, rr.height * k)
  const pdf = new jsPDF({ unit: 'pt', format: [A6_W, pageH], orientation: 'portrait', compress: true })

  const alpha = (a, fn) => {
    if (a >= 0.995) { fn(); return }
    pdf.saveGraphicsState()
    pdf.setGState(new pdf.GState({ opacity: a, 'stroke-opacity': a }))
    fn()
    pdf.restoreGraphicsState()
  }

  const strip = (sx, sy, sw, sh, dashed, horizontal) => {
    if (!dashed) { pdf.rect(sx, sy, sw, sh, 'F'); return }
    const d = Math.max(1.5, (horizontal ? sh : sw) * 3)
    if (horizontal) { for (let t = 0; t < sw; t += d * 2) pdf.rect(sx + t, sy, Math.min(d, sw - t), sh, 'F') }
    else { for (let t = 0; t < sh; t += d * 2) pdf.rect(sx, sy + t, sw, Math.min(d, sh - t), 'F') }
  }

  const drawBox = (node, cs, r) => {
    const x = (r.left - ox) * k
    const y = (r.top - oy) * k
    const w = r.width * k
    const h = r.height * k
    if (w <= 0 || h <= 0) return
    const rad = node === root ? 0 : Math.min(radiusPx(cs, r) * k, w / 2, h / 2)
    const bgc = parseColor(cs.backgroundColor)
    if (bgc[3] > 0) {
      alpha(bgc[3], () => {
        pdf.setFillColor(bgc[0], bgc[1], bgc[2])
        if (rad > 0) pdf.roundedRect(x, y, w, h, rad, rad, 'F')
        else pdf.rect(x, y, w, h, 'F')
      })
    }
    const names = ['Top', 'Right', 'Bottom', 'Left']
    const sides = names.map((n) => ({ w: num(cs['border' + n + 'Width']) * k, st: cs['border' + n + 'Style'], col: parseColor(cs['border' + n + 'Color']) }))
    const on = (s) => s.w > 0 && s.st !== 'none' && s.st !== 'hidden' && s.col[3] > 0
    if (!sides.some(on)) return
    const s0 = sides[0]
    const uniform = sides.every((s) => on(s) && Math.abs(s.w - s0.w) < 0.01 && s.st === s0.st && s.col.join() === s0.col.join())
    if (uniform) {
      const dashed = s0.st === 'dashed' || s0.st === 'dotted'
      alpha(s0.col[3], () => {
        pdf.setDrawColor(s0.col[0], s0.col[1], s0.col[2])
        pdf.setLineWidth(s0.w)
        if (dashed) pdf.setLineDashPattern([s0.w * 3, s0.w * 3], 0)
        const i = s0.w / 2
        if (rad > 0) pdf.roundedRect(x + i, y + i, w - s0.w, h - s0.w, Math.max(0, rad - i), Math.max(0, rad - i), 'S')
        else pdf.rect(x + i, y + i, w - s0.w, h - s0.w, 'S')
        if (dashed) pdf.setLineDashPattern([], 0)
      })
      return
    }
    sides.forEach((s, idx) => {
      if (!on(s)) return
      const dashed = s.st === 'dashed' || s.st === 'dotted'
      alpha(s.col[3], () => {
        pdf.setFillColor(s.col[0], s.col[1], s.col[2])
        if (idx === 0) strip(x, y, w, s.w, dashed, true)
        else if (idx === 1) strip(x + w - s.w, y, s.w, h, dashed, false)
        else if (idx === 2) strip(x, y + h - s.w, w, s.w, dashed, true)
        else strip(x, y, s.w, h, dashed, false)
      })
    })
  }

  const drawText = (node) => {
    const par = node.parentElement
    if (!par) return
    const cs = getComputedStyle(par)
    const lines = textLines(node, cs)
    if (!lines.length) return
    const col = parseColor(cs.color)
    const fam = String(cs.fontFamily).toLowerCase()
    const font = /mono|courier/.test(fam) ? 'courier' : 'helvetica'
    const bold = parseInt(cs.fontWeight, 10) >= 600 || cs.fontWeight === 'bold'
    const italic = cs.fontStyle === 'italic'
    pdf.setFont(font, bold ? (italic ? 'bolditalic' : 'bold') : italic ? 'italic' : 'normal')
    pdf.setFontSize(Math.max(3, num(cs.fontSize) * k))
    lines.forEach((l) => {
      const t = pdfText(l.text)
      if (!t.trim()) return
      const target = (l.right - l.left) * k
      const natural = pdf.getTextWidth(t)
      const cspace = t.length > 1 ? Math.max(-0.8, Math.min(2, (target - natural) / (t.length - 1))) : 0
      const x = (l.left - ox) * k
      const y = (l.top + (l.bottom - l.top) * 0.8 - oy) * k
      alpha(col[3], () => {
        pdf.setTextColor(col[0], col[1], col[2])
        pdf.text(t, x, y, { charSpace: cspace })
      })
    })
  }

  const drawImg = (img, r) => {
    if (!img.complete || !img.naturalWidth) return
    const S = 4
    const cw = Math.max(1, Math.round(r.width * S))
    const ch = Math.max(1, Math.round(r.height * S))
    const cv = document.createElement('canvas')
    cv.width = cw
    cv.height = ch
    const c = cv.getContext('2d')
    let n = img
    for (let i = 0; i < 4 && n; i++, n = n.parentElement) {
      const ncs = getComputedStyle(n)
      if (n !== img && ncs.overflow === 'visible') continue
      const nr = n.getBoundingClientRect()
      const rad = radiusPx(ncs, nr)
      if (rad > 0) {
        roundPath(c, (nr.left - r.left) * S, (nr.top - r.top) * S, nr.width * S, nr.height * S, rad * S)
        c.clip()
      }
    }
    const ics = getComputedStyle(img)
    const nw = img.naturalWidth
    const nh = img.naturalHeight
    let dw = cw, dh = ch, dx = 0, dy = 0
    if (ics.objectFit === 'contain' || ics.objectFit === 'cover') {
      const sc = ics.objectFit === 'contain' ? Math.min(cw / nw, ch / nh) : Math.max(cw / nw, ch / nh)
      dw = nw * sc; dh = nh * sc; dx = (cw - dw) / 2; dy = (ch - dh) / 2
    }
    c.drawImage(img, dx, dy, dw, dh)
    pdf.addImage(cv.toDataURL('image/png'), 'PNG', (r.left - ox) * k, (r.top - oy) * k, r.width * k, r.height * k)
  }

  const drawSvg = async (svg, r) => {
    try {
      const cs = getComputedStyle(svg)
      const clone = svg.cloneNode(true)
      clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
      clone.setAttribute('width', r.width)
      clone.setAttribute('height', r.height)
      const xml = new XMLSerializer().serializeToString(clone).replace(/currentColor/g, cs.color)
      const img = await new Promise((res, rej) => {
        const i = new Image()
        i.onload = () => res(i)
        i.onerror = rej
        i.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(xml)
      })
      const S = 4
      const cv = document.createElement('canvas')
      cv.width = Math.max(1, Math.round(r.width * S))
      cv.height = Math.max(1, Math.round(r.height * S))
      cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height)
      pdf.addImage(cv.toDataURL('image/png'), 'PNG', (r.left - ox) * k, (r.top - oy) * k, r.width * k, r.height * k)
    } catch (e) { /* icône ignorée */ }
  }

  const walk = async (node) => {
    if (node.nodeType === 3) { drawText(node); return }
    if (node.nodeType !== 1) return
    const cs = getComputedStyle(node)
    if (cs.display === 'none' || cs.visibility === 'hidden' || num(cs.opacity) === 0) return
    const tag = node.tagName.toLowerCase()
    if (tag === 'script' || tag === 'style') return
    const r = node.getBoundingClientRect()
    drawBox(node, cs, r)
    if (tag === 'img') { drawImg(node, r); return }
    if (tag === 'svg') { await drawSvg(node, r); return }
    if (tag === 'canvas') {
      try { pdf.addImage(node.toDataURL('image/png'), 'PNG', (r.left - ox) * k, (r.top - oy) * k, r.width * k, r.height * k) } catch (e) { /* ignoré */ }
      return
    }
    for (const c of node.childNodes) await walk(c)
  }

  await walk(root)
  return pdf
}

// Repli : capture haute résolution (4x), sans déformation
async function rasterPDF(el) {
  const rect = el.getBoundingClientRect()
  const scale = Math.max(1, Math.min(4, 6000 / Math.max(rect.width, rect.height, 1)))
  const canvas = await html2canvas(el, { scale, backgroundColor: '#ffffff', useCORS: true })
  const pw = 105
  const h = (pw * canvas.height) / canvas.width
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [pw, Math.max(148, h)] })
  pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, pw, h, undefined, 'FAST')
  return pdf
}

export async function elementToPDF(el) {
  try {
    return await vectorPDF(el)
  } catch (e) {
    console.warn('PDF vectoriel indisponible, repli image haute résolution', e)
    return rasterPDF(el)
  }
}
