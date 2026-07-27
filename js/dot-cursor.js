/* ── HOLYCAT DOT CURSOR EFFECT (magnetik) ──
       Grid titik hijau dengan fisika spring: titik dalam radius pengaruh
       TERTARIK ke arah kursor (gravitasi/magnet), membesar & menyala,
       lalu memantul mulus kembali ke posisi asalnya saat kursor pergi.
       - #dot-canvas-app   : background dashboard (home-view)
       - #dot-canvas-login : background overlay login (di luar popup;
                             area dalam popup otomatis tertutup card putih) */
    (function () {
      // Efek ini SENGAJA selalu menyala di semua kondisi — termasuk saat sistem
      // melaporkan preferensi "kurangi gerakan" (reduced-motion) / mode hemat baterai —
      // sesuai permintaan eksplisit. Performa tetap dijaga lewat: (1) kepadatan titik
      // lebih jarang di layar sempit, (2) mekanisme "tidur" otomatis — begitu titik-titik
      // sudah diam & tidak ada interaksi, loop berhenti melakukan kalkulasi/gambar berat
      // sampai ada sentuhan/gerakan baru lagi atau tampilan (home/login) baru saja dibuka.

      var isTouchDevice = window.matchMedia('(pointer: coarse)').matches ||
                          window.matchMedia('(max-width: 768px)').matches;

      var SPACING = isTouchDevice ? 38 : 26; // titik lebih jarang di HP → jauh lebih ringan per frame
      var INFLUENCE = 200;     // radius pengaruh kursor/jari (px)
      var PULL = 1.9;          // kekuatan tarikan magnetik ke kursor
      var SPRING = 0.045;      // pegas kembali ke posisi asal
      var DAMP = 0.82;         // redaman (0-1, makin kecil makin cepat berhenti)
      var MAX_SPEED = 7;       // batas kecepatan (hindari jitter)
      var BASE_R = 1.4;        // radius titik dasar
      var MAX_R = 3.4;         // radius titik saat tepat di kursor ("zoom in")
      var GLOW_EASE = 0.18;    // kecepatan transisi nyala/ukuran
      var IDLE_MS = 1800;      // jeda tanpa interaksi sebelum loop dianggap boleh "tidur"

      var mouse = { x: -99999, y: -99999 };
      var lastActivity = 0;
      function markActive() { lastActivity = performance.now(); }

      document.addEventListener('mousemove', function (e) {
        mouse.x = e.clientX; mouse.y = e.clientY;
        markActive();
      }, { passive: true });
      document.addEventListener('mouseleave', function () {
        mouse.x = -99999; mouse.y = -99999;
      });
      document.addEventListener('touchmove', function (e) {
        if (e.touches && e.touches[0]) { mouse.x = e.touches[0].clientX; mouse.y = e.touches[0].clientY; }
        markActive();
      }, { passive: true });
      document.addEventListener('touchend', function () { mouse.x = -99999; mouse.y = -99999; });
      document.addEventListener('touchcancel', function () { mouse.x = -99999; mouse.y = -99999; });

      function themeColors() {
        var dark = document.documentElement.getAttribute('data-theme') === 'dark';
        return dark
          ? { base: 'rgba(123, 211, 168, ', aBase: 0.16, aMax: 0.95 }
          : { base: 'rgba(68, 175, 124, ',  aBase: 0.20, aMax: 0.95 };
      }

      function createDotField(canvas, isVisible) {
        var ctx = canvas.getContext('2d');
        var dots = [];
        var w = 0, h = 0, wasVisible = false;
        var asleep = false; // true = titik sudah diam total & idle lama → lewati kerja berat

        function resize() {
          // Baca ulang DPR setiap resize (bukan sekali di awal) — laptop yang dipindah
          // ke monitor eksternal dengan skala berbeda (mis. 100% → 150%) butuh ini agar
          // canvas tidak buram/salah skala di layar barunya.
          var dpr = Math.min(window.devicePixelRatio || 1, 2);
          w = canvas.clientWidth; h = canvas.clientHeight;
          if (!w || !h) return;
          canvas.width = Math.round(w * dpr);
          canvas.height = Math.round(h * dpr);
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
          dots = [];
          for (var y = SPACING / 2; y < h; y += SPACING) {
            for (var x = SPACING / 2; x < w; x += SPACING) {
              dots.push({ hx: x, hy: y, x: x, y: y, vx: 0, vy: 0, s: 0 });
              // hx/hy = "rumah", x/y = posisi kini, vx/vy = kecepatan, s = intensitas
            }
          }
          // PENTING: set canvas.width/height di atas otomatis MENGOSONGKAN isi canvas
          // (perilaku bawaan HTML canvas). Kalau ini terjadi saat field sedang "tidur"
          // (idle), paksa bangun supaya frame() TIDAK melewati langkah gambar berikutnya
          // — kalau tidak, canvas akan tampak kosong sampai ada gerakan mouse berikutnya.
          asleep = false;
        }

        function frame(colors, active) {
          var visible = isVisible();
          if (!visible) {
            if (wasVisible) { ctx.clearRect(0, 0, w, h); wasVisible = false; asleep = false; }
            return;
          }
          var justBecameVisible = !wasVisible;
          if (justBecameVisible || canvas.clientWidth !== w || canvas.clientHeight !== h) resize();
          wasVisible = true;

          // Hemat CPU/baterai: kalau tidak ada interaksi & titik sudah diam total,
          // lewati loop fisika + gambar (kecuali baru saja jadi terlihat, agar tetap
          // langsung tergambar saat pindah halaman/buka modal walau sedang idle).
          if (asleep && !active && !justBecameVisible) return;

          var rect = canvas.getBoundingClientRect();
          var mx = mouse.x - rect.left, my = mouse.y - rect.top;

          ctx.clearRect(0, 0, w, h);
          var energy = 0; // total gerak+nyala tersisa; dipakai utk deteksi "sudah diam total"
          for (var i = 0; i < dots.length; i++) {
            var d = dots[i];

            // 1) Gaya magnetik: tarik ke arah kursor (dihitung dari POSISI RUMAH
            //    agar tarikan stabil — dot "tersedot" lalu mengorbit halus)
            var ax = 0, ay = 0;
            var dxm = mx - d.hx, dym = my - d.hy;
            var distHome = Math.sqrt(dxm * dxm + dym * dym);
            var tS = 0;
            if (distHome < INFLUENCE) {
              var t = 1 - distHome / INFLUENCE;
              t = t * t;                       // falloff: kuat di pusat, halus di tepi
              if (distHome > 0.001) {
                ax += (dxm / distHome) * PULL * t;
                ay += (dym / distHome) * PULL * t;
              }
              tS = t;
            }

            // 2) Pegas kembali ke rumah + redaman
            ax += (d.hx - d.x) * SPRING;
            ay += (d.hy - d.y) * SPRING;
            d.vx = (d.vx + ax) * DAMP;
            d.vy = (d.vy + ay) * DAMP;

            var sp = Math.sqrt(d.vx * d.vx + d.vy * d.vy);
            if (sp > MAX_SPEED) { d.vx = d.vx / sp * MAX_SPEED; d.vy = d.vy / sp * MAX_SPEED; }
            d.x += d.vx;
            d.y += d.vy;

            // 3) Intensitas nyala/ukuran mengikuti kedekatan POSISI KINI ke kursor
            var pdx = mx - d.x, pdy = my - d.y;
            var pDist = Math.sqrt(pdx * pdx + pdy * pdy);
            var tGlow = pDist < INFLUENCE ? (1 - pDist / INFLUENCE) : 0;
            tGlow = tGlow * tGlow;
            if (tGlow < tS) tGlow = tS;
            d.s += (tGlow - d.s) * GLOW_EASE;

            var r = BASE_R + (MAX_R - BASE_R) * d.s;
            var a = colors.aBase + (colors.aMax - colors.aBase) * d.s;
            ctx.beginPath();
            ctx.arc(d.x, d.y, r, 0, 6.2832);
            ctx.fillStyle = colors.base + a.toFixed(3) + ')';
            ctx.fill();

            energy += Math.abs(d.vx) + Math.abs(d.vy) + d.s;
          }
          asleep = !active && energy < 0.05;
        }

        window.addEventListener('resize', resize);
        resize();
        return { frame: frame };
      }

      var appCanvas = document.getElementById('dot-canvas-app');
      var loginCanvas = document.getElementById('dot-canvas-login');
      var homeView = document.getElementById('home-view');
      var analyticsView = document.getElementById('analytics-view');
      var loginModal = document.getElementById('login-modal');

      var fields = [];
      if (appCanvas) {
        fields.push(createDotField(appCanvas, function () {
          var isHome = homeView && homeView.style.display !== 'none';
          var isAnalytics = analyticsView && analyticsView.style.display !== 'none';
          return isHome || isAnalytics;
        }));
      }
      if (loginCanvas && loginModal) {
        fields.push(createDotField(loginCanvas, function () {
          return loginModal.style.display !== 'none';
        }));
      }

      function loop() {
        var colors = themeColors();
        var active = (performance.now() - lastActivity) < IDLE_MS;
        for (var i = 0; i < fields.length; i++) fields[i].frame(colors, active);
        requestAnimationFrame(loop);
      }
      if (fields.length) requestAnimationFrame(loop);
    })();