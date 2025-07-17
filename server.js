
const fs    = require('fs');
const https = require('https');
const crypto = require('crypto');
const WebSocket = require('ws');
const PORT            = process.env.PORT || 443;
const TLS_KEY_PATH    = process.env.TLS_KEY_PATH;
const TLS_CERT_PATH   = process.env.TLS_CERT_PATH;
const RAW_KEYS        = (process.env.KEYS || '').split(',');
const ALLOWED_ORIGIN  = process.env.ALLOWED_ORIGIN;
const RATE_LIMIT_MAX  = parseInt(process.env.RATE_MAX)  || 50;
const RATE_LIMIT_WIN  = parseInt(process.env.RATE_WIN)  || 60;
const NONCE_TTL       = parseInt(process.env.NONCE_TTL) || 30;
const validHashes = new Set(
  RAW_KEYS.map(k =>
    crypto.createHash('sha256').update(k).digest('hex')
  )
);
const rateState = new Map(); 
const nonces = new Map(); 
function issueNonce() {
  const nonce = crypto.randomBytes(16).toString('hex');
  nonces.set(nonce, { timestamp: Date.now(), used: false });
  setTimeout(() => nonces.delete(nonce), NONCE_TTL * 1000);
  return nonce;
}
function isNonceValid(nonce) {
  const rec = nonces.get(nonce);
  if (!rec || rec.used) return false;
  if (Date.now() - rec.timestamp > NONCE_TTL * 1000) {
    nonces.delete(nonce);
    return false;
  }
  rec.used = true;
  return true;
}
function rateCheck(ip) {
  const now = Date.now();
  let state = rateState.get(ip);
  if (!state || now > state.resetAt) {
    state = { count: 0, resetAt: now + RATE_LIMIT_WIN * 1000 };
  }
  state.count += 1;
  rateState.set(ip, state);
  return state.count <= RATE_LIMIT_MAX;
}
function hmacProof(secret, nonce) {
  return crypto
    .createHmac('sha256', secret)
    .update(nonce)
    .digest('hex');
}
function safeEqual(a, b) {
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}
const server = https.createServer({
  key : fs.readFileSync(TLS_KEY_PATH),
  cert: fs.readFileSync(TLS_CERT_PATH)
});

const wss = new WebSocket.Server({ 
  server,
  verifyClient: (info, cb) => {
    if (info.origin !== ALLOWED_ORIGIN) {
      return cb(false, 403, 'Forbidden');
    }
    cb(true);
  }
});

wss.on('connection', ws => {
  const ip = ws._socket.remoteAddress;
  const nonce = issueNonce();
  ws.send(JSON.stringify({ type: 'nonce', nonce }));
  ws.once('message', msg => {
    if (!rateCheck(ip)) {
      ws.close(4200, 'Rate limit exceeded');
      return;
    }

    let payload;
    try {
      payload = JSON.parse(msg);
    } catch {
      ws.close(1003, 'Invalid JSON');
      return;
    }

    const { user, proof } = payload;
    if (typeof user !== 'string' || typeof proof !== 'string') {
      ws.close(1008, 'Malformed payload');
      return;
    }

    // Validate nonce & proof
    if (!isNonceValid(nonce)) {
      ws.close(4003, 'Invalid nonce');
      return;
    }

    const userHash = crypto.createHash('sha256').update(user).digest('hex');
    const expectedProof = hmacProof(user, nonce);

    if (validHashes.has(userHash) && safeEqual(proof, expectedProof)) {
      ws.send(JSON.stringify({ status: Buffer.from('BCC').toString('base64') }));
    } else {
      ws.send(JSON.stringify({ status: Buffer.from('BCCD').toString('hex') }));
      ws.close(4003, 'Authentication failed');
    }
  });
});
server.listen(PORT, () => {
  console.log(`🔒 Secure WebSocket server listening on port ${PORT}`);
});
