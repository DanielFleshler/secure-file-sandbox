/**
 * Application Configuration
 * Centralized configuration management
 */

require('dotenv').config();

const config = {
  // Server configuration
  server: {
    port: parseInt(process.env.PORT || '3000', 10),
    env: process.env.NODE_ENV || 'development',
    host: process.env.HOST || '0.0.0.0'
  },

  // File upload constraints
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880', 10), // 5MB default
    allowedExtensions: (process.env.ALLOWED_EXTENSIONS || 'pdf,txt,jpg,jpeg,png,gif,doc,docx').split(','),
    uploadDir: process.env.UPLOAD_DIR || './storage/uploads',
    processedDir: process.env.PROCESSED_DIR || './storage/processed',
    tempDir: process.env.TEMP_DIR || './storage/temp'
  },

  // Sandbox configuration
  sandbox: {
    containerImage: process.env.CONTAINER_IMAGE || 'secure-file-sandbox:latest',
    processingTimeout: parseInt(process.env.PROCESSING_TIMEOUT || '60000', 10),
    maxMemory: process.env.MAX_MEMORY || '256m',
    maxCpu: process.env.MAX_CPU || '0.5',
    networkIsolation: process.env.NETWORK_ISOLATION !== 'false'
  },

  // Rate limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_WINDOW_MS || '900000', 10), // 15 minutes
    maxRequests: parseInt(process.env.RATE_MAX_REQUESTS || '100', 10),
    uploadWindowMs: parseInt(process.env.UPLOAD_RATE_WINDOW_MS || '3600000', 10), // 1 hour
    maxUploads: parseInt(process.env.MAX_UPLOADS || '10', 10)
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    dir: process.env.LOG_DIR || './logs'
  },

  // Security
  security: {
    enableVirusScan: process.env.ENABLE_VIRUS_SCAN === 'true',
    virusScanApiKey: process.env.VIRUS_SCAN_API_KEY || '',
    enableMetadataStripping: process.env.ENABLE_METADATA_STRIPPING !== 'false',
    enableMagicNumberCheck: process.env.ENABLE_MAGIC_NUMBER_CHECK !== 'false'
  },

  // Storage cleanup
  cleanup: {
    enabled: process.env.CLEANUP_ENABLED !== 'false',
    maxFileAgeMs: parseInt(process.env.MAX_FILE_AGE_MS || '86400000', 10), // 24 hours
    cleanupIntervalMs: parseInt(process.env.CLEANUP_INTERVAL_MS || '3600000', 10) // 1 hour
  }
};

// Validation function
function validateConfig() {
  // TODO: Validate required configuration values
  // TODO: Check for invalid combinations
  // TODO: Log warnings for missing optional values
}

// Export configuration
module.exports = config;
module.exports.validateConfig = validateConfig;
