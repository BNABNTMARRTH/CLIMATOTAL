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
  
  // correos separados por comas
  ADMIN_EMAILS: "dissobente@gmail.com, armando.sanchez@totalplay.com.mx",
  
  // URL pública donde está alojado tu admin.html
  ADMIN_APP_URL: "https://encuesta-totalplay-sanluis.netlify.app/admin.html"
};

/**
 * Obtiene el identificador del domingo de inicio de la semana actual
 */
function getSundayWeekStart(optDate) {
  var d = optDate ? new Date(optDate) : new Date();
  var tz = "America/Mexico_City";
  var dayOfWeek = parseInt(Utilities.formatDate(d, tz, "u"), 10); // 1 = Lunes, ..., 7 = Domingo
  var diffDays = (dayOfWeek === 7) ? 0 : dayOfWeek;
  var sundayTime = d.getTime() - (diffDays * 24 * 60 * 60 * 1000);
  return Utilities.formatDate(new Date(sundayTime), tz, "yyyyMMdd");
}

/**
 * Genera el token criptográfico semanal
 * Válido durante toda la semana (de domingo a domingo)
 * Formato: TP-SEM-YYYYMMDD-XXXXXXXX
 */
function getWeeklyToken(optDate) {
  var sundayStr = getSundayWeekStart(optDate);
  var raw = "WEEKLY_" + sundayStr + "_" + ADMIN_CONFIG.SECRET_KEY;
  var digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, raw);
  var hex = "";
  for (var i = 0; i < 4; i++) {
    var byteVal = (digest[i] < 0 ? digest[i] + 256 : digest[i]).toString(16);
    hex += (byteVal.length === 1 ? "0" : "") + byteVal;
  }
  return "TP-SEM-" + sundayStr + "-" + hex.toUpperCase();
}

/**
 * Envía por correo el enlace de acceso semanal con diseño Totalplay
 * Se ejecuta automáticamente todos los domingos a las 12:00 AM mediante el Trigger
 */
function sendWeeklyAdminEmail() {
  var token = getWeeklyToken();
  var todayStr = Utilities.formatDate(new Date(), "America/Mexico_City", "dd/MM/yyyy");
  var linkUrl = ADMIN_CONFIG.ADMIN_APP_URL + "?access=" + token;

  var htmlMessage = `
    <div style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px rgba(0,0,0,0.06);">
      <div style="background: linear-gradient(135deg, #0035c5 0%, #7b2cbf 100%); padding: 32px 24px; text-align: center; color: #ffffff;">
        <h1 style="margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">Totalplay® Clima Laboral</h1>
        <p style="margin: 6px 0 0 0; font-size: 13px; opacity: 0.9; font-weight: 500;">Enlace de Acceso Semanal al Panel de Administración</p>
      </div>
      <div style="padding: 32px 26px; color: #1a202c; line-height: 1.6;">
        <p style="font-size: 15px; margin-top: 0;">Hola <strong>Administrador</strong>,</p>
        <p style="font-size: 14px; color: #4a5568;">Aquí tienes tu enlace de seguridad exclusivo correspondiente a la semana del <strong>${todayStr}</strong> para consultar métricas, respuestas y comentarios de clima laboral:</p>
        
        <div style="text-align: center; margin: 32px 0;">
          <a href="${linkUrl}" target="_blank" style="background: #0035c5; color: #ffffff; text-decoration: none; padding: 15px 32px; font-size: 14px; font-weight: bold; border-radius: 50px; display: inline-block; box-shadow: 0 4px 15px rgba(0,53,197,0.35);">
            🔐 Abrir Panel de Administración
          </a>
        </div>

        <div style="background: #f7fafc; border: 1px solid #e2e8f0; border-left: 4px solid #0035c5; padding: 14px 16px; border-radius: 8px; font-size: 12px; color: #4a5568;">
          <p style="margin: 0 0 6px 0;"><strong>Código de acceso de la semana:</strong> <code style="font-family: monospace; background: #edf2f7; padding: 2px 6px; border-radius: 4px; font-weight: bold; color: #0035c5;">${token}</code></p>
          <span style="color: #718096; font-size: 11px;">ℹ️ Este enlace tiene vigencia de 7 días. El próximo domingo a las 12:00 AM recibirás tu nuevo enlace semanal.</span>
        </div>
      </div>
      <div style="background: #edf2f7; padding: 16px; text-align: center; font-size: 11px; color: #718096;">
        Totalplay® 2026 - Región Norponiente | Sistema de Seguridad Automatizado
      </div>
    </div>
  `;

  var recipients = Array.isArray(ADMIN_CONFIG.ADMIN_EMAILS)
    ? ADMIN_CONFIG.ADMIN_EMAILS.join(",")
    : (ADMIN_CONFIG.ADMIN_EMAILS || ADMIN_CONFIG.ADMIN_EMAIL);

  MailApp.sendEmail({
    to: recipients,
    subject: "🔐 Enlace Semanal al Panel de Administración - Totalplay (" + todayStr + ")",
    htmlBody: htmlMessage
  });
}

