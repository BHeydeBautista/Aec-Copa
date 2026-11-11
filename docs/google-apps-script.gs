/**
 * Backend de inscripciones Copa Challenger AEC — Google Apps Script
 * ------------------------------------------------------------------
 * Verifica el email, guarda cada inscripción en una hoja de cálculo
 * y el comprobante en una carpeta de Drive.
 *
 * INSTALACIÓN (5 minutos, con la cuenta Google del club):
 *  1. Crear una Google Sheet nueva (ej: "Inscripciones Copa Challenger").
 *  2. Crear una carpeta en Drive para los comprobantes y copiar su ID (lo que sigue a /folders/ en la URL).
 *  3. En la Sheet: Extensiones → Apps Script. Pegar TODO este archivo.
 *  4. Completar CARPETA_ID y SECRET abajo (SECRET = cualquier texto largo inventado).
 *  5. Implementar → Nueva implementación → tipo "Aplicación web"
 *       - Ejecutar como: Yo
 *       - Quién tiene acceso: Cualquier usuario
 *     Autorizar permisos de Gmail, Sheets y Drive; copiar la URL que termina en /exec.
 *  6. En Vercel (o .env.local): GOOGLE_SCRIPT_URL=<url /exec>  y  GOOGLE_SCRIPT_SECRET=<el mismo SECRET>.
 *  7. Al modificar este archivo, actualizar la implementación a una nueva versión.
 *
 * Para aprobar/rechazar un pago, cambiá la columna "estado" en la Sheet
 * (pendiente / aprobado / rechazado). Los "rechazado" liberan cupo.
 * El código de email vence en 10 minutos, permite 5 intentos y limita los reenvíos
 * a uno por minuto y limita el formulario a 80 envíos diarios. El token verificado
 * dura hasta 6 horas. GmailApp usa la cuota diaria de la cuenta que implementa el script.
 */

const CARPETA_ID = "PEGAR_ID_DE_CARPETA_DRIVE";
const SECRET = "PEGAR_CLAVE_SECRETA";
const HOJA = "Inscripciones";
const MAX_CODIGOS_DIARIOS = 80;

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

    if (body.action === "solicitar-codigo-email") return solicitarCodigoEmail_(body);
    if (body.action === "confirmar-codigo-email") return confirmarCodigoEmail_(body);
    if (body.action !== "inscripcion") return json_({ ok: false, error: "Acción desconocida" });

    const r = body.registro;
    const a = body.archivo;
    const tokenEmail = body.emailVerificationToken;

    const lock = LockService.getScriptLock();
    lock.waitLock(20000);
    try {
      if (!tokenEmail || CacheService.getScriptCache().get(claveTokenEmail_(r.email)) !== tokenEmail) {
        return json_({ ok: false, error: "El email no está verificado o venció la verificación. Verificalo nuevamente." });
      }

      const blob = Utilities.newBlob(Utilities.base64Decode(a.base64), a.tipo, r.id + "_" + a.nombre);
      const archivo = DriveApp.getFolderById(CARPETA_ID).createFile(blob);

      const fila = COLUMNAS.map(function (col) {
        if (col === "comprobante") return archivo.getUrl();
        if (col === "dni" || col === "telefono") return "'" + (r[col] || ""); // conservar ceros
        return r[col] === undefined || r[col] === null ? "" : r[col];
      });
      obtenerHoja_().appendRow(fila);
      CacheService.getScriptCache().remove(claveTokenEmail_(r.email));
    } finally {
      lock.releaseLock();
    }

    return json_({ ok: true, id: r.id });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

function claveEmail_(email) {
  const digest = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    String(email).trim().toLowerCase(),
  );
  return Utilities.base64EncodeWebSafe(digest).replace(/=+$/, "");
}

function claveTokenEmail_(email) {
  return "email-verificado:" + claveEmail_(email);
}

function hashCodigoEmail_(email, codigo) {
  const digest = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    SECRET + ":" + String(email).trim().toLowerCase() + ":" + codigo,
  );
  return Utilities.base64EncodeWebSafe(digest);
}

