/* ==========================================================================
   文心牙醫 — 線上預約流程
   Three steps, no page reloads, progress survives a refresh.

   ⚙️  CONNECTING A REAL BACKEND
   This build has no server, so a completed booking is handed to the clinic
   through LINE (message pre-composed and copied to the clipboard).
   To post it somewhere instead, fill in ENDPOINT below — the payload is
   already assembled as JSON in submit().  See README.md.
   ========================================================================== */
(function () {
  "use strict";

  var form = document.querySelector("[data-booking]");
  if (!form) return;

  var ENDPOINT = "";                               // e.g. "https://formspree.io/f/xxxx"
  var LINE_URL = "https://page.line.me/884xwoxp?openQrModal=true";
  var STORE_KEY = "wx-booking-draft";
  var HOURS = window.CLINIC_HOURS || {};
  var Spring = window.WX && window.WX.Spring;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  var panes = Array.prototype.slice.call(form.querySelectorAll(".step-pane"));
  var progressFill = form.querySelector("[data-progress-fill]");
  var progressSteps = Array.prototype.slice.call(form.querySelectorAll("[data-progress-step]"));
  var liveRegion = form.querySelector("[data-live]");
  var current = 0;

  var DOW = ["日", "一", "二", "三", "四", "五", "六"];

  /* ------------------------------------------------------------------
     Slot generation — derived from the same hours table the rest of the
     site uses, so the two can never drift apart.
     ------------------------------------------------------------------ */
  function slotsForDate(date) {
    var blocks = HOURS[date.getDay()] || [];
    var now = new Date();
    var sameDay = date.toDateString() === now.toDateString();
    var nowH = now.getHours() + now.getMinutes() / 60;
    var groups = [];
    var names = ["上午診", "下午診", "晚間診"];

    blocks.forEach(function (block, i) {
      var times = [];
      for (var h = block[0]; h < block[1]; h += 0.5) {
        // Need at least two hours' notice for a same-day slot
        if (sameDay && h < nowH + 2) continue;
        times.push(h);
      }
      if (times.length) groups.push({ name: names[i] || "診次", times: times });
    });
    return groups;
  }

  function fmtTime(h) {
    var hour = Math.floor(h);
    var min = Math.round((h - hour) * 60);
    return (hour < 10 ? "0" : "") + hour + ":" + (min < 10 ? "0" : "") + min;
  }

  function fmtDate(d) {
    return d.getFullYear() + "/" + (d.getMonth() + 1) + "/" + d.getDate() + "（" + DOW[d.getDay()] + "）";
  }

  function isoDate(d) {
    return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2);
  }

  /* ------------------------------------------------------------------
     Build the date rail: the next 21 days, closed days disabled
     ------------------------------------------------------------------ */
  var rail = form.querySelector("[data-date-rail]");
  function buildDates() {
    if (!rail) return;
    var frag = document.createDocumentFragment();
    var today = new Date();
    for (var i = 0; i < 21; i++) {
      var d = new Date(today.getFullYear(), today.getMonth(), today.getDate() + i);
      var available = slotsForDate(d).length > 0;
      var id = "date-" + isoDate(d);

      var label = document.createElement("label");
      label.className = "date";

      var input = document.createElement("input");
      input.type = "radio";
      input.name = "date";
      input.id = id;
      input.value = isoDate(d);
      input.disabled = !available;
      input.setAttribute("data-label", fmtDate(d));

      var box = document.createElement("span");
      box.className = "date__box";
      box.innerHTML =
        '<span class="date__dow">' + (i === 0 ? "今天" : "週" + DOW[d.getDay()]) + "</span>" +
        '<span class="date__day">' + d.getDate() + "</span>" +
        '<span class="date__mon">' + (d.getMonth() + 1) + "月</span>";

      label.appendChild(input);
      label.appendChild(box);
      frag.appendChild(label);
    }
    rail.appendChild(frag);
  }

  /* ------------------------------------------------------------------
     Build time slots for whichever date is selected
     ------------------------------------------------------------------ */
  var slotWrap = form.querySelector("[data-slots]");
  var slotEmpty = form.querySelector("[data-slots-empty]");

  function buildSlots(isoStr) {
    if (!slotWrap) return;
    slotWrap.innerHTML = "";
    var parts = isoStr.split("-");
    var d = new Date(+parts[0], +parts[1] - 1, +parts[2]);
    var groups = slotsForDate(d);

    if (!groups.length) {
      if (slotEmpty) slotEmpty.hidden = false;
      return;
    }
    if (slotEmpty) slotEmpty.hidden = true;

    groups.forEach(function (group) {
      var section = document.createElement("div");
      section.className = "slot-group";

      var title = document.createElement("p");
      title.className = "slot-group__title";
      title.textContent = group.name;
      section.appendChild(title);

      var grid = document.createElement("div");
      grid.className = "slots";
      group.times.forEach(function (h) {
        var label = document.createElement("label");
        label.className = "slot";
        var input = document.createElement("input");
        input.type = "radio";
        input.name = "time";
        input.value = fmtTime(h);
        var box = document.createElement("span");
        box.className = "slot__box";
        box.textContent = fmtTime(h);
        label.appendChild(input);
        label.appendChild(box);
        grid.appendChild(label);
      });
      section.appendChild(grid);
      slotWrap.appendChild(section);
    });
  }

  /* ------------------------------------------------------------------
     Step navigation — pane swap with a spring-driven slide
     ------------------------------------------------------------------ */
  function goTo(index, direction) {
    if (index === current) return;
    var outgoing = panes[current];
    var incoming = panes[index];
    var back = direction === "back";

    // Measure before the swap so the container never collapses mid-animation
    var wrap = form.querySelector("[data-steps]");
    var startH = wrap ? wrap.getBoundingClientRect().height : 0;

    outgoing.classList.remove("is-active");
    incoming.classList.add("is-active");
    current = index;
    updateProgress();

    if (!reduceMotion.matches && Spring) {
      var endH = wrap ? wrap.getBoundingClientRect().height : 0;
      if (wrap && startH && endH) {
        wrap.style.overflow = "hidden";
        var hSpring = new Spring({
          from: startH, to: endH, damping: 1, response: 0.38,
          onUpdate: function (v) { wrap.style.height = v + "px"; },
          onRest: function () { wrap.style.height = ""; wrap.style.overflow = ""; }
        });
        hSpring.start();
      }
      incoming.animate(
        [
          { opacity: 0, transform: "translateX(" + (back ? -18 : 18) + "px)" },
          { opacity: 1, transform: "translateX(0)" }
        ],
        { duration: 340, easing: "cubic-bezier(.22,.61,.36,1)" }
      );
    }

    // Keep the newly revealed step in view without yanking the page
    var top = form.getBoundingClientRect().top + window.scrollY - 100;
    window.scrollTo({ top: top, behavior: reduceMotion.matches ? "auto" : "smooth" });

    var heading = incoming.querySelector("h2, h3");
    if (heading) {
      heading.setAttribute("tabindex", "-1");
      heading.focus({ preventScroll: true });
    }
    announce("第 " + (index + 1) + " 步，共 3 步");
  }

  function updateProgress() {
    if (progressFill) progressFill.style.width = ((current + 1) / panes.length) * 100 + "%";
    progressSteps.forEach(function (step, i) {
      step.classList.toggle("is-active", i === current);
      step.classList.toggle("is-done", i < current);
    });
  }

  function announce(msg) {
    if (liveRegion) liveRegion.textContent = msg;
  }

  /* ------------------------------------------------------------------
     Validation — inline, on blur and on advance, never a wall of errors
     ------------------------------------------------------------------ */
  function fieldOf(el) { return el.closest(".field") || el.closest(".options") || el.closest("fieldset"); }

  function setError(el, message) {
    var wrap = fieldOf(el);
    if (!wrap) return;
    wrap.classList.add("has-error");
    var err = wrap.querySelector(".field__err");
    if (err) err.textContent = message;
    el.setAttribute("aria-invalid", "true");
  }

  function clearError(el) {
    var wrap = fieldOf(el);
    if (!wrap) return;
    wrap.classList.remove("has-error");
    el.removeAttribute("aria-invalid");
  }

  function validateStep(index) {
    var pane = panes[index];
    var ok = true;
    var firstBad = null;

    // Radio groups marked required
    Array.prototype.forEach.call(pane.querySelectorAll("[data-require-group]"), function (group) {
      var name = group.getAttribute("data-require-group");
      var checked = form.querySelector('input[name="' + name + '"]:checked');
      var err = group.querySelector(".field__err");
      if (!checked) {
        ok = false;
        group.classList.add("has-error");
        if (err) err.textContent = group.getAttribute("data-require-msg") || "請選擇一個選項";
        if (!firstBad) firstBad = group;
      } else {
        group.classList.remove("has-error");
      }
    });

    // Text inputs
    Array.prototype.forEach.call(pane.querySelectorAll("input[required], textarea[required]"), function (el) {
      var v = el.value.trim();
      if (!v) {
        setError(el, el.getAttribute("data-msg-empty") || "此欄為必填");
        ok = false;
        if (!firstBad) firstBad = el;
        return;
      }
      if (el.type === "tel" && !/^09\d{8}$/.test(v.replace(/[\s-]/g, ""))) {
        setError(el, "請輸入正確的手機號碼（09 開頭共 10 碼）");
        ok = false;
        if (!firstBad) firstBad = el;
        return;
      }
      if (el.type === "email" && v && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v)) {
        setError(el, "請輸入正確的 Email");
        ok = false;
        if (!firstBad) firstBad = el;
        return;
      }
      clearError(el);
    });

    // Consent checkbox
    var consent = pane.querySelector("[data-consent]");
    if (consent && !consent.checked) {
      var cwrap = fieldOf(consent);
      if (cwrap) {
        cwrap.classList.add("has-error");
        var cerr = cwrap.querySelector(".field__err");
        if (cerr) cerr.textContent = "請確認同意後再送出";
      }
      ok = false;
      if (!firstBad) firstBad = consent;
    }

    if (!ok && firstBad) {
      var focusTarget = firstBad.focus ? firstBad : firstBad.querySelector("input, textarea, select");
      if (focusTarget && focusTarget.focus) focusTarget.focus({ preventScroll: false });
      announce("有欄位需要修正");
    }
    return ok;
  }

  // Clear an error the moment the user fixes it
  form.addEventListener("input", function (e) {
    var el = e.target;
    if (el.matches("input, textarea, select")) {
      var wrap = fieldOf(el);
      if (wrap && wrap.classList.contains("has-error")) {
        if (el.type === "checkbox" ? el.checked : el.value.trim()) clearError(el);
      }
    }
  });

  /* ------------------------------------------------------------------
     Wiring
     ------------------------------------------------------------------ */
  form.addEventListener("click", function (e) {
    var next = e.target.closest("[data-next]");
    var prev = e.target.closest("[data-prev]");
    if (next) {
      e.preventDefault();
      if (validateStep(current)) {
        if (current === 1) fillSummary();
        goTo(Math.min(current + 1, panes.length - 1), "next");
        save();
      }
    }
    if (prev) {
      e.preventDefault();
      goTo(Math.max(current - 1, 0), "back");
    }
  });

  form.addEventListener("change", function (e) {
    var el = e.target;
    if (el.name === "date") {
      buildSlots(el.value);
      var g = el.closest(".field");
      if (g) g.classList.remove("has-error");
    }
    if (el.name === "service" || el.name === "visit") {
      var grp = el.closest("[data-require-group]");
      if (grp) grp.classList.remove("has-error");
    }
    save();
  });

  /* ------------------------------------------------------------------
     Summary on the review step
     ------------------------------------------------------------------ */
  function collect() {
    var get = function (n) {
      var el = form.querySelector('[name="' + n + '"]:checked') || form.querySelector('[name="' + n + '"]');
      return el ? el.value.trim() : "";
    };
    var dateEl = form.querySelector('input[name="date"]:checked');
    return {
      service: labelFor("service"),
      visit: labelFor("visit"),
      date: dateEl ? dateEl.getAttribute("data-label") : "",
      dateISO: dateEl ? dateEl.value : "",
      time: get("time"),
      name: get("name"),
      phone: get("phone"),
      email: get("email"),
      note: get("note")
    };
  }

  function labelFor(name) {
    var el = form.querySelector('input[name="' + name + '"]:checked');
    if (!el) return "";
    var strong = el.parentNode.querySelector(".opt__text strong");
    return strong ? strong.textContent.trim() : el.value;
  }

  function fillSummary() {
    var data = collect();
    var map = {
      service: data.service,
      visit: data.visit,
      when: data.date + (data.time ? " " + data.time : "")
    };
    Object.keys(map).forEach(function (key) {
      var slot = form.querySelector('[data-sum="' + key + '"]');
      if (slot) slot.textContent = map[key] || "—";
    });
  }

  /* ------------------------------------------------------------------
     Draft persistence — a refresh should never cost the user their place
     ------------------------------------------------------------------ */
  function save() {
    try {
      sessionStorage.setItem(STORE_KEY, JSON.stringify({ step: current, data: collect() }));
    } catch (err) { /* private mode — proceed without a draft */ }
  }

  function restore() {
    var raw;
    try { raw = sessionStorage.getItem(STORE_KEY); } catch (err) { return; }
    if (!raw) return;
    var saved;
    try { saved = JSON.parse(raw); } catch (err) { return; }
    var d = saved.data || {};
    ["name", "phone", "email", "note"].forEach(function (k) {
      var el = form.querySelector('[name="' + k + '"]');
      if (el && d[k]) el.value = d[k];
    });
    if (d.dateISO) {
      var dateEl = form.querySelector('input[name="date"][value="' + d.dateISO + '"]');
      if (dateEl && !dateEl.disabled) {
        dateEl.checked = true;
        buildSlots(d.dateISO);
        if (d.time) {
          var t = form.querySelector('input[name="time"][value="' + d.time + '"]');
          if (t) t.checked = true;
        }
      }
    }
  }

  /* ------------------------------------------------------------------
     Submit
     ------------------------------------------------------------------ */
  function buildMessage(d) {
    return [
      "【線上預約】文心牙醫",
      "姓名：" + d.name,
      "電話：" + d.phone,
      d.email ? "Email：" + d.email : "",
      "初診／複診：" + d.visit,
      "預約項目：" + d.service,
      "希望時段：" + d.date + " " + d.time,
      d.note ? "想諮詢的問題：" + d.note : ""
    ].filter(Boolean).join("\n");
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (!validateStep(current)) return;

    var data = collect();
    var message = buildMessage(data);
    var btn = form.querySelector("[data-submit]");
    if (btn) { btn.disabled = true; btn.textContent = "處理中…"; }

    var finish = function () {
      try { sessionStorage.removeItem(STORE_KEY); } catch (err) {}
      var done = form.querySelector("[data-done]");
      var steps = form.querySelector("[data-steps]");
      var progress = form.querySelector("[data-progress]");
      if (done && steps) {
        steps.hidden = true;
        if (progress) progress.hidden = true;
        done.hidden = false;
        var when = done.querySelector("[data-done-when]");
        if (when) when.textContent = data.date + " " + data.time;
        var copy = done.querySelector("[data-copy-target]");
        if (copy) copy.textContent = message;
        done.setAttribute("tabindex", "-1");
        done.focus({ preventScroll: true });
        window.scrollTo({
          top: form.getBoundingClientRect().top + window.scrollY - 100,
          behavior: reduceMotion.matches ? "auto" : "smooth"
        });
      }
      announce("預約資料已送出");
    };

    // Copy the request so the patient can paste it straight into LINE
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(message).catch(function () {});
    }

    if (ENDPOINT) {
      fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(data)
      }).then(finish).catch(function () {
        if (btn) { btn.disabled = false; btn.textContent = "送出預約"; }
        alert("送出失敗，請改用 LINE 或電話 06-2156600 與我們聯絡。");
      });
    } else {
      setTimeout(finish, 320);
    }
  });

  /* Copy-again button on the confirmation screen */
  form.addEventListener("click", function (e) {
    var copyBtn = e.target.closest("[data-copy]");
    if (!copyBtn) return;
    var target = form.querySelector("[data-copy-target]");
    if (!target || !navigator.clipboard) return;
    navigator.clipboard.writeText(target.textContent).then(function () {
      var original = copyBtn.getAttribute("data-label") || copyBtn.textContent;
      copyBtn.setAttribute("data-label", original);
      copyBtn.textContent = "已複製 ✓";
      setTimeout(function () { copyBtn.textContent = original; }, 1800);
    });
  });

  var lineBtn = form.querySelector("[data-line-link]");
  if (lineBtn) lineBtn.setAttribute("href", LINE_URL);

  /* ------------------------------------------------------------------
     Init
     ------------------------------------------------------------------ */
  buildDates();
  restore();
  updateProgress();

  // Deep link: booking.html?service=invisalign preselects the treatment
  var preset = new URLSearchParams(location.search).get("service");
  if (preset) {
    var match = form.querySelector('input[name="service"][value="' + preset + '"]');
    if (match) match.checked = true;
  }
})();
