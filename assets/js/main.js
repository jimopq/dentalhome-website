/* ==========================================================================
   文心牙醫聯合診所 — interaction layer
   Springs over durations: motion starts from the current on-screen value,
   inherits the user's velocity, and can be grabbed and reversed mid-flight.
   ========================================================================== */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  /* ------------------------------------------------------------------
     Spring — damping ratio + response, the two parameters Apple exposes.
     Interruptible by design: retarget() keeps the current value AND the
     current velocity, so a reversal never hits a "brick wall".
     ------------------------------------------------------------------ */
  function Spring(opts) {
    opts = opts || {};
    this.value = opts.from || 0;
    this.target = opts.to || 0;
    this.velocity = opts.velocity || 0;
    this.damping = opts.damping == null ? 1 : opts.damping; // 1 = critically damped
    this.response = opts.response || 0.4;                   // seconds, not a duration
    this.onUpdate = opts.onUpdate || function () {};
    this.onRest = opts.onRest || function () {};
    this._raf = null;
    this._last = 0;
  }

  Spring.prototype.retarget = function (to, velocity) {
    this.target = to;
    if (velocity != null) this.velocity = velocity;
    this.start();
  };

  Spring.prototype.set = function (v) {
    this.stop();
    this.value = this.target = v;
    this.velocity = 0;
    this.onUpdate(v);
  };

  Spring.prototype.start = function () {
    if (this._raf) return;                 // already running — just keep going
    this._last = performance.now();
    var self = this;
    var tick = function (now) {
      var dt = Math.min((now - self._last) / 1000, 1 / 30); // clamp after a stall
      self._last = now;
      self._step(dt);
      self.onUpdate(self.value);
      if (Math.abs(self.value - self.target) < 0.08 && Math.abs(self.velocity) < 0.08) {
        self.value = self.target;
        self.velocity = 0;
        self.onUpdate(self.value);
        self._raf = null;
        self.onRest();
        return;
      }
      self._raf = requestAnimationFrame(tick);
    };
    this._raf = requestAnimationFrame(tick);
  };

  Spring.prototype.stop = function () {
    if (this._raf) cancelAnimationFrame(this._raf);
    this._raf = null;
  };

  Spring.prototype._step = function (dt) {
    // Apple's mapping: ω = 2π / response, ζ = damping ratio
    var omega = (2 * Math.PI) / this.response;
    var zeta = this.damping;
    var x = this.value - this.target;
    var accel = -omega * omega * x - 2 * zeta * omega * this.velocity;
    this.velocity += accel * dt;
    this.value += this.velocity * dt;
  };

  /* Momentum projection — where a flick is *going*, not where it was released.
     Apple's exponential-decay form, not the v²/2a textbook one. */
  function project(velocity, decelerationRate) {
    var d = decelerationRate || 0.998;
    return (velocity / 1000) * d / (1 - d);
  }

  /* Progressive resistance past a boundary — real things slow before they stop */
  function rubberband(overshoot, dimension, c) {
    c = c || 0.55;
    return (overshoot * dimension * c) / (dimension + c * Math.abs(overshoot));
  }

  /* Tracks the last few pointer samples so release velocity is real,
     not a single-frame delta. */
  function VelocityTracker() {
    this.samples = [];
  }
  VelocityTracker.prototype.add = function (y) {
    this.samples.push({ y: y, t: performance.now() });
    if (this.samples.length > 6) this.samples.shift();
  };
  VelocityTracker.prototype.reset = function () { this.samples = []; };
  VelocityTracker.prototype.velocity = function () {
    var s = this.samples;
    if (s.length < 2) return 0;
    var last = s[s.length - 1];
    var first = s[0];
    // Prefer a recent window so an old slow drag doesn't dilute a late flick
    for (var i = s.length - 1; i >= 0; i--) {
      if (last.t - s[i].t > 90) { first = s[i]; break; }
      first = s[i];
    }
    var dt = (last.t - first.t) / 1000;
    if (dt <= 0) return 0;
    return (last.y - first.y) / dt;
  };

  /* ==================================================================
     Header — translucent material once content scrolls beneath it
     ================================================================== */
  /* A sentinel beats a scroll listener: the browser tells us when the top
     of the page leaves view, instead of us asking on every frame. */
  function sentinel(offsetPx, onChange) {
    var el = document.createElement("div");
    el.setAttribute("aria-hidden", "true");
    el.style.cssText = "position:absolute;top:" + offsetPx + "px;left:0;width:1px;height:1px;pointer-events:none;";
    document.body.appendChild(el);
    if (!("IntersectionObserver" in window)) { onChange(false); return; }
    new IntersectionObserver(function (entries) {
      onChange(!entries[0].isIntersecting);
    }, { threshold: 0 }).observe(el);
  }

  var header = document.querySelector(".header");
  if (header) {
    sentinel(12, function (past) { header.classList.toggle("is-stuck", past); });
  }

  /* ==================================================================
     Mobile sheet — grabbable, velocity-aware, rubber-banded at the top
     ================================================================== */
  (function () {
    var sheet = document.querySelector("[data-sheet]");
    var scrim = document.querySelector("[data-scrim]");
    var burger = document.querySelector("[data-burger]");
    if (!sheet || !burger || !scrim) return;

    var height = 0;
    var isOpen = false;
    var lastFocus = null;

    var spring = new Spring({
      damping: 0.86,            // a little bounce: the gesture carries momentum
      response: 0.32,
      onUpdate: function (v) {
        sheet.style.transform = "translate3d(0," + v + "px,0)";
        var p = height > 0 ? 1 - Math.min(v / height, 1) : 0;
        scrim.style.opacity = String(Math.max(0, Math.min(1, p)));
      },
      onRest: function () {
        if (!isOpen) {
          sheet.classList.remove("is-open");
          scrim.classList.remove("is-open");
          scrim.style.opacity = "";
        }
      }
    });

    function measure() { height = sheet.offsetHeight || 1; }

    function open() {
      if (isOpen) return;
      lastFocus = document.activeElement;
      measure();
      sheet.classList.add("is-open");
      scrim.classList.add("is-open");
      document.body.classList.add("is-locked");
      burger.setAttribute("aria-expanded", "true");
      sheet.setAttribute("aria-hidden", "false");
      isOpen = true;
      if (reduceMotion.matches) { spring.set(0); scrim.style.opacity = "1"; }
      else { spring.value = height; spring.retarget(0); }
      var first = sheet.querySelector("a, button");
      if (first) first.focus({ preventScroll: true });
    }

    function close(velocity) {
      if (!isOpen) return;
      isOpen = false;
      document.body.classList.remove("is-locked");
      burger.setAttribute("aria-expanded", "false");
      sheet.setAttribute("aria-hidden", "true");
      if (reduceMotion.matches) {
        spring.set(height);
        sheet.classList.remove("is-open");
        scrim.classList.remove("is-open");
      } else {
        spring.retarget(height, velocity);
      }
      if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
    }

    burger.addEventListener("click", function () { isOpen ? close() : open(); });
    scrim.addEventListener("click", function () { close(); });
    sheet.addEventListener("click", function (e) {
      if (e.target.closest("a")) close();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && isOpen) close();
    });
    window.addEventListener("resize", function () { if (isOpen) measure(); }, { passive: true });

    /* Drag to dismiss ------------------------------------------------ */
    var dragging = false, grabOffset = 0, pointerId = null;
    var tracker = new VelocityTracker();
    var body = sheet.querySelector(".sheet__body");

    sheet.addEventListener("pointerdown", function (e) {
      if (!isOpen) return;
      // Let the scrollable body scroll unless it's already at the top
      if (body && body.contains(e.target) && body.scrollTop > 0) return;
      if (e.target.closest("a, button")) {
        // still allow a drag that starts on a link, but don't steal the tap
      }
      dragging = true;
      pointerId = e.pointerId;
      sheet.setPointerCapture(pointerId);
      spring.stop();                        // grab it wherever it currently is
      grabOffset = e.clientY - spring.value; // respect where they grabbed
      tracker.reset();
      tracker.add(e.clientY);
    });

    sheet.addEventListener("pointermove", function (e) {
      if (!dragging || e.pointerId !== pointerId) return;
      tracker.add(e.clientY);
      var y = e.clientY - grabOffset;
      if (y < 0) y = -rubberband(-y, height); // resist past the top, never hard-stop
      spring.value = y;
      spring.onUpdate(y);
    });

    function endDrag(e) {
      if (!dragging || (e && e.pointerId !== pointerId)) return;
      dragging = false;
      try { sheet.releasePointerCapture(pointerId); } catch (err) {}
      var v = tracker.velocity();
      // Project where the flick is heading, then pick the nearer rest state
      var projected = spring.value + project(v);
      var shouldClose = projected > height * 0.42;
      // Velocity sign wins over position: a decisive flick always commits
      if (v > 520) shouldClose = true;
      else if (v < -420) shouldClose = false;
      if (shouldClose) { isOpen = true; close(v); }
      else { spring.retarget(0, v); }       // hand the finger's velocity to the spring
    }
    sheet.addEventListener("pointerup", endDrag);
    sheet.addEventListener("pointercancel", endDrag);
  })();

  /* ==================================================================
     Accordion — height animated from its live value, so it is interruptible
     ================================================================== */
  Array.prototype.forEach.call(document.querySelectorAll("[data-acc]"), function (acc) {
    var btn = acc.querySelector(".acc__btn");
    var panel = acc.querySelector(".acc__panel");
    var inner = acc.querySelector(".acc__inner");
    if (!btn || !panel || !inner) return;

    btn.addEventListener("click", function () {
      var expanded = btn.getAttribute("aria-expanded") === "true";
      // Start from the height on screen right now, not from 0 or from the target
      var current = panel.getBoundingClientRect().height;
      panel.style.height = current + "px";
      void panel.offsetHeight;
      btn.setAttribute("aria-expanded", String(!expanded));
      panel.style.height = expanded ? "0px" : inner.offsetHeight + "px";
    });

    panel.addEventListener("transitionend", function (e) {
      if (e.propertyName !== "height") return;
      if (btn.getAttribute("aria-expanded") === "true") panel.style.height = "auto";
    });
  });

  /* ==================================================================
     Scroll reveal — staggered, and a no-op when motion is reduced
     ================================================================== */
  (function () {
    var items = document.querySelectorAll("[data-reveal]");
    if (!items.length) return;
    if (!("IntersectionObserver" in window)) {
      Array.prototype.forEach.call(items, function (el) { el.classList.add("is-in"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        var delay = parseInt(el.getAttribute("data-reveal-delay") || "0", 10);
        el.style.setProperty("--reveal-delay", delay + "ms");
        el.classList.add("is-in");
        io.unobserve(el);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    Array.prototype.forEach.call(items, function (el) { io.observe(el); });

    // Failsafe: content must never stay invisible because an observer misfired
    setTimeout(function () {
      if (!document.querySelector("[data-reveal].is-in")) {
        Array.prototype.forEach.call(items, function (el) { el.classList.add("is-in"); });
      }
    }, 1400);
  })();

  /* ==================================================================
     Sticky action dock — appears once the hero CTA has scrolled past,
     so it never competes with the primary call to action
     ================================================================== */
  (function () {
    var dock = document.querySelector("[data-dock]");
    if (!dock) return;
    // Appears only once the hero CTA is behind the reader, so it never
    // competes with the primary call to action.
    sentinel(420, function (past) { dock.classList.toggle("is-up", past); });
  })();

  /* ==================================================================
     Clinic hours — one source of truth, shared by the status pill,
     the table highlight and the booking form's available slots.
     ⚠️ CONFIRM THESE WITH THE CLINIC before going live. See README.
     ================================================================== */
  var HOURS = window.CLINIC_HOURS = {
    // Transcribed from the clinic's own 門診表:
    // 早 09:00–12:00 / 午 15:00–17:30 / 晚 18:10–21:00
    // 週六僅早診，週日與國定例假日休診。
    0: [],
    1: [[9, 12], [15, 17.5], [18 + 10 / 60, 21]],
    2: [[9, 12], [15, 17.5], [18 + 10 / 60, 21]],
    3: [[9, 12], [15, 17.5], [18 + 10 / 60, 21]],
    4: [[9, 12], [15, 17.5], [18 + 10 / 60, 21]],
    5: [[9, 12], [15, 17.5], [18 + 10 / 60, 21]],
    6: [[9, 12]]
  };

  // Which doctors sit each session — lets the booking form name them.
  window.CLINIC_ROSTER = {
    am:  { 1: ["李俊茂", "王媛儀"], 2: ["陳柏群"], 3: ["李俊茂"], 4: ["王媛儀", "陳柏群"], 5: ["李俊茂", "王媛儀"], 6: ["李俊茂", "王媛儀", "陳柏群"] },
    pm:  { 1: ["李俊茂", "陳柏群"], 2: ["王媛儀"], 3: ["李俊茂", "陳柏群"], 4: ["李俊茂"], 5: ["李俊茂", "陳柏群"] },
    eve: { 1: ["李俊茂", "陳柏群"], 2: ["王媛儀", "陳柏群"], 3: ["陳柏群"], 4: ["李俊茂", "王媛儀"], 5: ["李俊茂", "陳柏群"] }
  };

  function isOpenNow(now) {
    now = now || new Date();
    var blocks = HOURS[now.getDay()] || [];
    var h = now.getHours() + now.getMinutes() / 60;
    for (var i = 0; i < blocks.length; i++) {
      if (h >= blocks[i][0] && h < blocks[i][1]) return true;
    }
    return false;
  }
  window.clinicIsOpenNow = isOpenNow;

  (function () {
    var pills = document.querySelectorAll("[data-status]");
    if (!pills.length) return;
    var open = isOpenNow();
    Array.prototype.forEach.call(pills, function (pill) {
      pill.classList.add(open ? "status--open" : "status--shut");
      var label = pill.querySelector("[data-status-text]");
      if (label) label.textContent = open ? "現在看診中" : "目前休診";
    });
  })();

  /* Highlight today's column in the hours table */
  (function () {
    var table = document.querySelector("[data-hours-table]");
    if (!table) return;
    var day = new Date().getDay();
    Array.prototype.forEach.call(table.querySelectorAll("[data-day]"), function (cell) {
      if (parseInt(cell.getAttribute("data-day"), 10) === day) cell.classList.add("is-now");
    });
  })();

  /* ==================================================================
     Article filter — 64 articles need a way to narrow down
     ================================================================== */
  (function () {
    var bar = document.querySelector("[data-artfilter]");
    var grid = document.querySelector(".artgrid");
    if (!bar || !grid) return;
    var cards = Array.prototype.slice.call(grid.querySelectorAll("[data-cat]"));
    var count = document.querySelector("[data-artcount]");

    bar.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-filter]");
      if (!btn) return;
      var want = btn.getAttribute("data-filter");

      Array.prototype.forEach.call(bar.querySelectorAll("[data-filter]"), function (b) {
        var on = b === btn;
        b.classList.toggle("chip--brand", on);
        b.setAttribute("aria-pressed", String(on));
      });

      var shown = 0;
      cards.forEach(function (c) {
        var match = want === "all" || c.getAttribute("data-cat") === want;
        c.hidden = !match;
        if (match) shown++;
      });
      if (count) count.textContent = "顯示 " + shown + " 篇文章";
    });
  })();

  /* ==================================================================
     Mark the current page in navigation
     ================================================================== */
  (function () {
    var here = location.pathname.split("/").pop() || "index.html";
    Array.prototype.forEach.call(document.querySelectorAll("[data-nav] a"), function (a) {
      var href = (a.getAttribute("href") || "").split("/").pop().split("#")[0];
      if (href && href === here) a.setAttribute("aria-current", "page");
    });
  })();

  /* Expose the primitives so booking.js can reuse them */
  window.WX = { Spring: Spring, project: project, rubberband: rubberband, VelocityTracker: VelocityTracker };
})();