function reservarCuotaEmail_() {
  const lock = LockService.getScriptLock();
  lock.waitLock(5000);
  try {
    const propiedades = PropertiesService.getScriptProperties();
    const hoy = Utilities.formatDate(new Date(), "America/Argentina/Buenos_Aires", "yyyy-MM-dd");
    if (propiedades.getProperty("email-verificacion-fecha") !== hoy) {
      propiedades.setProperty("email-verificacion-fecha", hoy);
      propiedades.setProperty("email-verificacion-cantidad", "0");
    }

    const cantidad = Number(propiedades.getProperty("email-verificacion-cantidad") || 0);
    if (cantidad >= MAX_CODIGOS_DIARIOS) return false;
    propiedades.setProperty("email-verificacion-cantidad", String(cantidad + 1));
    return true;
  } finally {
    lock.releaseLock();
  }
}

function liberarCuotaEmail_() {
  const lock = LockService.getScriptLock();
  lock.waitLock(5000);
  try {
    const propiedades = PropertiesService.getScriptProperties();
    const cantidad = Number(propiedades.getProperty("email-verificacion-cantidad") || 0);
    propiedades.setProperty("email-verificacion-cantidad", String(Math.max(0, cantidad - 1)));
  } finally {
    lock.releaseLock();
  }
}

function solicitarCodigoEmail_(body) {
  const email = String(body.email || "").trim().toLowerCase();
  const codigo = String(body.codigo || "");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !/^\d{6}$/.test(codigo)) {
    return json_({ ok: false, error: "Email o código inválido." });
  }

  const cache = CacheService.getScriptCache();
  const prefijo = "verificacion-email:" + claveEmail_(email);
  if (cache.get(prefijo + ":espera")) {
    return json_({ ok: false, error: "Esperá un minuto antes de pedir otro código." });
  }
  if (!reservarCuotaEmail_()) {
    return json_({ ok: false, error: "Se alcanzó el límite diario de códigos. Contactá a la organización." });
  }

  cache.put(prefijo + ":hash", hashCodigoEmail_(email, codigo), 600);
  cache.put(prefijo + ":intentos", "0", 600);
  cache.put(prefijo + ":espera", "1", 60);
  cache.remove(claveTokenEmail_(email));

  try {
    GmailApp.sendEmail(
      email,
      "Tu código para la inscripción · Copa Challenger AEC",
      "Tu código de verificación es: " + codigo + "\n\nVence en 10 minutos. Si no solicitaste este código, podés ignorar este mensaje.",
      { name: "Atlético Echagüe Club · Natación Máster" },
    );
    return json_({ ok: true });
  } catch (error) {
    cache.remove(prefijo + ":hash");
    cache.remove(prefijo + ":intentos");
    cache.remove(prefijo + ":espera");
    liberarCuotaEmail_();
    throw error;
  }
}

function confirmarCodigoEmail_(body) {
  const email = String(body.email || "").trim().toLowerCase();
  const codigo = String(body.codigo || "");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !/^\d{6}$/.test(codigo)) {
    return json_({ ok: false, error: "Revisá el email y el código ingresados." });
  }

  const cache = CacheService.getScriptCache();
  const prefijo = "verificacion-email:" + claveEmail_(email);
  const codigoGuardado = cache.get(prefijo + ":hash");
  if (!codigoGuardado) {
    return json_({ ok: false, error: "El código venció. Volvé a solicitar uno nuevo." });
  }

  const intentos = Number(cache.get(prefijo + ":intentos") || 0);
  if (intentos >= 5) {
    cache.remove(prefijo + ":hash");
    cache.remove(prefijo + ":intentos");
    return json_({ ok: false, error: "Superaste los intentos. Solicitá un código nuevo." });
  }

  if (hashCodigoEmail_(email, codigo) !== codigoGuardado) {
    cache.put(prefijo + ":intentos", String(intentos + 1), 600);
    return json_({ ok: false, error: "El código no coincide. Revisalo e intentá otra vez." });
  }

  const token = Utilities.getUuid() + Utilities.getUuid();
  cache.put(claveTokenEmail_(email), token, 21600);
  cache.remove(prefijo + ":hash");
  cache.remove(prefijo + ":intentos");
  return json_({ ok: true, token: token });
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
