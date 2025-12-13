/**
 * Importar módulos necesarios
 */
const { onRequest } = require("firebase-functions/v2/https");
const { getStorage } = require("firebase-admin/storage");
const { initializeApp } = require("firebase-admin/app");
// const { getAppCheck } = require("firebase-admin/app-check"); // Importar App Check (YA NO SE USA)
const logger = require("firebase-functions/logger");

// Inicializa la app de Admin. Esto es requerido para App Check y Storage.
try {
  initializeApp();
  logger.info("Aplicación de Firebase Admin inicializada.");
} catch (e) {
  logger.warn("La aplicación de Firebase Admin ya estaba inicializada:", e.message);
}

// --- Constantes de Configuración ---
const BUCKET_NAME = "sbx-relojes-web-stg-fmdzxpsv8t73fbgyq2i3c";
const SERVICE_ACCOUNT_EMAIL = "326032897645-compute@developer.gserviceaccount.com";

/**
 * Cloud Function: getSignedUrl
 * * Expone un endpoint HTTP que:
 * 1. (SE HA ELIMINADO) Verificación de App Check.
 * 2. Genera una URL firmada (temporal) para un archivo en un bucket privado.
 */
exports.getSignedUrl = onRequest(
  { cors: true }, // Habilita CORS automáticamente
  async (req, res) => {
    
    // --- 1. VERIFICACIÓN DE APP CHECK (DESACTIVADA) ---
    // logger.info("Iniciando verificación de App Check...");
    // const appCheckToken = req.headers["x-firebase-appcheck"]; // El token viene del header

    // if (!appCheckToken) {
    //   logger.warn("Petición rechazada: No se encontró el token de App Check ('x-firebase-appcheck').");
    //   res.status(401).send("Unauthorized: Missing App Check token.");
    //   return;
    // }

    // try {
    //   // Verifica el token
    //   await getAppCheck().verifyToken(appCheckToken);
    //   logger.info("Token de App Check verificado con éxito.");
    // } catch (err) {
    //   logger.error("Petición rechazada: El token de App Check es inválido.", err);
    //   res.status(401).send("Unauthorized: Invalid App Check token.");
    //   return;
    // }
    // --- FIN DE LA VERIFICACIÓN DE APP CHECK ---

    
    // --- 2. LÓGICA DE LA FUNCIÓN (Ahora se ejecuta siempre) ---
    const filePath = req.query.filePath;

    if (!filePath) {
      logger.warn("Petición fallida: 'filePath' no se proporcionó en la query.");
      res.status(400).send("Bad Request: Missing 'filePath' query parameter.");
      return;
    }

    logger.info(`Petición válida. Iniciando generación de URL para: ${filePath}`);

    try {
      // Obtener el archivo del bucket
      const file = getStorage().bucket(BUCKET_NAME).file(filePath);

      // Configurar la URL firmada
      const [url] = await file.getSignedUrl({
        action: "read",
        expires: Date.now() + 15 * 60 * 1000, // 15 minutos
        serviceAccountEmail: SERVICE_ACCOUNT_EMAIL, // Usar la SA explícita
      });

      logger.info(`URL firmada generada con éxito para: ${filePath}`);
      res.status(200).json({ url: url }); // Enviar la URL como JSON

    } catch (error) {
      logger.error(`ERROR CRÍTICO: Falló al generar la URL firmada para ${filePath} en el bucket ${BUCKET_NAME}`, error);
      res.status(500).json({ error: "failed to generate signed URL" });
    }
  }
);