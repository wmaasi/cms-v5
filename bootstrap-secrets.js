// bootstrap-secrets.js
// Carga secretos desde Secret Manager y los inyecta en process.env
// antes de arrancar Strapi. Solo corre en producción (App Engine);
// en desarrollo local se sigue usando .env normal.

const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');

const PROJECT_ID = 'flawless-agency-347915';

const SECRET_MAP = {
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
};

async function loadSecrets() {
  const client = new SecretManagerServiceClient();

  const entries = Object.entries(SECRET_MAP);
  await Promise.all(entries.map(async ([envVar, secretName]) => {
    const name = `projects/${PROJECT_ID}/secrets/${secretName}/versions/latest`;
    const [version] = await client.accessSecretVersion({ name });
    process.env[envVar] = version.payload.data.toString('utf8');
  }));

  console.log(`✅ ${entries.length} secretos cargados desde Secret Manager.`);
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
