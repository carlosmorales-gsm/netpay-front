"""Fill NetPay certification questionnaire with answers."""
import glob
import re
import shutil

import openpyxl
from openpyxl.styles import Alignment

SRC_MATCH = r"c:\Users\rogel\Downloads\Resultados_Certificaci*NetPay_v4.4.1.xlsx"
DST = r"c:\Users\rogel\Downloads\Resultados_Certificacion_NetPay_RESPONDIDO.xlsx"
DST_COPY = r"c:\desarrollo\sanmartin\netpay-front\Resultados_Certificacion_NetPay_RESPONDIDO.xlsx"

candidates = [
    f for f in glob.glob(SRC_MATCH) if "RESPONDIDO" not in f.upper()
]
if not candidates:
    raise FileNotFoundError("No se encontró el Excel original en Downloads")
SRC = candidates[0]

ANSWERS = {
    1: (
        "El login del comercio (Odoo ERP) es independiente del token OAuth de NetPay. "
        "Odoo autentica al usuario con sus credenciales corporativas habituales. "
        "El token de NetPay lo genera exclusivamente api-netpay en servidor (middleware), "
        "sin enlazarlo al login de Odoo ni a un storeId fijo. "
        "El panel administrativo NetPay (netpay-front) tiene login propio con JWT (email/contraseña), "
        "también separado del token NetPay."
    ),
    2: (
        "Sí. Por cada cobro se resuelve dinámicamente la terminal según usuario Odoo + empresa "
        "(tabla join_usuarios_terminales): storeId y serialNumber (folioTerminal/serie). "
        "Cada usuario puede tener una terminal activa distinta por empresa. "
        "Los valores se envían en cada transacción; no hay storeId global fijo."
    ),
    3: (
        "Mediante variables de entorno por ambiente (pruebas/producción): API_NETPAY, credenciales OAuth "
        "(NETPAY_USER, NETPAY_PASS, TOKEN_NETPAY_USER, TOKEN_NETPAY_PASS), URL pública del webhook, "
        "ODOO_API_KEY y PORT. Cada ambiente tiene su propio despliegue y configuración; "
        "no se mezclan credenciales ni URLs entre pruebas y producción."
    ),
    4: (
        "api-netpay obtiene el token con POST oauth-service/oauth/token (grant_type password + Basic auth). "
        "Se renueva bajo demanda: al iniciar si no hay token en memoria, o al recibir HTTP 401/403 en una petición. "
        "NO utilizamos refresh token. El token se mantiene en memoria del servicio. "
        "Se puede programar renovación periódica (cada 6-11 hrs) como mejora operativa si NetPay lo requiere en producción."
    ),
    5: (
        "En producción NO. El webhook es un endpoint público HTTPS en api-netpay: "
        "POST /transactions/terminal-response. Debe ser accesible desde internet con certificado SSL válido "
        "(compatible con Android de la terminal Pax). En desarrollo local puede usarse http://localhost:3017, "
        "pero en certificación/producción siempre HTTPS en servidor centralizado."
    ),
    6: (
        "Utilizamos webhook público centralizado en api-netpay (servidor en nube/datacenter). "
        "NetPay notifica ahí; api-netpay actualiza base de datos y resuelve la espera del cobro hacia Odoo. "
        "NO hay reenvío a servidor local de sucursal ni puente intermedio. "
        "Si el webhook no puede procesar la transacción, se registra en log_transacciones y la respuesta "
        "al cobro en curso refleja el error/timeout."
    ),
    7: (
        "No. La integración es API en la nube: Odoo → api-netpay → NetPay cloud → terminal Pax. "
        "No utilizamos servidores locales, COM, SDK ni agente local en sucursal para transaccionar con NetPay."
    ),
    8: (
        "Sí. Odoo envía la venta a api-netpay mediante POST /bill/charge-card-terminal-wait. "
        "El flujo es síncrono: Odoo espera la respuesta de la terminal (hasta timeout backend). "
        "Se evita procesar múltiples ventas simultáneas desde la misma acción: "
        "el wizard de Odoo bloquea la UI mientras el cobro está en curso (un cobro a la vez por operación)."
    ),
    9: (
        "Sí. El backend espera la respuesta de la terminal con timeout configurable (actualmente 120 segundos) "
        "mediante TerminalResponseWaiter + polling a base de datos cada 500 ms como respaldo multi-instancia. "
        "Si no llega respuesta, retorna status timeout. "
        "NOTA: se ajustará a 180 segundos (3 min) para cumplir recomendación NetPay en certificación."
    ),
    10: (
        "Odoo muestra loading/bloqueo de pantalla mientras espera la respuesta del API (sin countdown). "
        "El panel admin NetPay usa spinner global (withLoading) hasta respuesta del backend. "
        "No hay timer fijo de 3 min en UI; si el usuario termina antes en terminal, la respuesta llega antes del timeout. "
        "No se usa cashback."
    ),
    11: (
        "Parcialmente. Antes de enviar a NetPay se crea registro en transacciones con folioNumber único y estado pendiente. "
        "Si no hay respuesta de terminal, la transacción queda sin tipo_respuesta (recuperable por folio/reimpresión desde panel admin). "
        "No hay flujo automático de pre-registro en Odoo ni recuperación guiada ante timeout; "
        "el operador puede consultar/reimprimir manualmente por folio."
    ),
    12: (
        "APIs estándar NetPay Smart Accounts: venta (sale), cancelación/void (cancel) y reimpresión (reprint). "
        "Endpoints propios de middleware: charge-card-terminal-wait, terminal-payment-finalize y auto-reimpresión post-pago Odoo. "
        "No se implementaron APIs fuera de documentación NetPay sin conocimiento del equipo de integraciones."
    ),
    13: (
        "Sí. El folio se genera ANTES de enviar la venta y se manda en el campo folioNumber del request a NetPay. "
        "Se crea al registrar la transacción en api-netpay, no después de procesarse la venta."
    ),
    14: (
        "Estructura: {paymentOrderId}-{transactionId}-{timestamp}. "
        "Ejemplo: 12345-678-1723488123456. "
        "Incluye ID orden de pago Odoo + ID transacción interna + timestamp. "
        "No es consecutivo numérico simple; actúa como prefijo/sufijo implícito por composición."
    ),
    15: (
        "Sí. El folioNumber es único por intento de cobro a nivel global "
        "(paymentOrderId + transactionId + timestamp). No se repite entre sucursales, usuarios ni reintentos."
    ),
    16: (
        "No se duplica. Cada intento (aprobado o declinado) genera un folioNumber distinto. "
        "Un declinado conserva su folio; un reintento crea uno nuevo, facilitando consulta/reimpresión por folio."
    ),
    17: (
        "Campo responseCode = '00' indica transacción aprobada. "
        "Para venta: responseCode 00 con transType A (o vacío). "
        "Para cancelación/void: responseCode 00 con transType V. "
        "Cualquier valor distinto de 00 se considera error, declinación o cancelación."
    ),
    18: (
        "Sí. Las declinaciones se almacenan en transacciones (tipo_respuesta, order_id, tarjeta, importe, traceability, aplicado=false) "
        "y en log_transacciones con payload completo del webhook. "
        "Visibles en panel de movimientos con estatus Declinado."
    ),
    19: (
        "Sí. Se mantiene activo el voucher oficial de NetPay impreso en la terminal Pax. "
        "No se desactiva ni se sustituye; la reimpresión vía API imprime el ticket oficial de NetPay."
    ),
    20: "N/A. No hay aplicación Android nativa propia; integración vía API cloud desde Odoo web/backend.",
    21: "No. No modificamos el voucher oficial de NetPay en la terminal.",
    22: (
        "Pendiente certificación ticket personalizado (pestaña TICKET-PERSONALIZADO). "
        "Actualmente se utiliza voucher oficial NetPay sin ticket custom certificado."
    ),
    23: "No. Solo impresión en terminal NetPay (venta, reimpresión y cancelación). No hay impresora propia adicional.",
    24: (
        "Sí. En cada venta se envía traceability con: sale_id, saler_order, payment_order_id, user_id, company_id, "
        "store_id, transaction_id, folio_number, amount, channel_id, payments. "
        "NetPay lo devuelve en callback para correlacionar la transacción."
    ),
    25: (
        "Sí. api-netpay registra bitácora en log_transacciones (webhook terminal + finalize Odoo) "
        "y logs de aplicación NestJS. Panel admin consulta movimientos; módulo de logs en desarrollo."
    ),
    26: (
        "PC/laptop con navegador web ejecutando Odoo ERP (punto de venta/backoffice). "
        "Terminal Pax Smart PinPad para cobro con tarjeta. No es app móvil ni kiosco propio."
    ),
    27: "No. Terminal Pax con app NetPay estándar conectada a internet. Sin VPN ni aplicaciones adicionales en terminal.",
    28: (
        "Sí, estándar corporativo: firewall/perímetro en sucursal y datacenter. "
        "Terminal requiere salida HTTPS hacia NetPay; webhook api-netpay accesible desde internet (HTTPS 443)."
    ),
    29: (
        "Sí, manual desde panel admin NetPay (POST /admin/movements/:id/reprint). "
        "Reimpresión por folioNumber (folioId) u orderId solo como consulta/recuperación operativa. "
        "No se dispara automáticamente ante transacción perdida."
    ),
    30: "No. No hay auto-reimpresión en declinación. Solo auto-reimpresión tras pago exitoso en Odoo (finalize).",
    31: (
        "No como fuente de verdad. El estatus se determina por webhook/BD (tipo_respuesta, traceability). "
        "La reimpresión es operativa, no para determinar estatus de reversos."
    ),
    32: (
        "Parcialmente. Odoo bloquea UI durante cobro (una acción a la vez). "
        "api-netpay procesa secuencialmente por request. Se recomienda deshabilitar botón de cobro mientras hay transacción en curso."
    ),
    33: "No. Operación asistida por cajero/usuario en Odoo. No es kiosco ni autoatendido.",
    34: "N/A. No implementamos cashback ni segunda respuesta por cashback.",
    35: "N/A. No hay cashback.",
    36: (
        "Loading en Odoo hasta respuesta del API (máx. timeout backend). "
        "Sin timer visual de 3 min; respuesta llega antes si el usuario termina en terminal."
    ),
    37: (
        "Polling interno backend cada 500 ms hacia BD mientras espera webhook (fallback multi-instancia). "
        "Timeout total: 120 s (se ajustará a 180 s para certificación)."
    ),
    38: (
        "Servidor: Linux/Windows, Node.js (NestJS), arquitectura x64. "
        "Cliente: navegador web (Odoo). Terminal: Android (Pax, app NetPay)."
    ),
    39: "N/A. No usamos integración COM/.NET.",
    40: (
        "La venta queda pendiente o en timeout en api-netpay. Odoo recibe error/timeout. "
        "Operador puede consultar/reimprimir por folio desde panel admin. No aplica findPortByDescription (integración COM)."
    ),
    41: "N/A. No usamos DLL COM.",
    42: "N/A. No hay app Android propia.",
    43: "N/A. Terminal Pax con app NetPay preinstalada; no desarrollamos app Android.",
    44: "N/A. No hay proyecto Android/Gradle propio.",
    45: "N/A. No usamos integración OAuth Smart PinPad; usamos API Smart Accounts con token servidor.",
    46: "N/A. No aplica OAuth Smart PinPad.",
    47: "N/A. No aplica OAuth Smart PinPad.",
    48: "N/A. No aplica OAuth Smart PinPad.",
    49: (
        "Sí. NestJS responde HTTP 200 al recibir webhook correctamente. "
        "Errores devuelven códigos estándar 4xx/5xx según excepción NestJS."
    ),
    50: (
        "Tras cobro aplicado o devolución exitosa: POST integration-service/transactions/reprint "
        "con isSmartAccounts=true, serialNumber, storeId. "
        "Preferido: folioId (= folioNumber de venta) con orderId vacío. "
        "Fallback: reimpresión por orderId. Uso: reimprimir ticket y consulta operativa; NO para estatus de reversos."
    ),
    51: "Sí. Siempre se envía isSmartAccounts='true' en venta, cancelación y reimpresión (hardcoded en api-netpay).",
    52: (
        "Pendiente / primera certificación. Usamos voucher oficial NetPay. "
        "Completar pestaña TICKET-PERSONALIZADO si NetPay lo exige en este ciclo."
    ),
    53: (
        "Desde panel admin NetPay (permiso refunds.manage): lista ventas elegibles "
        "(mismo día CDMX, antes 20:00, aplicadas, con orderId+storeId) → POST /admin/refunds/:id/void → "
        "cancelación en terminal vía API NetPay Smart Accounts. "
        "Cancelación mismo día antes 20:00 CDMX; post-día sería devolución bancaria (fuera de alcance actual)."
    ),
    54: (
        "Sí, para reimprimir ticket tras void exitoso (desde panel admin). "
        "NO consultamos Print-Ticket antes del void; usamos orderId guardado de la venta original."
    ),
    55: (
        "Sí. Guardamos orderId del callback de venta en terminal para void. "
        "Para reimpresión usamos folioNumber como folioId (preferido) o orderId de venta. "
        "Si se requiere API Print-Ticket formal para devoluciones, usar orderId largo de esa API."
    ),
    56: (
        "Void/cancelación exitosa: responseCode='00' y transType='V'. "
        "NOTA: certificación menciona code=02 para API Print-Ticket de devoluciones; "
        "nuestro void por terminal se valida con 00+V según callback Smart Accounts cancel API."
    ),
    57: (
        "transacciones: tipo_respuesta (código ≠ 00), order_id (si viene), tarjeta, importe, folio_venta, "
        "store_id, usuario_id, company_id, traceability (payload+message), aplicado=false. "
        "log_transacciones: payload completo webhook."
    ),
    58: (
        "transacciones: tipo_respuesta='00', order_id, tarjeta, importe, folio_venta, store_id, "
        "usuario_id, company_id, traceability enriquecido. aplicado=true tras finalize Odoo exitoso. "
        "log_transacciones: payload webhook + odoo_finalize."
    ),
    59: (
        "Se infiere por tipo_respuesta vacío/null (pendiente), mensaje cancelación en traceability, "
        "o transacción sin cierre. No hay tabla específica de reverso; "
        "no consultamos reversos vía reimpresión como estatus oficial."
    ),
    60: (
        "Transacción tipo_transaccion=3 (reimprimir cobro) o registro en traceability con reprint_mode, folio_id. "
        "log_transacciones con payload reimpresión. Referencia al movimiento original conservada."
    ),
    61: (
        "Transacción tipo_transaccion=2 (cancelar cobro): tipo_respuesta, order_id original, store_id, importe, "
        "aplicado=true si void OK. Venta original: traceability devuelto=true, devolucion_transaccion_id, devolucion_at."
    ),
    62: (
        "Sí, confirmamos. Valores del webhook NetPay se persisten en BD (transacciones + log_transacciones) "
        "y se validan en operación (movimientos, devoluciones, reimpresión). "
        "Responsabilidad del comercio verificar conciliación."
    ),
}

