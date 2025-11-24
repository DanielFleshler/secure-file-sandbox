# Secure File Sandbox

A containerized file processing system with comprehensive security validation. This project demonstrates secure file handling practices including input validation, sandboxed execution, and threat mitigation.

## Overview

The Secure File Sandbox accepts file uploads, validates them against multiple security criteria, processes them in isolated Docker containers, and provides sanitized outputs. It's designed to showcase defensive programming and security best practices for file handling systems.

## Architecture

```
Client Request
    ↓
API Gateway (Express)
    ↓
Validation Layer (File Type, Size, Magic Number)
    ↓
Temporary Storage
    ↓
Docker Container (Isolated Processing)
    ↓
Sanitized Output
    ↓
Secure Storage
```

## Security Features

### Input Validation
- File extension whitelist
- MIME type verification
- Magic number (file signature) validation
- File size limits
- Filename sanitization (path traversal prevention)

### Sandboxed Execution
- Docker container isolation
- Network isolation (`--network none`)
- Resource limits (CPU, memory)
- Read-only filesystem
- Dropped capabilities
- Process timeout enforcement

### Output Sanitization
- Metadata stripping (EXIF, document properties)
- JavaScript removal from PDFs
- Macro removal from documents
- Content normalization

### Additional Security
- Rate limiting per IP
- Request logging
- Error handling without information disclosure
- Automated cleanup of old files

## Threat Model

### Threats Addressed
1. **Malicious File Upload**: Executables disguised as documents
2. **Path Traversal**: Filenames like `../../etc/passwd`
3. **Resource Exhaustion**: Zip bombs, oversized files
4. **Code Injection**: Embedded scripts, macros
5. **Metadata Leakage**: EXIF data, document metadata

### Attack Surface
- HTTP endpoints (upload, status, download)
- File processing logic
- Docker container runtime
- Filesystem access

## Prerequisites

- Node.js 20+
- Docker & Docker Compose
- npm

## Installation

```bash
# Clone repository
git clone <repository-url>
cd secure-file-sandbox

# Install dependencies
npm install

# Copy environment configuration
cp .env.example .env

# Build Docker sandbox image
npm run docker:build
```

## Configuration

Edit `.env` file to customize:

```bash
# Server
PORT=3000

# File constraints
MAX_FILE_SIZE=5242880  # 5MB
ALLOWED_EXTENSIONS=pdf,txt,jpg,png

# Sandbox limits
MAX_MEMORY=256m
MAX_CPU=0.5
PROCESSING_TIMEOUT=60000
```

## Usage

### Start Development Server

```bash
npm run dev
```

### Start Production Server

```bash
npm start
```

### Run with Docker Compose

```bash
npm run docker:up
```

## API Documentation

### POST /upload

Upload a file for processing.

**Request:**
- Content-Type: `multipart/form-data`
- Field: `file` (the file to upload)

**Response:**
```json
{
  "success": true,
  "fileId": "abc123...",
  "status": "pending"
}
```

### GET /status/:id

Check processing status.

**Response:**
```json
{
  "fileId": "abc123...",
  "status": "completed",
  "uploadedAt": "2024-01-01T12:00:00Z",
  "processedAt": "2024-01-01T12:00:05Z"
}
```

### GET /download/:id

Download processed file.

**Response:**
- File stream with appropriate headers

## Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test suite
npm test -- tests/unit
npm test -- tests/integration
npm test -- tests/security
```

## Project Structure

```
/api
  /controllers     # Request handlers
  /routes          # Route definitions
  /middleware      # Express middleware
/validators        # Input validation logic
/sandbox           # Docker container processing
/storage           # File storage management
/config            # Configuration files
/tests
  /unit            # Unit tests
  /integration     # Integration tests
  /security        # Security tests
```

## Security Considerations

### What This Project Demonstrates
- Defense in depth (multiple validation layers)
- Principle of least privilege (container runs as non-root)
- Fail-safe defaults (whitelist approach)
- Complete mediation (all inputs validated)
- Separation of concerns (validation, processing, storage)

### Production Considerations
- Add authentication/authorization
- Integrate real virus scanning (ClamAV, VirusTotal)
- Implement database for metadata
- Add request signing/verification
- Enable HTTPS/TLS
- Set up monitoring and alerting
- Implement audit logging
- Regular security updates

## License

ISC

## Author

TODO: Add author information
