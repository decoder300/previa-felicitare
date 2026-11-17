/* Felicitare Clínica Veterinária — prévia.
   Dados do cliente: só o bloco CONFIG. A cena (pulso, dia→noite, patinhas) fica mais abaixo. */
(function () {
  'use strict';

  /* ================= CONFIG: troque pelos dados do cliente ================= */
  var CONFIG = {
    nome: 'Felicitare',
    zap: '5564999171102',    // só dígitos com DDI e DDD
    /* 0 = domingo … 6 = sábado. null = fechado (mas há plantão 24h para emergência). */
    horario: {
      0: null,
      1: { abre: '08:00', fecha: '18:00' },
      2: { abre: '08:00', fecha: '18:00' },
      3: { abre: '08:00', fecha: '18:00' },
      4: { abre: '08:00', fecha: '18:00' },
      5: { abre: '08:00', fecha: '18:00' },
      6: { abre: '08:00', fecha: '12:00' }
    },
    fuso: 'America/Sao_Paulo'
  };
  var MSG = {
    agendar: 'quero agendar uma consulta para o meu pet.',
    consulta: 'quero agendar uma consulta geral.',
    especializada: 'quero falar sobre um atendimento especializado (dermatologia/oncologia).',
    cirurgia: 'tenho uma dúvida sobre cirurgia e anestesia.',
    imagem: 'quero agendar um exame de imagem (ultrassom ou raio-x).',
    laboratorio: 'quero fazer um exame laboratorial.',
    internacao: 'quero saber sobre a internação monitorada 24h.',
    dentaria: 'quero agendar uma avaliação de limpeza dentária.',
    vacina: 'quero marcar a vacinação do meu pet.',
    castracao: 'quero saber sobre castração.',
    farmacia: 'quero saber de um remédio ou antiparasitário.',
    produtos: 'quero fazer um pedido de ração ou produtos.',
    comochegar: 'tenho uma dúvida e quero falar com a equipe.'
  };
  /* ======================================================================== */

  var NOMES = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  var reduz = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.documentElement.classList.add('js');

  function linkZap(texto) { return 'https://wa.me/' + CONFIG.zap + '?text=' + encodeURIComponent(texto); }
  function ola(t) { return 'Olá, ' + CONFIG.nome + '! ' + t.charAt(0).toUpperCase() + t.slice(1); }
  document.querySelectorAll('[data-zap]').forEach(function (a) {
    var m = MSG[a.getAttribute('data-zap')];
    if (m) a.href = linkZap(ola(m));
  });

  var ano = document.querySelector('[data-ano]'); if (ano) ano.textContent = new Date().getFullYear();

  /* ---------- Aberto agora ---------- */
  function agora() {
    var p = {};
    try {
      new Intl.DateTimeFormat('en-US', { timeZone: CONFIG.fuso, weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
        .formatToParts(new Date()).forEach(function (x) { p[x.type] = x.value; });
      var d = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
      return { dia: d[p.weekday], min: (+p.hour % 24) * 60 + (+p.minute) };
    } catch (e) { var n = new Date(); return { dia: n.getDay(), min: n.getHours() * 60 + n.getMinutes() }; }
  }
  function emMin(h) { var p = h.split(':'); return +p[0] * 60 + (+p[1]); }
  function proximaAbertura(dia) {
    for (var i = 1; i <= 7; i++) {
      var d = (dia + i) % 7, h = CONFIG.horario[d];
      if (h) return (i === 1 ? 'amanhã' : NOMES[d].toLowerCase()) + ' às ' + h.abre;
    }
    return '';
  }
  var ag = agora(), hoje = CONFIG.horario[ag.dia], estado, resto;
  if (hoje && ag.min < emMin(hoje.abre)) { estado = 'fechado'; resto = ', abre às ' + hoje.abre + ' (plantão 24h)'; }
  else if (hoje && ag.min < emMin(hoje.fecha)) { estado = 'aberto'; resto = ', fecha às ' + hoje.fecha; }
  else { estado = 'fechado'; resto = ', abre ' + proximaAbertura(ag.dia) + ' (plantão 24h)'; }
  document.querySelectorAll('[data-status]').forEach(function (el) {
    el.setAttribute('data-estado', estado);
    var t = el.querySelector('[data-status-txt]');
    if (t) { t.textContent = estado === 'aberto' ? 'Aberto agora' : 'Fechado agora'; var r = document.createElement('span'); r.className = 'st-resto'; r.textContent = resto; t.appendChild(r); }
  });
  var corpo = document.querySelector('[data-horario]');
  if (corpo) {
    [1, 2, 3, 4, 5, 6, 0].forEach(function (d) {
      var h = CONFIG.horario[d], tr = document.createElement('tr');
      if (d === ag.dia) tr.className = 'hoje';
      tr.innerHTML = '<th scope="row"></th><td></td>';
      tr.firstChild.textContent = NOMES[d] + (d === ag.dia ? ' (hoje)' : '');
      tr.lastChild.textContent = h ? h.abre + ' às ' + h.fecha : 'Fechado (plantão 24h)';
      corpo.appendChild(tr);
    });
  }

  /* ---------- Agendador: monta a mensagem do WhatsApp ---------- */
  var form = document.getElementById('agenda');
  if (form) {
    var caixaDias = form.querySelector('[data-dias]');
    var primeiro = true;
    [1, 2, 3, 4, 5, 6, 0].forEach(function (d) {
      if (!CONFIG.horario[d]) return;
      var l = document.createElement('label');
      l.innerHTML = '<input type="radio" name="dia"><span></span>';
      l.firstChild.value = NOMES[d].toLowerCase(); if (primeiro) { l.firstChild.checked = true; primeiro = false; }
      l.lastChild.textContent = NOMES[d].slice(0, 3);
      caixaDias.appendChild(l);
    });
    var previa = form.querySelector('[data-previa]'), btn = form.querySelector('[data-agenda-btn]');
    var atualiza = function () {
      var v = function (n) { return (form.querySelector('[name=' + n + ']:checked') || {}).value || ''; };
      var dia = v('dia');
      var msg = ola('quero agendar ' + v('tipo') + ' para o meu ' + v('bicho') +
        ', de preferência ' + (dia === 'sábado' || dia === 'domingo' ? 'no ' : 'na ') + dia + '.');
      previa.textContent = '“' + msg + '”';
      btn.href = linkZap(msg);
    };
    form.addEventListener('change', atualiza);
    atualiza();
  }

  /* ---------- Topo, menu e barra do celular ---------- */
  var topo = document.querySelector('.topo');
  var aoRolar = function () { topo.classList.toggle('rolou', window.scrollY > 20); };
  window.addEventListener('scroll', aoRolar, { passive: true }); aoRolar();

  var abre = document.querySelector('.abre-menu'), menu = document.getElementById('menu');
  if (abre && menu) {
    var fecha = function () { menu.classList.remove('aberto'); abre.setAttribute('aria-expanded', 'false'); abre.setAttribute('aria-label', 'Abrir menu'); };
    abre.addEventListener('click', function () {
      var a = menu.classList.toggle('aberto');
      abre.setAttribute('aria-expanded', a ? 'true' : 'false');
      abre.setAttribute('aria-label', a ? 'Fechar menu' : 'Abrir menu');
    });
    menu.addEventListener('click', function (e) { if (e.target.closest('a')) fecha(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') fecha(); });
  }

  var barra = document.querySelector('.barra-zap');
  var btnHeroi = document.querySelector('.heroi .btn-zap');
  if (barra && btnHeroi && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (es) {
      barra.classList.toggle('antes', es[0].isIntersecting || es[0].boundingClientRect.top > 0);
    }).observe(btnHeroi);
  } else if (barra) { barra.classList.remove('antes'); }

  /* ---------- Blobs suaves no herói (canvas) ---------- */
  function blobs(canvas) {
    var ctx = canvas.getContext('2d'); if (!ctx) return;
    var dpr = Math.min(window.devicePixelRatio || 1, 2), w, h, lista = [], visivel = true;
    var qtd = window.innerWidth < 860 ? 10 : 18;
    var cores = ['232,126,99', '207,154,140', '243,218,209'];
    function medir() { w = canvas.clientWidth; h = canvas.clientHeight; canvas.width = w * dpr; canvas.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
    function nova(inicio) {
      var r = 24 + Math.random() * 70;
      return { x: Math.random() * w, y: inicio ? Math.random() * h : h + r, r: r, vy: .12 + Math.random() * .4, fase: Math.random() * 6.28, cor: cores[(Math.random() * cores.length) | 0], a: .1 + Math.random() * .12 };
    }
    medir(); for (var i = 0; i < qtd; i++) lista.push(nova(true));
    window.addEventListener('resize', medir);
    function quadro(t) {
      ctx.clearRect(0, 0, w, h);
      lista.forEach(function (b, i) {
        if (!reduz) { b.y -= b.vy; b.x += Math.sin(t / 1400 + b.fase) * .3; if (b.y < -b.r) lista[i] = nova(false); }
        var g = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r);
        g.addColorStop(0, 'rgba(' + b.cor + ',' + b.a + ')');
        g.addColorStop(1, 'rgba(' + b.cor + ',0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, 6.283); ctx.fill();
      });
      if (!reduz && visivel) requestAnimationFrame(quadro);
    }
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) {
        var era = visivel; visivel = es[0].isIntersecting;
        if (visivel && !era && !reduz) requestAnimationFrame(quadro);
      }).observe(canvas);
    }
    requestAnimationFrame(quadro);
  }
  document.querySelectorAll('[data-bolhas]').forEach(function (c) { blobs(c); });

  /* ---------- Jornada do plantão (marcação ativa) ---------- */
  var passos = document.querySelectorAll('.passo');
  function marcaPasso(i) { passos.forEach(function (e, j) { e.classList.toggle('ativa', j === i); }); }
  marcaPasso(0);

  /* ---------- Sem GSAP ou com movimento reduzido: tudo visível ---------- */
  var surgem = document.querySelectorAll('.surge');
  function mostraTudo() { surgem.forEach(function (el) { el.classList.add('visto'); }); }
  if (reduz || !window.gsap || !window.ScrollTrigger) {
    mostraTudo();
    if (reduz) passos.forEach(function (e) { e.classList.add('ativa'); });
    return;
  }

  /* ================= CENA (GSAP + Lenis) ================= */
  var gsap = window.gsap, ST = window.ScrollTrigger;
  gsap.registerPlugin(ST);
  if (window.Lenis) {
    var lenis = new window.Lenis({ lerp: 0.1 });
    lenis.on('scroll', ST.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var id = a.getAttribute('href'); if (id.length < 2) return;
        var alvo = document.querySelector(id); if (!alvo) return;
        e.preventDefault(); lenis.scrollTo(alvo, { offset: -90 });
      });
    });
  }

  /* entradas */
  surgem.forEach(function (el) {
    ST.create({ trigger: el, start: 'top 90%', once: true, onEnter: function () { el.classList.add('visto'); } });
  });

  /* título que se compõe: palavra por palavra */
  var h1 = document.querySelector('.compoe');
  if (h1) {
    var partes = [];
    Array.prototype.slice.call(h1.childNodes).forEach(function (n) {
      if (n.nodeType === 3) {
        n.textContent.split(/(\s+)/).forEach(function (p) {
          if (!p) return;
          if (/^\s+$/.test(p)) { partes.push(document.createTextNode(p)); return; }
          var s = document.createElement('span'); s.className = 'pal'; s.textContent = p; partes.push(s);
        });
      } else { n.classList.add('pal'); partes.push(n); }
    });
    h1.textContent = ''; partes.forEach(function (p) { h1.appendChild(p); });
    h1.querySelectorAll('.pal').forEach(function (s) { s.style.display = 'inline-block'; });
    gsap.from(h1.querySelectorAll('.pal'), { yPercent: 90, opacity: 0, rotate: 3, duration: .8, ease: 'back.out(1.6)', stagger: .06, delay: .1 });
    gsap.from('.heroi .bairro, .heroi .lead, .heroi-acoes, .google-selo', { y: 24, opacity: 0, duration: .7, stagger: .1, delay: .5 });
    gsap.from('.bolha-foto', { scale: .6, opacity: 0, duration: 1.1, ease: 'elastic.out(1, .6)', delay: .3 });
    gsap.from('.balao', { scale: 0, rotate: -30, duration: .7, ease: 'back.out(2.2)', delay: 1 });
    gsap.from('.selo-24', { scale: 0, rotate: 40, duration: .7, ease: 'back.out(2)', delay: 1.2 });
  }

  /* linha de pulso do herói se desenha */
  var pulso = document.querySelector('.pulso-linha');
  if (pulso) gsap.to(pulso, { strokeDashoffset: 0, duration: 2, ease: 'power1.inOut', delay: .4, repeat: -1, repeatDelay: 1.2, yoyo: false, onRepeat: function () { gsap.set(pulso, { strokeDashoffset: 1400 }); } });

  /* profundidade: camadas em velocidades diferentes */
  document.querySelectorAll('[data-vel]').forEach(function (el) {
    gsap.to(el, { yPercent: -60 * parseFloat(el.dataset.vel), ease: 'none',
      scrollTrigger: { trigger: el.closest('section'), start: 'top top', end: 'bottom top', scrub: true } });
  });

  var mm = gsap.matchMedia();

  /* PLANTÃO: seção presa só no desktop (>=1101) — em tablet/celular nada fica preso, então nada cobre o título */
  mm.add('(min-width: 1101px)', function () {
    var tl = gsap.timeline({
      scrollTrigger: {
        trigger: '[data-plantao]', start: 'top top', end: '+=180%',
        scrub: 1, pin: true,
        onUpdate: function (s) { marcaPasso(s.progress < .25 ? 0 : s.progress < .5 ? 1 : s.progress < .75 ? 2 : 3); }
      }
    });
    tl.to('.ceu', { background: 'linear-gradient(180deg, #5a4660, #2a2033 55%, #171019)', ease: 'none', duration: 1 }, 0)
      .to('.sol', { y: 220, opacity: 0, ease: 'power1.in', duration: .6 }, 0)
      .to('.lua', { opacity: 1, ease: 'power1.out', duration: .6 }, .35)
      .to('.estrelas', { opacity: .9, ease: 'none', duration: .6 }, .4);
  });
  /* tablet e celular (<=1100): sem pin, só acende a jornada e escurece o céu */
  mm.add('(max-width: 1100px)', function () {
    gsap.to('.ceu', { background: 'linear-gradient(180deg, #4a3850, #241b2e)', ease: 'none',
      scrollTrigger: { trigger: '[data-plantao]', start: 'top 70%', end: 'bottom 40%', scrub: true } });
    gsap.to('.lua', { opacity: 1, scrollTrigger: { trigger: '[data-plantao]', start: 'center 70%', end: 'center 40%', scrub: true } });
    gsap.to('.sol', { opacity: 0, y: 120, scrollTrigger: { trigger: '[data-plantao]', start: 'top 70%', end: 'center 50%', scrub: true } });
    ST.create({ trigger: '[data-plantao]', start: 'top 60%', end: 'bottom 40%', onUpdate: function (s) { marcaPasso(Math.min(3, (s.progress * 4) | 0)); } });
  });

  /* QUEM SOMOS / FAQ: foto se abre por máscara */
  gsap.utils.toArray('.mascara img').forEach(function (img) {
    gsap.from(img, { scale: 1.2, ease: 'none', scrollTrigger: { trigger: img, start: 'top 90%', end: 'center 50%', scrub: true } });
  });
  gsap.from('.lista-quem li', { y: 24, opacity: 0, stagger: .1, duration: .5, scrollTrigger: { trigger: '.lista-quem', start: 'top 88%' } });

  /* SERVIÇOS: cartões entram */
  gsap.from('.serv-grade .card', { y: 30, opacity: 0, duration: .5, stagger: .06, scrollTrigger: { trigger: '.serv-grade', start: 'top 85%' } });

  /* DEPOIMENTOS e BICHOS: entrada pelo mecanismo .surge (confiável, nunca fica vazio) */

  /* COMO CHEGAR: as patinhas andam até a porta */
  var patas = document.querySelectorAll('[data-patas] use');
  gsap.fromTo(patas, { opacity: 0 }, { opacity: 1, stagger: .12, ease: 'none',
    scrollTrigger: { trigger: '[data-mapa]', start: 'top 80%', end: 'center 50%', scrub: true } });
  gsap.from('.m-loja', { scale: 0, transformOrigin: '50% 50%', duration: .6, ease: 'back.out(2)', scrollTrigger: { trigger: '[data-mapa]', start: 'center 60%' } });

  window.addEventListener('load', function () { ST.refresh(); });
})();
