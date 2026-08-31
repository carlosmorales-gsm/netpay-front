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

  const workbookXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"
 xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    <sheet name="${escapeXml(sheetName)}" sheetId="1" r:id="rId1"/>
  </sheets>
</workbook>`

  const blob = zipStore([
    {
      path: '[Content_Types].xml',
      xml: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
  <Override PartName="/xl/tables/table1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.table+xml"/>
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
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
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
  ])

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
