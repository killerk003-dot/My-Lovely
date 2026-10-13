/*
=========================================================
MY LOVELY
SHARED SITE JAVASCRIPT

Loaded first on every page. Contains only the things that
every page needs: the header, the mobile menu, the
dropdown, scroll reveals, page transitions, storage
helpers and formatting helpers.

Page-specific behaviour lives in home.js,
conversations.js and quran.js.
=========================================================
*/

(function () {

    "use strict";


    /* =====================================================
       WHO IS WHO

       Usernames differ between platforms — Discord says
       "KillerK003" and "Yona", WhatsApp and Instagram will
       say something else again. Every alias is listed here
       once, so the rest of the site can just ask
       ML.identify(name) and get back "khalil" or "ilham".
    ===================================================== */

    var PEOPLE = {

        khalil: {
            key: "khalil",
            name: "Khalil",
            initial: "K",
            photo: "khalilpfp.jpg",
            aliases: [
                "killerk003",
                "killerk",
                "khalil",
                "khalil yousfi",
                "khalilyousfi"
            ]
        },

        ilham: {
            key: "ilham",
            name: "Ilham",
            initial: "I",
            photo: "ilhampfp.jpg",
            aliases: [
                "yona",
                "ilham",
                "my lovely",
                "ilhxm.ita",
                "ilhxmita",
                "ilhxm"
            ]
        }

    };


    function identify(name) {

        if (!name) {
            return "other";
        }

        var needle = String(name).trim().toLowerCase();

        var stripped = needle.replace(/[._\-\s]/g, "");

        var keys = Object.keys(PEOPLE);

        for (var i = 0; i < keys.length; i += 1) {

            var person = PEOPLE[keys[i]];

            if (person.aliases.indexOf(needle) !== -1) {
                return person.key;
            }

            var loose = person.aliases.some(function (alias) {

                return alias.replace(/[._\-\s]/g, "") === stripped;

            });

            if (loose) {
                return person.key;
            }

        }

        return "other";

    }


    function personName(key) {

        return PEOPLE[key] ? PEOPLE[key].name : "Someone";

    }


    /* =====================================================
       STORAGE

       localStorage throws in private-browsing mode and when
       the quota is full, so every call is wrapped. If it
       fails the site still works, it just stops remembering.
    ===================================================== */

    var storageWorks = (function () {

        try {

            var probe = "__ml_probe__";

            window.localStorage.setItem(probe, "1");
            window.localStorage.removeItem(probe);

            return true;

        } catch (error) {

            return false;

        }

    }());


    var store = {

        available: storageWorks,

        get: function (key, fallback) {

            if (!storageWorks) {
                return fallback;
            }

            try {

                var raw = window.localStorage.getItem(key);

                if (raw === null) {
                    return fallback;
                }

                return JSON.parse(raw);

            } catch (error) {

                return fallback;

            }

        },

        set: function (key, value) {

            if (!storageWorks) {
                return false;
            }

            try {

                window.localStorage.setItem(key, JSON.stringify(value));

                return true;

            } catch (error) {

                return false;

            }

        },

        remove: function (key) {

            if (!storageWorks) {
                return false;
            }

            try {

                window.localStorage.removeItem(key);

                return true;

            } catch (error) {

                return false;

            }

        },

        raw: function (key) {

            if (!storageWorks) {
                return null;
            }

            try {

                return window.localStorage.getItem(key);

            } catch (error) {

                return null;

            }

        }

    };


    /* =====================================================
       FORMATTING
    ===================================================== */

    function pad(value) {

        return String(value).length < 2
            ? "0" + value
            : String(value);

    }


    function toDate(value) {

        var date = value instanceof Date
            ? value
            : new Date(value);

        return Number.isNaN(date.getTime())
            ? null
            : date;

    }


    function formatDate(value, style) {

        var date = toDate(value);

        if (!date) {
            return "—";
        }

        var options = style === "long"
            ? { day: "numeric", month: "long", year: "numeric" }
            : { day: "numeric", month: "short", year: "numeric" };

        return date.toLocaleDateString("en-GB", options);

    }


    function formatTime(value) {

        var date = toDate(value);

        if (!date) {
            return "";
        }

        return date.toLocaleTimeString("en-GB", {
            hour: "2-digit",
            minute: "2-digit"
        });

    }


    function formatDateTime(value) {

        var date = toDate(value);

        if (!date) {
            return "—";
        }

        return formatDate(date) + " · " + formatTime(date);

    }


    function formatNumber(value) {

        var number = Number(value);

        return Number.isFinite(number)
            ? number.toLocaleString("en-GB")
            : "—";

    }


    function plural(count, singular, pluralForm) {

        return Number(count) === 1
            ? singular
            : (pluralForm || singular + "s");

    }


    function dayKey(value) {

        var date = toDate(value);

        if (!date) {
            return "";
        }

        return date.getFullYear()
            + "-" + pad(date.getMonth() + 1)
            + "-" + pad(date.getDate());

    }


    function todayKey() {

        return dayKey(new Date());

    }


    function debounce(fn, wait) {

        var timer = null;

        return function () {

            var context = this;
            var args = arguments;

            window.clearTimeout(timer);

            timer = window.setTimeout(function () {

                fn.apply(context, args);

            }, wait || 300);

        };

    }


    /*
        Lets a long job hand control back to the browser so
        the page can paint a loading state instead of
        freezing. Used by the chat analyser.
    */

    function yieldToBrowser() {

        return new Promise(function (resolve) {

            window.setTimeout(resolve, 0);

        });

    }


    function prefersReducedMotion() {

        return window.matchMedia
            && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    }


    /* =====================================================
       TOAST
    ===================================================== */

    var toastNode = null;
    var toastTimer = null;


    function toast(message) {

        if (!toastNode) {

            toastNode = document.createElement("div");
            toastNode.className = "toast";
            toastNode.setAttribute("role", "status");
            toastNode.setAttribute("aria-live", "polite");

            document.body.appendChild(toastNode);

        }

        toastNode.textContent = message;

        window.requestAnimationFrame(function () {

            toastNode.classList.add("is-visible");

        });

        window.clearTimeout(toastTimer);

        toastTimer = window.setTimeout(function () {

            toastNode.classList.remove("is-visible");

        }, 2600);

    }


    /* =====================================================
       HELPER — write text into an element by id

       Kept as a global function as well as on ML, because
       home.js already calls setText() in fifteen places.
    ===================================================== */

    function setText(id, value) {

        var element = document.getElementById(id);

        if (element) {

            element.textContent = value;

        }

    }


    function setWidth(id, percent) {

        var element = document.getElementById(id);

        if (element) {

            element.style.width = Math.max(0, Math.min(100, Number(percent) || 0)) + "%";

        }

    }


    /* =====================================================
       SCROLL REVEALS
    ===================================================== */

    function setupRevealAnimations() {

        var elements = document.querySelectorAll(".reveal");

        if (!("IntersectionObserver" in window) || prefersReducedMotion()) {

            Array.prototype.forEach.call(elements, function (element) {

                element.classList.add("is-visible");

            });

            return;

        }

        var observer = new IntersectionObserver(function (entries) {

            entries.forEach(function (entry) {

                if (entry.isIntersecting) {

                    entry.target.classList.add("is-visible");

                    observer.unobserve(entry.target);

                }

            });

        }, { threshold: 0.12 });

        Array.prototype.forEach.call(elements, function (element) {

            observer.observe(element);

        });

    }


    /*
        Content that is added after page load (moments,
        Quran log rows) still needs revealing.
    */

    function revealNow(root) {

        var scope = root || document;

        Array.prototype.forEach.call(

            scope.querySelectorAll(".reveal:not(.is-visible)"),

            function (element) {

                element.classList.add("is-visible");

            }

        );

    }


    /* =====================================================
       MOBILE MENU
    ===================================================== */

    function setupMobileMenu() {

        var toggle = document.querySelector(".menu-toggle");
        var navigation = document.querySelector(".site-nav");

        if (!toggle || !navigation) {
            return;
        }

        toggle.setAttribute("aria-expanded", "false");

        toggle.addEventListener("click", function () {

            var isOpen = navigation.classList.toggle("open");

            toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");

        });

        Array.prototype.forEach.call(

            navigation.querySelectorAll("a"),

            function (link) {

                link.addEventListener("click", function () {

                    navigation.classList.remove("open");

                    toggle.setAttribute("aria-expanded", "false");

                });

            }

        );

    }


    /* =====================================================
       DASHBOARD DROPDOWN

       Hover and keyboard focus are handled in CSS. This adds
       click support, which is what touch screens send, and
       closes the menu on Escape or an outside click.
    ===================================================== */

    function setupDropdown() {

        var dropdowns = document.querySelectorAll(".dropdown");

        if (!dropdowns.length) {
            return;
        }

        Array.prototype.forEach.call(dropdowns, function (dropdown) {

            var button = dropdown.querySelector(".dropbtn");

            if (!button) {
                return;
            }

            button.setAttribute("aria-expanded", "false");

            button.addEventListener("click", function (event) {

                event.preventDefault();
                event.stopPropagation();

                var isOpen = dropdown.classList.toggle("open");

                button.setAttribute("aria-expanded", isOpen ? "true" : "false");

            });

        });

        document.addEventListener("click", function (event) {

            Array.prototype.forEach.call(dropdowns, function (dropdown) {

                if (!dropdown.contains(event.target)) {

                    dropdown.classList.remove("open");

                    var button = dropdown.querySelector(".dropbtn");

                    if (button) {
                        button.setAttribute("aria-expanded", "false");
                    }

                }

            });

        });

        document.addEventListener("keydown", function (event) {

            if (event.key !== "Escape") {
                return;
            }

            Array.prototype.forEach.call(dropdowns, function (dropdown) {

                dropdown.classList.remove("open");

                var button = dropdown.querySelector(".dropbtn");

                if (button) {
                    button.setAttribute("aria-expanded", "false");
                }

            });

        });

    }


    /* =====================================================
       ACTIVE NAV LINK

       Set automatically from the URL so that no page has to
       remember to hardcode class="active".
    ===================================================== */

    function currentPageName() {

        var path = window.location.pathname;

        var file = path.substring(path.lastIndexOf("/") + 1);

        if (!file) {
            return "index.html";
        }

        return file.toLowerCase();

    }


    function markActiveNavLink() {

        var current = currentPageName();

        var links = document.querySelectorAll(".site-nav a[href]");

        var matchedInsideDropdown = null;

        Array.prototype.forEach.call(links, function (link) {

            var href = (link.getAttribute("href") || "").toLowerCase();

            if (!href || href.charAt(0) === "#") {
                return;
            }

            if (href === current) {

                link.classList.add("active");
                link.setAttribute("aria-current", "page");

                if (link.closest(".dropdown-content")) {

                    matchedInsideDropdown = link;

                }

            }

        });

        /*
            If the open page lives inside the Dashboard menu,
            light up the Dashboard button too.
        */

        if (matchedInsideDropdown) {

            var button = document.querySelector(".dropdown .dropbtn");

            if (button) {
                button.classList.add("active");
            }

        }

    }


    /* =====================================================
       PAGE TRANSITIONS
    ===================================================== */

    function setupPageTransitions() {

        if (prefersReducedMotion()) {
            return;
        }

        var current = currentPageName();

        var links = document.querySelectorAll("a[href]");

        Array.prototype.forEach.call(links, function (link) {

            var href = link.getAttribute("href");

            if (!href) {
                return;
            }

            /* Anchors, mail, phone and downloads are left alone. */

            if (href.charAt(0) === "#"
                    || href.indexOf("mailto:") === 0
                    || href.indexOf("tel:") === 0
                    || link.hasAttribute("download")
                    || link.getAttribute("target") === "_blank") {

                return;

            }

            /* External links are left alone. */

            if (link.hostname && link.hostname !== window.location.hostname) {
                return;
            }

            /* A link to the page you are already on is left alone. */

            if (href.toLowerCase() === current) {
                return;
            }

            link.addEventListener("click", function (event) {

                if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0) {
                    return;
                }

                event.preventDefault();

                document.body.classList.add("page-leaving");

                window.setTimeout(function () {

                    window.location.href = href;

                }, 350);

            });

        });

    }


    /* =====================================================
       YEAR STAMP
    ===================================================== */

    function stampYear() {

        setText("year", new Date().getFullYear());

    }


    /* =====================================================
       START
    ===================================================== */

    var started = false;


    function startShared() {

        if (started) {
            return;
        }

        started = true;

        setupRevealAnimations();
        setupMobileMenu();
        setupDropdown();
        markActiveNavLink();
        setupPageTransitions();
        stampYear();

    }


    function ready(fn) {

        if (document.readyState === "loading") {

            document.addEventListener("DOMContentLoaded", fn);

        } else {

            fn();

        }

    }


    ready(startShared);


    /* =====================================================
       PUBLIC API
    ===================================================== */

    window.ML = {
        PEOPLE: PEOPLE,
        identify: identify,
        personName: personName,
        store: store,
        setText: setText,
        setWidth: setWidth,
        toast: toast,
        pad: pad,
        toDate: toDate,
        formatDate: formatDate,
        formatTime: formatTime,
        formatDateTime: formatDateTime,
        formatNumber: formatNumber,
        plural: plural,
        dayKey: dayKey,
        todayKey: todayKey,
        debounce: debounce,
        yieldToBrowser: yieldToBrowser,
        prefersReducedMotion: prefersReducedMotion,
        revealNow: revealNow,
        ready: ready
    };


    /* Backwards compatibility with the original home.js. */

    window.setText = setText;

}());
