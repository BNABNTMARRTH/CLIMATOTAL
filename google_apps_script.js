/**
 * GOOGLE APPS SCRIPT PARA ENCUESTA DE CLIMA LABORAL TOTALPLAY
 * Con Sistema de Seguridad de Enlace Diario Rotativo (Magic Link)
 * 
 * Instrucciones de instalación:
 * 1. Abre tu hoja de Google Sheets.
 * 2. Ve a "Extensiones" > "Apps Script".
 * 3. Reemplaza todo el código por este script.
 * 4. Ajusta la variable ADMIN_CONFIG con tu correo y la URL de tu página.
 * 5. Haz clic en "Guardar" (icono de disco).
 * 6. Haz clic en "Implementar" > "Gestionar implementaciones" > Edita y crea una "Nueva versión".
 * 7. (Opcional) Ejecuta la función "crearTriggerDiario8AM()" una sola vez para programar el envío automático diario a las 8:00 AM.
 */

// CONFIGURACIÓN DEL ADMINISTRADOR
var ADMIN_CONFIG = {
  // Clave secreta privada para generar el hash diario
  SECRET_KEY: "TOTALPLAY_CLIMA_2026_SECURE_KEY",
  
  // Puedes poner varios correos separados por comas
  ADMIN_EMAILS: "tu_correo@totalplay.com.mx, otro_admin@totalplay.com.mx",
  
  // URL pública donde está alojado tu admin.html
  ADMIN_APP_URL: "https://climatotalplay.netlify.app/admin.html"
};

/**
 * Genera el token criptográfico único para la fecha indicada (o el día de hoy)
 * Formato: TP-YYYYMMDD-XXXXXXXX
 */
function getDailyToken(optDateStr) {
  var dateStr = optDateStr || Utilities.formatDate(new Date(), "America/Mexico_City", "yyyy-MM-dd");
  var raw = dateStr + "_" + ADMIN_CONFIG.SECRET_KEY;
  var digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, raw);
  var hex = "";
  for (var i = 0; i < 4; i++) {
    var byteVal = (digest[i] < 0 ? digest[i] + 256 : digest[i]).toString(16);
    hex += (byteVal.length === 1 ? "0" : "") + byteVal;
  }
  return "TP-" + dateStr.replace(/-/g, "") + "-" + hex.toUpperCase();
}

/**
 * Envía por correo el enlace de acceso del día con diseño Totalplay
 * Se ejecuta automáticamente todos los días a las 8:00 AM mediante el Trigger
 */
function sendDailyAdminEmail() {
  var token = getDailyToken();
  var todayStr = Utilities.formatDate(new Date(), "America/Mexico_City", "dd/MM/yyyy");
  var linkUrl = ADMIN_CONFIG.ADMIN_APP_URL + "?access=" + token;

  var htmlMessage = `
    <div style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px rgba(0,0,0,0.06);">
      <div style="background: linear-gradient(135deg, #0035c5 0%, #7b2cbf 100%); padding: 32px 24px; text-align: center; color: #ffffff;">
        <h1 style="margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">Totalplay® Clima Laboral</h1>
        <p style="margin: 6px 0 0 0; font-size: 13px; opacity: 0.9; font-weight: 500;">Enlace de Acceso Diario al Panel de Administración</p>
      </div>
      <div style="padding: 32px 26px; color: #1a202c; line-height: 1.6;">
        <p style="font-size: 15px; margin-top: 0;">Hola <strong>Administrador</strong>,</p>
        <p style="font-size: 14px; color: #4a5568;">Aquí tienes tu enlace de seguridad exclusivo para consultar las respuestas consolidadas y métricas de clima laboral de hoy (<strong>${todayStr}</strong>):</p>
        
        <div style="text-align: center; margin: 32px 0;">
          <a href="${linkUrl}" target="_blank" style="background: #0035c5; color: #ffffff; text-decoration: none; padding: 15px 32px; font-size: 14px; font-weight: bold; border-radius: 50px; display: inline-block; box-shadow: 0 4px 15px rgba(0,53,197,0.35);">
            🔐 Abrir Panel de Administración
          </a>
        </div>

        <div style="background: #f7fafc; border: 1px solid #e2e8f0; border-left: 4px solid #0035c5; padding: 14px 16px; border-radius: 8px; font-size: 12px; color: #4a5568;">
          <p style="margin: 0 0 6px 0;"><strong>Código de acceso del día:</strong> <code style="font-family: monospace; background: #edf2f7; padding: 2px 6px; border-radius: 4px; font-weight: bold; color: #0035c5;">${token}</code></p>
          <span style="color: #718096; font-size: 11px;">⚠️ Este enlace expira automáticamente hoy a las 11:59 PM. Mañana a las 8:00 AM recibirás un nuevo enlace automático.</span>
        </div>
      </div>
      <div style="background: #edf2f7; padding: 16px; text-align: center; font-size: 11px; color: #718096;">
        Totalplay® 2026 - San Luis | Sistema de Seguridad Automatizado
      </div>
    </div>
  `;

  var recipients = Array.isArray(ADMIN_CONFIG.ADMIN_EMAILS)
    ? ADMIN_CONFIG.ADMIN_EMAILS.join(",")
    : (ADMIN_CONFIG.ADMIN_EMAILS || ADMIN_CONFIG.ADMIN_EMAIL);

  MailApp.sendEmail({
    to: recipients,
    subject: "🔐 Enlace Diario al Panel de Administración - Totalplay (" + todayStr + ")",
    htmlBody: htmlMessage
  });
}

