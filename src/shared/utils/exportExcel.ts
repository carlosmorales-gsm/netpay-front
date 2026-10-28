export type ExcelColumn = {
  header: string
  key: string
  type?: 'string' | 'number'
  width?: number
}

type ExcelValue = string | number | boolean | null | undefined

const CRC_TABLE = (() => {
  const table = new Uint32Array(256)
  for (let i = 0; i < 256; i++) {
    let c = i
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    table[i] = c >>> 0
  }
  return table
})()

function crc32(data: Uint8Array) {
  let c = 0xffffffff
  for (let i = 0; i < data.length; i++) {
    c = CRC_TABLE[(c ^ data[i]!) & 0xff]! ^ (c >>> 8)
  }
  return (c ^ 0xffffffff) >>> 0
}

function concatBytes(parts: Uint8Array[]) {
  const total = parts.reduce((sum, part) => sum + part.length, 0)
  const out = new Uint8Array(total)
  let offset = 0
  for (const part of parts) {
    out.set(part, offset)
    offset += part.length
  }
  return out
}

function u16(value: number) {
  const buf = new Uint8Array(2)
  new DataView(buf.buffer).setUint16(0, value, true)
  return buf
}

function u32(value: number) {
  const buf = new Uint8Array(4)
  new DataView(buf.buffer).setUint32(0, value, true)
  return buf
}

