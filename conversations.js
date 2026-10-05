/*
=========================================================
MY LOVELY
CONVERSATIONS PAGE

This page does not print the whole archive. It reads
everything once, keeps the messages that were pinned,
reacted to, or clearly about something that matters, and
shows those with the date and time attached.

Load order on conversations.html:

    shared.js  →  chat-data.js  →  conversations.js
=========================================================
*/

(function () {

    "use strict";


    if (!window.ML || !window.ChatData) {

        window.console.error(
            "conversations.js needs shared.js and chat-data.js to load first."
        );

        return;

    }


    var STAR_KEY = "ml.moments.starred.v1";

    var PAGE_SIZE = 18;


    var state = {
        summary: null,
        topic: "all",
        person: "all",
        source: "all",
        sort: "newest",
        search: "",
        shown: PAGE_SIZE,
        starred: window.ML.store.get(STAR_KEY, [])
    };

    if (!Array.isArray(state.starred)) {
        state.starred = [];
    }


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


    function isStarred(id) {

        return state.starred.indexOf(id) !== -1;

    }


    function toggleStar(id) {

        var index = state.starred.indexOf(id);

        if (index === -1) {

            state.starred.push(id);

        } else {

            state.starred.splice(index, 1);

        }

        window.ML.store.set(STAR_KEY, state.starred);

        return index === -1;

    }


    /* =====================================================
       NUMBERS PANEL
    ===================================================== */

    function renderNumbers(summary) {

        var totals = summary.totals;
        var span = summary.span;

        window.ML.setText("conv-messages", window.ML.formatNumber(totals.messages));
        window.ML.setText("conv-span-days", window.ML.formatNumber(span.days));
        window.ML.setText("conv-active-days", window.ML.formatNumber(span.activeDays));
        window.ML.setText("conv-photos", window.ML.formatNumber(totals.attachments));
        window.ML.setText("conv-calls", window.ML.formatNumber(totals.calls));
        window.ML.setText("conv-reactions", window.ML.formatNumber(totals.reactions));
        window.ML.setText("conv-love", window.ML.formatNumber(summary.phrases.love));
        window.ML.setText("conv-laughs", window.ML.formatNumber(summary.phrases.laugh));

        window.ML.setText(
            "conv-span-note",
            window.ML.formatDate(span.first) + " → " + window.ML.formatDate(span.last)
        );

        window.ML.setText(
            "conv-active-note",
            span.days
                ? Math.round((span.activeDays / span.days) * 100) + "% of all days since the first message"
                : ""
        );

        var perDay = span.activeDays
            ? Math.round(totals.messages / span.activeDays)
            : 0;

        window.ML.setText(
            "conv-messages-note",
            perDay
                ? "About " + window.ML.formatNumber(perDay) + " on every day you spoke"
                : ""
        );


        /* Who says more. */

        var khalil = summary.perPerson.khalil.messages;
        var ilham = summary.perPerson.ilham.messages;

        var total = khalil + ilham;

        if (total > 0) {

            var khalilShare = Math.round((khalil / total) * 100);

            var bar = document.getElementById("conv-split");

            if (bar) {

                bar.textContent = "";

                var left = element("span", "split-khalil", khalilShare + "%");

                left.style.width = khalilShare + "%";

                var right = element("span", "split-ilham", (100 - khalilShare) + "%");

                right.style.width = (100 - khalilShare) + "%";

                bar.appendChild(left);
                bar.appendChild(right);

            }

            window.ML.setText(
                "conv-split-note",
                "Khalil " + window.ML.formatNumber(khalil)
                    + " · Ilham " + window.ML.formatNumber(ilham)
                    + " · " + window.ML.formatNumber(summary.totals.words) + " words between you"
            );

        }


        /* Emoji league table. */

        var chart = document.getElementById("conv-emoji");

        if (chart) {

            chart.textContent = "";

            if (!summary.emojis.length) {

                chart.appendChild(element("p", "muted-text", "No emoji in the archive yet."));

            } else {

                var top = summary.emojis[0].count;

                summary.emojis.forEach(function (item) {

                    var row = element("div", "emoji-row");

                    row.appendChild(element("span", "emoji-glyph", item.emoji));

                    var track = element("div", "emoji-track");

                    var fill = element("span");

                    fill.style.width = Math.round((item.count / top) * 100) + "%";

                    track.appendChild(fill);

                    row.appendChild(track);

                    row.appendChild(element("span", "emoji-count", window.ML.formatNumber(item.count)));

                    chart.appendChild(row);

                });

            }

        }


        /* Little facts. */

        var facts = document.getElementById("conv-facts");

        if (facts) {

            facts.textContent = "";

            var rows = [];

            rows.push([
                "Longest run of days talking",
                summary.bestStreak.days
                    ? summary.bestStreak.days + " days"
                    : "—"
            ]);

            rows.push([
                "Longest quiet gap",
                summary.longestGap.days
                    ? summary.longestGap.days + " " + window.ML.plural(summary.longestGap.days, "day")
                    : "None yet"
            ]);

            rows.push([
                "Busiest hour of the day",
                window.ML.pad(summary.busiestHour) + ":00"
            ]);

            rows.push([
                "\u201cI miss you\u201d",
                window.ML.formatNumber(summary.phrases.miss) + " times"
            ]);

            rows.push([
                "Goodnights sent",
                window.ML.formatNumber(summary.phrases.goodnight)
            ]);

            rows.push([
                "Good mornings sent",
                window.ML.formatNumber(summary.phrases.goodmorning)
            ]);

            rows.push([
                "Pet names used",
                window.ML.formatNumber(summary.phrases.endearment) + " times"
            ]);

            if (summary.longest) {

                rows.push([
                    "Longest single message",
                    window.ML.formatNumber(summary.longest.characters)
                        + " characters, from "
                        + window.ML.personName(summary.longest.person)
                ]);

            }

            if (summary.peakDay) {

                rows.push([
                    "Most in one day",
                    window.ML.formatNumber(summary.peakDay.count)
                        + " on "
                        + window.ML.formatDate(summary.peakDay.key + "T12:00:00")
                ]);

            }

            rows.forEach(function (row) {

                var li = document.createElement("li");

                li.appendChild(element("span", null, row[0]));
                li.appendChild(element("strong", null, row[1]));

                facts.appendChild(li);

            });

        }


        /* Milestones. */

        var milestones = document.getElementById("conv-milestones");

        if (milestones) {

            milestones.textContent = "";

            summary.milestones = summary.milestones || [];

            if (!summary.milestones.length) {

                milestones.appendChild(element("p", "muted-text", "No milestones found yet."));

            }

            summary.milestones.forEach(function (milestone) {

                var card = element("article", "moment");

                if (milestone.person) {

                    card.setAttribute("data-person", milestone.person);

                }

                var top = element("div", "moment-top");

                top.appendChild(element("span", "moment-author", milestone.label));

                top.appendChild(element("span", "moment-time", window.ML.formatDate(milestone.time, "long")));

                card.appendChild(top);

                var text = milestone.text || "";

                card.appendChild(
                    element(
                        "p",
                        "moment-text",
                        text.length > 220
                            ? text.slice(0, 219) + "…"
                            : text
                    )
                );

                milestones.appendChild(card);

            });

        }

    }


    /* =====================================================
       FILTER CHIPS
    ===================================================== */

    function buildChip(label, value, count, group) {

        var chip = element("button", "chip");

        chip.type = "button";
        chip.setAttribute("data-value", value);
        chip.setAttribute("data-group", group);

        chip.appendChild(element("span", null, label));

        if (count !== null && count !== undefined) {

            chip.appendChild(element("span", "chip-count", window.ML.formatNumber(count)));

        }

        return chip;

    }


    function renderFilters(summary) {

        /* Topics. */

        var topicBar = document.getElementById("conv-topics");

        if (topicBar) {

            topicBar.textContent = "";

            topicBar.appendChild(buildChip("Everything", "all", summary.moments.length, "topic"));

            topicBar.appendChild(buildChip("Pinned", "pinned", summary.moments.filter(function (moment) {

                return moment.pinned;

            }).length, "topic"));

            topicBar.appendChild(buildChip("Starred", "starred", state.starred.length, "topic"));

            summary.topics.forEach(function (topic) {

                topicBar.appendChild(buildChip(topic.label, topic.id, topic.kept, "topic"));

            });

            topicBar.addEventListener("click", function (event) {

                var chip = event.target.closest(".chip");

                if (!chip) {
                    return;
                }

                state.topic = chip.getAttribute("data-value");
                state.shown = PAGE_SIZE;

                syncChips(topicBar, state.topic);

                renderMoments();

            });

            syncChips(topicBar, state.topic);

        }


        /* People. */

        var peopleBar = document.getElementById("conv-people");

        if (peopleBar) {

            peopleBar.textContent = "";

            peopleBar.appendChild(buildChip("Both of you", "all", null, "person"));
            peopleBar.appendChild(buildChip("Khalil", "khalil", null, "person"));
            peopleBar.appendChild(buildChip("Ilham", "ilham", null, "person"));

            peopleBar.addEventListener("click", function (event) {

                var chip = event.target.closest(".chip");

                if (!chip) {
                    return;
                }

                state.person = chip.getAttribute("data-value");
                state.shown = PAGE_SIZE;

                syncChips(peopleBar, state.person);

                renderMoments();

            });

            syncChips(peopleBar, state.person);

        }


        /* Sources. */

        var sourceBar = document.getElementById("conv-sources");

        if (sourceBar) {

            sourceBar.textContent = "";

            var found = summary.sources.filter(function (source) {

                return source.found;

            });

            if (found.length > 1) {

                sourceBar.appendChild(buildChip("All platforms", "all", null, "source"));

            }

            summary.sources.forEach(function (source) {

                var chip = buildChip(
                    source.label,
                    source.id,
                    source.found ? source.count : null,
                    "source"
                );

                chip.classList.add("source-chip");
                chip.setAttribute("data-source", source.id);

                chip.insertBefore(element("span", "dot"), chip.firstChild);

                if (!source.found) {

                    chip.disabled = true;
                    chip.title = source.file + " has not been added yet.";

                }

                sourceBar.appendChild(chip);

            });

            sourceBar.addEventListener("click", function (event) {

                var chip = event.target.closest(".chip");

                if (!chip || chip.disabled) {
                    return;
                }

                state.source = chip.getAttribute("data-value");
                state.shown = PAGE_SIZE;

                syncChips(sourceBar, state.source);

                renderMoments();

            });

            if (found.length === 1) {

                state.source = found[0].id;

            }

            syncChips(sourceBar, state.source);

        }

    }


    function syncChips(container, value) {

        Array.prototype.forEach.call(

            container.querySelectorAll(".chip"),

            function (chip) {

                var active = chip.getAttribute("data-value") === value;

                chip.classList.toggle("is-active", active);

                chip.setAttribute("aria-pressed", active ? "true" : "false");

            }

        );

    }


    /* =====================================================
       MOMENTS
    ===================================================== */

    function matchesFilters(moment) {

        if (state.topic === "pinned" && !moment.pinned) {
            return false;
        }

        if (state.topic === "starred" && !isStarred(moment.id)) {
            return false;
        }

        if (state.topic !== "all" && state.topic !== "pinned" && state.topic !== "starred") {

            var hasTopic = moment.tags.some(function (tag) {

                return tag.id === state.topic;

            });

            if (!hasTopic) {
                return false;
            }

        }

        if (state.person !== "all" && moment.person !== state.person) {
            return false;
        }

        if (state.source !== "all" && moment.source !== state.source) {
            return false;
        }

        if (state.search) {

            var haystack = (moment.text + " " + moment.author).toLowerCase();

            if (haystack.indexOf(state.search) === -1) {
                return false;
            }

        }

        return true;

    }


    function sortMoments(list) {

        var sorted = list.slice();

        if (state.sort === "oldest") {

            sorted.sort(function (a, b) {

                return a.time - b.time;

            });

        } else if (state.sort === "meaningful") {

            sorted.sort(function (a, b) {

                return b.score - a.score || b.time - a.time;

            });

        } else {

            sorted.sort(function (a, b) {

                return b.time - a.time;

            });

        }

        return sorted;

    }


    function buildMomentCard(moment) {

        var card = element("article", "moment");

        card.setAttribute("data-person", moment.person);


        /* Top line: who, when, where. */

        var top = element("div", "moment-top");

        top.appendChild(element("span", "moment-author", window.ML.personName(moment.person) !== "Someone"
            ? window.ML.personName(moment.person)
            : moment.author));

        top.appendChild(element("span", "moment-time", window.ML.formatDateTime(moment.time)));

        if (moment.pinned) {

            top.appendChild(element("span", "badge badge-gold", "Pinned"));

        }

        top.appendChild(element("span", "moment-source", moment.sourceLabel));

        card.appendChild(top);


        /* What they were replying to. */

        if (moment.reply) {

            var quote = element("p", "moment-quote");

            quote.appendChild(element("b", null, moment.reply.author + ": "));

            quote.appendChild(document.createTextNode(moment.reply.text));

            card.appendChild(quote);

        }


        card.appendChild(element("p", "moment-text", moment.text));


        /* Tags, reactions, attachments, star. */

        var foot = element("div", "moment-foot");

        moment.tags.forEach(function (tag) {

            foot.appendChild(element("span", "moment-tag", tag.label));

        });

        if (moment.reactions.length) {

            var reactions = element("span", "moment-reactions");

            moment.reactions.forEach(function (reaction) {

                reactions.appendChild(
                    element("span", "reaction-pill", reaction.emoji + " " + reaction.count)
                );

            });

            foot.appendChild(reactions);

        }

        if (moment.attachments) {

            foot.appendChild(
                element(
                    "span",
                    "moment-attachments",
                    "📎 " + moment.attachments + " " + window.ML.plural(moment.attachments, "attachment")
                )
            );

        }

        var star = element("button", "moment-star", isStarred(moment.id) ? "★" : "☆");

        star.type = "button";
        star.title = "Keep this one";
        star.setAttribute("aria-label", "Star this moment");
        star.setAttribute("aria-pressed", isStarred(moment.id) ? "true" : "false");

        if (isStarred(moment.id)) {

            star.classList.add("is-starred");

        }

        star.addEventListener("click", function () {

            var nowStarred = toggleStar(moment.id);

            star.textContent = nowStarred ? "★" : "☆";
            star.classList.toggle("is-starred", nowStarred);
            star.setAttribute("aria-pressed", nowStarred ? "true" : "false");

            window.ML.toast(nowStarred ? "Kept" : "Removed from starred");

            var starredChip = document.querySelector('.chip[data-group="topic"][data-value="starred"] .chip-count');

            if (starredChip) {

                starredChip.textContent = window.ML.formatNumber(state.starred.length);

            }

            if (state.topic === "starred" && !nowStarred) {

                renderMoments();

            }

        });

        foot.appendChild(star);

        card.appendChild(foot);

        return card;

    }


    function renderMoments() {

        var list = document.getElementById("conv-moments");
        var empty = document.getElementById("conv-moments-empty");
        var more = document.getElementById("conv-more");
        var count = document.getElementById("conv-moments-count");

        if (!list || !state.summary) {
            return;
        }

        var filtered = sortMoments(state.summary.moments.filter(matchesFilters));

        list.textContent = "";

        if (count) {

            count.textContent = filtered.length
                ? window.ML.formatNumber(filtered.length) + " " + window.ML.plural(filtered.length, "moment")
                : "Nothing here";

        }

        if (!filtered.length) {

            if (empty) {
                empty.hidden = false;
            }

            if (more) {
                more.hidden = true;
            }

            return;

        }

        if (empty) {
            empty.hidden = true;
        }

        var visible = filtered.slice(0, state.shown);

        var fragment = document.createDocumentFragment();

        visible.forEach(function (moment) {

            fragment.appendChild(buildMomentCard(moment));

        });

        list.appendChild(fragment);

        if (more) {

            more.hidden = filtered.length <= state.shown;

            more.textContent = "Show " + Math.min(
                PAGE_SIZE,
                filtered.length - state.shown
            ) + " more";

        }

    }


    /* =====================================================
       CONTROLS
    ===================================================== */

    function setupControls() {

        var search = document.getElementById("conv-search");

        if (search) {

            search.addEventListener("input", window.ML.debounce(function () {

                state.search = search.value.trim().toLowerCase();
                state.shown = PAGE_SIZE;

                renderMoments();

            }, 220));

        }

        var sort = document.getElementById("conv-sort");

        if (sort) {

            sort.addEventListener("change", function () {

                state.sort = sort.value;
                state.shown = PAGE_SIZE;

                renderMoments();

            });

        }

        var more = document.getElementById("conv-more");

        if (more) {

            more.addEventListener("click", function () {

                state.shown += PAGE_SIZE;

                renderMoments();

            });

        }

        var copy = document.getElementById("conv-copy-starred");

        if (copy) {

            copy.addEventListener("click", function () {

                if (!state.summary) {
                    return;
                }

                var starred = state.summary.moments.filter(function (moment) {

                    return isStarred(moment.id);

                });

                if (!starred.length) {

                    window.ML.toast("Nothing starred yet");

                    return;

                }

                var text = starred.map(function (moment) {

                    return window.ML.formatDateTime(moment.time)
                        + " — "
                        + window.ML.personName(moment.person)
                        + "\n"
                        + moment.text;

                }).join("\n\n");

                if (navigator.clipboard && navigator.clipboard.writeText) {

                    navigator.clipboard.writeText(text).then(function () {

                        window.ML.toast("Copied " + starred.length + " starred " + window.ML.plural(starred.length, "moment"));

                    }).catch(function () {

                        window.ML.toast("Your browser blocked the copy");

                    });

                } else {

                    window.ML.toast("Copying is not supported here");

                }

            });

        }

        var refresh = document.getElementById("conv-refresh");

        if (refresh) {

            refresh.addEventListener("click", function () {

                window.ChatData.clearCache();

                window.location.reload();

            });

        }

        var resetAfterHours = document.getElementById("conv-reset-after-hours");

        if (resetAfterHours) {

            resetAfterHours.addEventListener("click", function () {

                localStorage.removeItem("ml.after.hours.unlocked.v1");
                localStorage.removeItem("ml.after.hours.hidden.v1");

                window.ML.toast("After Hours reset - scroll down to see the curtain");

                window.location.reload();

            });

        }

    }


    /* =====================================================
       START
    ===================================================== */

    function showLoading(message) {

        var node = document.getElementById("conv-load-text");

        if (node) {
            node.textContent = message;
        }

    }


    function start() {

        var loader = document.getElementById("conv-load");
        var content = document.getElementById("conv-content");
        var failure = document.getElementById("conv-error");

        if (!window.ChatData) {
            return;
        }

        setupControls();

        window.ChatData.load({ onProgress: showLoading })

            .then(function (summary) {

                state.summary = summary;

                renderNumbers(summary);

                renderFilters(summary);

                renderMoments();

                if (loader) {
                    loader.hidden = true;
                }

                if (content) {

                    content.hidden = false;

                    window.ML.revealNow(content);

                }

            })

            .catch(function (problem) {

                if (loader) {
                    loader.hidden = true;
                }

                if (!failure) {
                    return;
                }

                failure.hidden = false;

                var text = document.getElementById("conv-error-text");

                if (!text) {
                    return;
                }

                text.textContent = problem && problem.kind === "file-protocol"
                    ? "Your browser will not read local files when a page is opened straight from the folder. Start the site with Live Server in VS Code and this page will fill itself in."
                    : "No chat export was found. Put Chat.json in the same folder as this page, then reload.";

            });

    }


    /* =====================================================
       AFTER HOURS — SPICY ARCHIVE
    ===================================================== */

    var AFTER_HOURS_KEY = "ml.after.hours.unlocked.v1";
    var AFTER_HOURS_HIDDEN_KEY = "ml.after.hours.hidden.v1";

    var afterHoursState = {
        unlocked: window.ML.store.get(AFTER_HOURS_KEY, false),
        heat: "all",
        hidden: window.ML.store.get(AFTER_HOURS_HIDDEN_KEY, [])
    };

    console.log("After Hours State:", afterHoursState);

    if (!Array.isArray(afterHoursState.hidden)) {
        afterHoursState.hidden = [];
    }

    var SPICY_EMOJI = [
        "😏", "😈", "🥵", "💦", "🍑", "🍆", "👅", "🫦", "🔥", "💋",
        "👀", "🌚", "😘", "😍", "🥰", "💕", "❤️", "💖", "🫶", "😉"
    ];

    var SPICY_PHRASES = [
        /* Explicit */
        { pattern: /\b(want|need)\s+(you|u)\s+(so\s+)?(bad|badly|now)/gi, heat: 3, context: [] },
        { pattern: /\b(come|cum)\s+(for|to)\s+me\b/gi, heat: 3, context: [] },
        { pattern: /\bmake\s+(you|u)\s+(cum|come|moan|scream)/gi, heat: 3, context: [] },
        { pattern: /\b(hard|wet)\s+(for|from)\s+(you|u|me)/gi, heat: 3, context: ["rain", "weather", "shower", "water"] },
        { pattern: /\btaste\s+(you|u)/gi, heat: 3, context: ["food", "cook"] },
        { pattern: /\binside\s+(you|u|me)/gi, heat: 3, context: ["house", "room", "car"] },
        { pattern: /\b(suck|lick|bite)\s+(you|u|me|it)/gi, heat: 3, context: ["food", "ice", "candy"] },
        { pattern: /\b(naked|strip|undress)/gi, heat: 3, context: [] },
        { pattern: /\b(moan|groan|whimper)(ing|ed|s)?\b/gi, heat: 3, context: ["pain", "tired", "groan"] },

        /* Spicy */
        { pattern: /\btease\s+(you|u|me)/gi, heat: 2, context: [] },
        { pattern: /\b(you|u)\s+turn\s+me\s+on\b/gi, heat: 2, context: [] },
        { pattern: /\b(want|need|crave)\s+(your|ur)\s+(body|lips|touch|hands)/gi, heat: 2, context: [] },
        { pattern: /\bthinking\s+about\s+(you|u)\s+(naked|in\s+bed)/gi, heat: 2, context: [] },
        { pattern: /\b(dirty|naughty)\s+(thoughts|mind|talk)/gi, heat: 2, context: [] },
        { pattern: /\b(bed|bedroom)\s+with\s+(you|u)/gi, heat: 2, context: ["sleep", "tired", "nap"] },
        { pattern: /\b(touch|feel|grab|hold)\s+(you|u|me)/gi, heat: 2, context: ["hand", "hug"] },
        { pattern: /\byou'?re\s+(so\s+)?(hot|sexy|gorgeous)/gi, heat: 2, context: ["weather", "temperature"] },

        /* Flirty */
        { pattern: /\bmiss\s+(your|ur)\s+(lips|kiss|body|touch|voice)/gi, heat: 1, context: [] },
        { pattern: /\b(kiss|kissing|kisses)\s+(you|u|me)/gi, heat: 1, context: [] },
        { pattern: /\bcan'?t\s+stop\s+thinking\s+about\s+(you|u)/gi, heat: 1, context: [] },
        { pattern: /\b(you|u)\s+drive\s+me\s+(crazy|wild|insane)/gi, heat: 1, context: [] },
        { pattern: /\blate\s+night\s+(thoughts|vibes)/gi, heat: 1, context: [] },
        { pattern: /\b(cuddle|cuddling|snuggle)/gi, heat: 1, context: [] },
        { pattern: /\b(flirt|flirting)\s+(with)?\s+(you|u|me)/gi, heat: 1, context: [] },
        { pattern: /\byou'?re\s+mine\b/gi, heat: 1, context: [] }
    ];

    function hasSpicyEmoji(text) {
        if (!text) return false;
        return SPICY_EMOJI.some(function(emoji) {
            return text.indexOf(emoji) !== -1;
        });
    }

    function getSpicyScore(message) {
        var text = message.text || "";
        var lower = text.toLowerCase();
        var maxHeat = 0;

        if (hasSpicyEmoji(text)) {
            maxHeat = Math.max(maxHeat, 1);
        }

        SPICY_PHRASES.forEach(function(phrase) {
            var matches = lower.match(phrase.pattern);
            if (!matches) return;

            if (phrase.context.length === 0) {
                maxHeat = Math.max(maxHeat, phrase.heat);
                return;
            }

            var hasExcludingContext = phrase.context.some(function(ctx) {
                return lower.indexOf(ctx) !== -1;
            });

            if (!hasExcludingContext) {
                maxHeat = Math.max(maxHeat, phrase.heat);
            }
        });

        return maxHeat;
    }

    function groupSpicyNights(messages) {
        var nights = [];
        var current = null;
        var NIGHT_GAP = 3 * 60 * 60 * 1000;

        messages.forEach(function(message) {
            var heat = getSpicyScore(message);
            if (heat === 0) return;

            var date = new Date(message.time);
            var hour = date.getHours();

            if (!current || message.time - current.lastTime > NIGHT_GAP) {
                if (current && current.messages.length >= 3) {
                    nights.push(current);
                }

                current = {
                    date: window.ML.dayKey(date),
                    startTime: message.time,
                    lastTime: message.time,
                    messages: [],
                    maxHeat: 0,
                    afterMidnight: hour >= 23 || hour <= 4
                };
            }

            current.messages.push({
                time: message.time,
                person: message.person,
                author: message.author,
                text: message.text,
                heat: heat
            });

            current.maxHeat = Math.max(current.maxHeat, heat);
            current.lastTime = message.time;
        });

        if (current && current.messages.length >= 3) {
            nights.push(current);
        }

        nights.sort(function(a, b) {
            return b.startTime - a.startTime;
        });

        return nights;
    }

    function getHeatLabel(level) {
        if (level === 3) return "explicit";
        if (level === 2) return "spicy";
        return "flirty";
    }

    function isNightHidden(nightId) {
        return afterHoursState.hidden.indexOf(nightId) !== -1;
    }

    function toggleNightHidden(nightId) {
        var index = afterHoursState.hidden.indexOf(nightId);
        if (index === -1) {
            afterHoursState.hidden.push(nightId);
        } else {
            afterHoursState.hidden.splice(index, 1);
        }
        window.ML.store.set(AFTER_HOURS_HIDDEN_KEY, afterHoursState.hidden);
    }

    function buildNightCard(night, index) {
        var nightId = "night-" + night.date + "-" + index;
        var card = element("article", "night-card");
        card.setAttribute("data-heat", getHeatLabel(night.maxHeat));
        card.setAttribute("data-id", nightId);

        var header = element("div", "night-header");
        
        var dateEl = element("span", "night-date", window.ML.formatDate(night.startTime));
        header.appendChild(dateEl);

        var meta = element("div", "night-meta");
        meta.appendChild(document.createTextNode(night.messages.length + " messages"));
        if (night.afterMidnight) {
            meta.appendChild(document.createTextNode(" · After midnight"));
        }
        header.appendChild(meta);

        card.appendChild(header);

        var badge = element("span", "night-badge", getHeatLabel(night.maxHeat));
        badge.setAttribute("data-heat", getHeatLabel(night.maxHeat));
        header.appendChild(badge);

        var preview = element("div", "night-preview");
        var previewCount = Math.min(3, night.messages.length);
        
        for (var i = 0; i < previewCount; i++) {
            var msg = night.messages[i];
            var msgEl = element("p", "night-message");
            msgEl.setAttribute("data-person", msg.person);
            
            var strong = element("strong", null, window.ML.personName(msg.person) + ": ");
            msgEl.appendChild(strong);
            
            var textNode = document.createTextNode(
                msg.text.length > 120 ? msg.text.slice(0, 117) + "…" : msg.text
            );
            msgEl.appendChild(textNode);
            
            preview.appendChild(msgEl);
        }
        
        card.appendChild(preview);

        if (night.messages.length > previewCount) {
            var full = element("div", "night-full");
            full.style.display = "none";

            for (var j = previewCount; j < night.messages.length; j++) {
                var fullMsg = night.messages[j];
                var fullMsgEl = element("p", "night-message");
                fullMsgEl.setAttribute("data-person", fullMsg.person);
                
                var fullStrong = element("strong", null, window.ML.personName(fullMsg.person) + ": ");
                fullMsgEl.appendChild(fullStrong);
                
                var fullTextNode = document.createTextNode(fullMsg.text);
                fullMsgEl.appendChild(fullTextNode);
                
                full.appendChild(fullMsgEl);
            }

            card.appendChild(full);
        }

        var footer = element("div", "night-footer");

        if (night.messages.length > previewCount) {
            var expand = element("button", "night-expand", "Show all " + night.messages.length + " messages");
            expand.type = "button";
            
            expand.addEventListener("click", function() {
                var fullSection = card.querySelector(".night-full");
                if (!fullSection) return;

                var isExpanded = fullSection.style.display !== "none";
                fullSection.style.display = isExpanded ? "none" : "block";
                expand.textContent = isExpanded 
                    ? "Show all " + night.messages.length + " messages"
                    : "Show less";
                expand.classList.toggle("is-expanded", !isExpanded);
            });

            footer.appendChild(expand);
        }

        var hide = element("button", "night-hide", "Hide this night");
        hide.type = "button";
        hide.addEventListener("click", function() {
            toggleNightHidden(nightId);
            card.style.display = "none";
            window.ML.toast("Night hidden");
        });
        footer.appendChild(hide);

        card.appendChild(footer);

        return card;
    }

    function renderAfterHours() {
        if (!afterHoursState.unlocked) return;

        var content = document.getElementById("after-hours-content");
        var loader = document.getElementById("after-hours-load");
        var nights = document.getElementById("after-hours-nights");
        var empty = document.getElementById("after-hours-empty");
        var note = document.getElementById("after-hours-note");
        var filters = document.getElementById("after-hours-filters");

        if (!content || !state.summary) return;

        content.hidden = false;
        if (loader) loader.hidden = false;

        window.ChatData.loadRaw().then(function(rawMessages) {
            var allMessages = rawMessages.map(function(msg) {
                return {
                    time: msg.time,
                    person: msg.person,
                    author: msg.author,
                    text: msg.text
                };
            });

            var spicyNights = groupSpicyNights(allMessages);

            var byHeat = {
                flirty: spicyNights.filter(function(n) { return n.maxHeat === 1; }).length,
                spicy: spicyNights.filter(function(n) { return n.maxHeat === 2; }).length,
                explicit: spicyNights.filter(function(n) { return n.maxHeat === 3; }).length
            };

            if (filters) {
                filters.textContent = "";
                
                var allChip = buildChip("All", "all", spicyNights.length, "heat");
                filters.appendChild(allChip);
                
                var flirtyChip = buildChip("Flirty", "flirty", byHeat.flirty, "heat");
                filters.appendChild(flirtyChip);
                
                var spicyChip = buildChip("Spicy", "spicy", byHeat.spicy, "heat");
                filters.appendChild(spicyChip);
                
                var explicitChip = buildChip("Explicit", "explicit", byHeat.explicit, "heat");
                filters.appendChild(explicitChip);

                filters.addEventListener("click", function(event) {
                    var chip = event.target.closest(".chip");
                    if (!chip) return;

                    afterHoursState.heat = chip.getAttribute("data-value");
                    syncChips(filters, afterHoursState.heat);
                    renderAfterHoursNights(spicyNights);
                });

                syncChips(filters, afterHoursState.heat);
            }

            if (note) {
                note.textContent = spicyNights.length 
                    ? spicyNights.length + " " + window.ML.plural(spicyNights.length, "night") + " found"
                    : "Nothing spicy found";
            }

            renderAfterHoursNights(spicyNights);

            if (loader) loader.hidden = true;
            window.ML.revealNow(content);
        });

        function renderAfterHoursNights(allNights) {
            if (!nights) return;

            nights.textContent = "";

            var filtered = allNights.filter(function(night) {
                if (afterHoursState.heat === "all") return true;
                return getHeatLabel(night.maxHeat) === afterHoursState.heat;
            });

            filtered = filtered.filter(function(night) {
                var nightId = "night-" + night.date + "-" + allNights.indexOf(night);
                return !isNightHidden(nightId);
            });

            if (!filtered.length) {
                if (empty) empty.hidden = false;
                return;
            }

            if (empty) empty.hidden = true;

            var fragment = document.createDocumentFragment();
            filtered.forEach(function(night, index) {
                fragment.appendChild(buildNightCard(night, allNights.indexOf(night)));
            });

            nights.appendChild(fragment);
            window.ML.revealNow(nights);
        }
    }

    function setupAfterHours() {
        var curtain = document.getElementById("after-hours-curtain");
        var unlockBtn = document.getElementById("curtain-unlock");
        var lockBtn = document.getElementById("after-hours-lock");
        var unhideBtn = document.getElementById("after-hours-unhide");
        var content = document.getElementById("after-hours-content");

        console.log("Setting up After Hours. Curtain element:", curtain, "Unlocked:", afterHoursState.unlocked);

        if (!unlockBtn) {
            console.error("After Hours unlock button not found!");
            return;
        }

        if (afterHoursState.unlocked) {
            if (curtain) curtain.style.display = "none";
            renderAfterHours();
        }

        unlockBtn.addEventListener("click", function() {
            afterHoursState.unlocked = true;
            window.ML.store.set(AFTER_HOURS_KEY, true);

            if (curtain) {
                curtain.style.opacity = "0";
                curtain.style.transition = "opacity 0.5s ease";
                setTimeout(function() {
                    curtain.style.display = "none";
                }, 500);
            }

            renderAfterHours();
        });

        if (lockBtn) {
            lockBtn.addEventListener("click", function() {
                afterHoursState.unlocked = false;
                window.ML.store.set(AFTER_HOURS_KEY, false);

                if (content) content.hidden = true;
                if (curtain) {
                    curtain.style.display = "";
                    curtain.style.opacity = "1";
                }

                window.ML.toast("Curtain locked");
            });
        }

        if (unhideBtn) {
            unhideBtn.addEventListener("click", function() {
                var hiddenCount = afterHoursState.hidden.length;
                if (hiddenCount === 0) {
                    window.ML.toast("No hidden nights");
                    return;
                }

                afterHoursState.hidden = [];
                window.ML.store.set(AFTER_HOURS_HIDDEN_KEY, []);

                window.ML.toast("Showing " + hiddenCount + " hidden " + window.ML.plural(hiddenCount, "night"));

                if (afterHoursState.unlocked) {
                    renderAfterHours();
                }
            });
        }
    }


    window.ML.ready(start);
    window.ML.ready(setupAfterHours);

}());
