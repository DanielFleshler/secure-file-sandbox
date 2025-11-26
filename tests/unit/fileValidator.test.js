/**
 * Unit Tests - File Validator
 * Tests file validation logic
 */

const fileValidator = require("../../validators/fileValidator");
const path = require("path");
const fs = require("fs").promises;

describe("File Validator", () => {
	describe("isExtensionAllowed", () => {
		test("should allow whitelisted extensions", () => {
			const allowedExtensions = [
				"pdf",
				"txt",
				"jpg",
				"jpeg",
				"png",
				"gif",
				"doc",
				"docx",
			];
			allowedExtensions.forEach((ext) => {
				const filename = `filename.${ext}`;
				expect(fileValidator.isExtensionAllowed(filename)).toBe(true);
			});
		});

		test("should reject non-whitelisted extensions", () => {
			const forbiddenExtensions = [
				"exe",
				"sh",
				"bin",
				"bat",
				"cmd",
				"com",
				"msi",
				"dll",
				"scr",
				"vbs",
				"ps1",
				"js",
				"php",
				"py",
				"rb",
			];

			forbiddenExtensions.forEach((ext) => {
				const filename = `malicious.${ext}`;
				expect(fileValidator.isExtensionAllowed(filename)).toBe(false);
			});
		});

		test("should reject filenames without a name (e.g., '.pdf')", () => {
			const edgeCases = [".pdf", ".txt", ".jpg", ".png", ".doc"];
			edgeCases.forEach((filename) => {
				expect(fileValidator.isExtensionAllowed(filename)).toBe(false);
			});
		});

		test("should handle filenames with multiple dots correctly", () => {
			expect(fileValidator.isExtensionAllowed("document.backup.pdf")).toBe(
				true
			);
			expect(fileValidator.isExtensionAllowed("image.2023.12.25.jpg")).toBe(
				true
			);
			expect(fileValidator.isExtensionAllowed("document.backup.exe")).toBe(
				false
			);
			expect(fileValidator.isExtensionAllowed("script.test.js")).toBe(false);
		});

		test("should reject empty or invalid filenames", () => {
			const invalidFilenames = ["", ".", "..", "...", "noextension"];
			invalidFilenames.forEach((filename) => {
				expect(fileValidator.isExtensionAllowed(filename)).toBe(false);
			});
		});

		test("should handle hidden files with valid extensions", () => {
			expect(fileValidator.isExtensionAllowed(".config.txt")).toBe(true);
			expect(fileValidator.isExtensionAllowed(".hidden.pdf")).toBe(true);
			expect(fileValidator.isExtensionAllowed(".env.sh")).toBe(false);
		});
	});

	describe("sanitizeFilename", () => {
		test("should remove path traversal sequences", () => {
			expect(fileValidator.sanitizeFilename("../../etc/passwd")).toBe("passwd");
			expect(fileValidator.sanitizeFilename("..\\..\\Windows\\System32")).toBe(
				"System32"
			);
		});

		test("should replace special characters", () => {
			expect(fileValidator.sanitizeFilename("my|file<script>.pdf")).toBe(
				"my_file_script_.pdf"
			);
		});

		test("should clean up excessive dots", () => {
			expect(fileValidator.sanitizeFilename("....pdf")).toBe("pdf");
			expect(fileValidator.sanitizeFilename("file..pdf")).toBe("file.pdf");
		});

		test("should limit filename length", () => {
			const longName = "a".repeat(150) + ".pdf";
			const result = fileValidator.sanitizeFilename(longName);
			expect(result.length).toBeLessThanOrEqual(100);
		});

		test("should return null for invalid filenames that become empty", () => {
			expect(fileValidator.sanitizeFilename("../../")).toBe(null);
			expect(fileValidator.sanitizeFilename("|||")).toBe(null);
			expect(fileValidator.sanitizeFilename("...")).toBe(null);
		});
	});

	describe("isFileSizeValid", () => {
		test("should accept files under size limit", () => {
			expect(fileValidator.isFileSizeValid(1 * 1024 * 1024)).toBe(true);
			expect(fileValidator.isFileSizeValid(3 * 1024 * 1024)).toBe(true);
			expect(fileValidator.isFileSizeValid(5 * 1024 * 1024)).toBe(true);
		});

		test("should reject files over size limit", () => {
			expect(fileValidator.isFileSizeValid(5.01 * 1024 * 1024)).toBe(false);
			expect(fileValidator.isFileSizeValid(10 * 1024 * 1024)).toBe(false);
			expect(fileValidator.isFileSizeValid(50 * 1024 * 1024)).toBe(false);
		});
		test("should reject zero byte files", () => {
			expect(fileValidator.isFileSizeValid(0)).toBe(false);
		});
		test("should reject negative file sizes", () => {
			expect(fileValidator.isFileSizeValid(-100)).toBe(false);
		});
	});

	describe("verifyMagicNumber", () => {
		test("should detect mismatched file types", async () => {
			expect(
				await fileValidator.verifyMagicNumber(
					Buffer.from([0x25, 0x50, 0x44, 0x46]),
					"jpg"
				)
			).toBe(false); // PDF magic number as JPG
			expect(
				await fileValidator.verifyMagicNumber(
					Buffer.from([0xff, 0xd8, 0xff]),
					"png"
				)
			).toBe(false); // JPG magic number as PNG
			expect(
				await fileValidator.verifyMagicNumber(
					Buffer.from([0x89, 0x50, 0x4e, 0x47]),
					"gif"
				)
			).toBe(false); // PNG magic number as GIF
			expect(
				await fileValidator.verifyMagicNumber(
					Buffer.from([0x47, 0x49, 0x46, 0x38]),
					"pdf"
				)
			).toBe(false); // GIF magic number as PDF
			expect(
				await fileValidator.verifyMagicNumber(Buffer.from([0x4d, 0x5a]), "pdf")
			).toBe(false); // EXE magic number as PDF
		});

		test("should accept valid file types", async () => {
			expect(
				await fileValidator.verifyMagicNumber(
					Buffer.from([0x25, 0x50, 0x44, 0x46]),
					"pdf"
				)
			).toBe(true); // PDF
			expect(
				await fileValidator.verifyMagicNumber(
					Buffer.from([0xff, 0xd8, 0xff]),
					"jpg"
				)
			).toBe(true); // JPG
			expect(
				await fileValidator.verifyMagicNumber(
					Buffer.from([0x47, 0x49, 0x46, 0x38]),
					"gif"
				)
			).toBe(true); // GIF
		});
	});

	describe("validateFile", () => {
		test("should reject when no file is provided", async () => {
			const result = await fileValidator.validateFile(null);
			expect(result.valid).toBe(false);
			expect(result.message).toBe("No file was provided");
		});

		test("should reject when file is undefined", async () => {
			const result = await fileValidator.validateFile(undefined);
			expect(result.valid).toBe(false);
			expect(result.message).toBe("No file was provided");
		});

		test("should reject files exceeding size limit", async () => {
			const largeFile = {
				originalname: "large.pdf",
				size: 6 * 1024 * 1024, // 6MB
				buffer: Buffer.from([0x25, 0x50, 0x44, 0x46]),
			};
			const result = await fileValidator.validateFile(largeFile);
			expect(result.valid).toBe(false);
			expect(result.message).toBe("File exceeds maximum size of 5MB");
		});

		test("should reject files with zero size", async () => {
			const emptyFile = {
				originalname: "empty.pdf",
				size: 0,
				buffer: Buffer.from([]),
			};
			const result = await fileValidator.validateFile(emptyFile);
			expect(result.valid).toBe(false);
			expect(result.message).toBe("File exceeds maximum size of 5MB");
		});
		test("should reject files with invalid extensions", async () => {
			const invalidFile = {
				originalname: "malicious.exe",
				size: 1024,
				buffer: Buffer.from([0x4d, 0x5a]), // EXE magic number
			};
			const result = await fileValidator.validateFile(invalidFile);
			expect(result.valid).toBe(false);
			expect(result.message).toBe("Invalid file type");
		});

		test("should reject files with no extension", async () => {
			const noExtFile = {
				originalname: "noextension",
				size: 1024,
				buffer: Buffer.from([0x25, 0x50, 0x44, 0x46]),
			};
			const result = await fileValidator.validateFile(noExtFile);
			expect(result.valid).toBe(false);
			expect(result.message).toBe("Invalid file type");
		});

		test("should reject files with invalid characters in filename", async () => {
			const invalidNameFile = {
				originalname: "|||",
				size: 1024,
				buffer: Buffer.from([0x25, 0x50, 0x44, 0x46]),
			};
			const result = await fileValidator.validateFile(invalidNameFile);
			expect(result.valid).toBe(false);
			expect(result.message).toBe("Invalid file type");
		});

		test("should reject files with path traversal in filename", async () => {
			const traversalFile = {
				originalname: "../../etc/passwd",
				size: 1024,
				buffer: Buffer.from("test content"),
			};
			const result = await fileValidator.validateFile(traversalFile);
			expect(result.valid).toBe(false);
			expect(result.message).toBe("Invalid file type");
		});

		test("should reject files with mismatched magic numbers", async () => {
			const mismatchedFile = {
				originalname: "fake.pdf",
				size: 1024,
				buffer: Buffer.from([0xff, 0xd8, 0xff]), // JPG magic number but named as PDF
			};
			const result = await fileValidator.validateFile(mismatchedFile);
			expect(result.valid).toBe(false);
			expect(result.message).toBe(
				"Invalid or corrupted file, Please try again"
			);
		});

		test("should reject files with unrecognizable magic numbers", async () => {
			const unknownFile = {
				originalname: "unknown.pdf",
				size: 1024,
				buffer: Buffer.from([0x00, 0x00, 0x00, 0x00]), // Unknown format
			};
			const result = await fileValidator.validateFile(unknownFile);
			expect(result.valid).toBe(false);
			expect(result.message).toBe(
				"Invalid or corrupted file, Please try again"
			);
		});

		test("should accept valid PDF file", async () => {
			const validPDF = {
				originalname: "document.pdf",
				size: 1024,
				buffer: Buffer.from([0x25, 0x50, 0x44, 0x46]), // PDF magic number
			};
			const result = await fileValidator.validateFile(validPDF);
			expect(result.valid).toBe(true);
			expect(result.sanitizedFilename).toBe("document.pdf");
			expect(result.message).toBe("Validation successful");
		});

		test("should accept valid JPG file", async () => {
			const validJPG = {
				originalname: "photo.jpg",
				size: 2048,
				buffer: Buffer.from([0xff, 0xd8, 0xff]), // JPG magic number
			};
			const result = await fileValidator.validateFile(validJPG);
			expect(result.valid).toBe(true);
			expect(result.sanitizedFilename).toBe("photo.jpg");
			expect(result.message).toBe("Validation successful");
		});

		test("should accept valid GIF file", async () => {
			const validGIF = {
				originalname: "animation.gif",
				size: 3072,
				buffer: Buffer.from([0x47, 0x49, 0x46, 0x38]), // GIF magic number
			};
			const result = await fileValidator.validateFile(validGIF);
			expect(result.valid).toBe(true);
			expect(result.sanitizedFilename).toBe("animation.gif");
			expect(result.message).toBe("Validation successful");
		});

		test("should sanitize filename with special characters", async () => {
			const fileWithSpecialChars = {
				originalname: "my|file<script>.pdf",
				size: 1024,
				buffer: Buffer.from([0x25, 0x50, 0x44, 0x46]),
			};
			const result = await fileValidator.validateFile(fileWithSpecialChars);
			expect(result.valid).toBe(true);
			expect(result.sanitizedFilename).toBe("my_file_script_.pdf");
			expect(result.message).toBe("Validation successful");
		});

		test("should handle files with multiple dots in filename", async () => {
			const multiDotFile = {
				originalname: "document.backup.2023.pdf",
				size: 1024,
				buffer: Buffer.from([0x25, 0x50, 0x44, 0x46]),
			};
			const result = await fileValidator.validateFile(multiDotFile);
			expect(result.valid).toBe(true);
			expect(result.sanitizedFilename).toBe("document.backup.2023.pdf");
			expect(result.message).toBe("Validation successful");
		});

		test("should accept file at exact size limit", async () => {
			const exactSizeFile = {
				originalname: "maxsize.pdf",
				size: 5 * 1024 * 1024, // Exactly 5MB
				buffer: Buffer.from([0x25, 0x50, 0x44, 0x46]),
			};
			const result = await fileValidator.validateFile(exactSizeFile);
			expect(result.valid).toBe(true);
			expect(result.sanitizedFilename).toBe("maxsize.pdf");
			expect(result.message).toBe("Validation successful");
		});
	});
});
