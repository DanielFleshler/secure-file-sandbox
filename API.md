# API Documentation

## Base URL

```
http://localhost:3000
```

## Authentication

Currently no authentication required. In production, implement:
- API keys
- JWT tokens
- OAuth 2.0

## Endpoints

### Upload File

Upload a file for secure processing.

**Endpoint:** `POST /upload`

**Content-Type:** `multipart/form-data`

**Request Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| file | File | Yes | File to upload (max 5MB) |

**Request Example:**
```bash
curl -X POST http://localhost:3000/upload \
  -F "file=@document.pdf"
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "fileId": "a1b2c3d4e5f6...",
  "status": "pending",
  "message": "File uploaded successfully and queued for processing"
}
```

**Error Responses:**

400 Bad Request - Invalid file:
```json
{
  "success": false,
  "error": "Invalid file type",
  "message": "Only pdf, txt, jpg, png files are allowed"
}
```

413 Payload Too Large:
```json
{
  "success": false,
  "error": "File too large",
  "message": "Maximum file size is 5MB"
}
```

429 Too Many Requests:
```json
{
  "success": false,
  "error": "Rate limit exceeded",
  "message": "Maximum 10 uploads per hour"
}
```

---

### Check Processing Status

Get the current processing status of an uploaded file.

**Endpoint:** `GET /status/:id`

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | String | Yes | File ID returned from upload |

**Request Example:**
```bash
curl http://localhost:3000/status/a1b2c3d4e5f6
```

**Success Response (200 OK):**
```json
{
  "fileId": "a1b2c3d4e5f6...",
  "status": "completed",
  "originalFilename": "document.pdf",
  "uploadedAt": "2024-01-01T12:00:00.000Z",
  "processedAt": "2024-01-01T12:00:05.000Z",
  "fileSize": 1234567,
  "processingTime": 5000
}
```

**Status Values:**
- `pending`: File uploaded, waiting for processing
- `processing`: Currently being processed in sandbox
- `completed`: Processing complete, ready for download
- `failed`: Processing failed (see error message)

**Error Response (404 Not Found):**
```json
{
  "success": false,
  "error": "File not found",
  "message": "No file found with the specified ID"
}
```

---

### Download Processed File

Download the processed and sanitized file.

**Endpoint:** `GET /download/:id`

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | String | Yes | File ID |

**Request Example:**
```bash
curl -O http://localhost:3000/download/a1b2c3d4e5f6
```

**Success Response (200 OK):**
- Headers:
  - `Content-Type`: appropriate MIME type
  - `Content-Disposition`: attachment with sanitized filename
  - `Content-Length`: file size in bytes
- Body: File stream

**Error Responses:**

404 Not Found:
```json
{
  "success": false,
  "error": "File not found"
}
```

409 Conflict - File not ready:
```json
{
  "success": false,
  "error": "File not ready",
  "message": "File is still being processed",
  "status": "processing"
}
```

---

## Rate Limits

| Endpoint | Limit |
|----------|-------|
| POST /upload | 10 requests per hour |
| GET /status/:id | 100 requests per 15 minutes |
| GET /download/:id | 50 requests per hour |

Rate limit headers included in response:
- `X-RateLimit-Limit`: Request limit
- `X-RateLimit-Remaining`: Requests remaining
- `X-RateLimit-Reset`: Time when limit resets

---

## Error Handling

All errors follow this format:

```json
{
  "success": false,
  "error": "Error type",
  "message": "Human-readable error message",
  "code": "ERROR_CODE"
}
```

### Error Codes

| Code | Description |
|------|-------------|
| INVALID_FILE_TYPE | File extension not allowed |
| FILE_TOO_LARGE | Exceeds maximum file size |
| INVALID_FILE_SIGNATURE | Magic number doesn't match extension |
| PATH_TRAVERSAL_DETECTED | Malicious filename detected |
| RATE_LIMIT_EXCEEDED | Too many requests |
| PROCESSING_FAILED | Sandbox processing error |
| FILE_NOT_FOUND | Invalid file ID |

---

## Examples

### Complete Upload-Process-Download Workflow

```bash
# 1. Upload file
RESPONSE=$(curl -s -X POST http://localhost:3000/upload -F "file=@document.pdf")
FILE_ID=$(echo $RESPONSE | jq -r '.fileId')

echo "Uploaded with ID: $FILE_ID"

# 2. Check status (poll until complete)
while true; do
  STATUS=$(curl -s http://localhost:3000/status/$FILE_ID | jq -r '.status')
  echo "Status: $STATUS"

  if [ "$STATUS" = "completed" ]; then
    break
  fi

  sleep 2
done

# 3. Download processed file
curl -O http://localhost:3000/download/$FILE_ID
```

### Using with JavaScript/Node.js

```javascript
const FormData = require('form-data');
const fs = require('fs');
const axios = require('axios');

// Upload
const form = new FormData();
form.append('file', fs.createReadStream('document.pdf'));

const uploadResponse = await axios.post('http://localhost:3000/upload', form, {
  headers: form.getHeaders()
});

const fileId = uploadResponse.data.fileId;

// Check status
const statusResponse = await axios.get(`http://localhost:3000/status/${fileId}`);
console.log(statusResponse.data);

// Download
const downloadResponse = await axios.get(`http://localhost:3000/download/${fileId}`, {
  responseType: 'stream'
});

downloadResponse.data.pipe(fs.createWriteStream('processed-file.pdf'));
```
