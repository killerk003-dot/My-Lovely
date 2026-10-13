/*
=========================================================
MY LOVELY
QURAN TRACKER — ONE PAGE A DAY

This follows the spreadsheet exactly:

    Date · Surah · Page number · Completed #1 · Completed #2 · Reflection

One page per day, 604 pages, one full khatm. Each day has
two dropdowns (Completed / Not Completed), one for Khalil
and one for Ilham, plus a shared reflection.

The page number is not typed in — it comes from the date.
Day 1 of the plan is page 1, day 2 is page 2, and so on.
=========================================================
*/

(function () {

    "use strict";


    if (!window.ML) {

        window.console.error(
            "quran.js needs shared.js to load first. Check the script tags at the bottom of the page."
        );

        return;

    }


    /* =====================================================
       THE PLAN
    ===================================================== */

    var STORAGE_KEY = "ml.quran.plan.v1";

    /* Older keys, read once so nothing already logged is lost. */
    var LEGACY_ENTRIES_KEY = "ml.quran.entries.v1";
    var LEGACY_PAGES_KEY = "ml.quran.completed_pages.v1";

    var TOTAL_PAGES = 604;
    var DEFAULT_START = "2026-08-09";

    var DONE = "Completed";
    var NOT_DONE = "Not Completed";


    /*
        The page each surah begins on in the standard
        Madani mushaf. Checked against the spreadsheet:
        297 of 303 labelled rows match exactly, and the six
        that differ are pages where one surah ends and the
        next begins — those are shown as "A / B", the same
        way the spreadsheet writes page 267.
    */

    var SURAH_STARTS = [
        1, 2, 50, 77, 106, 128, 151, 177, 187, 208,
        221, 235, 249, 255, 262, 267, 282, 293, 305, 312,
        322, 332, 342, 350, 359, 367, 377, 385, 396, 404,
        411, 415, 418, 428, 434, 440, 446, 453, 458, 467,
        477, 483, 489, 496, 499, 502, 507, 511, 515, 518,
        520, 523, 526, 528, 531, 534, 537, 542, 545, 549,
        551, 553, 554, 556, 558, 560, 562, 564, 566, 568,
        570, 572, 574, 575, 577, 578, 580, 582, 583, 585,
        586, 587, 587, 589, 590, 591, 591, 592, 593, 594,
        595, 595, 596, 596, 597, 597, 598, 598, 599, 599,
        600, 600, 601, 601, 601, 602, 602, 602, 603, 603,
        603, 604, 604, 604
    ];

    var SURAH_NAMES = [
        "Al-Fatihah", "Al-Baqarah", "Aal-Imran", "An-Nisa", "Al-Ma'idah",
        "Al-An'am", "Al-A'raf", "Al-Anfal", "At-Tawbah", "Yunus",
        "Hud", "Yusuf", "Ar-Ra'd", "Ibrahim", "Al-Hijr",
        "An-Nahl", "Al-Isra", "Al-Kahf", "Maryam", "Ta-Ha",
        "Al-Anbiya", "Al-Hajj", "Al-Mu'minun", "An-Nur", "Al-Furqan",
        "Ash-Shu'ara", "An-Naml", "Al-Qasas", "Al-Ankabut", "Ar-Rum",
        "Luqman", "As-Sajdah", "Al-Ahzab", "Saba", "Fatir",
        "Ya-Sin", "As-Saffat", "Sad", "Az-Zumar", "Ghafir",
        "Fussilat", "Ash-Shura", "Az-Zukhruf", "Ad-Dukhan", "Al-Jathiyah",
        "Al-Ahqaf", "Muhammad", "Al-Fath", "Al-Hujurat", "Qaf",
        "Adh-Dhariyat", "At-Tur", "An-Najm", "Al-Qamar", "Ar-Rahman",
        "Al-Waqi'ah", "Al-Hadid", "Al-Mujadila", "Al-Hashr", "Al-Mumtahanah",
        "As-Saff", "Al-Jumu'ah", "Al-Munafiqun", "At-Taghabun", "At-Talaq",
        "At-Tahrim", "Al-Mulk", "Al-Qalam", "Al-Haqqah", "Al-Ma'arij",
        "Nuh", "Al-Jinn", "Al-Muzzammil", "Al-Muddaththir", "Al-Qiyamah",
        "Al-Insan", "Al-Mursalat", "An-Naba", "An-Nazi'at", "Abasa",
        "At-Takwir", "Al-Infitar", "Al-Mutaffifin", "Al-Inshiqaq", "Al-Buruj",
        "At-Tariq", "Al-A'la", "Al-Ghashiyah", "Al-Fajr", "Al-Balad",
        "Ash-Shams", "Al-Layl", "Ad-Duha", "Ash-Sharh", "At-Tin",
        "Al-Alaq", "Al-Qadr", "Al-Bayyinah", "Az-Zalzalah", "Al-Adiyat",
        "Al-Qari'ah", "At-Takathur", "Al-Asr", "Al-Humazah", "Al-Fil",
        "Quraysh", "Al-Ma'un", "Al-Kawthar", "Al-Kafirun", "An-Nasr",
        "Al-Masad", "Al-Ikhlas", "Al-Falaq", "An-Nas"
    ];


    function surahForPage(page) {

        var running = 0;
        var starting = [];

        var i;

        for (i = 0; i < SURAH_STARTS.length; i += 1) {

            if (SURAH_STARTS[i] === page) {

                starting.push(SURAH_NAMES[i]);

            }

            if (SURAH_STARTS[i] <= page) {

                running = i;

            }

        }

        var carried = SURAH_NAMES[running];

        /*
            If a surah begins on this page and a different one
            was already running across the top of it, show both.
        */

        if (starting.length && starting[0] !== carried) {

            return carried + " / " + starting[0];

        }

        if (starting.length > 1) {

            return starting.join(" / ");

        }

        return carried;

    }


    /* =====================================================
       WHAT IS ALREADY LOGGED

       Seeded from the spreadsheet the first time the page is
       opened, so the days already marked there are not lost.
    ===================================================== */

    var SEED = {
        "2026-08-09": { k: true, i: true, note: "" },
        "2026-08-10": { k: true, i: true, note: "" },
        "2026-08-11": { k: true, i: true, note: "Khalil read extremely well, I'm super proud of him" },
        "2026-08-12": { k: true, i: true, note: "Ilham has been enjoying the Qur'an challenge" },
        "2026-08-13": { k: true, i: true, note: "Proud of Ilham for persevering with the challenge" },
        "2026-08-14": { k: true, i: true, note: "Khalil is encouraging and I'm enjoying this challenge so much :))) Super beneficial <3" },
        "2026-08-15": { k: true, i: true, note: "" },
        "2026-08-16": { k: true, i: true, note: "" },
        "2026-08-17": { k: true, i: true, note: "" },
        "2026-08-18": { k: true, i: true, note: "" },
        "2026-08-19": { k: true, i: true, note: "" },
        "2026-08-20": { k: true, i: true, note: "" },
        "2026-08-21": { k: true, i: true, note: "" },
        "2026-08-22": { k: true, i: true, note: "" },
        "2026-08-23": { k: true, i: true, note: "" },
        "2026-08-24": { k: true, i: false, note: "" },
        "2026-08-25": { k: true, i: false, note: "" }
    };


    function blankPlan() {

        return {
            startDate: DEFAULT_START,
            days: {}
        };

    }


    var plan = blankPlan();


    function startDateObject() {

        return new Date(plan.startDate + "T12:00:00");

    }


    function pageForDate(dateKey) {

        var start = startDateObject();
        var day = new Date(dateKey + "T12:00:00");

        var difference = Math.round((day - start) / 86400000);

        if (difference < 0 || difference >= TOTAL_PAGES) {
            return null;
        }

        return difference + 1;

    }


    function dateForPage(page) {

        if (!page || page < 1 || page > TOTAL_PAGES) {
            return null;
        }

        var start = startDateObject();

        start.setDate(start.getDate() + (page - 1));

        return window.ML.dayKey(start);

    }


    function migrateLegacy() {

        var moved = 0;

        /* Old shape: { khalil: [pageNumbers], ilham: [pageNumbers] } */

        var pages = window.ML.store.get(LEGACY_PAGES_KEY, null);

        if (pages && (Array.isArray(pages.khalil) || Array.isArray(pages.ilham))) {

            ["khalil", "ilham"].forEach(function (person) {

                var list = Array.isArray(pages[person])
                    ? pages[person]
                    : [];

                list.forEach(function (page) {

                    var key = dateForPage(Number(page));

                    if (!key) {
                        return;
                    }

                    if (!plan.days[key]) {
                        plan.days[key] = { k: false, i: false, note: "" };
                    }

                    plan.days[key][person === "khalil" ? "k" : "i"] = true;

                    moved += 1;

                });

            });

        }

        /* Old shape: a list of per-person entries with dates. */

        var entries = window.ML.store.get(LEGACY_ENTRIES_KEY, null);

        if (Array.isArray(entries)) {

            entries.forEach(function (entry) {

                if (!entry || !entry.date || !entry.done) {
                    return;
                }

                if (!plan.days[entry.date]) {
                    plan.days[entry.date] = { k: false, i: false, note: "" };
                }

                plan.days[entry.date][entry.person === "khalil" ? "k" : "i"] = true;

                if (entry.notes && !plan.days[entry.date].note) {

                    plan.days[entry.date].note = entry.notes;

                }

                moved += 1;

            });

        }

        return moved;

    }


    function loadPlan() {

        var stored = window.ML.store.get(STORAGE_KEY, null);

        if (stored && stored.days && typeof stored.days === "object") {

            plan = stored;

            if (!plan.startDate) {
                plan.startDate = DEFAULT_START;
            }

            return;

        }

        /* First run on this device. */

        plan = blankPlan();

        var moved = migrateLegacy();

        if (!moved) {

            Object.keys(SEED).forEach(function (key) {

                plan.days[key] = {
                    k: SEED[key].k,
                    i: SEED[key].i,
                    note: SEED[key].note
                };

            });

        }

        window.ML.store.set(STORAGE_KEY, plan);

    }


    loadPlan();


    var listeners = [];


    function persist() {

        window.ML.store.set(STORAGE_KEY, plan);

        listeners.forEach(function (fn) {

            fn(plan);

        });

    }


    function dayRecord(dateKey) {

        return plan.days[dateKey] || { k: false, i: false, note: "" };

    }


    function cleanUp(dateKey) {

        var record = plan.days[dateKey];

        if (record && !record.k && !record.i && !record.note) {

            delete plan.days[dateKey];

        }

    }


    function setCompleted(dateKey, person, completed) {

        if (!plan.days[dateKey]) {

            plan.days[dateKey] = { k: false, i: false, note: "" };

        }

        plan.days[dateKey][person === "khalil" ? "k" : "i"] = Boolean(completed);

        cleanUp(dateKey);

        persist();

    }


    function setNote(dateKey, note) {

        if (!plan.days[dateKey]) {

            plan.days[dateKey] = { k: false, i: false, note: "" };

        }

        plan.days[dateKey].note = note;

        cleanUp(dateKey);

        persist();

    }


    function setStartDate(dateKey) {

        plan.startDate = dateKey;

        persist();

    }


    /* =====================================================
       THE NUMBERS
    ===================================================== */

    function streakFor(which) {

        var cursor = new Date();

        var count = 0;

        function countsOn(record) {

            if (!record) {
                return false;
            }

            if (which === "both") {
                return record.k && record.i;
            }

            return record[which === "khalil" ? "k" : "i"];

        }

        /* Today not being done yet does not break a streak. */

        if (!countsOn(plan.days[window.ML.dayKey(cursor)])) {

            cursor.setDate(cursor.getDate() - 1);

        }

        while (countsOn(plan.days[window.ML.dayKey(cursor)])) {

            count += 1;

            cursor.setDate(cursor.getDate() - 1);

        }

        return count;

    }


    function summary() {

        var khalilPages = 0;
        var ilhamPages = 0;
        var bothPages = 0;
        var notes = 0;

        Object.keys(plan.days).forEach(function (key) {

            var record = plan.days[key];

            if (record.k) {
                khalilPages += 1;
            }

            if (record.i) {
                ilhamPages += 1;
            }

            if (record.k && record.i) {
                bothPages += 1;
            }

            if (record.note) {
                notes += 1;
            }

        });

        var todayKey = window.ML.todayKey();

        var todayPage = pageForDate(todayKey);

        return {

            startDate: plan.startDate,
            finishDate: dateForPage(TOTAL_PAGES),
            totalPages: TOTAL_PAGES,

            todayPage: todayPage,
            todayKey: todayKey,
            todaySurah: todayPage ? surahForPage(todayPage) : null,
            todayRecord: dayRecord(todayKey),

            khalilPages: khalilPages,
            ilhamPages: ilhamPages,
            bothPages: bothPages,
            notes: notes,

            khalilStreak: streakFor("khalil"),
            ilhamStreak: streakFor("ilham"),
            bothStreak: streakFor("both"),

            /* The keys the home page card reads. */
            pages: bothPages,
            juz: Math.floor(bothPages / (TOTAL_PAGES / 30)),
            progress: Math.round((bothPages / TOTAL_PAGES) * 100),
            streak: streakFor("both"),
            togetherDays: bothPages,
            hasData: Object.keys(plan.days).length > 0

        };

    }


    /* =====================================================
       IMPORT FROM THE SPREADSHEET

       Accepts rows copied straight out of the sheet:
       Date · Surah · Page · Completed #1 · Completed #2 · Notes
    ===================================================== */

    function normaliseDate(value) {

        var raw = String(value || "").trim();

        if (!raw) {
            return "";
        }

        if (/^\d{4}-\d{2}-\d{2}/.test(raw)) {
            return raw.slice(0, 10);
        }

        var parts = raw.split(/[\/.\-]/);

        if (parts.length === 3 && parts[0].length <= 2) {

            var day = Number(parts[0]);
            var month = Number(parts[1]);
            var year = Number(parts[2]);

            if (year < 100) {
                year += 2000;
            }

            if (day >= 1 && day <= 31 && month >= 1 && month <= 12) {

                return year + "-" + window.ML.pad(month) + "-" + window.ML.pad(day);

            }

        }

        var parsed = Date.parse(raw);

        return Number.isNaN(parsed)
            ? ""
            : window.ML.dayKey(new Date(parsed));

    }


    function isCompleted(value) {

        var text = String(value || "").trim().toLowerCase();

        if (!text || text.indexOf("not") === 0) {
            return false;
        }

        return text === "completed"
            || text === "yes"
            || text === "y"
            || text === "true"
            || text === "1"
            || text === "done"
            || text === "\u2713"
            || text === "\u2714"
            || text === "x";

    }


    function parseSheet(text) {

        var lines = String(text)
            .split(/\r?\n/)
            .filter(function (line) {

                return line.trim() !== "";

            });

        if (!lines.length) {
            return [];
        }

        var separator = lines[0].indexOf("\t") !== -1
            ? "\t"
            : ",";

        var first = lines[0].toLowerCase();

        var hasHeader = first.indexOf("date") !== -1
            && (first.indexOf("completed") !== -1 || first.indexOf("page") !== -1);

        var body = hasHeader
            ? lines.slice(1)
            : lines;

        var rows = [];

        body.forEach(function (line) {

            var cells = line.split(separator).map(function (cell) {

                return cell.trim().replace(/^"|"$/g, "");

            });

            var date = normaliseDate(cells[0]);

            if (!date) {
                return;
            }

            rows.push({
                date: date,
                page: Number(String(cells[2] || "").replace(/[^0-9]/g, "")) || null,
                khalil: isCompleted(cells[3]),
                ilham: isCompleted(cells[4]),
                note: cells[5] || ""
            });

        });

        return rows;

    }


    function importRows(rows, mode) {

        if (mode === "replace") {
            plan.days = {};
        }

        var applied = 0;

        rows.forEach(function (row) {

            if (!row.khalil && !row.ilham && !row.note) {
                return;
            }

            plan.days[row.date] = {
                k: row.khalil,
                i: row.ilham,
                note: row.note
            };

            applied += 1;

        });

        persist();

        return applied;

    }


    /* =====================================================
       PUBLIC API
    ===================================================== */

    window.QuranStore = {
        TOTAL_PAGES: TOTAL_PAGES,
        DONE: DONE,
        NOT_DONE: NOT_DONE,
        surahForPage: surahForPage,
        pageForDate: pageForDate,
        dateForPage: dateForPage,
        dayRecord: dayRecord,
        setCompleted: setCompleted,
        setNote: setNote,
        setStartDate: setStartDate,
        summary: summary,
        parseSheet: parseSheet,
        importRows: importRows,
        all: function () {

            return JSON.parse(JSON.stringify(plan));

        },
        reset: function () {

            plan = blankPlan();

            persist();

        },
        subscribe: function (fn) {

            listeners.push(fn);

        }
    };


    /* =====================================================
       THE PAGE
    ===================================================== */

    function element(tag, className, text) {

        var node = document.createElement(tag);

        if (className) {
            node.className = className;
        }

        if (text !== undefined && text !== null) {
            node.textContent = text;
        }

        return node;

    }


    function buildSelect(isDone, onChange) {

        var select = document.createElement("select");

        select.className = "select";

        [NOT_DONE, DONE].forEach(function (label) {

            var option = document.createElement("option");

            option.value = label;
            option.textContent = label;

            select.appendChild(option);

        });

        select.value = isDone
            ? DONE
            : NOT_DONE;

        select.addEventListener("change", function () {

            onChange(select.value === DONE);

        });

        return select;

    }


    function buildPage() {

        var root = document.getElementById("quran-page");

        if (!root) {
            return;
        }

        var filter = "all";

        var todayCard = document.getElementById("quran-today-card");
        var tableBody = document.getElementById("quran-plan-body");


        /* ---------- today ---------- */

        function renderToday() {

            if (!todayCard) {
                return;
            }

            todayCard.textContent = "";

            var stats = summary();

            if (!stats.todayPage) {

                var outside = element("div", "empty-state");

                outside.appendChild(element("strong", null, "Today sits outside the plan"));

                outside.appendChild(element(
                    "p",
                    null,
                    "The plan runs from "
                        + window.ML.formatDate(stats.startDate + "T12:00:00", "long")
                        + " to "
                        + window.ML.formatDate(stats.finishDate + "T12:00:00", "long")
                        + "."
                ));

                todayCard.appendChild(outside);

                return;

            }

            var card = element("div", "plan-today");

            var badge = element("div", "page-badge");

            badge.appendChild(element("small", null, "PAGE"));
            badge.appendChild(element("strong", null, String(stats.todayPage)));
            badge.appendChild(element("small", null, "OF " + TOTAL_PAGES));

            card.appendChild(badge);

            var copy = element("div", "plan-today-copy");

            copy.appendChild(element("p", "eyebrow", "Today's page"));
            copy.appendChild(element("h2", null, stats.todaySurah));
            copy.appendChild(element(
                "p",
                "plan-today-date",
                window.ML.formatDate(new Date(), "long")
                    + " · day " + stats.todayPage + " of " + TOTAL_PAGES
            ));

            var row = element("div", "tick-row");

            [
                { key: "khalil", label: "Khalil", flag: "k" },
                { key: "ilham", label: "Ilham", flag: "i" }
            ].forEach(function (person) {

                var box = element("div", "tick-person");

                box.setAttribute("data-person", person.key);

                var done = stats.todayRecord[person.flag];

                if (done) {
                    box.classList.add("is-done");
                }

                var label = element("label");

                label.appendChild(element("span", "who-dot"));
                label.appendChild(document.createTextNode(person.label));

                box.appendChild(label);

                box.appendChild(buildSelect(done, function (completed) {

                    setCompleted(stats.todayKey, person.key, completed);

                    /*
                        Update in place rather than rebuilding the
                        card, so the dropdown keeps focus.
                    */

                    box.classList.toggle("is-done", completed);

                    renderNumbers();

                    renderTable();

                    window.ML.toast(
                        completed
                            ? person.label + " completed page " + stats.todayPage
                            : person.label + " marked not completed"
                    );

                }));

                row.appendChild(box);

            });

            copy.appendChild(row);

            var noteField = element("div", "field plan-note-field");

            noteField.appendChild(element("label", null, "Reflection / notes"));

            var note = document.createElement("textarea");

            note.className = "textarea";
            note.placeholder = "Anything worth remembering about today's page…";
            note.value = stats.todayRecord.note || "";

            note.addEventListener("input", window.ML.debounce(function () {

                setNote(stats.todayKey, note.value);

                renderNumbers();

                renderTable();

            }, 600));

            noteField.appendChild(note);

            copy.appendChild(noteField);

            card.appendChild(copy);

            todayCard.appendChild(card);

        }


        /* ---------- the numbers ---------- */

        function renderNumbers() {

            var stats = summary();

            window.ML.setText("quran-both-pages", window.ML.formatNumber(stats.bothPages));
            window.ML.setText("quran-khalil-pages", window.ML.formatNumber(stats.khalilPages));
            window.ML.setText("quran-ilham-pages", window.ML.formatNumber(stats.ilhamPages));
            window.ML.setText("quran-streak", window.ML.formatNumber(stats.bothStreak));

            window.ML.setText("quran-progress-percent", stats.progress + "%");
            window.ML.setWidth("quran-progress-bar", stats.progress);

            window.ML.setText(
                "quran-progress-note",
                stats.bothPages
                    ? stats.bothPages + " of " + TOTAL_PAGES
                        + " pages done by both of you · Khalil " + stats.khalilPages
                        + " · Ilham " + stats.ilhamPages
                    : "Nothing marked yet. Use the dropdowns above."
            );

            window.ML.setText(
                "quran-finish-note",
                "Plan runs "
                    + window.ML.formatDate(stats.startDate + "T12:00:00")
                    + " → "
                    + window.ML.formatDate(stats.finishDate + "T12:00:00")
            );

        }


        /* ---------- the plan table ---------- */

        /*
            Each row gets its own function so that every
            dropdown closes over its own date, instead of
            whatever the loop variable ended up as.
        */

        function buildRow(page, dateKey, isToday, isPast) {

            var record = dayRecord(dateKey);

            var tr = document.createElement("tr");

            function paint() {

                var current = dayRecord(dateKey);

                var bothDone = current.k && current.i;

                tr.className = isToday
                    ? "is-today"
                    : ((isPast && !bothDone) ? "is-past-missed" : "");

            }

            paint();

            tr.appendChild(element("td", null, window.ML.formatDate(dateKey + "T12:00:00")));

            tr.appendChild(element("td", "cell-page", String(page)));

            tr.appendChild(element("td", null, surahForPage(page)));

            [
                { key: "khalil", flag: "k" },
                { key: "ilham", flag: "i" }
            ].forEach(function (person) {

                var cell = element("td");

                cell.appendChild(buildSelect(record[person.flag], function (completed) {

                    setCompleted(dateKey, person.key, completed);

                    /* Repaint just this row, so focus is kept. */

                    paint();

                    renderNumbers();

                    if (isToday) {
                        renderToday();
                    }

                }));

                tr.appendChild(cell);

            });

            var noteCell = element("td");

            var noteInput = document.createElement("input");

            noteInput.type = "text";
            noteInput.className = "input note-input";
            noteInput.placeholder = "—";
            noteInput.value = record.note || "";

            noteInput.addEventListener("input", window.ML.debounce(function () {

                setNote(dateKey, noteInput.value);

                renderNumbers();

            }, 600));

            noteCell.appendChild(noteInput);

            tr.appendChild(noteCell);

            return tr;

        }


        function renderTable() {

            if (!tableBody) {
                return;
            }

            tableBody.textContent = "";

            var todayKey = window.ML.todayKey();
            var todayPage = pageForDate(todayKey);

            var from = 1;
            var to = TOTAL_PAGES;

            /* Show a window around today unless a filter is on. */

            if (filter === "all" && todayPage) {

                from = Math.max(1, todayPage - 10);
                to = Math.min(TOTAL_PAGES, todayPage + 25);

            }

            var shown = 0;

            var page;

            for (page = from; page <= to; page += 1) {

                var dateKey = dateForPage(page);

                if (!dateKey) {
                    continue;
                }

                var record = dayRecord(dateKey);

                var isPast = dateKey < todayKey;
                var isToday = dateKey === todayKey;
                var bothDone = record.k && record.i;

                if (filter === "done" && !bothDone) {
                    continue;
                }

                if (filter === "missed" && !(isPast && !bothDone)) {
                    continue;
                }

                if (filter === "upcoming" && dateKey <= todayKey) {
                    continue;
                }

                shown += 1;

                if (shown > 200) {
                    break;
                }

                tableBody.appendChild(buildRow(page, dateKey, isToday, isPast));

            }

            if (!shown) {

                var empty = document.createElement("tr");

                var cell = element("td", "muted-text", "Nothing to show for this filter.");

                cell.colSpan = 6;

                empty.appendChild(cell);

                tableBody.appendChild(empty);

            }

        }


        function render() {

            renderToday();
            renderNumbers();
            renderTable();

        }


        /* ---------- controls ---------- */

        var filterSelect = document.getElementById("quran-filter");

        if (filterSelect) {

            filterSelect.addEventListener("change", function () {

                filter = filterSelect.value;

                renderTable();

            });

        }

        var jump = document.getElementById("quran-jump-today");

        if (jump) {

            jump.addEventListener("click", function () {

                filter = "all";

                if (filterSelect) {
                    filterSelect.value = "all";
                }

                renderTable();

                var todayRow = document.querySelector(".plan-table tr.is-today");

                if (todayRow && todayRow.scrollIntoView) {

                    todayRow.scrollIntoView({ block: "center", behavior: "smooth" });

                }

            });

        }


        var exportButton = document.getElementById("quran-export");

        if (exportButton) {

            exportButton.addEventListener("click", function () {

                var lines = [
                    "Date\tSurah Name\tPage Numeber\tCompleted # 1\tCompleted # 2\tReflection / Notes"
                ];

                var page;

                for (page = 1; page <= TOTAL_PAGES; page += 1) {

                    var dateKey = dateForPage(page);

                    var record = dayRecord(dateKey);

                    lines.push([
                        dateKey,
                        surahForPage(page),
                        page,
                        record.k ? DONE : NOT_DONE,
                        record.i ? DONE : NOT_DONE,
                        (record.note || "").replace(/\t/g, " ")
                    ].join("\t"));

                }

                var blob = new Blob([lines.join("\n")], {
                    type: "text/tab-separated-values"
                });

                var url = URL.createObjectURL(blob);

                var link = document.createElement("a");

                link.href = url;
                link.download = "quran-tracker-" + window.ML.todayKey() + ".tsv";

                document.body.appendChild(link);

                link.click();

                document.body.removeChild(link);

                URL.revokeObjectURL(url);

                window.ML.toast("Downloaded — opens straight in Google Sheets");

            });

        }


        if (!window.ML.store.available) {

            var warning = document.getElementById("quran-storage-warning");

            if (warning) {
                warning.hidden = false;
            }

        }

        render();

    }


    window.ML.ready(buildPage);

}());
