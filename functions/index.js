/**
 * Importar módulos necesarios
 */
const { onRequest } = require("firebase-functions/v2/https");
const { getStorage } = require("firebase-admin/storage");
const { initializeApp } = require("firebase-admin/app");
const logger = require("firebase-functions/logger");

// Inicializa la app de Admin. 
// Al no pasar argumentos, usa la configuración por defecto del proyecto actual (sea SBX o PROD).
initializeApp();

/**
 * Cloud Function: getSignedUrl
 * Genera una URL firmada (temporal) para un archivo en el bucket por defecto.
 */
exports.getSignedUrl = onRequest(
  { cors: true }, // Habilita CORS para que tu web pueda llamar a la función
  async (req, res) => {
    
    const filePath = req.query.filePath;

    if (!filePath) {
      logger.warn("Petición fallida: Falta 'filePath'.");
      res.status(400).send("Bad Request: Missing 'filePath'.");
      return;
    }

    try {
      // CAMBIO 1: .bucket() VACÍO
      // Esto le dice a Firebase: "Usa el bucket por defecto de ESTE proyecto".
      // En Sandbox usará 'sbx-relojes-web.appspot.com'
      // En Producción usará 'nayra-pacha-relojes.appspot.com'
      const bucket = getStorage().bucket(); 
      const file = bucket.file(filePath);

      // CAMBIO 2: Sin serviceAccountEmail explícito
      // El entorno de Google Cloud inyecta sus propias credenciales automáticamente.
      const [url] = await file.getSignedUrl({
        action: "read",
        expires: Date.now() + 15 * 60 * 1000, // 15 minutos de validez
      });

      // logger.info(`URL generada para: ${filePath}`); // (Opcional: descomentar para debug)
      res.status(200).json({ url: url });

    } catch (error) {
      logger.error(`ERROR al generar URL para ${filePath}`, error);
      res.status(500).json({ error: "failed to generate signed URL" });
    }
  }
);