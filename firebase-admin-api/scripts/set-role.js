const fs = require('fs');
const fetch = require('node-fetch');
require('dotenv').config();

if (!process.env.API_URL || !process.env.API_KEY) {
  console.error('Set API_URL and API_KEY in .env');
  process.exit(1);
}

const uid = process.argv[2];
const role = process.argv[3];
const adminClaim = process.argv[4] === 'true';

if (!uid) {
  console.error('Usage: node set-role.js <uid> <role?> <adminClaim?>');
  process.exit(1);
}

(async () => {
  const url = `${process.env.API_URL.replace(/\/$/, '')}/set-role/${uid}`;
  const body = {};
  if (role) body.role = role;
  if (process.argv[4] !== undefined) body.adminClaim = adminClaim;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.API_KEY
    },
    body: JSON.stringify(body)
  });
  const data = await res.json();
  console.log(data);
})();
