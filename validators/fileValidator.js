/**
 * File Validator
 * Validates uploaded files for security and compliance
 */

const fileType = require("file-type");
const path = require("path");
const fs = require("fs").promises;
const logger = require("../config/logger");

// Whitelist of allowed file extensions
const ALLOWED_EXTENSIONS = [
	"pdf",
	"txt",
	"jpg",
	"jpeg",
	"png",
	"gif",
	"doc",
	"docx",
];

// Whitelist of allowed MIME types
const ALLOWED_MIME_TYPES = [
	"application/pdf",
	"text/plain",
	"image/jpeg",
	"image/png",
	"image/gif",
	"application/msword",
	"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

// Maximum file size (5MB)
const MAX_FILE_SIZE = 5 * 1024 * 1024;
/**
 *
 * @param {String} sanitizedFilename
 * @returns {Object} Validation success result
 */
function validationSuccess(sanitizedFilename) {
	return {
		valid: true,
		sanitizedFilename,
		message: "Validation successful",
	};
}
/**
 * @param {String} reason
 * @returns {Object} Validation failure result
 */

function validationFailure(reason) {
	return {
		valid: false,
		message: `${reason}`,
	};
}

/**
 * Validate file meets security requirements
 * @param {Object} file - File object from multer
 * @returns {Promise<Object>} Validation result
 */

async function validateFile(file) {
	if (!file) {
		return validationFailure("No file was provided");
	}
	if (!isFileSizeValid(file.size)) {
		return validationFailure("File exceeds maximum size of 5MB");
	}
	if (!isExtensionAllowed(file.originalname)) {
		return validationFailure("Invalid file type");
	}
	const sanitizedFilename = sanitizeFilename(file.originalname);
	if (!sanitizedFilename) {
		return validationFailure("Invalid filename");
	}

	const magicNumberResult = await verifyMagicNumber(
		file.buffer,
		path.extname(sanitizedFilename).toLowerCase().slice(1)
	);
	if (!magicNumberResult) {
		return validationFailure("Invalid or corrupted file, Please try again");
	}
	return validationSuccess(sanitizedFilename);
}

/**
 * Check file extension against whitelist
 * @param {string} filename - Original filename
 * @returns {boolean} True if extension is allowed
 */
function isExtensionAllowed(filename) {
	const ext = path.extname(filename).toLowerCase().slice(1);
	if (!ext) return false;
	return ALLOWED_EXTENSIONS.includes(ext);
}

/**
 * Verify magic number (file signature) matches expected type
 * @param {Buffer} buffer - File buffer
 * @param {string} expectedExtension - Expected file extension
 * @returns {Promise<boolean>} True if magic number matches
 */
async function verifyMagicNumber(buffer, expectedExtension) {
	const result = await fileType.fromBuffer(buffer);
	if (!result) return false;
	return result.ext.toLowerCase() === expectedExtension.toLowerCase();
}

/**
 * Sanitize filename to prevent path traversal and injection
 * @param {string} filename - Original filename
 * @returns {string} Sanitized filename
 */
function sanitizeFilename(filename) {
	filename = filename.replace(/\\/g, "/");
	let sanitized = path.basename(filename);
	sanitized = sanitized
		.trim()
		.replace(/[^a-zA-Z0-9._ -]/g, "_") // only allowed chars
		.replace(/\.{2,}/g, ".") // collapse multiple dots
		.replace(/^\.+/, "") // strip leading dots
		.slice(0, 100);
	if (!sanitized) return null;
	if (!/[a-zA-Z0-9]/.test(sanitized)) return null;

	return sanitized;
}

/**
 * Check if file size is within limits
 * @param {number} size - File size in bytes
 * @returns {boolean} True if size is acceptable
 */
function isFileSizeValid(size) {
	return size > 0 && size <= MAX_FILE_SIZE;
}

/**
 * Simulate virus scan (placeholder for external API integration)
 * @param {string} filePath - Path to file
 * @returns {Promise<Object>} Scan result
 */
async function scanForMalware(filePath) {
	// TODO: Mock virus scan result
	// TODO: In production, integrate with VirusTotal, ClamAV, etc.
}

module.exports = {
	validateFile,
	isExtensionAllowed,
	verifyMagicNumber,
	sanitizeFilename,
	isFileSizeValid,
	scanForMalware,
	ALLOWED_EXTENSIONS,
	ALLOWED_MIME_TYPES,
	MAX_FILE_SIZE,
};
