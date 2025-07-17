const A = require('crypto');
const B = require('ws');
const C = new B.Server({ port: 0xbb8 });
const rawKeys = process.env.KEYS ? process.env.KEYS.split(',') : [];
const D = new Set(rawKeys.map(key => A.createHash('sha256').update(key).digest('hex')));
const E = (F) => A.createHash('sha256').update(F).digest('hex');
C.on('connection', G => {
    G.on('message', H => {
        try {
            const I = JSON.parse(H);
            const J = E(I.user);
            const K = D.has(J)
                ? Buffer.from('BCC').toString('base64')
                : Buffer.from('BCCD').toString('hex');

            G.send(JSON.stringify({ status: K }));
        } catch (err) {
            G.send(JSON.stringify({ status: 'Error', message: 'Invalid request format' }));
        }
    });
});
