import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

export type PdfColumn = {
  header: string
  key: string
}

export function downloadTablePdf(options: {
  title: string
  filename: string
  columns: PdfColumn[]
  rows: Array<Record<string, string | number | boolean | null | undefined>>
  subtitle?: string
}) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' })
  const marginX = 40

  doc.setFontSize(16)
  doc.setTextColor(53, 100, 125)
  doc.text(options.title, marginX, 40)

  doc.setFontSize(10)
  doc.setTextColor(90, 90, 90)
  doc.text(options.subtitle || `Generado: ${new Date().toLocaleString('es-MX')}`, marginX, 58)

  autoTable(doc, {
    startY: 72,
    head: [options.columns.map((c) => c.header)],
    body: options.rows.map((row) =>
      options.columns.map((c) => {
        const value = row[c.key]
        if (value == null) return '—'
        return String(value)
      }),
    ),
    styles: {
      fontSize: 9,
      cellPadding: 5,
      textColor: [35, 35, 35],
    },
    headStyles: {
      fillColor: [53, 100, 125],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [249, 243, 238],
    },
    margin: { left: marginX, right: marginX },
  })

  doc.save(options.filename.endsWith('.pdf') ? options.filename : `${options.filename}.pdf`)
}
