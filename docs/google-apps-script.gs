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
 *  4. Verificar CARPETA_ID y configurar SECRET abajo con la misma clave de GOOGLE_SCRIPT_SECRET.
 *  5. Implementar → Nueva implementación → tipo "Aplicación web"
 *       - Ejecutar como: Yo
 *       - Quién tiene acceso: Cualquier usuario
 *     Autorizar permisos de Gmail, Sheets y Drive; copiar la URL que termina en /exec.
 *  6. En Vercel configurá GOOGLE_SCRIPT_URL, GOOGLE_SCRIPT_SECRET y NEXT_PUBLIC_SITE_URL.
 *  7. Al modificar este archivo, actualizar la implementación a una nueva versión.
 *     Después, recargá la Sheet para que aparezca el menú "AEC Inscripciones".
 *
 * La organización revisa el comprobante en Drive y usa el menú "AEC Inscripciones"
 * de la Sheet para aprobar/rechazar. Pileta General y Pileta Challenger comparten un máximo
 * de 40 lugares: los pagos pendientes y aprobados reservan lugar; al rechazar un pendiente, se libera.
 * La aprobación envía por email la entrada con QR verificable. No cambies "estado"
 * manualmente: usá el menú para que el email y el token del QR queden sincronizados.
 * El código de email vence en 10 minutos, permite 5 intentos y limita los reenvíos
 * a uno por minuto y limita el formulario a 80 envíos diarios. El token verificado
 * dura hasta 6 horas. GmailApp usa la cuota diaria de la cuenta que implementa el script.
 */

const CARPETA_ID = "1hXd64YHZQtN9erK1Xsj9aR3ZztobBgU0";
const SECRET = "PEGAR_CLAVE_SECRETA";
const HOJA = "Inscripciones";
const MAX_CODIGOS_DIARIOS = 80;
const TIPOS_CUPO_PILETA = ["pileta-general", "pileta-challenger"];
const CUPO_PILETA_TOTAL = 40;
const PRECIO_PROMOCIONAL = 15000;
const PRECIO_GENERAL = 20000;

const COLUMNAS = [
  "id", "creadoEn", "estado", "tipoEntrada", "cantidad", "precioUnitario", "total",
  "nombre", "apellido", "dni", "email", "telefono", "club", "numeroSocio",
  "metodoPago", "observaciones", "comprobante", "archivoComprobante", "urlSitio", "ticketToken",
];

function obtenerHoja_() {
  const libro = SpreadsheetApp.getActiveSpreadsheet();
  let hoja = libro.getSheetByName(HOJA);
  if (!hoja) {
    hoja = libro.insertSheet(HOJA);
    hoja.appendRow(COLUMNAS);
    hoja.setFrozenRows(1);
    return hoja;
  }

  if (hoja.getLastRow() === 0) {
    hoja.appendRow(COLUMNAS);
    hoja.setFrozenRows(1);
    return hoja;
  }

  const cabeceras = hoja.getRange(1, 1, 1, Math.max(1, hoja.getLastColumn())).getValues()[0];
  COLUMNAS.forEach(function (columna) {
    if (cabeceras.indexOf(columna) === -1) {
      hoja.getRange(1, hoja.getLastColumn() + 1).setValue(columna);
      cabeceras.push(columna);
    }
  });
  return hoja;
}

