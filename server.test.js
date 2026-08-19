const test = require('node:test');
const assert = require('node:assert/strict');
const { createApp } = require('./server');

function makeRequest(app, method, path, body) {
  return new Promise((resolve, reject) => {
    const server = app.listen(0, () => {
      const port = server.address().port;
      const headers = { 'Content-Type': 'application/json' };
      const payload = body ? JSON.stringify(body) : null;
      const http = require('node:http');
      const req = http.request({ host: '127.0.0.1', port, path, method, headers }, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          server.close();
          resolve({ statusCode: res.statusCode, headers: res.headers, body: data });
        });
      });
      req.on('error', (error) => {
        server.close();
        reject(error);
      });
      if (payload) req.write(payload);
      req.end();
    });
  });
}

test('POST /api/petitions stores a valid signature and returns 201', async () => {
  const app = createApp({ petitionFile: './tmp-petitions.json' });
  const response = await makeRequest(app, 'POST', '/api/petitions', {
    name: 'Aster Bekele',
    email: 'aster@example.com',
    region: 'Addis Ababa',
    message: 'I support tax-free periods.'
  });

  assert.equal(response.statusCode, 201);
  assert.match(response.body, /"success":true/);
});

test('GET /api/petitions/export.pdf returns a PDF response', async () => {
  const app = createApp({ petitionFile: './tmp-petitions.json' });
  const response = await makeRequest(app, 'GET', '/api/petitions/export.pdf');

  assert.equal(response.statusCode, 200);
  assert.match(response.headers['content-type'], /application\/pdf/);
});
