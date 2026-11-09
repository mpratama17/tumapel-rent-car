// Nomor WA admin (format 62xxx). Kosong = WhatsApp minta pilih kontak sendiri,
// dipakai karena usaha ini fiktif. Isi dengan nomor asli untuk situs client.
const ADMIN_WA = '';
const SOPIR_PER_HARI = 200000;

const rp = n => 'Rp ' + n.toLocaleString('id-ID');
const waLink = text => `https://wa.me/${ADMIN_WA}?text=${encodeURIComponent(text)}`;

// Harga: <= 12 jam pakai tarif 12 jam, selebihnya dibulatkan ke atas per 24 jam.
// Sopir dihitung per hari (minimal 1 hari).
function estimate({ p12, p24 }, withDriver, start, end) {
  const hours = (end - start) / 36e5;
  if (!(hours > 0)) return null;
  const days = Math.ceil(hours / 24);
  const base = hours <= 12 ? p12 : days * p24;
  const label = hours <= 12 ? '12 jam' : `${days} hari × ${rp(p24)}`;
  const driver = withDriver ? days * SOPIR_PER_HARI : 0;
  return { total: base + driver, label: driver ? `${label} + sopir` : label };
}

if (typeof module !== 'undefined') module.exports = { estimate };

if (typeof document !== 'undefined') {
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];

  $$('[data-wa]').forEach(a => { a.href = waLink(a.dataset.wa); });

  // Menu mobile
  const menu = $('#menu'), menuBtn = $('.menu-btn');
  const setMenu = open => { menu.classList.toggle('is-open', open); menuBtn.setAttribute('aria-expanded', open); };
  menuBtn.addEventListener('click', () => setMenu(!menu.classList.contains('is-open')));
  menu.addEventListener('click', e => { if (e.target.closest('a')) setMenu(false); });

  // Filter armada + "lihat semua" (mobile)
  const carsBox = $('#cars'), showAll = $('#show-all');
  const expand = () => { carsBox.classList.remove('is-collapsed'); showAll.hidden = true; };
  showAll.addEventListener('click', expand);
  $$('.pill').forEach(p => p.addEventListener('click', () => {
    const f = p.dataset.filter;
    $$('.pill').forEach(x => { x.classList.toggle('is-on', x === p); x.setAttribute('aria-pressed', x === p); });
    $$('.car').forEach(c => { c.hidden = f !== 'all' && c.dataset.cat !== f; });
    if (f !== 'all') expand();
  }));

  // Booking dialog
  const dlg = $('#booking'), form = $('#bk-form'), err = $('#bk-err');
  const lepas = form.querySelector('[value=lepas]'), sopir = form.querySelector('[value=sopir]');
  let car = null;

  const pad = n => String(n).padStart(2, '0');
  const toLocal = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  const fmt = d => d.toLocaleString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  // Unit wajib sopir (Hiace) harganya sudah termasuk sopir
  const extraDriver = () => sopir.checked && !car.driverOnly;
  const dates = () => [new Date(form.start.value), new Date(form.end.value)];

  function update() {
    const [s, e] = dates();
    const est = car && estimate(car, extraDriver(), s, e);
    $('#sum-label').textContent = est ? `Estimasi ${est.label}` : 'Pilih tanggal untuk estimasi';
    $('#sum-total').textContent = est ? rp(est.total) : '—';
  }

  function open(el) {
    const d = el.dataset;
    const driverOnly = 'driverOnly' in d;
    car = { name: d.name, p12: +d.p12, p24: +d.p24, driverOnly };
    $('#bk-title').textContent = `Booking ${d.name}`;
    $('#bk-spec').textContent = d.spec;
    $('#bk-img').src = d.img;
    $('#svc-lepas').textContent = `${rp(car.p24)} / 24 jam`;
    $('#svc-sopir').textContent = driverOnly ? 'Harga sudah termasuk sopir' : `+ ${rp(SOPIR_PER_HARI)} / hari`;
    lepas.disabled = driverOnly;
    (driverOnly ? sopir : lepas).checked = true;

    const start = new Date(); start.setDate(start.getDate() + 1); start.setHours(8, 0, 0, 0);
    const end = new Date(start); end.setDate(end.getDate() + 2);
    form.start.min = form.end.min = toLocal(new Date());
    form.start.value = toLocal(start);
    form.end.value = toLocal(end);
    err.textContent = '';
    dlg.showModal();
    update();
  }

  $$('.book').forEach(b => b.addEventListener('click', () => open(b.closest('.car'))));
  $('.bk-close').addEventListener('click', () => dlg.close());
  dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); });
  form.addEventListener('input', update);

  form.addEventListener('submit', e => {
    e.preventDefault();
    const [s, en] = dates();
    const name = form.elements.name.value.trim();
    const est = estimate(car, extraDriver(), s, en);
    if (!(s >= Date.now() - 36e5)) err.textContent = 'Tanggal ambil tidak boleh di masa lalu.';
    else if (!est) err.textContent = 'Tanggal kembali harus setelah tanggal ambil.';
    else if (!name) err.textContent = 'Isi nama kamu dulu ya.';
    else err.textContent = '';
    if (err.textContent) return;

    const msg = [
      'Halo Tumapel Rent Car, saya mau booking:',
      `• Mobil: ${car.name}`,
      `• Layanan: ${sopir.checked ? 'Dengan sopir' : 'Lepas kunci'}`,
      `• Ambil: ${fmt(s)}`,
      `• Kembali: ${fmt(en)}`,
      `• Lokasi jemput: ${form.loc.value}`,
      `• Nama: ${name}`,
      `Estimasi di web: ${rp(est.total)} (${est.label})`,
      'Mohon info ketersediaan & DP. Terima kasih.',
    ].join('\n');
    window.open(waLink(msg), '_blank', 'noopener');
    dlg.close();
  });
}