function limpiarNombreArchivo_(valor) {
  return String(valor || "")
    .replace(/[\\/:*?"<>|]/g, " ")
    .replace(/[\u0000-\u001f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
}

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("AEC Inscripciones")
    .addItem("Aprobar pago y enviar entrada", "aprobarPagoSeleccionado")
    .addItem("Reenviar entrada", "reenviarEntradaSeleccionada")
    .addItem("Rechazar inscripción", "rechazarInscripcionSeleccionada")
    .addToUi();
}

function onEdit(e) {
  if (!e || !e.range || e.range.getNumRows() !== 1 || e.range.getNumColumns() !== 1 || e.range.getRow() === 1) return;
  const hoja = e.range.getSheet();
  if (hoja.getName() !== HOJA) return;

  const cabeceras = hoja.getRange(1, 1, 1, hoja.getLastColumn()).getValues()[0];
  const columnaEstado = cabeceras.indexOf("estado") + 1;
  if (e.range.getColumn() === columnaEstado && String(e.value || "").toLowerCase() === "aprobado") {
    e.range.setValue("pendiente");
    hoja.toast('Usá "AEC Inscripciones → Aprobar pago y enviar entrada" para confirmar el pago.', "Acción requerida", 8);
  }
}

function obtenerContextoFilaSeleccionada_() {
  const hoja = SpreadsheetApp.getActiveSheet();
  if (hoja.getName() !== HOJA) throw new Error('Seleccioná una fila de la hoja "Inscripciones".');

  obtenerHoja_();
  const fila = hoja.getActiveRange().getRow();
  if (fila <= 1) throw new Error("Seleccioná una fila de inscripción, no el encabezado.");

  const cabeceras = hoja.getRange(1, 1, 1, hoja.getLastColumn()).getValues()[0];
  const indices = {};
  cabeceras.forEach(function (nombre, indice) {
    indices[nombre] = indice;
  });
  const valores = hoja.getRange(fila, 1, 1, hoja.getLastColumn()).getValues()[0];
  return { hoja: hoja, fila: fila, cabeceras: cabeceras, indices: indices, valores: valores };
}

function valorFila_(contexto, columna) {
  if (columna === "urlSitio") {
    const urls = [];
    contexto.cabeceras.forEach(function (cabecera, indice) {
      if (cabecera === columna && contexto.valores[indice]) urls.push(contexto.valores[indice]);
    });
    for (let i = urls.length - 1; i >= 0; i--) {
      const url = String(urls[i]).trim().replace(/\/+$/, "");
      if (/^https:\/\/[^/]+$/i.test(url)) return url;
    }
    return urls.length ? String(urls[urls.length - 1]).trim() : "";
  }
  const indice = contexto.indices[columna];
  return indice === undefined ? "" : contexto.valores[indice];
}

function esTipoCupoPileta_(tipo) {
  return TIPOS_CUPO_PILETA.indexOf(tipo) !== -1;
}

function contarCuposPiletaReservados_(hoja, indices, filaExcluir) {
  if (hoja.getLastRow() < 2) return 0;
  const filas = hoja.getRange(2, 1, hoja.getLastRow() - 1, hoja.getLastColumn()).getValues();
  return filas.reduce(function (total, fila, indice) {
    const filaHoja = indice + 2;
    if (
      filaHoja === filaExcluir ||
      !esTipoCupoPileta_(fila[indices.tipoEntrada]) ||
      (fila[indices.estado] !== "aprobado" && fila[indices.estado] !== "pendiente")
    ) return total;
    return total + Math.max(1, Number(fila[indices.cantidad]) || 1);
  }, 0);
}

function urlEntrada_(sitioUrl, id, token) {
  const base = String(sitioUrl || "").trim().replace(/\/+$/, "");
  if (!/^https:\/\/[^/]+$/i.test(base) && !/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(base)) {
    throw new Error("Falta una URL pública válida del sitio. Configurá NEXT_PUBLIC_SITE_URL y registrá de nuevo.");
  }
  return base + "/entrada?id=" + encodeURIComponent(id) + "&token=" + encodeURIComponent(token);
}

function enviarEntrada_(contexto, token) {
  const id = String(valorFila_(contexto, "id"));
  const email = String(valorFila_(contexto, "email"));
  const nombre = [valorFila_(contexto, "nombre"), valorFila_(contexto, "apellido")].filter(Boolean).join(" ");
  const entrada = String(valorFila_(contexto, "tipoEntrada"));
  const observacion = entrada === "pileta-challenger"
    ? "El nadador de la Copa Challenger queda a observación de la organización."
    : "";
  const url = urlEntrada_(valorFila_(contexto, "urlSitio"), id, token);
  const enlace = '<a href="' + url + '" style="display:inline-block;padding:12px 20px;background:#1e3a5f;color:#fff;text-decoration:none;border-radius:8px">Ver mi entrada y QR</a>';
  GmailApp.sendEmail(
    email,
    "Pago confirmado · Entrada Copa Challenger AEC",
    "Hola " + nombre + ". Confirmamos tu pago para la Copa Challenger AEC. " + observacion + " Tu código es " + id + ". Abrí tu entrada: " + url,
    {
      name: "Atlético Echagüe Club · Natación Máster",
      htmlBody: "<p>Hola " + htmlSeguro_(nombre) + ",</p><p>Confirmamos tu pago. Tu inscripción para <strong>" + htmlSeguro_(entrada) + "</strong> ya está aprobada.</p>" + (observacion ? "<p><strong>" + htmlSeguro_(observacion) + "</strong></p>" : "") + enlace + "<p>Código de entrada: <strong>" + htmlSeguro_(id) + "</strong></p><p>El QR se valida en línea; guardá este correo para el ingreso.</p>",
    },
  );
}

function htmlSeguro_(valor) {
  return String(valor).replace(/[&<>"']/g, function (caracter) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[caracter];
  });
}

function aprobarPagoSeleccionado() {
  const ui = SpreadsheetApp.getUi();
  const lock = LockService.getScriptLock();
  let lockAdquirido = false;
  let aprobado = false;
  let titulo = "No se pudo completar la aprobación";
  let mensaje;
  try {
    lock.waitLock(20000);
    lockAdquirido = true;
    const contexto = obtenerContextoFilaSeleccionada_();
    const estado = String(valorFila_(contexto, "estado")).toLowerCase();
    if (estado !== "pendiente") throw new Error("Solo se pueden aprobar inscripciones pendientes. Si ya está aprobada, usá «Reenviar entrada».");

    const tipo = String(valorFila_(contexto, "tipoEntrada"));
    const cantidad = Math.max(1, Number(valorFila_(contexto, "cantidad")) || 1);
    const precioActual = Number(valorFila_(contexto, "precioUnitario")) || 0;
    if (esTipoCupoPileta_(tipo)) {
      const reservados = contarCuposPiletaReservados_(contexto.hoja, contexto.indices, contexto.fila);
      if (reservados + cantidad > CUPO_PILETA_TOTAL) {
        throw new Error(
          "El cupo compartido de pileta (" + CUPO_PILETA_TOTAL + " lugares) ya está completo: no se puede aprobar esta inscripción. " +
            "Coordiná con la persona y rechazá esta fila si corresponde.",
        );
      }
    }
    if (tipo === "pileta-challenger") {
      if (precioActual < PRECIO_PROMOCIONAL) {
        throw new Error("El precio registrado es menor al de Pileta Challenger. Revisalo antes de aprobar.");
      }
    }

    const token = Utilities.getUuid() + Utilities.getUuid();
    contexto.hoja.getRange(contexto.fila, contexto.indices.estado + 1).setValue("aprobado");
    contexto.hoja.getRange(contexto.fila, contexto.indices.ticketToken + 1).setValue(token);
    SpreadsheetApp.flush();
    aprobado = true;
    enviarEntrada_(contexto, token);
    titulo = "Pago aprobado";
    mensaje = "Entrada enviada a " + valorFila_(contexto, "email") + ".";
  } catch (error) {
    const detalle = error instanceof Error ? error.message : String(error);
    mensaje = aprobado
      ? "El pago quedó aprobado, pero no se pudo enviar el email. Usá «Reenviar entrada». Detalle: " + detalle
      : detalle;
  } finally {
    if (lockAdquirido) lock.releaseLock();
  }
  ui.alert(titulo, mensaje || "Ocurrió un error inesperado.", ui.ButtonSet.OK);
}

function reenviarEntradaSeleccionada() {
  const ui = SpreadsheetApp.getUi();
  try {
    const contexto = obtenerContextoFilaSeleccionada_();
    if (String(valorFila_(contexto, "estado")).toLowerCase() !== "aprobado") {
      throw new Error("La inscripción todavía no está aprobada.");
    }
    const token = String(valorFila_(contexto, "ticketToken") || "");
    if (!token) throw new Error("Esta inscripción no tiene una entrada emitida. Usá «Aprobar pago y enviar entrada».");
    enviarEntrada_(contexto, token);
    ui.alert("Entrada reenviada a " + valorFila_(contexto, "email") + ".");
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : String(error);
    ui.alert("No se pudo reenviar la entrada", mensaje, ui.ButtonSet.OK);
  }
}

function rechazarInscripcionSeleccionada() {
  const ui = SpreadsheetApp.getUi();
  const lock = LockService.getScriptLock();
  let lockAdquirido = false;
  let titulo = "No se pudo rechazar la inscripción";
  let mensaje;
  try {
    lock.waitLock(20000);
    lockAdquirido = true;
    const contexto = obtenerContextoFilaSeleccionada_();
    if (String(valorFila_(contexto, "estado")).toLowerCase() !== "pendiente") {
      throw new Error("Solo se pueden rechazar inscripciones pendientes.");
    }
    contexto.hoja.getRange(contexto.fila, contexto.indices.estado + 1).setValue("rechazado");
    titulo = "Inscripción rechazada";
    mensaje = "No ocupa cupo de pileta.";
  } catch (error) {
    mensaje = error instanceof Error ? error.message : String(error);
  } finally {
    if (lockAdquirido) lock.releaseLock();
  }
  ui.alert(titulo, mensaje || "Ocurrió un error inesperado.", ui.ButtonSet.OK);
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

      if (esTipoCupoPileta_(r.tipoEntrada)) {
        const hojaCupo = obtenerHoja_();
        const datosCupo = hojaCupo.getDataRange().getValues();
        const cabCupo = datosCupo.shift();
        const iT = cabCupo.indexOf("tipoEntrada");
        const iE = cabCupo.indexOf("estado");
        const iC = cabCupo.indexOf("cantidad");
        const reservados = datosCupo.reduce(function (total, fila) {
          if (!esTipoCupoPileta_(fila[iT]) || (fila[iE] !== "aprobado" && fila[iE] !== "pendiente")) return total;
          return total + Math.max(1, Number(fila[iC]) || 1);
        }, 0);
        if (reservados + Math.max(1, Number(r.cantidad) || 1) > CUPO_PILETA_TOTAL) {
          return json_({ ok: false, error: "CUPO_COMPLETO" });
        }
      }

      const persona = limpiarNombreArchivo_([r.nombre, r.apellido].filter(Boolean).join(" ")) || "Inscripto";
      const nombreOriginal = limpiarNombreArchivo_(a.nombre) || "comprobante";
      const nombreArchivo = "Comprobante de " + persona + " - " + r.id + " - " + nombreOriginal;
      const blob = Utilities.newBlob(Utilities.base64Decode(a.base64), a.tipo, nombreArchivo);
      const archivo = DriveApp.getFolderById(CARPETA_ID).createFile(blob);

      const fila = COLUMNAS.map(function (col) {
        if (col === "comprobante") return archivo.getUrl();
        if (col === "archivoComprobante") return nombreArchivo;
        if (col === "urlSitio") return body.urlSitio;
        if (col === "ticketToken") return "";
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
    const iCantidad = cab.indexOf("cantidad");
    const ocupados = datos.reduce(function (total, fila) {
      if (!esTipoCupoPileta_(fila[iTipo]) || fila[iEstado] !== "aprobado") return total;
      return total + Math.max(1, Number(iCantidad >= 0 ? fila[iCantidad] : 1) || 1);
    }, 0);
    const pendientes = datos.reduce(function (total, fila) {
      if (!esTipoCupoPileta_(fila[iTipo]) || fila[iEstado] !== "pendiente") return total;
      return total + Math.max(1, Number(iCantidad >= 0 ? fila[iCantidad] : 1) || 1);
    }, 0);
    return json_({ tipo: "pileta", ocupados: ocupados, pendientes: pendientes });
  }

  if (p.action === "ticket") return obtenerEntrada_(p);

  return json_({ error: "Acción desconocida" });
}

function obtenerEntrada_(parametros) {
  const hoja = obtenerHoja_();
  if (hoja.getLastRow() < 2) return json_({ ok: false });

  const cabeceras = hoja.getRange(1, 1, 1, hoja.getLastColumn()).getValues()[0];
  const indices = {};
  cabeceras.forEach(function (nombre, indice) {
    indices[nombre] = indice;
  });
  const filas = hoja.getRange(2, 1, hoja.getLastRow() - 1, hoja.getLastColumn()).getValues();
  const fila = filas.find(function (valores) {
    return String(valores[indices.id]) === String(parametros.id);
  });
  if (!fila || fila[indices.estado] !== "aprobado" || fila[indices.ticketToken] !== parametros.token) {
    return json_({ ok: false });
  }
  const contexto = { cabeceras: cabeceras, indices: indices, valores: fila };

  return json_({
    ok: true,
    ticket: {
      id: fila[indices.id],
      nombre: fila[indices.nombre],
      apellido: fila[indices.apellido],
      tipoEntrada: fila[indices.tipoEntrada],
      cantidad: Number(fila[indices.cantidad]) || 1,
      total: Number(fila[indices.total]) || 0,
      urlSitio: valorFila_(contexto, "urlSitio"),
    },
  });
}