/**
 * Programar automáticamente el envío semanal cada DOMINGO a las 12:00 AM (Medianoche)
 * Ejecuta esta función una sola vez desde el editor de Apps Script.
 */
function crearTriggerSemanalDomingo12AM() {
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    var fnName = triggers[i].getHandlerFunction();
    if (fnName === "sendWeeklyAdminEmail" || fnName === "sendDailyAdminEmail") {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }
  ScriptApp.newTrigger("sendWeeklyAdminEmail")
    .timeBased()
    .onWeekDay(ScriptApp.WeekDay.SUNDAY)
    .atHour(0)
    .inTimezone("America/Mexico_City")
    .create();
    
  Logger.log("✅ Trigger semanal programado con éxito: Todos los domingos a las 12:00 AM.");
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
        "Distrito",
        "eNPS Score (1-10)",
        "Motivo eNPS",
        "Felicidad (1-10)",
        "Motivo Felicidad",
        "Orgullo 1",
        "Orgullo 2",
        "Orgullo 3",
        "Orgullo 4",
        "Formador 1",
        "Formador 2",
        "Formador 3",
        "Formador 4",
        "Formador 5",
        "Reconocimiento 1",
        "Reconocimiento 2",
        "Reconocimiento 3",
        "Reconocimiento 4",
        "Reconocimiento 5",
        "Reconocimiento 6",
        "Desarrollo 1",
        "Desarrollo 2",
        "Desarrollo 3",
        "Desarrollo 4",
        "Colaboración 1",
        "Colaboración 2",
        "Retribución 1",
        "Retribución 2",
        "Retribución 3",
        "Retribución 4",
        "Retribución 5",
        "Promedio Clima Individual",
        "Respuestas Completas JSON"
      ]);
      sheet.getRange(1, 1, 1, 36).setFontWeight("bold").setBackground("#0035c5").setFontColor("#ffffff");
      sheet.setFrozenRows(1);
    }

    var data = JSON.parse(e.postData.contents);
    var responses = data.responses || {};
    var areaName = responses.area || data.area || "NO ESPECIFICADO";
    var distritoName = responses.distrito || data.distrito || "NO ESPECIFICADO";

    var timestampStr = data.timestamp || Utilities.formatDate(new Date(), Session.getScriptTimeZone() || "America/Mexico_City", "yyyy-MM-dd HH:mm:ss");

    var rowData = [
      data.id || "RESP-" + new Date().getTime(),
      timestampStr,
      areaName,
      distritoName,
      responses.enps !== undefined ? responses.enps : "",
      responses.enps_reason || "",
      responses.happiness !== undefined ? responses.happiness : "",
      responses.happiness_reason || "",
      responses.orgullo_1 || "",
      responses.orgullo_2 || "",
      responses.orgullo_3 || "",
      responses.orgullo_4 || "",
      responses.formador_1 || "",
      responses.formador_2 || "",
      responses.formador_3 || "",
      responses.formador_4 || "",
      responses.formador_5 || "",
      responses.reconocimiento_1 || "",
      responses.reconocimiento_2 || "",
      responses.reconocimiento_3 || "",
      responses.reconocimiento_4 || "",
      responses.reconocimiento_5 || "",
      responses.reconocimiento_6 || "",
      responses.desarrollo_1 || "",
      responses.desarrollo_2 || "",
      responses.desarrollo_3 || "",
      responses.desarrollo_4 || "",
      responses.colaboracion_1 || "",
      responses.colaboracion_2 || "",
      responses.retribucion_1 || "",
      responses.retribucion_2 || "",
      responses.retribucion_3 || "",
      responses.retribucion_4 || "",
      responses.retribucion_5 || "",
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

// CONSULTA DE RESPUESTAS PROTEGIDA CON TOKEN SEMANAL (GET)
function doGet(e) {
  try {
    var reqToken = (e && e.parameter && (e.parameter.access || e.parameter.token)) || "";
    var weeklyToken = getWeeklyToken();

    // Verificación de seguridad del token semanal
    var isAuthorized = reqToken && (reqToken.trim().toUpperCase() === weeklyToken.toUpperCase());

    if (!isAuthorized) {
      return ContentService
        .createTextOutput(JSON.stringify({ 
          status: "unauthorized", 
          authorized: false, 
          message: "Acceso denegado: El enlace de acceso semanal no es válido o ha expirado." 
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
        distrito: row[3],
        responses: {}
      };

      if (row[jsonColIdx]) {
        try {
          item.responses = JSON.parse(row[jsonColIdx]);
          if ((!item.area || item.area === "") && item.responses.area) {
            item.area = item.responses.area;
          }
          if ((!item.distrito || item.distrito === "") && item.responses.distrito) {
            item.distrito = item.responses.distrito;
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
