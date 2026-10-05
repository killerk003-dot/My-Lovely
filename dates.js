/*
=========================================================
MY LOVELY
DATE IDEAS PAGE

Load order on dates.html:

    shared.js  →  dates.js

Everything is saved in localStorage under one key, so both
of you can add ideas on any device that opens the page.
=========================================================
*/

(function () {

    "use strict";


    if (!window.ML) {

        window.console.error(
            "dates.js needs shared.js to load first. dates.html must load, in order: shared.js, dates.js."
        );

        return;

    }


    /* =====================================================
       SETTINGS
    ===================================================== */

    var SETTINGS = {

        storeKey: "ml.dates.v1",

        /* Same moment the rest of the site counts down to. */

        meetupDate: "2026-12-27T00:00:00",

        /*
            First-run ideas. Seeded once so the page is never
            empty, then yours take over completely.
        */

        seed: [
            { title: "Sunset walk by the water", category: "outdoors", who: "both", notes: "The one we keep saying we will do first." },
            { title: "Cook one dish each, judge the other's", category: "food", who: "khalil", notes: "Loser does the washing up." },
            { title: "Watch party — next anime on the shared list", category: "virtual", who: "both", notes: "Works even before December." },
            { title: "K-drama night, her pick", category: "virtual", who: "khalil", notes: "No complaining about the plot." },
            { title: "First real date, in person", category: "meetup", who: "both", notes: "27 December 2026. The big one." },
            { title: "Gym session together", category: "active", who: "ilham", notes: "You both said gym. Now it is written down." }
        ],

        /* Labels, emoji and colours for the categories. */

        categories: [
            { key: "all", label: "Everything", emoji: "✦" },
            { key: "meetup", label: "The meet-up", emoji: "🧡" },
            { key: "virtual", label: "Virtual dates", emoji: "💻" },
            { key: "food", label: "Food", emoji: "🍽️" },
            { key: "outdoors", label: "Outdoors", emoji: "🌤️" },
            { key: "active", label: "Active", emoji: "🏋️" },
            { key: "culture", label: "Culture", emoji: "🎭" },
            { key: "cozy", label: "Cozy", emoji: "🕯️" },
            { key: "travel", label: "Travel", emoji: "✈️" }
        ],

        statusLabels: {
            idea: "Idea",
            planned: "Planned",
            done: "Done"
        },

        /* Status order for the cycle button. */

        statusOrder: ["idea", "planned", "done"],

        /* Rotating little lines under the countdown. */

        tags: [
            "One day closer, My Lovely.",
            "Counting down with you.",
            "December will come.",
            "Worth every day of waiting."
        ]

    };


    /* =====================================================
       STATE
    ===================================================== */

    var ideas = load();
    var activeCategory = "all";
    var statusFilter = "all";


    function load() {

        var stored = window.ML.store.get(SETTINGS.storeKey, null);

        if (Array.isArray(stored)) {
            return stored;
        }

        /* First run — seed, save, and hand the ideas back. */

        var seeded = SETTINGS.seed.map(function (entry, index) {

            return {
                id: "seed-" + index,
                title: entry.title,
                category: entry.category,
                who: entry.who,
                notes: entry.notes || "",
                when: "",
                status: "idea",
                addedAt: Date.now()
            };

        });

        window.ML.store.set(SETTINGS.storeKey, seeded);

        return seeded;

    }


    function save() {

        window.ML.store.set(SETTINGS.storeKey, ideas);

    }


    /* =====================================================
       HELPERS
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


    function categoryMeta(key) {

        var found = null;

        SETTINGS.categories.forEach(function (category) {

            if (category.key === key) {
                found = category;
            }

        });

        return found || { key: key, label: key, emoji: "✦" };

    }


    function whoLabel(who) {

        if (who === "both") {
            return "Both of us";
        }

        return window.ML.personName(who) + "'s idea";

    }


    function populateCategorySelect() {

        var select = document.getElementById("dates-category");

        if (!select) {
            return;
        }

        /* "all" is for the chips, not the form, so skip it here. */

        SETTINGS.categories

            .filter(function (category) {

                return category.key !== "all";

            })

            .forEach(function (category) {

                var option = document.createElement("option");

                option.value = category.key;
                option.textContent = category.emoji + " " + category.label;

                select.appendChild(option);

            });

        /* Sensible default: nothing beats the meet-up. */

        select.value = "meetup";

    }


    /* =====================================================
       COUNTDOWN
    ===================================================== */

    var tagTimer = null;
    var tagIndex = 0;


    function updateCountdown() {

        var days = document.getElementById("meet-days");

        if (!days) {
            return;
        }

        var target = new Date(SETTINGS.meetupDate).getTime();
        var difference = target - Date.now();

        if (difference <= 0) {

            window.ML.setText("meet-days", "000");
            window.ML.setText("meet-hours", "00");
            window.ML.setText("meet-mins", "00");
            window.ML.setText("meet-secs", "00");

            window.ML.setText("meet-tag", "Today is the day, My Lovely.");

            return;

        }

        var totalSeconds = Math.floor(difference / 1000);

        window.ML.setText("meet-days", String(Math.floor(totalSeconds / 86400)).padStart(3, "0"));
        window.ML.setText("meet-hours", window.ML.pad(Math.floor((totalSeconds % 86400) / 3600)));
        window.ML.setText("meet-mins", window.ML.pad(Math.floor((totalSeconds % 3600) / 60)));
        window.ML.setText("meet-secs", window.ML.pad(totalSeconds % 60));

    }


    function startCountdown() {

        updateCountdown();

        window.setInterval(updateCountdown, 1000);

        /* Rotate the tag line every little while. */

        var tag = document.getElementById("meet-tag");

        if (!tag || SETTINGS.tags.length < 2) {
            return;
        }

        tagTimer = window.setInterval(function () {

            tagIndex = (tagIndex + 1) % SETTINGS.tags.length;

            tag.textContent = SETTINGS.tags[tagIndex];

        }, 8000);

    }


    /* =====================================================
       CATEGORY CHIPS
    ===================================================== */

    function renderCategoryChips() {

        var strip = document.getElementById("dates-categories");

        if (!strip) {
            return;
        }

        strip.textContent = "";

        SETTINGS.categories.forEach(function (category) {

            var count = category.key === "all"
                ? ideas.length
                : ideas.filter(function (idea) {

                    return idea.category === category.key;

                }).length;

            /* Categories with nothing in them still show, so
               you can see what is worth filling. Empty ones
               keep a lighter look through the count badge. */

            var chip = element(
                "button",
                "category-chip" + (activeCategory === category.key ? " is-active" : ""),
                category.emoji + " " + category.label
            );

            chip.type = "button";

            var badge = element("span", "chip-count", String(count));

            chip.appendChild(badge);

            chip.addEventListener("click", function () {

                activeCategory = category.key;

                renderCategoryChips();
                renderIdeas();

            });

            strip.appendChild(chip);

        });

    }


    /* =====================================================
       IDEA CARDS
    ===================================================== */

    function buildCard(idea) {

        var card = element("article", "idea-card");

        /* Status drives the left border and strike-through. */

        if (idea.status === "done") {
            card.classList.add("is-done");
        } else if (idea.status === "planned") {
            card.classList.add("is-planned");
        }

        /* Top row — category chip + status. */

        var top = element("div", "idea-top");
        var meta = categoryMeta(idea.category);

        top.appendChild(
            element("span", "idea-chip", meta.emoji + " " + meta.label)
        );

        top.appendChild(
            element("span", "idea-chip", SETTINGS.statusLabels[idea.status] || idea.status)
        );

        card.appendChild(top);

        /* Title + note. */

        card.appendChild(element("h3", "idea-title", idea.title));

        if (idea.notes) {
            card.appendChild(element("p", "idea-note", idea.notes));
        }

        /* Meta line — who, and when if a date was set. */

        var bottom = element("div", "idea-meta");

        bottom.appendChild(element("span", null, whoLabel(idea.who)));

        if (idea.when) {

            bottom.appendChild(element("span", "dot"));

            bottom.appendChild(
                element("span", "idea-when", window.ML.formatDate(idea.when))
            );

        }

        card.appendChild(bottom);

        /* Action row — advance status, delete. */

        var actions = element("div", "idea-actions");

        var advance = element(
            "button",
            "icon-button",
            idea.status === "done" ? "↺ Not done" : "✓ " + SETTINGS.statusLabels[SETTINGS.statusOrder[SETTINGS.statusOrder.indexOf(idea.status) + 1]] || "✓"
        );

        advance.type = "button";

        advance.addEventListener("click", function () {

            if (idea.status === "done") {

                idea.status = "idea";

            } else {

                idea.status = SETTINGS.statusOrder[
                    SETTINGS.statusOrder.indexOf(idea.status) + 1
                ];

            }

            save();
            renderAll();

            window.ML.toast(
                idea.title + " — " + (SETTINGS.statusLabels[idea.status] || idea.status).toLowerCase()
            );

        });

        actions.appendChild(advance);

        var remove = element("button", "icon-button danger", "✕");

        remove.type = "button";
        remove.title = "Remove";

        remove.addEventListener("click", function () {

            ideas = ideas.filter(function (candidate) {

                return candidate.id !== idea.id;

            });

            save();
            renderAll();

            window.ML.toast("Removed " + idea.title);

        });

        actions.appendChild(remove);

        card.appendChild(actions);

        return card;

    }


    function renderIdeas() {

        var grid = document.getElementById("dates-grid");
        var empty = document.getElementById("dates-empty");

        if (!grid) {
            return;
        }

        grid.textContent = "";

        var visible = ideas.filter(function (idea) {

            var categoryOk = activeCategory === "all"
                || idea.category === activeCategory;

            var statusOk = statusFilter === "all"
                || idea.status === statusFilter;

            return categoryOk && statusOk;

        });

        /* Done items drift to the bottom so the plan stays
           at the top. Newest ideas first inside each group. */

        visible.sort(function (a, b) {

            var rank = { idea: 0, planned: 1, done: 2 };

            if (rank[a.status] !== rank[b.status]) {
                return rank[a.status] - rank[b.status];
            }

            return (b.addedAt || 0) - (a.addedAt || 0);

        });

        visible.forEach(function (idea) {

            grid.appendChild(buildCard(idea));

        });

        if (empty) {
            empty.hidden = visible.length > 0;
        }

    }


    function updateBadge() {

        window.ML.setText(
            "dates-count",
            ideas.length + " " + window.ML.plural(ideas.length, "idea")
        );

    }


    function renderAll() {

        renderCategoryChips();
        renderIdeas();
        updateBadge();

    }


    /* =====================================================
       ADD AN IDEA
    ===================================================== */

    function addIdea() {

        var titleInput = document.getElementById("dates-title");

        var title = titleInput ? titleInput.value.trim() : "";

        if (!title) {

            window.ML.toast("Give the idea a name first");

            if (titleInput) {
                titleInput.focus();
            }

            return;

        }

        ideas.push({
            id: "d" + Date.now() + Math.floor(Math.random() * 1000),
            title: title,
            category: document.getElementById("dates-category").value,
            who: document.getElementById("dates-who").value,
            when: document.getElementById("dates-when").value || "",
            notes: document.getElementById("dates-notes").value.trim(),
            status: "idea",
            addedAt: Date.now()
        });

        save();

        /* Reset the text fields, keep the chosen category. */

        titleInput.value = "";
        document.getElementById("dates-notes").value = "";
        document.getElementById("dates-when").value = "";
        titleInput.focus();

        renderAll();

        window.ML.toast("Added " + title);

    }


    /* =====================================================
       PICK FOR US
    ===================================================== */

    function pickForUs() {

        var result = document.getElementById("dates-pick-result");

        /* Only things that are still ideas can be picked —
           no point suggesting something already done. */

        var pool = ideas.filter(function (idea) {

            var categoryOk = activeCategory === "all"
                || idea.category === activeCategory;

            return categoryOk && idea.status !== "done";

        });

        if (!pool.length) {

            window.ML.toast("Nothing left to pick from");

            return;

        }

        /* Ideas thought up by you both count three times —
           they are the ones you already agreed on. */

        var weighted = [];

        pool.forEach(function (idea) {

            weighted.push(idea);

            if (idea.who === "both") {
                weighted.push(idea);
                weighted.push(idea);
            }

        });

        var pick = weighted[Math.floor(Math.random() * weighted.length)];

        /* A pick doubles as a plan — move it along. */

        if (pick.status === "idea") {

            pick.status = "planned";
            save();

        }

        var meta = categoryMeta(pick.category);

        window.ML.setText("dates-pick-title", meta.emoji + " " + pick.title);

        window.ML.setText(
            "dates-pick-note",
            (pick.notes
                ? pick.notes + " · "
                : "")
                + whoLabel(pick.who)
                + (pick.when
                    ? " · " + window.ML.formatDate(pick.when)
                    : "")
        );

        result.hidden = false;

        renderAll();

    }


    /* =====================================================
       SHOW MEET-UP IDEAS
    ===================================================== */

    function showMeetupIdeas() {

        activeCategory = "meetup";

        renderCategoryChips();
        renderIdeas();

        var heading = document.querySelector("#dates-page .section-heading");

        if (heading) {

            heading.scrollIntoView({
                behavior: window.ML.prefersReducedMotion() ? "auto" : "smooth",
                block: "start"
            });

        }

    }


    /* =====================================================
       BACKUP
    ===================================================== */

    function downloadBackup() {

        var payload = JSON.stringify(
            { exportedAt: new Date().toISOString(), ideas: ideas },
            null,
            2
        );

        var blob = new Blob([payload], { type: "application/json" });

        var url = URL.createObjectURL(blob);

        var link = document.createElement("a");

        link.href = url;
        link.download = "date-ideas-" + window.ML.todayKey() + ".json";

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        URL.revokeObjectURL(url);

        window.ML.toast("Backup downloaded");

    }


    /* =====================================================
       WIRING
    ===================================================== */

    function wire() {

        var add = document.getElementById("dates-add");

        if (add) {
            add.addEventListener("click", addIdea);
        }

        var title = document.getElementById("dates-title");

        if (title) {

            title.addEventListener("keydown", function (event) {

                if (event.key === "Enter") {
                    event.preventDefault();
                    addIdea();
                }

            });

        }

        var pick = document.getElementById("dates-pick");

        if (pick) {
            pick.addEventListener("click", pickForUs);
        }

        var focusMeetup = document.getElementById("dates-focus-meetup");

        if (focusMeetup) {
            focusMeetup.addEventListener("click", showMeetupIdeas);
        }

        var filter = document.getElementById("dates-filter");

        if (filter) {

            filter.addEventListener("change", function (event) {

                statusFilter = event.target.value;

                renderIdeas();

            });

        }

        var exporter = document.getElementById("dates-export");

        if (exporter) {
            exporter.addEventListener("click", downloadBackup);
        }

    }


    /* =====================================================
       START
    ===================================================== */

    populateCategorySelect();
    wire();
    renderAll();
    startCountdown();

}());