TIPO_INTEGRACION = "API (con Smart Accounts)"
TIPO_APIS = "Print-Ticket, Devoluciones-PrintTicket"
MARCA = "Pax"

wb = openpyxl.load_workbook(SRC)
ws = wb["Cuestionario"]

answer_col = 6  # F: Respuestas DETALLADAS
tipo_col = 8
apis_col = 9
marca_col = 10
first_row = 4
last_row = 65  # Q62
wrap = Alignment(wrap_text=True, vertical="top")

def parse_qid(row: int, raw) -> int | None:
    if raw is None:
        return row - first_row + 1 if first_row <= row <= last_row else None
    if isinstance(raw, (int, float)):
        return int(raw)
    text = str(raw)
    match = re.search(r",(\d+\.?\d*)\)$", text)
    if match:
        return int(float(match.group(1)))
    return row - first_row + 1 if first_row <= row <= last_row else None

filled = 0
for r in range(first_row, last_row + 1):
    qid = parse_qid(r, ws.cell(r, 2).value)
    if qid is None or qid not in ANSWERS:
        continue

    ans_cell = ws.cell(r, answer_col)
    ans_cell.value = ANSWERS[qid]
    ans_cell.alignment = wrap
    ws.cell(r, tipo_col).value = TIPO_INTEGRACION
    ws.cell(r, apis_col).value = TIPO_APIS
    ws.cell(r, marca_col).value = MARCA
    filled += 1

ws.column_dimensions["F"].width = 80
ws.column_dimensions["C"].width = 45

wb.save(DST)
shutil.copy2(DST, DST_COPY)
print(f"Source: {SRC}")
print(f"Saved: {DST}")
print(f"Copy:  {DST_COPY}")
print(f"Questions filled: {filled}")
