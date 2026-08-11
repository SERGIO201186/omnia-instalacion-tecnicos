/**
 * Backend de seguimiento de instalaciones — Omnia Technology
 * ============================================================
 * Agrega estas dos acciones a tu proyecto de Apps Script existente
 * (el mismo que ya usa el Portal de Cliente para 'products', 'supportTicket',
 * 'requestMagicLink', etc.). Si ya tienes un router doPost/doGet con un
 * switch(action), solo copia los casos 'installationReport' y
 * 'listInstallations' ahí y pega las funciones de abajo en cualquier parte
 * del archivo. Si es tu primer script, usa el doPost/doGet de ejemplo al
 * final (bórralo si ya tienes uno propio para no duplicar el punto de entrada).
 *
 * Qué hace:
 *  - installationReport: guarda cada instalación reportada desde
 *    index.html (checklist + firma del cliente) como una fila en la hoja
 *    "Instalaciones", y la firma como imagen en Drive.
 *  - listInstallations: devuelve todas las instalaciones guardadas, para
 *    que seguimiento.html las liste.
 */

const INSTALACIONES_SHEET_NAME = 'Instalaciones';
const INSTALACIONES_SIGNATURES_FOLDER_NAME = 'Firmas_Instalaciones';

const INSTALACIONES_HEADERS = [
  'folio', 'submittedAt', 'clientId', 'clientName', 'app', 'rfc', 'telefono',
  'emailAdmin', 'technicianName', 'technicianEmail', 'apiUrlDesplegada',
  'signerName', 'signerRole', 'stepsDone', 'stepsTotal', 'completionPercent',
  'checklistJson', 'signatureUrl'
];

function getInstalacionesSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(INSTALACIONES_SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(INSTALACIONES_SHEET_NAME);
    sheet.appendRow(INSTALACIONES_HEADERS);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function getSignaturesFolder_() {
  const folders = DriveApp.getFoldersByName(INSTALACIONES_SIGNATURES_FOLDER_NAME);
  if (folders.hasNext()) return folders.next();
  return DriveApp.createFolder(INSTALACIONES_SIGNATURES_FOLDER_NAME);
}

/**
 * payload viene del fetch() de index.html — ver submitInstallation() en el HTML
 * para el shape exacto. Devuelve {ok:true, folio} o {error:'mensaje'}.
 */
function handleInstallationReport(payload) {
  try {
    if (!payload || !payload.folio || !payload.clientId) {
      return { error: 'Falta folio o clientId en el reporte de instalación.' };
    }

    let signatureUrl = '';
    if (payload.signatureDataUrl && payload.signatureDataUrl.indexOf('base64,') > -1) {
      const base64 = payload.signatureDataUrl.split('base64,')[1];
      const bytes = Utilities.base64Decode(base64);
      const blob = Utilities.newBlob(bytes, 'image/png', `${payload.folio}.png`);
      const file = getSignaturesFolder_().createFile(blob);
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      signatureUrl = file.getUrl();
    }

    const sheet = getInstalacionesSheet_();
    sheet.appendRow([
      payload.folio,
      payload.submittedAt || new Date().toISOString(),
      payload.clientId || '',
      payload.clientName || '',
      payload.app || '',
      payload.rfc || '',
      payload.telefono || '',
      payload.emailAdmin || '',
      payload.technicianName || '',
      payload.technicianEmail || '',
      payload.apiUrlDesplegada || '',
      payload.signerName || '',
      payload.signerRole || '',
      payload.stepsDone || 0,
      payload.stepsTotal || 0,
      payload.completionPercent || 0,
      JSON.stringify(payload.checklist || {}),
      signatureUrl
    ]);

    return { ok: true, folio: payload.folio, signatureUrl };
  } catch (err) {
    return { error: String(err) };
  }
}

/**
 * Devuelve todas las instalaciones como array de objetos, para
 * seguimiento.html. Incluye signatureDataUrl solo si tienes la imagen en
 * Drive (se referencia por URL, no se re-descarga como base64, para no
 * hacer la respuesta pesada).
 */
function handleListInstallations() {
  const sheet = getInstalacionesSheet_();
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  const headers = data[0];
  const rows = data.slice(1);
  return rows.map(row => {
    const obj = {};
    headers.forEach((h, i) => { obj[h] = row[i]; });
    obj.completionPercent = Number(obj.completionPercent) || 0;
    obj.stepsDone = Number(obj.stepsDone) || 0;
    obj.stepsTotal = Number(obj.stepsTotal) || 0;
    try { obj.checklist = JSON.parse(obj.checklistJson || '{}'); } catch (e) { obj.checklist = {}; }
    delete obj.checklistJson;
    // seguimiento.html espera "signatureDataUrl" para mostrar la imagen;
    // aquí le pasamos el link de Drive directo (basta para <img src>).
    obj.signatureDataUrl = obj.signatureUrl || null;
    return obj;
  });
}

/* =========================================================================
 * SOLO SI NO TIENES UN ROUTER doPost/doGet TODAVÍA.
 * Si ya tienes uno (el que usa el Portal de Cliente), BORRA este bloque y
 * agrega los dos "case" de arriba a tu switch(action) existente en su lugar.
 * ========================================================================= */
function doPost(e) {
  const payload = JSON.parse(e.postData.contents);
  let result;
  switch (payload.action) {
    case 'installationReport':
      result = handleInstallationReport(payload);
      break;
    default:
      result = { error: 'Acción no reconocida: ' + payload.action };
  }
  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  const action = e.parameter.action;
  let result;
  switch (action) {
    case 'listInstallations':
      result = handleListInstallations();
      break;
    default:
      result = { error: 'Acción no reconocida: ' + action };
  }
  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}
