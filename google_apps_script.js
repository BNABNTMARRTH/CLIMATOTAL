/**
 * GOOGLE APPS SCRIPT PARA ENCUESTA DE CLIMA LABORAL TOTALPLAY
 * 
 * Instrucciones de instalación:
 * 1. Abre tu hoja de Google Sheets.
 * 2. Ve a "Extensiones" > "Apps Script".
 * 3. Borra todo el código que aparezca y pega este script.
 * 4. Haz clic en "Guardar" (icono de disco).
 * 5. Haz clic en "Implementar" > "Nueva implementación".
 * 6. Selecciona el tipo "Aplicación web".
 * 7. En "Ejecutar como", selecciona "Yo".
 * 8. En "Quién tiene acceso", selecciona "Cualquier persona" (Anyone).
 * 9. Haz clic en "Implementar", autoriza los permisos y COPIA la URL de la aplicación web.
 * 10. Pega esa URL en tu index.html en la constante SCRIPT_URL.
 */

// Permite peticiones POST desde la encuesta web
function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    // Espera hasta 10 segundos si entran varias respuestas simultáneas
    lock.waitLock(10000);

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("Respuestas");

    // Si la pestaña no existe, se crea con sus encabezados
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

// Permite peticiones GET para consultar todas las respuestas en la vista de Dashboard Global del proyecto
function doGet(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("Respuestas");

    if (!sheet) {
      return ContentService
        .createTextOutput(JSON.stringify({ status: "success", total: 0, data: [] }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    var values = sheet.getDataRange().getValues();
    if (values.length <= 1) {
      return ContentService
        .createTextOutput(JSON.stringify({ status: "success", total: 0, data: [] }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    var headers = values[0];
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

      // Si la columna JSON existe, parsearla
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
      .createTextOutput(JSON.stringify({ status: "success", total: data.length, data: data }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: "error", message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
