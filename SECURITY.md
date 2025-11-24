# Security Documentation

## Security Model

This project implements defense-in-depth with multiple security layers:

1. **Input Validation Layer**
2. **Sandboxed Execution Layer**
3. **Output Sanitization Layer**
4. **Access Control Layer**

## Threat Model

### Assets
- Server infrastructure
- User uploaded files
- Processed files
- Application code
- Configuration data

### Threat Actors
- Malicious users attempting to compromise system
- Attackers trying to execute arbitrary code
- Users attempting to exfiltrate data
- Automated scanning/exploitation tools

### Attack Vectors

#### 1. Malicious File Upload
**Threat:** Upload executable code disguised as legitimate file

**Mitigations:**
- File extension whitelist
- MIME type validation
- Magic number (file signature) verification
- File content scanning
- Sandboxed execution prevents code execution on host

**Test Cases:**
- `.exe` renamed to `.pdf`
- Polyglot files (valid PDF + executable)
- Embedded scripts in PDFs
- Macro-enabled documents

#### 2. Path Traversal
**Threat:** Access unauthorized files via manipulated filenames

**Mitigations:**
- Filename sanitization
- Path validation
- Rejection of `..`, absolute paths, null bytes
- Hashed directory storage

**Test Cases:**
- `../../etc/passwd`
- `..\..\..\windows\system32`
- `/etc/shadow`
- `file.txt\0.jpg`

#### 3. Resource Exhaustion
**Threat:** Crash or slow down service via resource-intensive files

**Mitigations:**
- File size limits (5MB default)
- Processing timeout (60s default)
- Container memory limits (256MB default)
- Container CPU limits (50% default)
- Rate limiting

**Test Cases:**
- Zip bombs
- Billion laughs XML
- Deeply nested structures
- Concurrent large uploads

#### 4. Code Injection
**Threat:** Execute malicious code through file processing

**Mitigations:**
- Sandboxed execution in Docker
- Network isolation (`--network none`)
- No shell execution of user input
- Read-only filesystem
- Dropped capabilities

**Test Cases:**
- Command injection in filenames: `; rm -rf /`
- SQL injection patterns: `'; DROP TABLE--`
- Script tags in metadata
- Embedded JavaScript in PDFs

#### 5. Information Disclosure
**Threat:** Leak sensitive system information through errors

**Mitigations:**
- Generic error messages to users
- Detailed logging only server-side
- Stack traces hidden in production
- No version disclosure in headers

**Test Cases:**
- Invalid requests to trigger errors
- Path traversal to read sensitive files
- Timing attacks for file existence

## Security Features

### Container Isolation

Docker containers run with maximum security constraints:

```dockerfile
docker run \
  --rm \
  --network none \
  --memory 256m \
  --cpus 0.5 \
  --read-only \
  --security-opt no-new-privileges \
  --cap-drop ALL \
  --user nobody \
  sandbox-image
```

**Constraints:**
- No network access
- Limited memory and CPU
- Read-only root filesystem
- No privilege escalation
- All capabilities dropped
- Non-root user

### Input Validation

**File Extension Whitelist:**
```javascript
['pdf', 'txt', 'jpg', 'jpeg', 'png', 'gif', 'doc', 'docx']
```

**Magic Number Verification:**
Uses `file-type` package to verify actual file type matches extension.

**Filename Sanitization:**
- Remove path traversal: `../`, `..\`
- Remove special chars: `|`, `&`, `;`, `<`, `>`, ```, `$`
- Limit length to prevent buffer issues
- Remove null bytes

**Size Limits:**
- Default: 5MB
- Configurable via `MAX_FILE_SIZE`

### Rate Limiting

| Endpoint | Limit | Window |
|----------|-------|--------|
| Upload | 10 requests | 1 hour |
| Status | 100 requests | 15 minutes |
| Download | 50 requests | 1 hour |

### Content Sanitization

**PDF Files:**
- Remove JavaScript
- Strip metadata
- Remove embedded files
- Flatten forms

**Images:**
- Strip EXIF data
- Remove metadata
- Re-encode to remove potential exploits

**Documents:**
- Remove macros
- Strip metadata
- Remove embedded objects

**Text Files:**
- Validate encoding
- Remove control characters
- Ensure UTF-8 compliance

## Security Best Practices

### Deployment

1. **Use HTTPS/TLS:**
   - All traffic should be encrypted
   - Use strong cipher suites
   - Enable HSTS

2. **Authentication & Authorization:**
   - Implement API authentication
   - Use JWT or OAuth 2.0
   - Rate limit per user, not just per IP

3. **Monitoring:**
   - Log all security events
   - Monitor for attack patterns
   - Set up alerting for anomalies

4. **Updates:**
   - Regularly update dependencies
   - Keep Docker images updated
   - Apply security patches promptly

5. **Network Security:**
   - Use firewall rules
   - Isolate from other services
   - Consider running in private network

### Code Security

1. **Input Validation:**
   - Validate all inputs
   - Use whitelist approach
   - Never trust user input

2. **Error Handling:**
   - Don't expose internal details
   - Log full errors server-side only
   - Use generic user-facing messages

3. **Dependencies:**
   - Audit with `npm audit`
   - Keep dependencies updated
   - Use `package-lock.json`

4. **Secrets Management:**
   - Never commit `.env` files
   - Use environment variables
   - Rotate API keys regularly

## Testing Security

### Running Security Tests

```bash
npm test -- tests/security
```

### Manual Testing

1. **File Type Spoofing:**
```bash
# Create executable, rename to .pdf
cp /bin/ls malicious.pdf
curl -F "file=@malicious.pdf" http://localhost:3000/upload
```

2. **Path Traversal:**
```bash
curl -F "file=@test.txt;filename=../../etc/passwd" http://localhost:3000/upload
```

3. **Oversize File:**
```bash
dd if=/dev/zero of=huge.txt bs=1M count=10  # 10MB file
curl -F "file=@huge.txt" http://localhost:3000/upload
```

4. **Rate Limiting:**
```bash
for i in {1..15}; do
  curl -F "file=@test.pdf" http://localhost:3000/upload
done
```

## Vulnerability Disclosure

If you discover a security vulnerability, please:

1. Do NOT open a public issue
2. Email: security@example.com
3. Include:
   - Description of vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

We will respond within 48 hours and provide updates as we investigate and remediate.

## Compliance Considerations

This project demonstrates security controls relevant to:

- **OWASP Top 10:**
  - A03:2021 - Injection
  - A04:2021 - Insecure Design
  - A05:2021 - Security Misconfiguration
  - A08:2021 - Software and Data Integrity Failures

- **CWE (Common Weakness Enumeration):**
  - CWE-22: Path Traversal
  - CWE-78: OS Command Injection
  - CWE-434: Unrestricted Upload of Dangerous File Type
  - CWE-502: Deserialization of Untrusted Data

## Known Limitations

1. **No persistent storage:** Files deleted after 24 hours
2. **No authentication:** Open access (add auth for production)
3. **Limited file type support:** Only common formats
4. **Mock virus scanning:** Integrate real AV for production
5. **Single server:** Not horizontally scalable as-is

## Future Security Enhancements

- [ ] Integrate ClamAV or VirusTotal for virus scanning
- [ ] Add digital signature verification
- [ ] Implement content disarm and reconstruction (CDR)
- [ ] Add honeypot endpoints for attack detection
- [ ] Implement file integrity monitoring
- [ ] Add support for encrypted file uploads
- [ ] Implement zero-knowledge architecture
