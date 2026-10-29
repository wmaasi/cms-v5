// bootstrap-secrets.js
// Carga secretos desde Secret Manager y los inyecta en process.env
// antes de arrancar Strapi. Solo corre en producción (App Engine);
// en desarrollo local se sigue usando .env normal.
//
// SECRETS_PROFILE elige la lista de secretos:
//   - production (por defecto): servicio brainstrapi
//   - dev: servicio brainstrapi-dev (sin SendGrid, sin CRM, claves propias)

const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');

const PROJECT_ID = 'flawless-agency-347915';

const PROFILES = {
  production: {
    DATABASE_PASSWORD:     'brainstrapi-database-password',
    APP_KEYS:               'brainstrapi-app-keys',
    API_TOKEN_SALT:         'brainstrapi-api-token-salt',
    ADMIN_JWT_SECRET:       'brainstrapi-admin-jwt-secret',
    TRANSFER_TOKEN_SALT:    'brainstrapi-transfer-token-salt',
    JWT_SECRET:             'brainstrapi-jwt-secret',
    SENDGRID_API_KEY:       'brainstrapi-sendgrid-api-key',
    CRON_SECRET:            'brainstrapi-cron-secret',
    CRM_API_PASSWORD:       'brainstrapi-crm-api-password',
    FIREBASE_SERVICE_ACCOUNT_JSON: 'brainstrapi-firebase-sa',
    ZOOM_CLIENT_SECRET:     'zoom-s2s-client-secret',
    ZOOM_SDK_SECRET:        'zoom-sdk-secret',
    ZOOM_WEBHOOK_SECRET:    'zoom-webhook-secret',
  },
  dev: {
    DATABASE_PASSWORD:     'brainstrapi-dev-database-password',
    APP_KEYS:               'brainstrapi-dev-app-keys',
    API_TOKEN_SALT:         'brainstrapi-dev-api-token-salt',
    ADMIN_JWT_SECRET:       'brainstrapi-dev-admin-jwt-secret',
    TRANSFER_TOKEN_SALT:    'brainstrapi-dev-transfer-token-salt',
    JWT_SECRET:             'brainstrapi-dev-jwt-secret',
    SENDGRID_API_KEY:       'brainstrapi-sendgrid-api-key',
    CRON_SECRET:            'brainstrapi-cron-secret',
    FIREBASE_SERVICE_ACCOUNT_JSON: 'brainstrapi-firebase-sa',
    ZOOM_CLIENT_SECRET:     'zoom-s2s-client-secret',
    ZOOM_SDK_SECRET:        'zoom-sdk-secret',
    ZOOM_WEBHOOK_SECRET:    'zoom-webhook-secret',
    // Sin CRON_SECRET ni CRM_API_PASSWORD a propósito. SendGrid solo con EMAIL_OVERRIDE_TO activo.
  },
};

async function loadSecrets() {
  const profile = process.env.SECRETS_PROFILE || 'production';
  const secretMap = PROFILES[profile];
  if (!secretMap) throw new Error(`SECRETS_PROFILE desconocido: ${profile}`);

  const client = new SecretManagerServiceClient();

  const entries = Object.entries(secretMap);
  await Promise.all(entries.map(async ([envVar, secretName]) => {
    const name = `projects/${PROJECT_ID}/secrets/${secretName}/versions/latest`;
    const [version] = await client.accessSecretVersion({ name });
    process.env[envVar] = version.payload.data.toString('utf8');
  }));

  console.log(`✅ ${entries.length} secretos cargados desde Secret Manager (perfil ${profile}).`);
}

async function main() {
  if (process.env.NODE_ENV === 'production') {
    await loadSecrets();
  } else {
    console.log('ℹ️  NODE_ENV != production, usando variables de entorno locales (.env).');
  }

  // Arrancar Strapi después de que los secretos estén cargados
  require('@strapi/strapi').compileStrapi;
  const { execSync } = require('child_process');
  execSync('npx strapi start', { stdio: 'inherit', env: process.env });
}

main().catch((err) => {
  console.error('❌ Error cargando secretos:', err);
  process.exit(1);
});
