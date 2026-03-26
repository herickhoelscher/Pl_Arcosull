/* ═══════════════════════════════════════════════
   ARCOSULL — MAIN.JS v5
   3-slide carousel, FAQ, Charts, Form
   ═══════════════════════════════════════════════ */

/* ─── CARROSSEL 3-SLIDE (estado por classe) ─── */
let currentSlide = 0;
const totalSlides = 5;
let carouselInterval = null;

/**
 * Retorna o nome da classe de estado para cada slide
 * com base na distância do slide ativo.
 *   diff=0  → centro (active)
 *   diff=1  → direita próxima (next)
 *   diff=-1 → esquerda próxima (prev)
 *   diff=2  → escondido à direita
 *   diff=-2 → escondido à esquerda
 */
function getSlideState(slideIndex) {
  const diff = ((slideIndex - currentSlide) + totalSlides) % totalSlides;
  if (diff === 0) return 'state-active';
  if (diff === 1) return 'state-next';
  if (diff === totalSlides - 1) return 'state-prev';
  if (diff === 2) return 'state-hidden-right';
  return 'state-hidden-left';
}

function updateCarousel() {
  const track = document.getElementById('carouselTrack');
  if (!track) return;

  const slides = track.querySelectorAll('.carousel-slide');
  const stateClasses = ['state-active', 'state-prev', 'state-next', 'state-hidden-left', 'state-hidden-right'];

  slides.forEach((slide, i) => {
    stateClasses.forEach(c => slide.classList.remove(c));
    slide.classList.add(getSlideState(i));
  });

  // Atualiza os dots
  document.querySelectorAll('.carousel-dot').forEach((dot, i) => {
    dot.classList.toggle('active', i === currentSlide);
  });
}

function goToSlide(index) {
  currentSlide = ((index % totalSlides) + totalSlides) % totalSlides;
  updateCarousel();
}

function startAutoPlay() {
  carouselInterval = setInterval(() => goToSlide(currentSlide + 1), 4500);
}

function stopAutoPlay() {
  if (carouselInterval) clearInterval(carouselInterval);
}

document.addEventListener('DOMContentLoaded', () => {
  const prevBtn = document.getElementById('carouselPrev');
  const nextBtn = document.getElementById('carouselNext');

  if (prevBtn) prevBtn.addEventListener('click', () => {
    stopAutoPlay();
    goToSlide(currentSlide - 1);
    startAutoPlay();
  });

  if (nextBtn) nextBtn.addEventListener('click', () => {
    stopAutoPlay();
    goToSlide(currentSlide + 1);
    startAutoPlay();
  });

  document.querySelectorAll('.carousel-dot').forEach(dot => {
    dot.addEventListener('click', () => {
      stopAutoPlay();
      goToSlide(parseInt(dot.dataset.index));
      startAutoPlay();
    });
  });

  // Inicia estado e autoplay
  updateCarousel();
  startAutoPlay();
  renderPlanoBtns('Veículos');
  setPlano('auto50');
});

/* Swipe para mobile */
let touchStartX = 0;
document.addEventListener('DOMContentLoaded', () => {
  const vp = document.querySelector('.carousel-viewport');
  if (!vp) return;
  vp.addEventListener('touchstart', e => {
    touchStartX = e.changedTouches[0].screenX;
  }, { passive: true });
  vp.addEventListener('touchend', e => {
    const diff = touchStartX - e.changedTouches[0].screenX;
    if (Math.abs(diff) > 50) {
      stopAutoPlay();
      diff > 0 ? goToSlide(currentSlide + 1) : goToSlide(currentSlide - 1);
      startAutoPlay();
    }
  }, { passive: true });
});

/* ─── MODAL SIMULAÇÃO ─── */
let _modalPlan = {};