function zipStore(files: Array<{ path: string; xml: string }>) {
  const encoder = new TextEncoder()
  const locals: Uint8Array[] = []
  const centrals: Uint8Array[] = []
  let offset = 0

  for (const file of files) {
    const name = encoder.encode(file.path)
    const data = encoder.encode(file.xml)
    const crc = crc32(data)
    const local = concatBytes([
      u32(0x04034b50),
      u16(20),
      u16(0x0800),
      u16(0),
      u16(0),
      u16(0),
      u32(crc),
      u32(data.length),
      u32(data.length),
      u16(name.length),
      u16(0),
      name,
      data,
    ])
    locals.push(local)
    centrals.push(
      concatBytes([
        u32(0x02014b50),
        u16(20),
        u16(20),
        u16(0x0800),
        u16(0),
        u16(0),
        u16(0),
        u32(crc),
        u32(data.length),
        u32(data.length),
        u16(name.length),
        u16(0),
        u16(0),
        u16(0),
        u16(0),
        u32(0),
        u32(offset),
        name,
      ]),
    )
    offset += local.length
  }

  const central = concatBytes(centrals)
  const eocd = concatBytes([
    u32(0x06054b50),
    u16(0),
    u16(0),
    u16(files.length),
    u16(files.length),
    u32(central.length),
    u32(offset),
    u16(0),
  ])

  return new Blob([concatBytes([...locals, central, eocd])], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
}

function escapeXml(value: string) {
  return value
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function colLetter(index: number) {
  let n = index
  let out = ''
  while (n > 0) {
    const rem = (n - 1) % 26
    out = String.fromCharCode(65 + rem) + out
    n = Math.floor((n - 1) / 26)
  }
  return out
}

function safeSheetName(name: string) {
  const cleaned = name.replace(/[\\/*?:[\]]/g, ' ').trim() || 'Hoja1'
  return cleaned.slice(0, 31)
}

function textWidth(length: number, min: number, max: number) {
  return Math.min(max, Math.max(min, Math.round(length * 1.15) + 2))
}

function inlineCell(ref: string, text: string, style: number) {
  return `<c r="${ref}" t="inlineStr" s="${style}"><is><t xml:space="preserve">${escapeXml(text)}</t></is></c>`
}

function numberCell(ref: string, value: number, style: number) {
  return `<c r="${ref}" s="${style}"><v>${value}</v></c>`
}

function stylesXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <numFmts count="1">
    <numFmt numFmtId="164" formatCode="&quot;$&quot;#,##0.00"/>
  </numFmts>
  <fonts count="5">
    <font><sz val="11"/><color theme="1"/><name val="Calibri"/></font>
    <font><b/><sz val="16"/><color rgb="FF35647D"/><name val="Calibri"/></font>
    <font><sz val="10"/><color rgb="FF4A4A4A"/><name val="Calibri"/></font>
    <font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font>
    <font><sz val="11"/><color rgb="FF232323"/><name val="Calibri"/></font>
  </fonts>
  <fills count="4">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FF35647D"/><bgColor rgb="FF35647D"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFFAF6F1"/><bgColor rgb="FFFAF6F1"/></patternFill></fill>
  </fills>
  <borders count="2">
    <border><left/><right/><top/><bottom/><diagonal/></border>
    <border>
      <left style="thin"><color rgb="FFCECECE"/></left>
      <right style="thin"><color rgb="FFCECECE"/></right>
      <top style="thin"><color rgb="FFCECECE"/></top>
      <bottom style="thin"><color rgb="FFCECECE"/></bottom>
      <diagonal/>
    </border>
  </borders>
  <cellStyleXfs count="1">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0"/>
  </cellStyleXfs>
  <cellXfs count="8">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
    <xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/>
    <xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1"/>
    <xf numFmtId="0" fontId="3" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1">
      <alignment horizontal="center" vertical="center"/>
    </xf>
    <xf numFmtId="0" fontId="4" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1">
      <alignment vertical="center"/>
    </xf>
    <xf numFmtId="0" fontId="4" fillId="3" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1">
      <alignment vertical="center"/>
    </xf>
    <xf numFmtId="164" fontId="4" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyFont="1" applyBorder="1" applyAlignment="1">
      <alignment horizontal="right" vertical="center"/>
    </xf>
    <xf numFmtId="164" fontId="4" fillId="3" borderId="1" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1">
      <alignment horizontal="right" vertical="center"/>
    </xf>
  </cellXfs>
</styleSheet>`
}

function quoteSheet(name: string) {
  return `'${name.replace(/'/g, "''")}'`
}

function uniqueLabels(rows: Array<Record<string, ExcelValue>>, key: string) {
  const seen = new Set<string>()
  const labels: string[] = []
  for (const row of rows) {
    const text = row[key] == null || row[key] === '' ? '' : String(row[key])
    if (!text || text === '—' || seen.has(text)) continue
    seen.add(text)
    labels.push(text)
  }
  return labels
}

function countLabel(rows: Array<Record<string, ExcelValue>>, key: string, label: string) {
  return rows.filter((row) => String(row[key] ?? '') === label).length
}

function sumLabel(
  rows: Array<Record<string, ExcelValue>>,
  key: string,
  label: string,
  amountKey: string,
) {
  return rows.reduce((sum, row) => {
    if (String(row[key] ?? '') !== label) return sum
    const amount = Number(row[amountKey])
    return sum + (Number.isFinite(amount) ? amount : 0)
  }, 0)
}

function formulaCell(ref: string, formula: string, cached: number, style: number) {
  return `<c r="${ref}" s="${style}"><f>${escapeXml(formula)}</f><v>${cached}</v></c>`
}

function strCache(labels: string[]) {
  const points = labels
    .map((label, i) => `<c:pt idx="${i}"><c:v>${escapeXml(label)}</c:v></c:pt>`)
    .join('')
  return `<c:strCache><c:ptCount val="${labels.length}"/>${points}</c:strCache>`
}

function numCache(values: number[], format = 'General') {
  const points = values
    .map((value, i) => `<c:pt idx="${i}"><c:v>${value}</c:v></c:pt>`)
    .join('')
  return `<c:numCache><c:formatCode>${format}</c:formatCode><c:ptCount val="${values.length}"/>${points}</c:numCache>`
}

function chartTitle(text: string) {
  return `<c:title><c:tx><c:rich><a:bodyPr/><a:lstStyle/><a:p><a:pPr><a:defRPr sz="1400" b="1"/></a:pPr><a:r><a:rPr lang="es-MX" sz="1400" b="1"/><a:t>${escapeXml(text)}</a:t></a:r></a:p></c:rich></c:tx><c:overlay val="0"/></c:title>`
}

function pieChartXml(title: string, catRef: string, valRef: string, labels: string[], values: number[]) {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<c:chartSpace xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
  <c:date1904 val="0"/>
  <c:roundedCorners val="0"/>
  <c:chart>
    ${chartTitle(title)}
    <c:legend><c:legendPos val="b"/><c:overlay val="0"/></c:legend>
    <c:plotArea>
      <c:layout/>
      <c:pieChart>
        <c:varyColors val="1"/>
        <c:ser>
          <c:idx val="0"/>
          <c:order val="0"/>
          <c:tx><c:v>Operaciones</c:v></c:tx>
          <c:cat><c:strRef><c:f>${escapeXml(catRef)}</c:f>${strCache(labels)}</c:strRef></c:cat>
          <c:val><c:numRef><c:f>${escapeXml(valRef)}</c:f>${numCache(values)}</c:numRef></c:val>
        </c:ser>
        <c:dLbls>
          <c:showLegendKey val="0"/>
          <c:showVal val="0"/>
          <c:showCatName val="0"/>
          <c:showSerName val="0"/>
          <c:showPercent val="1"/>
        </c:dLbls>
      </c:pieChart>
    </c:plotArea>
    <c:plotVisOnly val="1"/>
  </c:chart>
</c:chartSpace>`
}

function columnChartXml(
  title: string,
  catRef: string,
  valRef: string,
  seriesName: string,
  labels: string[],
  values: number[],
) {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<c:chartSpace xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
  <c:date1904 val="0"/>
  <c:roundedCorners val="0"/>
  <c:chart>
    ${chartTitle(title)}
    <c:legend><c:legendPos val="b"/><c:overlay val="0"/></c:legend>
    <c:plotArea>
      <c:layout/>
      <c:barChart>
        <c:barDir val="col"/>
        <c:grouping val="clustered"/>
        <c:varyColors val="1"/>
        <c:ser>
          <c:idx val="0"/>
          <c:order val="0"/>
          <c:tx><c:v>${escapeXml(seriesName)}</c:v></c:tx>
          <c:cat><c:strRef><c:f>${escapeXml(catRef)}</c:f>${strCache(labels)}</c:strRef></c:cat>
          <c:val><c:numRef><c:f>${escapeXml(valRef)}</c:f>${numCache(values, '&quot;$&quot;#,##0.00')}</c:numRef></c:val>
        </c:ser>
        <c:axId val="111"/>
        <c:axId val="222"/>
      </c:barChart>
      <c:catAx>
        <c:axId val="111"/>
        <c:scaling><c:orientation val="minMax"/></c:scaling>
        <c:delete val="0"/>
        <c:axPos val="b"/>
        <c:majorTickMark val="out"/>
        <c:minorTickMark val="none"/>
        <c:crossAx val="222"/>
      </c:catAx>
      <c:valAx>
        <c:axId val="222"/>
        <c:scaling><c:orientation val="minMax"/></c:scaling>
        <c:delete val="0"/>
        <c:axPos val="l"/>
        <c:majorTickMark val="out"/>
        <c:minorTickMark val="none"/>
        <c:numFmt formatCode="&quot;$&quot;#,##0" sourceLinked="0"/>
        <c:crossAx val="111"/>
      </c:valAx>
    </c:plotArea>
    <c:plotVisOnly val="1"/>
  </c:chart>
</c:chartSpace>`
}

function drawingXml(
  charts: Array<{ id: number; fromCol: number; toCol: number; fromRow: number; toRow: number }>,
) {
  const anchors = charts
    .map(
      (chart) => `<xdr:twoCellAnchor>
      <xdr:from><xdr:col>${chart.fromCol}</xdr:col><xdr:colOff>120000</xdr:colOff><xdr:row>${chart.fromRow}</xdr:row><xdr:rowOff>80000</xdr:rowOff></xdr:from>
      <xdr:to><xdr:col>${chart.toCol}</xdr:col><xdr:colOff>0</xdr:colOff><xdr:row>${chart.toRow}</xdr:row><xdr:rowOff>0</xdr:rowOff></xdr:to>
      <xdr:graphicFrame macro="">
        <xdr:nvGraphicFramePr>
          <xdr:cNvPr id="${chart.id}" name="Gráfico ${chart.id}"/>
          <xdr:cNvGraphicFramePr/>
        </xdr:nvGraphicFramePr>
        <xdr:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/></xdr:xfrm>
        <a:graphic>
          <a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/chart">
            <c:chart xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" r:id="rId${chart.id}"/>
          </a:graphicData>
        </a:graphic>
      </xdr:graphicFrame>
      <xdr:clientData/>
    </xdr:twoCellAnchor>`,
    )
    .join('')
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<xdr:wsDr xmlns:xdr="http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
  ${anchors}
</xdr:wsDr>`
}

function buildIndicatorsSheet(input: {
  dataSheet: string
  subtitle: string
  columns: ExcelColumn[]
  rows: Array<Record<string, ExcelValue>>
  dataStart: number
  dataEnd: number
}) {
  const estatusCol = input.columns.findIndex((col) => col.key === 'estatus')
  const importeCol = input.columns.findIndex((col) => col.key === 'importe')
  const tipoCol = input.columns.findIndex((col) => col.key === 'tipo')
  if (estatusCol < 0 || importeCol < 0 || !input.rows.length) return null

  const name = input.dataSheet === 'Indicadores' ? 'Indicadores 2' : 'Indicadores'
  const data = quoteSheet(input.dataSheet)
  const estatusRange = `${data}!$${colLetter(estatusCol + 1)}$${input.dataStart}:$${colLetter(estatusCol + 1)}$${input.dataEnd}`
  const importeRange = `${data}!$${colLetter(importeCol + 1)}$${input.dataStart}:$${colLetter(importeCol + 1)}$${input.dataEnd}`
  const tipoRange =
    tipoCol >= 0
      ? `${data}!$${colLetter(tipoCol + 1)}$${input.dataStart}:$${colLetter(tipoCol + 1)}$${input.dataEnd}`
      : ''

  const estatus = uniqueLabels(input.rows, 'estatus')
  const tipos = tipoCol >= 0 ? uniqueLabels(input.rows, 'tipo') : []
  const totalOps = input.rows.length
  const totalImporte = input.rows.reduce((sum, row) => {
    const amount = Number(row.importe)
    return sum + (Number.isFinite(amount) ? amount : 0)
  }, 0)
  const aplicado = sumLabel(input.rows, 'estatus', 'Aplicado', 'importe')

  const firstCat = 8
  const estatusEnd = estatus.length ? firstCat + estatus.length - 1 : firstCat
  const tipoEnd = tipos.length ? firstCat + tipos.length - 1 : firstCat

  const catCount = Math.max(estatus.length, tipos.length)
  const catRows = Array.from({ length: catCount }, (_, index) => {
    const row = firstCat + index
    const cells: string[] = []
    const estatusLabel = estatus[index]
    if (estatusLabel) {
      const ops = countLabel(input.rows, 'estatus', estatusLabel)
      const amount = sumLabel(input.rows, 'estatus', estatusLabel, 'importe')
      cells.push(
        inlineCell(`A${row}`, estatusLabel, 4),
        formulaCell(`B${row}`, `COUNTIF(${estatusRange},A${row})`, ops, 4),
        formulaCell(`C${row}`, `SUMIF(${estatusRange},A${row},${importeRange})`, amount, 6),
      )
    }
    const tipoLabel = tipos[index]
    if (tipoLabel) {
      const ops = countLabel(input.rows, 'tipo', tipoLabel)
      const amount = sumLabel(input.rows, 'tipo', tipoLabel, 'importe')
      cells.push(
        inlineCell(`E${row}`, tipoLabel, 4),
        formulaCell(`F${row}`, `COUNTIF(${tipoRange},E${row})`, ops, 4),
        formulaCell(`G${row}`, `SUMIF(${tipoRange},E${row},${importeRange})`, amount, 6),
      )
    }
    return `<row r="${row}" ht="18" customHeight="1">${cells.join('')}</row>`
  }).join('')

  const rowsXml = [
    `<row r="1" ht="24" customHeight="1">${inlineCell('A1', 'Indicadores', 1)}</row>`,
    `<row r="2" ht="18" customHeight="1">${inlineCell('A2', input.subtitle, 2)}</row>`,
    `<row r="4" ht="18" customHeight="1">${inlineCell('A4', 'Operaciones', 3)}${formulaCell('B4', `COUNTA(${estatusRange})`, totalOps, 4)}${inlineCell('D4', 'Importe total', 3)}${formulaCell('E4', `SUM(${importeRange})`, totalImporte, 6)}${inlineCell('G4', 'Importe aplicado', 3)}${formulaCell('H4', `SUMIF(${estatusRange},"Aplicado",${importeRange})`, aplicado, 6)}</row>`,
    `<row r="6" ht="18" customHeight="1">${inlineCell('A6', 'Los conteos y los importes salen de la hoja de movimientos.', 2)}</row>`,
    `<row r="7" ht="20" customHeight="1">${inlineCell('A7', 'Estatus', 3)}${inlineCell('B7', 'Operaciones', 3)}${inlineCell('C7', 'Importe', 3)}${tipos.length ? `${inlineCell('E7', 'Tipo', 3)}${inlineCell('F7', 'Operaciones', 3)}${inlineCell('G7', 'Importe', 3)}` : ''}</row>`,
    catRows,
  ].join('')

  const lastRow = Math.max(estatusEnd, tipoEnd, 8)
  const sheetXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"
 xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <dimension ref="A1:H${lastRow + 36}"/>
  <sheetViews><sheetView workbookViewId="0"/></sheetViews>
  <sheetFormatPr defaultRowHeight="16"/>
  <cols>
    <col min="1" max="1" width="28" customWidth="1"/>
    <col min="2" max="3" width="16" customWidth="1"/>
    <col min="4" max="4" width="18" customWidth="1"/>
    <col min="5" max="5" width="24" customWidth="1"/>
    <col min="6" max="8" width="16" customWidth="1"/>
  </cols>
  <sheetData>${rowsXml}</sheetData>
  <mergeCells count="2">
    <mergeCell ref="A1:H1"/>
    <mergeCell ref="A2:H2"/>
  </mergeCells>
  <pageMargins left="0.5" right="0.5" top="0.6" bottom="0.6" header="0.3" footer="0.3"/>
  ${estatus.length || tipos.length ? '<drawing r:id="rId1"/>' : ''}
</worksheet>`

  const charts: string[] = []
  const anchors: Array<{ id: number; fromCol: number; toCol: number; fromRow: number; toRow: number }> = []
  const chartStart = lastRow + 2
  if (estatus.length) {
    charts.push(
      pieChartXml(
        'Operaciones por estatus',
        `${quoteSheet(name)}!$A$${firstCat}:$A$${estatusEnd}`,
        `${quoteSheet(name)}!$B$${firstCat}:$B$${estatusEnd}`,
        estatus,
        estatus.map((label) => countLabel(input.rows, 'estatus', label)),
      ),
    )
    anchors.push({ id: charts.length, fromCol: 0, toCol: 8, fromRow: chartStart - 1, toRow: chartStart + 15 })
    charts.push(
      columnChartXml(
        'Importe por estatus',
        `${quoteSheet(name)}!$A$${firstCat}:$A$${estatusEnd}`,
        `${quoteSheet(name)}!$C$${firstCat}:$C$${estatusEnd}`,
        'Importe',
        estatus,
        estatus.map((label) => sumLabel(input.rows, 'estatus', label, 'importe')),
      ),
    )
    anchors.push({ id: charts.length, fromCol: 8, toCol: 16, fromRow: chartStart - 1, toRow: chartStart + 15 })
  }
  if (tipos.length) {
    charts.push(
      columnChartXml(
        'Importe por tipo',
        `${quoteSheet(name)}!$E$${firstCat}:$E$${tipoEnd}`,
        `${quoteSheet(name)}!$G$${firstCat}:$G$${tipoEnd}`,
        'Importe',
        tipos,
        tipos.map((label) => sumLabel(input.rows, 'tipo', label, 'importe')),
      ),
    )
    anchors.push({
      id: charts.length,
      fromCol: 0,
      toCol: 16,
      fromRow: chartStart + 16,
      toRow: chartStart + 32,
    })
  }

  const files: Array<{ path: string; xml: string }> = [{ path: 'xl/worksheets/sheet2.xml', xml: sheetXml }]
  if (charts.length) {
    files.push({ path: 'xl/drawings/drawing1.xml', xml: drawingXml(anchors) })
    files.push({
      path: 'xl/drawings/_rels/drawing1.xml.rels',
      xml: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  ${charts.map((_, index) => `<Relationship Id="rId${index + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/chart" Target="../charts/chart${index + 1}.xml"/>`).join('')}
</Relationships>`,
    })
    files.push({
      path: 'xl/worksheets/_rels/sheet2.xml.rels',
      xml: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/drawing" Target="../drawings/drawing1.xml"/>
</Relationships>`,
    })
    charts.forEach((xml, index) => {
      files.push({ path: `xl/charts/chart${index + 1}.xml`, xml })
    })
  }

  return { name, charts, files }
}

export function downloadTableExcel(options: {
  title: string
  filename: string
  columns: ExcelColumn[]
  rows: Array<Record<string, ExcelValue>>
  subtitle?: string
  sheetName?: string
}) {
  const columns = options.columns
  const lastCol = colLetter(columns.length)
  const headerRow = 4
  const dataStart = 5
  const dataEnd = Math.max(dataStart, headerRow + Math.max(options.rows.length, 1))
  const tableRef = `A${headerRow}:${lastCol}${dataEnd}`
  const sheetName = safeSheetName(options.sheetName || options.title)
  const subtitle = options.subtitle || `Generado: ${new Date().toLocaleString('es-MX')}`

  const widths = columns.map((col) => {
    if (col.width) return col.width
    const longest = options.rows.reduce((max, row) => {
      const value = row[col.key]
      const text = value == null ? '' : String(value)
      return Math.max(max, text.length)
    }, col.header.length)
    return textWidth(longest, col.type === 'number' ? 12 : 14, 36)
  })

  const colXml = widths
    .map((width, i) => `<col min="${i + 1}" max="${i + 1}" width="${width}" customWidth="1"/>`)
    .join('')

  const titleRow = `<row r="1" ht="24" customHeight="1">${inlineCell('A1', options.title, 1)}</row>`
  const subtitleRow = `<row r="2" ht="18" customHeight="1">${inlineCell('A2', subtitle, 2)}</row>`
  const spacerRow = `<row r="3"/>`
  const headerCells = columns
    .map((col, i) => inlineCell(`${colLetter(i + 1)}${headerRow}`, col.header, 3))
    .join('')
  const headerXml = `<row r="${headerRow}" ht="20" customHeight="1">${headerCells}</row>`

  const dataRows =
    options.rows.length > 0
      ? options.rows
          .map((row, rowIndex) => {
            const excelRow = dataStart + rowIndex
            const alt = rowIndex % 2 === 1
            const cells = columns
              .map((col, colIndex) => {
                const ref = `${colLetter(colIndex + 1)}${excelRow}`
                if (col.type === 'number') {
                  const n = typeof row[col.key] === 'number' ? Number(row[col.key]) : Number(row[col.key])
                  if (Number.isFinite(n)) return numberCell(ref, n, alt ? 7 : 6)
                }
                const text = row[col.key] == null || row[col.key] === '' ? '—' : String(row[col.key])
                return inlineCell(ref, text, alt ? 5 : 4)
              })
              .join('')
            return `<row r="${excelRow}" ht="18" customHeight="1">${cells}</row>`
          })
          .join('')
      : `<row r="${dataStart}">${columns
          .map((col, i) => inlineCell(`${colLetter(i + 1)}${dataStart}`, '', 4))
          .join('')}</row>`

  const sheetXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"
 xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheetPr>
    <pageSetUpPr fitToPage="1"/>
  </sheetPr>
  <dimension ref="A1:${lastCol}${dataEnd}"/>
  <sheetViews>
    <sheetView workbookViewId="0" tabSelected="1">
      <pane ySplit="${headerRow}" topLeftCell="A${dataStart}" activePane="bottomLeft" state="frozen"/>
      <selection pane="bottomLeft" activeCell="A${dataStart}" sqref="A${dataStart}"/>
    </sheetView>
  </sheetViews>
  <sheetFormatPr defaultRowHeight="16"/>
  <cols>${colXml}</cols>
  <sheetData>${titleRow}${subtitleRow}${spacerRow}${headerXml}${dataRows}</sheetData>
  <mergeCells count="2">
    <mergeCell ref="A1:${lastCol}1"/>
    <mergeCell ref="A2:${lastCol}2"/>
  </mergeCells>
  <pageMargins left="0.5" right="0.5" top="0.6" bottom="0.6" header="0.3" footer="0.3"/>
  <pageSetup orientation="landscape" fitToWidth="1" fitToHeight="0" paperSize="9"/>
  <tableParts count="1">
    <tablePart r:id="rId1"/>
  </tableParts>
</worksheet>`

  const tableCols = columns
    .map((col, i) => `<tableColumn id="${i + 1}" name="${escapeXml(col.header)}"/>`)
    .join('')

  const tableXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<table xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"
 id="1" name="TablaDatos" displayName="TablaDatos" ref="${tableRef}" headerRowCount="1">
  <autoFilter ref="${tableRef}"/>
  <tableColumns count="${columns.length}">${tableCols}</tableColumns>
  <tableStyleInfo name="TableStyleMedium2" showFirstColumn="0" showLastColumn="0" showRowStripes="0" showColumnStripes="0"/>
</table>`

  const indicators = buildIndicatorsSheet({
    dataSheet: sheetName,
    subtitle,
    columns,
    rows: options.rows,
    dataStart,
    dataEnd: options.rows.length ? dataStart + options.rows.length - 1 : dataStart,
  })

  const workbookXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"
 xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    <sheet name="${escapeXml(sheetName)}" sheetId="1" r:id="rId1"/>
    ${indicators ? `<sheet name="${escapeXml(indicators.name)}" sheetId="2" r:id="rId3"/>` : ''}
  </sheets>
</workbook>`

  const contentOverrides = [
    `<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>`,
    `<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`,
    `<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>`,
    `<Override PartName="/xl/tables/table1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.table+xml"/>`,
  ]
  if (indicators) {
    contentOverrides.push(
      `<Override PartName="/xl/worksheets/sheet2.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`,
    )
    indicators.charts.forEach((_, index) => {
      contentOverrides.push(
        `<Override PartName="/xl/charts/chart${index + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.drawingml.chart+xml"/>`,
      )
    })
    if (indicators.charts.length) {
      contentOverrides.push(
        `<Override PartName="/xl/drawings/drawing1.xml" ContentType="application/vnd.openxmlformats-officedocument.drawing+xml"/>`,
      )
    }
  }

  const workbookRels = [
    `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>`,
    `<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>`,
  ]
  if (indicators) {
    workbookRels.push(
      `<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet2.xml"/>`,
    )
  }

  const files: Array<{ path: string; xml: string }> = [
    {
      path: '[Content_Types].xml',
      xml: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  ${contentOverrides.join('')}
</Types>`,
    },
    {
      path: '_rels/.rels',
      xml: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`,
    },
    { path: 'xl/workbook.xml', xml: workbookXml },
    {
      path: 'xl/_rels/workbook.xml.rels',
      xml: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  ${workbookRels.join('')}
</Relationships>`,
    },
    { path: 'xl/styles.xml', xml: stylesXml() },
    { path: 'xl/worksheets/sheet1.xml', xml: sheetXml },
    {
      path: 'xl/worksheets/_rels/sheet1.xml.rels',
      xml: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/table" Target="../tables/table1.xml"/>
</Relationships>`,
    },
    { path: 'xl/tables/table1.xml', xml: tableXml },
  ]
  if (indicators) files.push(...indicators.files)

  const blob = zipStore(files)

  const name = options.filename.toLowerCase().endsWith('.xlsx')
    ? options.filename
    : `${options.filename.replace(/\.xls$/i, '')}.xlsx`
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = name
  link.click()
  URL.revokeObjectURL(url)
}
