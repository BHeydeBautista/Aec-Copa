/**
 * Backend de inscripciones Copa Challenger AEC — Google Apps Script
 * ------------------------------------------------------------------
 * Guarda cada inscripción en una hoja de cálculo y el comprobante en una carpeta de Drive.
 *
 * INSTALACIÓN (5 minutos, con la cuenta Google del club):
 *  1. Crear una Google Sheet nueva (ej: "Inscripciones Copa Challenger").
 *  2. Crear una carpeta en Drive para los comprobantes y copiar su ID (lo que sigue a /folders/ en la URL).
 *  3. En la Sheet: Extensiones → Apps Script. Pegar TODO este archivo.
 *  4. Completar CARPETA_ID y SECRET abajo (SECRET = cualquier texto largo inventado).
 *  5. Implementar → Nueva implementación → tipo "Aplicación web"
 *       - Ejecutar como: Yo
 *       - Quién tiene acceso: Cualquier usuario
 *     Autorizar permisos y copiar la URL que termina en /exec.
 *  6. En Vercel (o .env.local): GOOGLE_SCRIPT_URL=<url /exec>  y  GOOGLE_SCRIPT_SECRET=<el mismo SECRET>.
 *
 * Para aprobar/rechazar un pago, cambiá la columna "estado" en la Sheet
 * (pendiente / aprobado / rechazado). Los "rechazado" liberan cupo.
 */

const CARPETA_ID = "PEGAR_ID_DE_CARPETA_DRIVE";
const SECRET = "PEGAR_CLAVE_SECRETA";
const HOJA = "Inscripciones";

const COLUMNAS = [
  "id", "creadoEn", "estado", "tipoEntrada", "cantidad", "precioUnitario", "total",
  "nombre", "apellido", "dni", "email", "telefono", "club", "numeroSocio",
  "metodoPago", "observaciones", "comprobante",
];

function obtenerHoja_() {
  const libro = SpreadsheetApp.getActiveSpreadsheet();
  let hoja = libro.getSheetByName(HOJA);
  if (!hoja) {
    hoja = libro.insertSheet(HOJA);
    hoja.appendRow(COLUMNAS);
    hoja.setFrozenRows(1);
  }
  return hoja;
}

function json_(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    if (body.secret !== SECRET) return json_({ ok: false, error: "No autorizado" });
    if (body.action !== "inscripcion") return json_({ ok: false, error: "Acción desconocida" });

    const r = body.registro;
    const a = body.archivo;

    const lock = LockService.getScriptLock();
    lock.waitLock(20000);
    try {
      const blob = Utilities.newBlob(Utilities.base64Decode(a.base64), a.tipo, r.id + "_" + a.nombre);
      const archivo = DriveApp.getFolderById(CARPETA_ID).createFile(blob);

      const fila = COLUMNAS.map(function (col) {
        if (col === "comprobante") return archivo.getUrl();
        if (col === "dni" || col === "telefono") return "'" + (r[col] || ""); // conservar ceros
        return r[col] === undefined || r[col] === null ? "" : r[col];
      });
      obtenerHoja_().appendRow(fila);
    } finally {
      lock.releaseLock();
    }

    return json_({ ok: true, id: r.id });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

function doGet(e) {
  const p = e.parameter || {};
  if (p.secret !== SECRET) return json_({ error: "No autorizado" });

  if (p.action === "cupos") {
    const datos = obtenerHoja_().getDataRange().getValues();
    const cab = datos.shift();
    const iTipo = cab.indexOf("tipoEntrada");
    const iEstado = cab.indexOf("estado");
    const ocupados = datos.filter(function (f) {
      return f[iTipo] === p.tipo && f[iEstado] !== "rechazado";
    }).length;
    return json_({ ocupados: ocupados });
  }

  return json_({ error: "Acción desconocida" });
}
