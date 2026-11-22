(function () {
  "use strict";

  var MONTHS = ["հունվար", "փետրվար", "մարտ", "ապրիլ", "մայիս", "հունիս",
                "հուլիս", "օգոստոս", "սեպտեմբեր", "հոկտեմբեր", "նոյեմբեր", "դեկտեմբեր"];
  // Ծննդական հոլովով՝ «22 նոյեմբերի 2026» տեսքի համար
  var MONTHS_GEN = ["հունվարի", "փետրվարի", "մարտի", "ապրիլի", "մայիսի", "հունիսի",
                    "հուլիսի", "օգոստոսի", "սեպտեմբերի", "հոկտեմբերի", "նոյեմբերի", "դեկտեմբերի"];
  // Դասախոսի ազգանունը որոշում է կատեգորիան (ֆայլերի անուններում մնում է միայն ազգանունը)
  var LECTURERS = {
    "Դավիդովա":     { cat: "lecture", label: "Դասախոսություն", full: "Դիանա Դավիդովա" },
    "Բարխուդարյան": { cat: "seminar", label: "Սեմինար",       full: "Վահե Բարխուդարյան" }
  };

  // «dd.mm.yyyy - Ազգանուն.pdf» (տարին կարող է լինել նաև երկնիշ)
  var NAME_RE = /^(\d{2})\.(\d{2})\.(\d{2}|\d{4}) - (.+)\.pdf$/i;

  var docs = [], problems = [];
  (window.MATH_DOCS || []).forEach(function (d) {
    var m = NAME_RE.exec(d.file);
    var who = m && LECTURERS[m[4]];
    if (!m || !who) { problems.push(d.file); return; }
    var year = m[3].length === 2 ? 2000 + parseInt(m[3], 10) : parseInt(m[3], 10);
    var day = parseInt(m[1], 10), month = parseInt(m[2], 10);
    var dateStr = m[1] + "." + m[2] + "." + year;
    docs.push({
      file: d.file, pages: d.pages, topics: d.topics || [], description: d.description,
      lecturer: who.full, cat: who.cat, catLabel: who.label,
      day: m[1], month: MONTHS[month - 1], year: year, dateStr: dateStr,
      time: Date.UTC(year, month - 1, day),
      hay: norm([dateStr, m[1] + "." + m[2], MONTHS[month - 1], year, who.full, who.label,
                 d.topics ? d.topics.join(" ") : "", d.description].join(" "))
    });
  });
  if (problems.length) console.warn("Անճանաչելի ֆայլի անուն (բաց թողնվեց):", problems);
  docs.sort(function (a, b) { return b.time - a.time; }); // նորից հին

  // «Նոր» նշանը՝ ամենավերջին ամսաթվով փաստաթղթին
  var latestTime = docs.length ? docs[0].time : null;

  // «Վերջին թարմացում». լռելյայն՝ ամենանոր փաստաթղթի ամսաթիվը։
  // Ցանկության դեպքում data/documents.js-ում կարելի է գրել՝ window.MATH_UPDATED = "dd.mm.yyyy";
  var updated = null;
  var um = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(String(window.MATH_UPDATED || ""));
  if (um && +um[2] >= 1 && +um[2] <= 12) {
    updated = { day: +um[1], month: +um[2], year: +um[3] };
  } else if (docs.length) {
    var newest = docs[0];
    updated = { day: +newest.day, month: +newest.file.slice(3, 5), year: newest.year };
  }

  function norm(s) { return String(s).toLowerCase().replace(/\s+/g, " "); }
  function $(id) { return document.getElementById(id); }
  function pad(n) { return (n < 10 ? "0" : "") + n; }

  var state = { q: "", cat: "all", topic: "" };
  var hl = null; // որոնվող բառերի ընդգծման RegExp (կամ null)
  var lists = { lecture: $("list-lectures"), seminar: $("list-seminars") };
  var blocks = { lecture: $("lectures"), seminar: $("seminars") };

  // Ընդհանուր թվեր
  $("count-total").textContent = docs.length;
  $("count-lectures").textContent = docs.filter(function (d) { return d.cat === "lecture"; }).length;
  $("count-seminars").textContent = docs.filter(function (d) { return d.cat === "seminar"; }).length;

  if (updated) {
    var ut = $("updated-time");
    ut.textContent = updated.day + " " + MONTHS_GEN[updated.month - 1] + " " + updated.year;
    ut.setAttribute("datetime", updated.year + "-" + pad(updated.month) + "-" + pad(updated.day));
    $("updated").hidden = false;
  }

  var ICON = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M14 3h7v7M21 3l-9 9M19 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  var SVG_OPEN = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">';
  var COPY_ICONS =
    '<span class="ic" aria-hidden="true">' +
      SVG_OPEN.replace('<svg ', '<svg class="i-link" ') + '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>' +
      SVG_OPEN.replace('<svg ', '<svg class="i-check" ') + '<path d="M20 6 9 17l-5-5"/></svg>' +
      SVG_OPEN.replace('<svg ', '<svg class="i-fail" ') + '<path d="M18 6 6 18M6 6l12 12"/></svg>' +
    '</span>';
  var X_ICON = '<svg viewBox="0 0 24 24" width="12" height="12" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>';

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  // Տեքստը ավելացնում է node-ի մեջ՝ որոնվող բառերը փաթաթելով <mark>-ի մեջ
  function put(node, text) {
    text = String(text);
    if (!hl) { node.appendChild(document.createTextNode(text)); return node; }
    var last = 0, m;
    hl.lastIndex = 0;
    while ((m = hl.exec(text)) !== null) {
      if (m[0] === "") { hl.lastIndex++; continue; }
      if (m.index > last) node.appendChild(document.createTextNode(text.slice(last, m.index)));
      node.appendChild(el("mark", null, m[0]));
      last = m.index + m[0].length;
    }
    if (last < text.length) node.appendChild(document.createTextNode(text.slice(last)));
    return node;
  }
  function hl_el(tag, cls, text) { return put(el(tag, cls), text); }

  function tokensOf(q) { return norm(q).trim().split(" ").filter(Boolean); }
  function buildHighlighter(tokens) {
    if (!tokens.length) return null;
    var parts = tokens.slice().sort(function (a, b) { return b.length - a.length; })
      .map(function (t) { return t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); });
    return new RegExp("(?:" + parts.join("|") + ")", "gi");
  }

  // Հղումը clipboard-ում պատճենելը (fallback՝ հին բրաուզերների և file:// համար)
  function legacyCopy(text) {
    return new Promise(function (resolve, reject) {
      var prev = document.activeElement;
      var ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.cssText = "position:fixed;top:0;left:0;opacity:0;pointer-events:none";
      document.body.appendChild(ta);
      ta.select();
      ta.setSelectionRange(0, text.length);
      var ok = false;
      try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
      document.body.removeChild(ta);
      if (prev && prev.focus) prev.focus({ preventScroll: true });
      ok ? resolve() : reject(new Error("copy failed"));
    });
  }
  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text).catch(function () { return legacyCopy(text); });
    }
    return legacyCopy(text);
  }
  function announce(msg) {
    var n = $("announce");
    n.textContent = "";
    setTimeout(function () { n.textContent = msg; }, 30);
  }

  function card(d) {
    var li = el("li", "doc " + d.cat);

    li.setAttribute("data-file", d.file);

    var date = el("div", "date");
    date.appendChild(hl_el("b", null, d.day));
    date.appendChild(hl_el("span", null, d.month));
    li.appendChild(date);

    var body = el("div", "body");
    var meta = el("div", "meta");
    meta.appendChild(hl_el("span", "tag", d.catLabel));
    if (d.time === latestTime) meta.appendChild(el("span", "badge-new", "Նոր"));
    var t = hl_el("time", null, d.dateStr);
    t.setAttribute("datetime", d.year + "-" + d.file.slice(3, 5) + "-" + d.day);
    meta.appendChild(t);
    var who = el("span", null, "Դասախոս՝ ");
    put(who, d.lecturer);
    meta.appendChild(who);
    if (d.pages) meta.appendChild(el("span", null, d.pages + " էջ"));
    body.appendChild(meta);

    // Եթե որոնվող բառը նկարագրության մեջ է, նկարագրությունը բացվում է, որպեսզի ընդգծումը երևա
    var hit = hl && tokensOf(state.q).some(function (tk) { return norm(d.description).indexOf(tk) !== -1; });
    var p = hl_el("p", "desc" + (hit ? "" : " clamp"), d.description);
    body.appendChild(p);
    var more = el("button", "more", hit ? "Ծալել" : "Կարդալ ավելին");
    more.type = "button";
    more.setAttribute("aria-expanded", String(!!hit));
    more.addEventListener("click", function () {
      var open = !p.classList.toggle("clamp");
      more.textContent = open ? "Ծալել" : "Կարդալ ավելին";
      more.setAttribute("aria-expanded", String(open));
    });
    body.appendChild(more);

    // Թեմաները՝ զտիչ-կոճակներ. կրկին սեղմելով զտիչը հանվում է
    if (d.topics.length) {
      var ul = el("ul", "topics");
      d.topics.forEach(function (x) {
        var li2 = el("li");
        var b = el("button", "topic");
        b.type = "button";
        b.setAttribute("data-topic", x);
        b.setAttribute("aria-pressed", String(state.topic === x));
        b.title = state.topic === x ? "Հանել թեմայի զտիչը" : "Ցույց տալ այս թեմայով բոլոր փաստաթղթերը";
        put(b, x);
        b.addEventListener("click", function () { toggleTopic(x, d.file); });
        li2.appendChild(b);
        ul.appendChild(li2);
      });
      body.appendChild(ul);
    }
    li.appendChild(body);

    var ctx = d.catLabel.toLowerCase() + ", " + d.dateStr + ", " + d.lecturer;
    var actions = el("div", "actions");

    var a = el("a", "btn");
    a.href = "pdfs/" + encodeURIComponent(d.file);
    a.target = "_blank";
    a.rel = "noopener";
    a.setAttribute("aria-label", "Բացել PDF-ը՝ " + ctx + " (նոր ներդիրում)");
    a.innerHTML = "<span>Բացել PDF-ը</span>" + ICON;
    actions.appendChild(a);

    var cp = el("button", "btn ghost");
    cp.type = "button";
    cp.setAttribute("data-state", "idle");
    cp.setAttribute("aria-label", "Պատճենել PDF-ի հղումը՝ " + ctx);
    cp.innerHTML = COPY_ICONS + "<span class=\"lbl\">Պատճենել հղումը</span>";
    var lbl = cp.querySelector(".lbl"), timer = null;
    function setState(st, text, label) {
      cp.setAttribute("data-state", st);
      lbl.textContent = text;
      cp.setAttribute("aria-label", label + "՝ " + ctx);
    }
    cp.addEventListener("click", function () {
      var url = new URL("pdfs/" + encodeURIComponent(d.file), document.baseURI).href;
      clearTimeout(timer);
      copyText(url).then(function () {
        setState("done", "Հղումը պատճենվեց", "Հղումը պատճենվեց");
        announce("Հղումը պատճենվեց");
      }, function () {
        setState("fail", "Չհաջողվեց պատճենել", "Չհաջողվեց պատճենել հղումը");
        announce("Չհաջողվեց պատճենել հղումը");
      }).then(function () {
        timer = setTimeout(function () { setState("idle", "Պատճենել հղումը", "Պատճենել PDF-ի հղումը"); }, 2200);
      });
    });
    actions.appendChild(cp);
    li.appendChild(actions);
    return li;
  }

  function toggleTopic(topic, file) {
    state.topic = state.topic === topic ? "" : topic;
    render();
    // Սեղմված կոճակը վերակառուցվել է. ֆոկուսը և դիրքը վերադարձնում ենք նրան
    var cards = document.querySelectorAll(".doc");
    for (var i = 0; i < cards.length; i++) {
      if (cards[i].getAttribute("data-file") !== file) continue;
      var btns = cards[i].querySelectorAll(".topic");
      for (var j = 0; j < btns.length; j++) {
        if (btns[j].getAttribute("data-topic") === topic) {
          btns[j].focus({ preventScroll: true });
          btns[j].scrollIntoView({ block: "center" });
          return;
        }
      }
    }
  }

  function matches(d) {
    if (state.cat !== "all" && d.cat !== state.cat) return false;
    if (state.topic && d.topics.indexOf(state.topic) === -1) return false;
    var tokens = tokensOf(state.q);
    return tokens.every(function (tk) { return d.hay.indexOf(tk) !== -1; });
  }

  function render() {
    var shown = 0;
    hl = buildHighlighter(tokensOf(state.q));
    ["lecture", "seminar"].forEach(function (cat) {
      var list = lists[cat];
      list.textContent = "";
      var items = docs.filter(function (d) { return d.cat === cat && matches(d); });
      items.forEach(function (d) { list.appendChild(card(d)); });
      blocks[cat].hidden = items.length === 0;
      shown+= items.length;
    });
    $("empty").hidden = shown !== 0;
    var filtered = state.q.trim() !== "" || state.cat !== "all" || state.topic !== "";

    // Ակտիվ թեմայի զտիչի գծիկ
    var bar = $("activebar");
    bar.hidden = !state.topic;
    if (state.topic) {
      var pill = $("clear-topic");
      pill.textContent = "";
      pill.appendChild(document.createTextNode("Թեմա՝ "));
      pill.appendChild(el("b", null, state.topic));
      var x = el("span", "x"); x.innerHTML = X_ICON;
      pill.appendChild(x);
      pill.setAttribute("aria-label", "Հանել թեմայի զտիչը՝ " + state.topic);
    }
    $("status").textContent = shown === 0 ? "" :
      filtered ? "Գտնվել է " + shown + " փաստաթուղթ՝ " + docs.length + "-ից։" : "";
  }

  // Որոնում
  var input = $("q");
  input.addEventListener("input", function () { state.q = input.value; render(); });

  // Զտում ըստ կատեգորիայի
  var chips = Array.prototype.slice.call(document.querySelectorAll(".chip"));
  chips.forEach(function (c) {
    c.addEventListener("click", function () {
      state.cat = c.getAttribute("data-cat");
      chips.forEach(function (x) { x.setAttribute("aria-pressed", String(x === c)); });
      render();
    });
  });

  $("clear-topic").addEventListener("click", function () {
    state.topic = "";
    render();
    input.focus({ preventScroll: true });
  });

  $("reset").addEventListener("click", function () {
    state.q = ""; state.cat = "all"; state.topic = ""; input.value = "";
    chips.forEach(function (x) { x.setAttribute("aria-pressed", String(x.getAttribute("data-cat") === "all")); });
    render(); input.focus();
  });

  // Բջջային մենյու
  var burger = $("burger"), menu = $("menu");
  function setMenu(open) {
    menu.classList.toggle("open", open);
    burger.setAttribute("aria-expanded", String(open));
    burger.setAttribute("aria-label", open ? "Փակել մենյուն" : "Բացել մենյուն");
  }
  burger.addEventListener("click", function () { setMenu(!menu.classList.contains("open")); });
  menu.addEventListener("click", function (e) { if (e.target.tagName === "A") setMenu(false); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") setMenu(false); });

  // Ընթացիկ բաժնի ընդգծում
  var links = {};
  Array.prototype.forEach.call(menu.querySelectorAll("a"), function (a) { links[a.getAttribute("data-section")] = a; });
  function markActive(id) {
    Object.keys(links).forEach(function (k) { links[k].classList.toggle("active", k === id); });
  }
  markActive("home");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) markActive(en.target.id); });
    }, { rootMargin: "-35% 0px -55% 0px" });
    ["home", "lectures", "seminars"].forEach(function (id) { io.observe($(id)); });
  }

  render();
})();