function openSimModal(plano, credito, parcela) {
  _modalPlan = { plano, credito, parcela };
  const tag = document.getElementById('simModalPlanTag');
  if (tag) {
    tag.innerHTML =
      `<strong>${plano}</strong><br>` +
      `💰 Crédito: <strong>${credito}</strong> &nbsp;|&nbsp; ` +
      `💳 Parcela estimada: <strong>${parcela}/mês</strong>`;
  }
  document.getElementById('simModalOverlay').classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeSimModal() {
  document.getElementById('simModalOverlay').classList.remove('active');
  document.body.style.overflow = '';
}

function handleOverlayClick(e) {
  if (e.target === document.getElementById('simModalOverlay')) closeSimModal();
}

function submitSimModal(e) {
  e.preventDefault();
  const btn      = e.target.querySelector('.btn-modal-enviar');
  const btnText  = btn.querySelector('.btn-enviar-text');
  const btnLoad  = btn.querySelector('.btn-enviar-loading');

  btnText.style.display = 'none';
  btnLoad.style.display = 'inline-flex';
  btn.disabled = true;

  const nome  = document.getElementById('modal-nome').value.trim();
  const email = document.getElementById('modal-email').value.trim();
  const tel   = document.getElementById('modal-telefone').value.trim();
  const cep   = document.getElementById('modal-cep').value.trim();

  const msg = encodeURIComponent(
    `Olá! Tenho interesse em um consórcio Arcosull.\n\n` +
    `*Dados da simulação*\n` +
    `Plano: ${_modalPlan.plano}\n` +
    `Crédito: ${_modalPlan.credito}\n` +
    `Parcela estimada: ${_modalPlan.parcela}/mês\n\n` +
    `*Dados do cliente*\n` +
    `Nome: ${nome}\n` +
    `E-mail: ${email}\n` +
    `Telefone: ${tel}\n` +
    `CEP: ${cep}`
  );

  setTimeout(() => {
    window.open(`https://wa.me/554598066693?text=${msg}`, '_blank');
    btnText.textContent = '✓ Enviado!';
    btnText.style.display = 'inline-flex';
    btnLoad.style.display = 'none';
    setTimeout(() => {
      closeSimModal();
      e.target.reset();
      btnText.textContent = 'Enviar Dados';
      btn.disabled = false;
    }, 1800);
  }, 900);
}

/* ─── Fechar modal com ESC ─── */
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeSimModal();
});

/* ─── FAQ ACCORDION ─── */
function toggleFaq(btn) {
  const item = btn.parentElement;
  const wasOpen = item.classList.contains('open');
  document.querySelectorAll('.faq-item').forEach(faq => faq.classList.remove('open'));
  if (!wasOpen) item.classList.add('open');
}

/* ─── CHART.JS ─── */
let simChart = null;
let chartMouseleaveAdded = false;

