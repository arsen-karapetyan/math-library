(function () {
  "use strict";

  var MONTHS = ["հունվար", "փետրվար", "մարտ", "ապրիլ", "մայիս", "հունիս",
                "հուլիս", "օգոստոս", "սեպտեմբեր", "հոկտեմբեր", "նոյեմբեր", "դեկտեմբեր"];
  // Դասախոսի ազգանունը որոշում է կատեգորիան
  var LECTURERS = {
    "Դավիդովա":     { cat: "lecture", label: "Դասախոսություն" },
    "Բարխուդարյան": { cat: "seminar", label: "Սեմինար" }
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
      lecturer: m[4], cat: who.cat, catLabel: who.label,
      day: m[1], month: MONTHS[month - 1], year: year, dateStr: dateStr,
      time: Date.UTC(year, month - 1, day),
      hay: norm([dateStr, m[1] + "." + m[2], MONTHS[month - 1], year, m[4], who.label,
                 d.topics ? d.topics.join(" ") : "", d.description].join(" "))
    });
  });
  if (problems.length) console.warn("Անճանաչելի ֆայլի անուն (բաց թողնվեց):", problems);
  docs.sort(function (a, b) { return b.time - a.time; }); // նորից հին

  function norm(s) { return String(s).toLowerCase().replace(/\s+/g, " "); }
  function $(id) { return document.getElementById(id); }

  var state = { q: "", cat: "all" };
  var lists = { lecture: $("list-lectures"), seminar: $("list-seminars") };
  var blocks = { lecture: $("lectures"), seminar: $("seminars") };

  // Ընդհանուր թվեր
  $("count-total").textContent = docs.length;
  $("count-lectures").textContent = docs.filter(function (d) { return d.cat === "lecture"; }).length;
  $("count-seminars").textContent = docs.filter(function (d) { return d.cat === "seminar"; }).length;

  var ICON = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M14 3h7v7M21 3l-9 9M19 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function card(d) {
    var li = el("li", "doc " + d.cat);

    var date = el("div", "date");
    date.appendChild(el("b", null, d.day));
    date.appendChild(el("span", null, d.month));
    li.appendChild(date);

    var body = el("div", "body");
    var meta = el("div", "meta");
    meta.appendChild(el("span", "tag", d.catLabel));
    var t = el("time", null, d.dateStr);
    t.setAttribute("datetime", d.year + "-" + d.file.slice(3, 5) + "-" + d.day);
    meta.appendChild(t);
    meta.appendChild(el("span", null, "Դասախոս՝ " + d.lecturer));
    if (d.pages) meta.appendChild(el("span", null, d.pages + " էջ"));
    body.appendChild(meta);
    body.appendChild(el("p", "desc", d.description));
    if (d.topics.length) {
      var ul = el("ul", "topics");
      d.topics.forEach(function (x) { ul.appendChild(el("li", null, x)); });
      body.appendChild(ul);
    }
    li.appendChild(body);

    var a = el("a", "btn");
    a.href = "pdfs/" + encodeURIComponent(d.file);
    a.target = "_blank";
    a.rel = "noopener";
    a.setAttribute("aria-label", "Բացել PDF-ը՝ " + d.catLabel.toLowerCase() + ", " + d.dateStr + ", " + d.lecturer + " (նոր ներդիրում)");
    a.innerHTML = "<span>Բացել PDF-ը</span>" + ICON;
    li.appendChild(a);
    return li;
  }

  function matches(d) {
    if (state.cat !== "all" && d.cat !== state.cat) return false;
    var tokens = norm(state.q).trim().split(" ").filter(Boolean);
    return tokens.every(function (tk) { return d.hay.indexOf(tk) !== -1; });
  }

  function render() {
    var shown = 0;
    ["lecture", "seminar"].forEach(function (cat) {
      var list = lists[cat];
      list.textContent = "";
      var items = docs.filter(function (d) { return d.cat === cat && matches(d); });
      items.forEach(function (d) { list.appendChild(card(d)); });
      blocks[cat].hidden = items.length === 0;
      shown += items.length;
    });
    $("empty").hidden = shown !== 0;
    var filtered = state.q.trim() !== "" || state.cat !== "all";
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

  $("reset").addEventListener("click", function () {
    state.q = ""; state.cat = "all"; input.value = "";
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