/**
 * Función para programar automáticamente el envío diario a las 8:00 AM
 * Solo necesitas ejecutar esta función una vez en el editor de Apps Script.
 */
function crearTriggerDiario8AM() {
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === "sendDailyAdminEmail") {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }
  ScriptApp.newTrigger("sendDailyAdminEmail")
    .timeBased()
    .atHour(8)
    .everyDays(1)
    .inTimezone("America/Mexico_City")
    .create();
    
  Logger.log("Trigger diario a las 8:00 AM programado con éxito.");
}

// RECIBE RESPUESTAS DE LA ENCUESTA (POST)
function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("Respuestas");

    if (!sheet) {
      sheet = ss.insertSheet("Respuestas");
      sheet.appendRow([
        "ID Respuesta",
        "Fecha y Hora",
        "Área",
        "eNPS Score (0-10)",
        "Motivo eNPS",
        "Felicidad (0-10)",
        "Orgullo 1",
        "Orgullo 2",
        "Formador 1",
        "Formador 2",
        "Formador 3",
        "Formador 4",
        "Formador 5",
        "Reconocimiento 1",
        "Reconocimiento 2",
        "Reconocimiento 3",
        "Desarrollo 1",
        "Desarrollo 2",
        "Desarrollo 3",
        "Colaboración 1",
        "Colaboración 2",
        "Retribución 1",
        "Retribución 2",
        "Retribución 3",
        "Promedio Clima Individual",
        "Respuestas Completas JSON"
      ]);
      sheet.getRange(1, 1, 1, 26).setFontWeight("bold").setBackground("#0035c5").setFontColor("#ffffff");
      sheet.setFrozenRows(1);
    }

    var data = JSON.parse(e.postData.contents);
    var responses = data.responses || {};
    var areaName = responses.area || data.area || "NO ESPECIFICADO";

    var timestampStr = data.timestamp || Utilities.formatDate(new Date(), Session.getScriptTimeZone() || "America/Mexico_City", "yyyy-MM-dd HH:mm:ss");

    var rowData = [
      data.id || "RESP-" + new Date().getTime(),
      timestampStr,
      areaName,
      responses.enps !== undefined ? responses.enps : "",
      responses.enps_reason || "",
      responses.happiness !== undefined ? responses.happiness : "",
      responses.orgullo_1 || "",
      responses.orgullo_2 || "",
      responses.formador_1 || "",
      responses.formador_2 || "",
      responses.formador_3 || "",
      responses.formador_4 || "",
      responses.formador_5 || "",
      responses.reconocimiento_1 || "",
      responses.reconocimiento_2 || "",
      responses.reconocimiento_3 || "",
      responses.desarrollo_1 || "",
      responses.desarrollo_2 || "",
      responses.desarrollo_3 || "",
      responses.colaboracion_1 || "",
      responses.colaboracion_2 || "",
      responses.retribucion_1 || "",
      responses.retribucion_2 || "",
      responses.retribucion_3 || "",
      data.climateAvg || "",
      JSON.stringify(responses)
    ];

    sheet.appendRow(rowData);

    return ContentService
      .createTextOutput(JSON.stringify({ status: "success", message: "Respuesta guardada correctamente" }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: "error", message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

// CONSULTA DE RESPUESTAS PROTEGIDA CON TOKEN DIARIO (GET)
function doGet(e) {
  try {
    var reqToken = (e && e.parameter && (e.parameter.access || e.parameter.token)) || "";
    var currentToken = getDailyToken();

    // Verificación de seguridad del token diario
    if (!reqToken || reqToken.trim().toUpperCase() !== currentToken.toUpperCase()) {
      return ContentService
        .createTextOutput(JSON.stringify({ 
          status: "unauthorized", 
          authorized: false, 
          message: "Acceso denegado: El enlace de acceso no es válido o ha expirado." 
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("Respuestas");

    if (!sheet) {
      return ContentService
        .createTextOutput(JSON.stringify({ status: "success", authorized: true, total: 0, data: [] }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    var values = sheet.getDataRange().getValues();
    if (values.length <= 1) {
      return ContentService
        .createTextOutput(JSON.stringify({ status: "success", authorized: true, total: 0, data: [] }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    var data = [];

    for (var i = 1; i < values.length; i++) {
      var row = values[i];
      var jsonColIdx = row.length - 1;
      var item = {
        id: row[0],
        timestamp: row[1],
        area: row[2],
        responses: {}
      };

      if (row[jsonColIdx]) {
        try {
          item.responses = JSON.parse(row[jsonColIdx]);
          if ((!item.area || item.area === "") && item.responses.area) {
            item.area = item.responses.area;
          }
        } catch (err) {
          item.responses = {};
        }
      }
      data.push(item);
    }

    return ContentService
      .createTextOutput(JSON.stringify({ status: "success", authorized: true, total: data.length, data: data }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: "error", message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