function createChart(creditValue, prazo = 72) {
  const ctx = document.getElementById('simChart');
  if (!ctx) return;

  // Remove pontos do hover ao sair do gráfico
  if (!chartMouseleaveAdded) {
    ctx.addEventListener('mouseleave', () => {
      if (simChart) {
        simChart.tooltip.hide();
        simChart.setActiveElements([]);
        simChart.update('none');
      }
    });
    chartMouseleaveAdded = true;
  }

  const months = prazo;
  const labels = [];
  const creditData = [];
  const parcelasData = [];
  const valorizacaoData = [];
  const taxaAdmin = 0.15;

  for (let i = 0; i <= months; i += 3) {
    labels.push(i === 0 ? 'Início' : `${i}m`);
    const t = i / months;
    const sCurve = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    creditData.push(Math.round(creditValue * sCurve));
    parcelasData.push(Math.round(creditValue * (1 + taxaAdmin) * Math.pow(t, 0.85)));
    const base = creditValue * (1 + 0.06 * (i / 12));
    const wave = Math.sin(i * 0.15) * creditValue * 0.02;
    valorizacaoData.push(Math.round((base * sCurve) + wave));
  }

  if (simChart) {
    simChart.data.labels = labels;
    simChart.data.datasets[0].data = creditData;
    simChart.data.datasets[1].data = parcelasData;
    simChart.data.datasets[2].data = valorizacaoData;
    simChart.update('none');
    return;
  }

  const chartCtx = ctx.getContext('2d');
  const blueGrad = chartCtx.createLinearGradient(0, 0, 0, 300);
  blueGrad.addColorStop(0, 'rgba(59,130,246,0.2)'); blueGrad.addColorStop(1, 'rgba(59,130,246,0)');
  const greenGrad = chartCtx.createLinearGradient(0, 0, 0, 300);
  greenGrad.addColorStop(0, 'rgba(16,185,129,0.15)'); greenGrad.addColorStop(1, 'rgba(16,185,129,0)');
  const purpleGrad = chartCtx.createLinearGradient(0, 0, 0, 300);
  purpleGrad.addColorStop(0, 'rgba(139,92,246,0.15)'); purpleGrad.addColorStop(1, 'rgba(139,92,246,0)');

  simChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        { label: 'Crédito acumulado', data: creditData, borderColor: '#3b82f6', backgroundColor: blueGrad, fill: true, tension: 0.45, borderWidth: 3, pointRadius: 0, pointHoverRadius: 7, pointHoverBackgroundColor: '#3b82f6', pointHoverBorderColor: '#fff', pointHoverBorderWidth: 3 },
        { label: 'Parcelas pagas', data: parcelasData, borderColor: '#10b981', backgroundColor: greenGrad, fill: true, tension: 0.45, borderWidth: 2.5, pointRadius: 0, pointHoverRadius: 6, pointHoverBackgroundColor: '#10b981', pointHoverBorderColor: '#fff', pointHoverBorderWidth: 3 },
        { label: 'Valorização', data: valorizacaoData, borderColor: '#8b5cf6', backgroundColor: purpleGrad, fill: true, tension: 0.45, borderWidth: 2, pointRadius: 0, pointHoverRadius: 6, pointHoverBackgroundColor: '#8b5cf6', pointHoverBorderColor: '#fff', pointHoverBorderWidth: 3 }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      animation: { duration: 800, easing: 'easeInOutQuart' },
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(10,37,64,0.95)', titleColor: '#fff', bodyColor: 'rgba(255,255,255,0.85)',
          padding: 16, cornerRadius: 12,
          titleFont: { size: 13, weight: '700', family: 'Inter' },
          bodyFont: { size: 12, family: 'Inter' },
          displayColors: true, boxWidth: 10, boxHeight: 10, boxPadding: 6, usePointStyle: true,
          callbacks: { label: c => '  ' + c.dataset.label + ':  R$ ' + c.parsed.y.toLocaleString('pt-BR') }
        }
      },
      scales: {
        x: { grid: { color: 'rgba(0,0,0,0.03)', drawBorder: false }, ticks: { color: '#9ca3af', font: { size: 10, weight: '600', family: 'Inter' }, maxTicksLimit: 8 } },
        y: {
          grid: { color: 'rgba(0,0,0,0.03)', drawBorder: false },
          ticks: {
            color: '#9ca3af', font: { size: 10, weight: '600', family: 'Inter' },
            callback: v => v >= 1000000 ? 'R$ ' + (v / 1000000).toFixed(1) + 'M' : v >= 1000 ? 'R$ ' + (v / 1000).toFixed(0) + 'k' : 'R$ ' + v,
            maxTicksLimit: 6
          },
          beginAtZero: true
        }
      }
    }
  });
}

/* ─── SIMULADOR ─── */
let simMode = 'credito';
let _simCreditValue = 40000;

// Tabelas reais Porto — [credito, parcelaCheia]
const TABELAS = {
  auto50:  [[25000,600],[30000,720],[35000,840],[40000,960],[45000,1080],[50000,1200]],
  auto72:  [[34000,566],[35000,583],[40000,666],[45000,750],[50000,833],[55000,916],[60000,1000],[65000,1083]],
  auto80:  [[62500,921],[72500,1069],[82500,1216],[92500,1364],[102500,1511],[112500,1659],[117500,1733],[122500,1806],[125000,1843]],
  auto90:  [[125000,1625],[130000,1690],[140000,1820],[150000,1950],[160000,2080],[170000,2210],[180000,2340],[190000,2470],[200000,2600]],
  pesado120: [[180000,1740],[200000,1933],[220000,2126],[240000,2320],[250000,2416],[260000,2513],[280000,2706],[300000,2900],[320000,3093],[340000,3286],[350000,3383],[360000,3480]],
  imovel200: [[70000,444],[80000,508],[90000,571],[100000,635],[110000,698],[120000,762],[130000,825],[140000,889],[150000,937],[180000,1125],[200000,1250],[220000,1375],[250000,1562],[280000,1750],[300000,1845],[400000,2460],[450000,2767],[500000,3075],[560000,3444],[600000,3645],[650000,3948],[700000,4252],[750000,4556],[800000,4860],[850000,5163],[900000,5467],[1000000,6075]],
};

