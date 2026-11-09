// Jalankan: node test_estimate.js
const assert = require('node:assert');
const { estimate } = require('./app.js');
const car = { p12: 300000, p24: 350000 };
const t = (h) => [new Date(2026, 10, 13, 8), new Date(2026, 10, 13, 8 + h)];

assert.equal(estimate(car, false, ...t(10)).total, 300000);          // <=12 jam: tarif 12 jam
assert.equal(estimate(car, false, ...t(12)).total, 300000);
assert.equal(estimate(car, false, ...t(13)).total, 350000);          // >12 jam: 1 hari
assert.equal(estimate(car, false, ...t(48)).total, 700000);          // 2 hari
assert.equal(estimate(car, false, ...t(49)).total, 1050000);         // dibulatkan ke 3 hari
assert.equal(estimate(car, true, ...t(48)).total, 700000 + 400000);  // + sopir 2 hari
assert.equal(estimate(car, true, ...t(6)).total, 300000 + 200000);   // sopir minimal 1 hari
assert.equal(estimate(car, false, ...t(0)), null);                   // kembali = ambil
assert.equal(estimate(car, false, ...t(-5)), null);                  // kembali < ambil
assert.equal(estimate(car, false, new Date(NaN), new Date()), null); // tanggal kosong
console.log('estimate ok');
