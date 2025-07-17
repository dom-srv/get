const crypto = require('crypto');
const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 3000 });
const rawKeys = (process.env.KEYS || '').split(',');
const validHashes = new Set(
  rawKeys.map(k => crypto.createHash('sha256').update(k).digest('hex'))
);
function makeHmac(key, nonce) {
  return crypto
    .createHmac('sha256', key)
    .update(nonce)
    .digest('hex');
}
wss.on('connection', ws => {
  const nonce = crypto.randomBytes(16).toString('hex');
  ws.send(JSON.stringify({ nonce }));

  ws.once('message', msg => {
    let payload;
    try { payload = JSON.parse(msg); }
    catch {
      return ws.close(1008, 'Invalid JSON');
    }
    const { user, hmac } = payload;
    const userHash = crypto.createHash('sha256').update(user).digest('hex');
    if (validHashes.has(userHash) && hmac === makeHmac(user, nonce)) {
      ws.send(JSON.stringify({ status: Buffer.from('BCC').toString('base64') }));
    } else {
      ws.send(JSON.stringify({ status: Buffer.from('BCCD').toString('hex') }));
      ws.close(4003, 'Authentication failed');
    }
  });
});