const TAXAS  = { auto50: 0.20, auto72: 0.20, auto80: 0.18, auto90: 0.17, pesado120: 0.16, imovel200: 0.22 };
const PRAZOS = { auto50: 50,   auto72: 72,   auto80: 80,   auto90: 90,   pesado120: 120,  imovel200: 200  };
const NOMES  = { auto50: 'Auto 50 meses', auto72: 'Auto 72 meses', auto80: 'Auto 80 meses', auto90: 'Auto 90 meses', pesado120: 'Pesado 120 meses', imovel200: 'Imóvel 200 meses' };

// Planos por categoria
const CAT_PLANOS = {
  'Veículos': ['auto50','auto72','auto80','auto90'],
  'Pesados':  ['pesado120'],
  'Imóveis':  ['imovel200'],
};

let _planoAtivo = 'auto50';

function renderPlanoBtns(categoria) {
  const grupo = document.getElementById('planoBtnGroup');
  if (!grupo) return;
  const planos = CAT_PLANOS[categoria] || CAT_PLANOS['Veículos'];
  grupo.innerHTML = planos.map(k =>
    `<button class="plano-btn ${k === _planoAtivo ? 'active' : ''}" onclick="setPlano('${k}')">${PRAZOS[k]}m</button>`
  ).join('');
}

function setPlano(key) {
  _planoAtivo = key;
  const rows   = TABELAS[key];
  const midIdx = Math.floor(rows.length / 2);
  const range  = document.getElementById('sim-range');
  range.min = 0; range.max = rows.length - 1; range.step = 1; range.value = midIdx;
  const fmtK = v => v >= 1000000 ? 'R$ ' + (v/1000000).toFixed(1) + 'M' : 'R$ ' + (v/1000).toFixed(0) + ' mil';
  document.querySelector('.sim-range-labels').innerHTML =
    `<span>${fmtK(rows[0][0])}</span><span>${fmtK(rows[rows.length-1][0])}</span>`;
  document.querySelectorAll('.plano-btn').forEach(b => b.classList.toggle('active', b.textContent === PRAZOS[key]+'m'));
  updateSim(midIdx);
}


function fmt(v) {
  return 'R$ ' + v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function updateSim(val) {
  const idx   = parseInt(val);
  const range = document.getElementById('sim-range');
  const max   = parseInt(range.max);
  const pct   = (idx / max) * 100;
  range.style.background = `linear-gradient(to right, #3b82f6 0%, #1d4ed8 ${pct}%, #e5e7eb ${pct}%, #e5e7eb 100%)`;

  const planoKey     = _planoAtivo;
  const row          = TABELAS[planoKey][idx] || TABELAS[planoKey][0];
  const credito      = row[0];
  const parcelaCheia = row[1];
  const prazo        = PRAZOS[planoKey];
  const taxa         = TAXAS[planoKey];

  _simCreditValue = credito;
  document.getElementById('sim-num').textContent = credito.toLocaleString('pt-BR', { maximumFractionDigits: 0 });

  const msgEl = document.getElementById('msgReducao');
  if (simMode === 'parcela') {
    const reducao = planoKey === 'imovel200' ? 0.25 : 0.20;
    document.getElementById('stat-parcela').textContent = fmt(Math.round(parcelaCheia * (1 - reducao)));
    if (msgEl) {
      msgEl.style.display = 'block';
      msgEl.innerHTML = `Parcela com <strong>${reducao * 100}% de redução</strong> padrão aplicada — válida até a contemplação.`;
    }
  } else {
    document.getElementById('stat-parcela').textContent = fmt(parcelaCheia);
    if (msgEl) msgEl.style.display = 'none';
  }

  document.getElementById('stat-prazo').textContent = NOMES[planoKey];
  document.getElementById('stat-taxa').textContent  = (taxa * 100).toFixed(0) + '% total';
  createChart(credito, prazo);
}

function simularAgora() {
  const btn = document.querySelector('.btn-simular');
  btn.style.transform = 'scale(0.95)';
  setTimeout(() => { btn.style.transform = ''; }, 200);

  const categoria = document.querySelector('.cat-btn.active')?.textContent?.trim() || 'Veículos';
  const prazo     = document.getElementById('stat-prazo')?.textContent?.trim() || '';
  const parcela   = document.getElementById('stat-parcela')?.textContent?.trim() || '';
  const credito   = 'R$ ' + _simCreditValue.toLocaleString('pt-BR', { maximumFractionDigits: 0 }) + ',00';

  openSimModal(`${categoria} — ${prazo}`, credito, parcela);
}

function setTab(el, mode) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  simMode = mode;
  // Slider não muda — apenas recalcula a parcela exibida
  updateSim(document.getElementById('sim-range').value);
}

