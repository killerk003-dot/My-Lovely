/*
=========================================================
MY LOVELY
HOME PAGE JAVASCRIPT

Home page only. The header, menu, reveals and page
transitions now live in shared.js, which loads first.

Load order on index.html:

    shared.js  →  chat-data.js  →  quran.js  →  home.js
=========================================================
*/

(function () {

    "use strict";


    if (!window.ML) {

        window.console.error(
            "home.js needs shared.js to load first. index.html must load, in order: shared.js, chat-data.js, quran.js, home.js."
        );

        return;

    }


    /* =====================================================
       SETTINGS
    ===================================================== */

    var SETTINGS = {

        /*
            Change this once you know the exact
            meeting time. Midnight is used for now.
        */

        meetupDate: "2026-12-27T00:00:00",

        /*
            Shown once the countdown reaches zero.
        */

        meetupMessage: "Today is the day, My Lovely."

    };


    /* =====================================================
       COUNTDOWN
    ===================================================== */

    var countdownTimer = null;


    function updateCountdown() {

        var days = document.getElementById("days");
        var hours = document.getElementById("hours");
        var minutes = document.getElementById("minutes");
        var seconds = document.getElementById("seconds");
        var message = document.getElementById("countdown-message");

        /* Not every page has a countdown. */

        if (!days || !hours || !minutes || !seconds) {

            if (countdownTimer) {

                window.clearInterval(countdownTimer);

            }

            return;

        }

        var target = new Date(SETTINGS.meetupDate).getTime();
        var difference = target - Date.now();

        /* The day itself. */

        if (difference <= 0) {

            days.textContent = "000";
            hours.textContent = "00";
            minutes.textContent = "00";
            seconds.textContent = "00";

            if (message) {

                message.textContent = SETTINGS.meetupMessage;

            }

            if (countdownTimer) {

                window.clearInterval(countdownTimer);

            }

            return;

        }

        var totalSeconds = Math.floor(difference / 1000);

        var dayCount = Math.floor(totalSeconds / 86400);
        var hourCount = Math.floor((totalSeconds % 86400) / 3600);
        var minuteCount = Math.floor((totalSeconds % 3600) / 60);
        var secondCount = totalSeconds % 60;

        days.textContent = String(dayCount).padStart(3, "0");
        hours.textContent = window.ML.pad(hourCount);
        minutes.textContent = window.ML.pad(minuteCount);
        seconds.textContent = window.ML.pad(secondCount);

        if (message) {

            message.textContent = dayCount <= 1
                ? "Almost there, My Lovely."
                : "One day closer, My Lovely.";

        }

    }


    /* =====================================================
       ARCHIVE STATISTICS

       Every id below already existed in home.js. The
       markup in index.html now carries the matching ids,
       so these finally land somewhere.
    ===================================================== */

    function showChatSummary(summary) {

        var totals = summary.totals;
        var span = summary.span;

        window.ML.setText("stat-messages", window.ML.formatNumber(totals.messages));

        window.ML.setText("stat-love", window.ML.formatNumber(summary.phrases.love));

        var topEmoji = summary.emojis.length
            ? summary.emojis[0]
            : null;

        window.ML.setText("stat-emoji", topEmoji ? topEmoji.emoji : "—");

        window.ML.setText(
            "stat-emoji-count",
            topEmoji
                ? window.ML.formatNumber(topEmoji.count) + " times so far"
                : "Waiting for the first emoji"
        );

        window.ML.setText("stat-active-days", window.ML.formatNumber(span.activeDays));

        window.ML.setText("stat-conversation-days", window.ML.formatNumber(span.activeDays));

        window.ML.setText("stat-archive-days", window.ML.formatNumber(span.days));

        window.ML.setText("stat-media", window.ML.formatNumber(totals.attachments));

        window.ML.setText("stat-reactions", window.ML.formatNumber(totals.reactions));

        window.ML.setText("stat-calls", window.ML.formatNumber(totals.calls));

        window.ML.setText("conversation-days-big", window.ML.formatNumber(span.days));

        if (summary.peakDay) {

            window.ML.setText(
                "stat-peak-day",
                "Busiest day: "
                    + window.ML.formatDate(summary.peakDay.key + "T12:00:00")
                    + " · "
                    + window.ML.formatNumber(summary.peakDay.count)
                    + " messages"
            );

        }

        window.ML.setText(
            "stat-date-range",
            window.ML.formatDate(span.first) + " → " + window.ML.formatDate(span.last)
        );

        var sourceNote = summary.sources

            .filter(function (source) {

                return source.found;

            })

            .map(function (source) {

                return source.label;

            })

            .join(" · ");

        window.ML.setText(
            "stat-sources",
            sourceNote
                ? "Reading from " + sourceNote
                : ""
        );

    }


    function showChatProblem(problem) {

        var note = document.getElementById("stat-date-range");

        if (!note) {
            return;
        }

        note.textContent = problem && problem.kind === "file-protocol"
            ? "Open the site through Live Server to read your archive."
            : "No chat export found next to index.html yet.";

    }


    /* =====================================================
       ON THIS DAY

       Deliberately does not print message text on the home
       page. It tells you something is there and sends you
       to Conversations.
    ===================================================== */

    function showOnThisDay(summary) {

        var title = document.getElementById("on-this-day-title");
        var text = document.getElementById("on-this-day-text");

        if (!title || !text) {
            return;
        }

        var hits = window.ChatData.onThisDay(summary);

        if (!hits) {

            title.textContent = "Nothing from this date yet.";

            text.textContent = "As the archive grows, this will find the days you were both here a year ago.";

            return;

        }

        var newest = hits[hits.length - 1];

        var total = hits.reduce(function (sum, hit) {

            return sum + hit.count;

        }, 0);

        title.textContent = "On this day in "
            + newest.key.slice(0, 4)
            + ", you were talking.";

        text.textContent = window.ML.formatNumber(total)
            + " "
            + window.ML.plural(total, "message")
            + " from this date "
            + (total === 1 ? "is" : "are")
            + " in your archive. Open Conversations to see what was worth keeping.";

    }


    /* =====================================================
       QURAN PREVIEW

       Reads the same store the tracker page writes to, so
       ticking a day there updates this card here.
    ===================================================== */

    function setQuranPreview(progress, pages, juz, streak) {

        var progressValue = document.getElementById("home-quran-percent");
        var progressBar = document.getElementById("home-quran-bar");
        var pagesElement = document.getElementById("home-quran-pages");
        var juzElement = document.getElementById("home-quran-juz");
        var streakElement = document.getElementById("home-quran-streak");

        if (progress !== null && progressValue && progressBar) {

            var safeProgress = Math.max(0, Math.min(100, Number(progress)));

            progressValue.textContent = safeProgress + "%";

            progressBar.style.width = safeProgress + "%";

        }

        if (pages !== null && pagesElement) {

            pagesElement.textContent = window.ML.formatNumber(pages);

        }

        if (juz !== null && juzElement) {

            juzElement.textContent = window.ML.formatNumber(juz);

        }

        if (streak !== null && streakElement) {

            streakElement.textContent = window.ML.formatNumber(streak);

        }

    }


    function refreshQuranPreview() {

        if (!window.QuranStore) {
            return;
        }

        var stats = window.QuranStore.summary();

        if (!stats.hasData) {

            setQuranPreview(0, 0, 0, 0);

            window.ML.setText(
                "home-quran-note",
                "Nothing logged yet. Open the tracker and tick today."
            );

            return;

        }

        setQuranPreview(stats.progress, stats.pages, stats.juz, stats.streak);

        window.ML.setText(
            "home-quran-note",
            stats.togetherDays > 0
                ? window.ML.formatNumber(stats.togetherDays)
                    + " "
                    + window.ML.plural(stats.togetherDays, "day")
                    + " you both read on the same day."
                : "Read on the same day to start a shared streak."
        );

    }


    /* =====================================================
       SURPRISE ME

       The original button had no handler at all. It now
       pulls a real moment out of the archive, and falls
       back to written prompts before the archive loads.
    ===================================================== */

    var surprisePool = [];

    var fallbackPool = [
        "The first message, 27 September 2025. Neither of you knew what it would turn into.",
        "Every countdown on this site exists because of one date you both circled.",
        "Somewhere in this archive is the first time one of you said goodnight and meant it differently.",
        "You have talked through more days than most people talk in a year."
    ];

    var lastIndex = -1;


    function pickSurprise() {

        var result = document.getElementById("surprise-result");
        var resultText = document.getElementById("surprise-result-text");
        var resultLabel = document.getElementById("surprise-result-label");

        if (!result || !resultText) {
            return;
        }

        var usingArchive = surprisePool.length > 0;

        var pool = usingArchive
            ? surprisePool
            : fallbackPool;

        var index = Math.floor(Math.random() * pool.length);

        if (pool.length > 1 && index === lastIndex) {

            index = (index + 1) % pool.length;

        }

        lastIndex = index;

        var pick = pool[index];

        if (usingArchive) {

            resultText.textContent = pick.text;

            if (resultLabel) {

                resultLabel.textContent = window.ML.personName(pick.person)
                    + " · "
                    + window.ML.formatDateTime(pick.time);

            }

        } else {

            resultText.textContent = pick;

            if (resultLabel) {

                resultLabel.textContent = "From our story";

            }

        }

        result.hidden = false;

    }


    function setupSurprise() {

        var button = document.getElementById("surprise-button");

        if (!button) {
            return;
        }

        button.addEventListener("click", pickSurprise);

    }


    /* =====================================================
       START
    ===================================================== */

    function start() {

        updateCountdown();

        countdownTimer = window.setInterval(updateCountdown, 1000);

        setupSurprise();

        refreshQuranPreview();

        if (window.QuranStore) {

            window.QuranStore.subscribe(refreshQuranPreview);

        }

        if (!window.ChatData) {
            return;
        }

        window.ChatData.load()

            .then(function (summary) {

                showChatSummary(summary);

                showOnThisDay(summary);

                surprisePool = summary.moments.filter(function (moment) {

                    return moment.text && moment.text.length > 40;

                });

            })

            .catch(function (problem) {

                showChatProblem(problem);

            });

    }


    window.ML.ready(start);

}());