function setCat(el) {
  document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  const cat = el.textContent.trim();
  const primeiroPlaono = (CAT_PLANOS[cat] || CAT_PLANOS['Veículos'])[0];
  _planoAtivo = primeiroPlaono;
  renderPlanoBtns(cat);
  setPlano(primeiroPlaono);
}

/* ─── FORMULÁRIO ─── */
function maskPhone(input) {
  let v = input.value.replace(/\D/g, '');
  if (v.length > 11) v = v.slice(0, 11);
  if (v.length > 6) v = `(${v.slice(0, 2)}) ${v.slice(2, 7)}-${v.slice(7)}`;
  else if (v.length > 2) v = `(${v.slice(0, 2)}) ${v.slice(2)}`;
  else if (v.length > 0) v = `(${v}`;
  input.value = v;
}

function maskCep(input) {
  let v = input.value.replace(/\D/g, '');
  if (v.length > 8) v = v.slice(0, 8);
  if (v.length > 5) v = `${v.slice(0, 5)}-${v.slice(5)}`;
  input.value = v;
}

function handleFormSubmit(e) {
  e.preventDefault();
  const btn = e.target.querySelector('.btn-enviar');
  const btnText = btn.querySelector('.btn-enviar-text');
  const btnLoading = btn.querySelector('.btn-enviar-loading');
  btnText.style.display = 'none';
  btnLoading.style.display = 'inline-flex';
  btn.disabled = true;
  setTimeout(() => {
    btnText.textContent = '✓ Dados Enviados!';
    btnText.style.display = 'inline'; btnLoading.style.display = 'none';
    btn.style.background = 'linear-gradient(135deg, #10b981, #059669)';
    setTimeout(() => {
      btnText.textContent = 'Enviar Dados';
      btn.style.background = ''; btn.disabled = false;
      e.target.reset();
    }, 3000);
  }, 1500);
}

/* ─── NAV ─── */
window.addEventListener('scroll', () => {
  const nav = document.getElementById('navbar');
  if (window.scrollY > 50) nav.classList.add('scrolled');
  else nav.classList.remove('scrolled');
});

document.getElementById('hamburger').addEventListener('click', () => {
  document.getElementById('navLinks').classList.toggle('open');
});

document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (target) { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth' }); document.getElementById('navLinks').classList.remove('open'); }
  });
});

/* ─── SCROLL REVEAL ─── */
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) { entry.target.style.opacity = '1'; entry.target.style.transform = 'translateY(0)'; }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('.section-header, .sim-container, .contato-container, .bene-grid, .faq-list, .carousel-3').forEach(el => {
  el.style.opacity = '0'; el.style.transform = 'translateY(30px)';
  el.style.transition = 'opacity 0.7s ease, transform 0.7s ease';
  revealObserver.observe(el);
});
