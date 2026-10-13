/*
=========================================================
MY LOVELY
CHAT DATA ENGINE

Loads every chat export listed in CHAT_SOURCES, turns the
different platform formats into one shape, and works out
the numbers and the moments worth keeping.

It never renders a full message log. It reads the whole
archive once, keeps the small interesting parts, and
throws the rest away.

To add WhatsApp or Instagram later: drop the file next to
this one and add a line to CHAT_SOURCES. Nothing else in
the site needs to change.
=========================================================
*/

(function () {

    "use strict";


    if (!window.ML) {

        window.console.error(
            "chat-data.js needs shared.js to load first."
        );

        return;

    }


    /* =====================================================
       SOURCES

       "optional: true" means a missing file is normal and
       is skipped quietly instead of being reported as an
       error. Turn a source off with "enabled: false".
    ===================================================== */

    var CHAT_SOURCES = [

        {
            id: "discord",
            label: "Discord",
            files: ["Chat.json"],
            enabled: true,
            optional: false
        },

        {
            id: "instagram",
            label: "Instagram",
            files: [
                "Chat2.0.json",
                "chat2.0.json",
                "Chat2.0.Json",
                "chat2.0.Json",
                "Chat2_0.json",
                "chat2_0.json"
            ],
            enabled: true,
            optional: false
        },

        {
            id: "whatsapp",
            label: "WhatsApp",
            files: [
                "Chat3.0.json",
                "chat3.0.json",
                "Chat3_0.json",
                "chat3_0.json"
            ],
            enabled: true,
            optional: false
        }

    ];


    /* =====================================================
       TOPICS

       These decide which messages are worth surfacing.
       Edit freely — add a topic, add words to a topic, or
       delete one. Words are matched case-insensitively on
       whole words, so "dua" will not match "duatoi".

       "limit" caps how many messages a single topic can
       contribute, so one chatty subject cannot flood the
       page.
    ===================================================== */

    var TOPICS = [

        {
            id: "deen",
            label: "Deen",
            limit: 45,
            words: [
                "allah", "alhamdulillah", "inshallah", "insha'allah", "mashallah",
                "subhanallah", "dua", "duas", "salah", "namaz", "fajr", "maghrib",
                "isha", "asr", "dhuhr", "quran", "qur'an", "surah", "ayah", "juz",
                "hadith", "sunnah", "halal", "haram", "ramadan", "eid", "istikhara",
                "barakah", "taqwa", "jannah", "masjid", "tahajjud", "sadaqah"
            ]
        },

        {
            id: "future",
            label: "Our future",
            limit: 45,
            words: [
                "nikah", "marriage", "married", "marry", "wedding", "engaged",
                "engagement", "our future", "one day", "forever", "walimah",
                "mahr", "proposal", "wali", "future house", "our home", "kids",
                "children", "growing old"
            ]
        },

        {
            id: "meeting",
            label: "Meeting up",
            limit: 40,
            words: [
                "meet up", "meetup", "meeting you", "meet you", "see you in person",
                "in person", "flight", "flights", "airport", "visa", "booking",
                "booked", "december", "countdown", "finally meet", "come visit",
                "travel", "trip"
            ]
        },

        {
            id: "calls",
            label: "Calls",
            limit: 30,
            words: [
                "call me", "calling", "call you", "voice note", "voice call",
                "vc", "facetime", "on call", "pick up", "late night call"
            ]
        },

        {
            id: "love",
            label: "Love notes",
            limit: 60,
            words: [
                "i love you", "love you", "i adore you", "my lovely", "habibti",
                "habibi", "my heart", "you're mine", "in love", "love u",
                "you mean the world", "my person", "my favourite person",
                "my favorite person"
            ]
        },

        {
            id: "missing",
            label: "Missing you",
            limit: 35,
            words: [
                "miss you", "missed you", "missing you", "miss u", "wish you were here",
                "can't wait", "cant wait", "come back", "lonely without"
            ]
        },

        {
            id: "sorry",
            label: "Making up",
            limit: 25,
            words: [
                "i'm sorry", "im sorry", "i am sorry", "forgive me", "my fault",
                "didn't mean", "didnt mean", "apologise", "apologize", "let's fix",
                "lets fix", "we're okay", "were okay"
            ]
        },

        {
            id: "firsts",
            label: "Firsts",
            limit: 25,
            words: [
                "first time", "first call", "first message", "first photo",
                "never told anyone", "no one knows", "i've never", "ive never"
            ]
        },

        {
            id: "plans",
            label: "Plans & promises",
            limit: 35,
            words: [
                "i promise", "promise me", "let's plan", "lets plan", "we should",
                "our plan", "goal", "deal", "pinky"
            ]
        },

        {
            id: "study",
            label: "Work & study",
            limit: 25,
            words: [
                "exam", "exams", "revision", "revising", "uni", "university",
                "coursework", "deadline", "assignment", "graduation", "degree",
                "interview", "shift", "work tomorrow"
            ]
        },

        {
            id: "family",
            label: "Family",
            limit: 25,
            words: [
                "my mum", "my mom", "my dad", "my parents", "your mum", "your mom",
                "your dad", "your parents", "my brother", "my sister", "family",
                "told my", "meet my"
            ]
        },

        {
            id: "food",
            label: "Food",
            limit: 20,
            words: [
                "cook", "cooking", "recipe", "dinner", "iftar", "suhoor", "breakfast",
                "restaurant", "takeaway", "hungry", "chocolate", "coffee", "tea"
            ]
        }

    ];


    /* =====================================================
       SCORING AND LIMITS
    ===================================================== */

    var RULES = {

        /* A topic match this short is not worth a card of its own. */
        minimumLength: 14,

        /*
            A reaction is a strong signal, so the bar is lower —
            but not zero. Photo-only messages have no text to put
            on a card, so they never become moments.
        */
        minimumReacted: 6,

        /* Nothing longer than this is shown in full on a card. */
        previewLength: 900,

        /* Total moments kept in memory and in the cache. */
        maximumMoments: 600,

        /* Score weights. */
        pinnedScore: 120,
        reactionScore: 14,
        topicScore: 8,
        lengthDivisor: 40,
        lengthCap: 14,

        /* Emojis shown on the stats panel. */
        emojiTop: 10,

        /* Cache version — bump this to force a rebuild. */
        cacheKey: "ml.chat.summary.v3"

    };


    /* =====================================================
       FORMAT DETECTION AND NORMALISATION
    ===================================================== */

    /* =====================================================
       INSTAGRAM TEXT REPAIR

       Meta writes its JSON exports with UTF-8 bytes stored
       one-byte-per-character, so "🫶" arrives as "ð\u009f«¶"
       and every emoji and curly quote looks like rubbish.

       This reads those characters back as the bytes they
       really are and decodes them properly. Text that is
       already correct is left untouched.
    ===================================================== */

    var mojibakePattern = /[\u00c2-\u00f4][\u0080-\u00bf]/;

    var textDecoder = (typeof TextDecoder === "function")
        ? new TextDecoder("utf-8")
        : null;


    function repairText(value) {

        if (!value || !textDecoder || !mojibakePattern.test(value)) {
            return value;
        }

        var bytes = new Uint8Array(value.length);

        var i;

        for (i = 0; i < value.length; i += 1) {

            var code = value.charCodeAt(i);

            /* Anything above one byte was never mojibake. */

            if (code > 255) {
                return value;
            }

            bytes[i] = code;

        }

        try {

            var decoded = textDecoder.decode(bytes);

            return decoded || value;

        } catch (error) {

            return value;

        }

    }


    function detectFormat(data) {

        if (!data) {
            return "unknown";
        }

        if (Array.isArray(data)) {
            return "generic";
        }

        if (Array.isArray(data.messages)) {

            var first = data.messages[0] || {};

            if (first.author && typeof first.author === "object") {
                return "discord";
            }

            if (typeof first.sender_name === "string" || typeof first.timestamp_ms === "number") {
                return "instagram";
            }

            return "generic";

        }

        if (Array.isArray(data.chats)) {
            return "generic";
        }

        return "unknown";

    }


    function rowsFor(data) {

        if (Array.isArray(data)) {
            return data;
        }

        if (data && Array.isArray(data.messages)) {
            return data.messages;
        }

        if (data && Array.isArray(data.chats)) {
            return data.chats;
        }

        return [];

    }


    function readAuthor(row) {

        if (row.author && typeof row.author === "object") {
            return row.author.nickname || row.author.name || "Unknown";
        }

        return repairText(row.sender_name)
            || row.sender
            || row.author
            || row.from
            || row.name
            || row.user
            || "Unknown";

    }


    function readText(row) {

        var value = row.content;

        if (typeof value !== "string") {
            value = row.text;
        }

        if (typeof value !== "string") {
            value = row.message;
        }

        if (typeof value !== "string") {
            value = row.body;
        }

        return typeof value === "string"
            ? repairText(value)
            : "";

    }


    function readTime(row) {

        if (typeof row.timestamp_ms === "number") {
            return row.timestamp_ms;
        }

        var raw = row.timestamp
            || row.time
            || row.date
            || row.datetime
            || row.created_at;

        if (typeof raw === "number") {

            /* Seconds or milliseconds. */
            return raw < 100000000000
                ? raw * 1000
                : raw;

        }

        if (typeof raw === "string") {

            var parsed = Date.parse(raw);

            return Number.isNaN(parsed)
                ? null
                : parsed;

        }

        return null;

    }


    function readAttachments(row) {

        if (Array.isArray(row.attachments)) {
            return row.attachments.length;
        }

        if (Array.isArray(row.photos)) {
            return row.photos.length;
        }

        if (Array.isArray(row.media)) {
            return row.media.length;
        }

        var meta = 0;

        if (Array.isArray(row.audio_files)) {
            meta += row.audio_files.length;
        }

        if (Array.isArray(row.videos)) {
            meta += row.videos.length;
        }

        if (row.share) {
            meta += 1;
        }

        if (meta) {
            return meta;
        }

        if (row.attachment) {
            return 1;
        }

        return 0;

    }


    function readReactions(row) {

        var output = [];

        if (Array.isArray(row.reactions)) {

            row.reactions.forEach(function (reaction) {

                var glyph = "";

                if (reaction && reaction.emoji) {

                    glyph = reaction.emoji.name
                        || reaction.emoji.code
                        || reaction.emoji
                        || "";

                } else if (reaction && reaction.reaction) {

                    glyph = repairText(reaction.reaction);

                } else if (typeof reaction === "string") {

                    glyph = reaction;

                }

                if (typeof glyph !== "string") {
                    glyph = "";
                }

                output.push({
                    emoji: glyph || "♡",
                    count: Number(reaction && reaction.count) || 1
                });

            });

        }

        return output;

    }


    function isSystemRow(row, text) {

        var type = row.type || "";

        if (type === "ChannelPinnedMessage"
                || type === "GuildMemberJoin"
                || type === "RecipientAdd"
                || type === "RecipientRemove"
                || type === "ThreadCreated"
                || type === "ChannelNameChange") {

            return true;

        }

        if (!text && !readAttachments(row) && type !== "Call") {
            return true;
        }

        return false;

    }


    function normalise(data, source) {

        var format = source.format && source.format !== "auto"
            ? source.format
            : detectFormat(data);

        var rows = rowsFor(data);

        var byId = {};
        var messages = [];
        var calls = 0;

        rows.forEach(function (row) {

            if (!row || typeof row !== "object") {
                return;
            }

            if (row.id) {
                byId[row.id] = row;
            }

        });

        rows.forEach(function (row) {

            if (!row || typeof row !== "object") {
                return;
            }

            var text = readText(row);
            var time = readTime(row);

            if (time === null) {
                return;
            }

            /*
                Discord marks calls with a type. Instagram
                instead attaches a call_duration to a message
                that reads "Audio call ended".
            */

            if ((row.type || "") === "Call" || row.call_duration !== undefined) {

                calls += 1;

                return;

            }

            if (isSystemRow(row, text)) {
                return;
            }

            var authorName = readAuthor(row);

            var message = {
                id: source.id + ":" + (row.id || time + "-" + messages.length),
                source: source.id,
                sourceLabel: source.label,
                time: time,
                author: authorName,
                person: window.ML.identify(authorName),
                text: text,
                attachments: readAttachments(row),
                reactions: readReactions(row),
                pinned: Boolean(row.isPinned || row.is_pinned || row.pinned),
                reply: null
            };

            /* Reply context, where the platform gives us one. */

            var referenceId = null;

            if (row.reference && row.reference.messageId) {
                referenceId = row.reference.messageId;
            } else if (row.replyTo) {
                referenceId = row.replyTo;
            } else if (row.quoted_message_id) {
                referenceId = row.quoted_message_id;
            }

            if (referenceId && byId[referenceId]) {

                var parent = byId[referenceId];
                var parentText = readText(parent);

                if (parentText) {

                    message.reply = {
                        author: readAuthor(parent),
                        text: parentText.length > 160
                            ? parentText.slice(0, 157) + "…"
                            : parentText
                    };

                }

            }

            messages.push(message);

        });

        return {
            format: format,
            messages: messages,
            calls: calls
        };

    }


    /* =====================================================
       EMOJI COUNTING

       Matches whole emoji, including skin tones and
       zero-width-joiner families, instead of counting the
       individual code points inside them.
    ===================================================== */

    var emojiPattern = (function () {

        try {

            return new RegExp(
                "\\p{Extended_Pictographic}(\\u200D\\p{Extended_Pictographic}|[\\uFE0F\\u{1F3FB}-\\u{1F3FF}])*",
                "gu"
            );

        } catch (error) {

            /* Older browsers without Unicode property escapes. */

            return /[\u2600-\u27BF\uD83C-\uDBFF\uDC00-\uDFFF]+/g;

        }

    }());


    function countEmoji(text, tally) {

        if (!text) {
            return;
        }

        var matches = text.match(emojiPattern);

        if (!matches) {
            return;
        }

        matches.forEach(function (glyph) {

            /* A bare variation selector is not an emoji. */

            var cleaned = glyph.replace(/\uFE0F/g, "");

            if (!cleaned) {
                return;
            }

            tally[cleaned] = (tally[cleaned] || 0) + 1;

        });

    }


    /* =====================================================
       PHRASE COUNTING
    ===================================================== */

    function escapeForRegex(value) {

        return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    }


    function buildTopicMatchers() {

        return TOPICS.map(function (topic) {

            var parts = topic.words.map(function (word) {

                var safe = escapeForRegex(word.toLowerCase());

                /*
                    Word boundaries only work around letters, so
                    phrases with apostrophes are matched loosely
                    at the start.
                */

                return "\\b" + safe.replace(/\s+/g, "\\s+");

            });

            return {
                id: topic.id,
                label: topic.label,
                limit: topic.limit || 40,
                pattern: new RegExp("(" + parts.join("|") + ")", "i"),
                count: 0,
                kept: 0
            };

        });

    }


    var PHRASES = {
        miss: /\bmiss(ed|ing)?\s+(you|u)\b/gi,
        goodnight: /\b(goodnight|good\s+night|gn|sleep\s+well)\b/gi,
        goodmorning: /\b(good\s*morning|gm|sabah\s+al\s*khayr)\b/gi,
        laugh: /\b(lol|lmao|lmfao|haha+|hehe+|ahaha+)\b/gi,
        endearment: /\b(habibi|habibti|my\s+lovely|okhti|akhi|my\s+love|sweetheart|baby)\b/gi,
        gratitude: /\b(thank\s+you|thanks|jazak\s*allah|jzk)\b/gi
    };


    /* =====================================================
       "I LOVE YOU" — WHO IT IS ACTUALLY ABOUT

       Matching the words "I love you" is not the same as
       finding a declaration between the two of you. Two
       patterns show up in real archives and both look like a
       match on the words alone:

       1. Reported or quoted speech — "she turned round and
          said 'I love you'", "I've never heard him say
          'i love you' to anyone". These are about someone
          else's relationship, recounted in conversation.

       2. A third-party addressee named right after the
          phrase — "I love you Sarah", "I love you mum" —
          talking about a different person than the one
          being messaged.

       A genuine declaration is judged by ruling both of
       these out, rather than by matching the phrase alone.
    ===================================================== */

    var LOVE_PATTERN = /\bi\s+love\s+(you|u)\b/gi;

    var REPORTED_SPEECH_MARKERS = [
        "say", "says", "saying", "said", "told", "tell", "telling",
        "hear", "heard", "quote", "quoted", "lyrics", "caption",
        "used to say", "would say", "kept saying", "keeps saying"
    ];

    /* Words that can follow "I love you" without it being a name. */
    var LOVE_CONTINUATION_ALLOWLIST = [
        "too", "so", "more", "forever", "always", "endlessly",
        "eternally", "unconditionally", "babe", "baby", "honey",
        "jaan", "habibi", "habibti", "okhti", "akhi", "sweetheart",
        "loads", "lots", "lot", "a", "x", "xx", "xxx", "much",
        "so much", "more than", "with", "for", "wayyyyyyyyy",
        "moreee", "moreeee", "3000"
    ];


    function isReportedSpeech(text, matchStart) {

        var windowStart = Math.max(0, matchStart - 45);

        var before = text.slice(windowStart, matchStart).toLowerCase();

        var hasMarker = REPORTED_SPEECH_MARKERS.some(function (marker) {

            return before.indexOf(marker) !== -1;

        });

        if (hasMarker) {
            return true;
        }

        /*
            A quotation mark sitting right before the match —
            straight or curly — means the words are being
            quoted rather than said in the moment.
        */

        var trimmed = text.slice(0, matchStart).replace(/\s+$/, "");

        var lastChar = trimmed.charAt(trimmed.length - 1);

        return lastChar === "\""
            || lastChar === "'"
            || lastChar === "\u201c"
            || lastChar === "\u2018";

    }


    function isThirdPartyAddressee(text, matchEnd) {

        var rest = text.slice(matchEnd);

        var tokenMatch = rest.match(/^\s*([^\s.!?,;:\n]+)/);

        if (!tokenMatch) {
            return false;
        }

        var bare = tokenMatch[1].replace(/[^a-zA-Z]/g, "").toLowerCase();

        if (!bare) {
            return false;
        }

        if (LOVE_CONTINUATION_ALLOWLIST.indexOf(bare) !== -1) {
            return false;
        }

        /* Either of the two people themselves is always fine. */

        var peopleKeys = window.ML.PEOPLE
            ? Object.keys(window.ML.PEOPLE)
            : [];

        var isEitherPerson = peopleKeys.some(function (key) {

            var person = window.ML.PEOPLE[key];

            if (person.name.toLowerCase() === bare) {
                return true;
            }

            return person.aliases.some(function (alias) {

                return alias.replace(/[^a-z]/gi, "").toLowerCase() === bare;

            });

        });

        if (isEitherPerson) {
            return false;
        }

        /*
            A capitalised word directly after "you", with no
            sentence-ending punctuation in between, reads as a
            name — "I love you Sarah" — rather than the start
            of a new sentence.
        */

        return /^[A-Z]/.test(tokenMatch[1]);

    }


    /*
        Returns every genuine declaration in the text, as
        character offsets, having ruled out reported speech
        and messages naming someone else.
    */

    function findLoveDeclarations(text) {

        if (!text) {
            return [];
        }

        var pattern = new RegExp(LOVE_PATTERN.source, "gi");

        var found = [];

        var match = pattern.exec(text);

        while (match !== null) {

            var start = match.index;
            var end = start + match[0].length;

            if (!isReportedSpeech(text, start) && !isThirdPartyAddressee(text, end)) {

                found.push(start);

            }

            match = pattern.exec(text);

        }

        return found;

    }


    function countPhrase(text, pattern) {

        pattern.lastIndex = 0;

        var matches = text.match(pattern);

        return matches
            ? matches.length
            : 0;

    }


    /* =====================================================
       ANALYSIS
    ===================================================== */

    function blankPersonStats() {

        return {
            messages: 0,
            words: 0,
            characters: 0,
            attachments: 0,
            love: 0,
            emoji: 0
        };

    }


    function analyse(messages, sources, callTotal) {

        var topicMatchers = buildTopicMatchers();

        var emojiTally = {};
        var dayTally = {};
        var hourTally = new Array(24).fill(0);

        var perPerson = {
            khalil: blankPersonStats(),
            ilham: blankPersonStats(),
            other: blankPersonStats()
        };

        var phraseTotals = {
            love: 0,
            miss: 0,
            goodnight: 0,
            goodmorning: 0,
            laugh: 0,
            endearment: 0,
            gratitude: 0
        };

        var totals = {
            messages: messages.length,
            attachments: 0,
            reactions: 0,
            words: 0,
            characters: 0,
            calls: callTotal || 0
        };

        var candidates = [];

        var longest = null;
        var latestNight = null;

        messages.forEach(function (message) {

            var text = message.text || "";
            var lower = text.toLowerCase();
            var date = new Date(message.time);
            var key = window.ML.dayKey(date);
            var hour = date.getHours();

            var words = text
                ? text.trim().split(/\s+/).length
                : 0;

            var stats = perPerson[message.person] || perPerson.other;

            stats.messages += 1;
            stats.words += words;
            stats.characters += text.length;
            stats.attachments += message.attachments;

            totals.words += words;
            totals.characters += text.length;
            totals.attachments += message.attachments;

            dayTally[key] = (dayTally[key] || 0) + 1;
            hourTally[hour] += 1;

            var emojiBefore = Object.keys(emojiTally).length;

            countEmoji(text, emojiTally);

            if (Object.keys(emojiTally).length !== emojiBefore) {
                stats.emoji += 1;
            }

            var reactionTotal = 0;

            message.reactions.forEach(function (reaction) {

                reactionTotal += reaction.count;

            });

            totals.reactions += reactionTotal;

            /* Phrase counts. */

            var loveHits = findLoveDeclarations(text).length;

            phraseTotals.love += loveHits;
            stats.love += loveHits;

            phraseTotals.miss += countPhrase(text, PHRASES.miss);
            phraseTotals.goodnight += countPhrase(text, PHRASES.goodnight);
            phraseTotals.goodmorning += countPhrase(text, PHRASES.goodmorning);
            phraseTotals.laugh += countPhrase(text, PHRASES.laugh);
            phraseTotals.endearment += countPhrase(text, PHRASES.endearment);
            phraseTotals.gratitude += countPhrase(text, PHRASES.gratitude);

            /* Longest message. */

            if (!longest || text.length > longest.text.length) {
                longest = message;
            }

            /* Latest message of the night, between 1am and 5am. */

            if (hour >= 1 && hour <= 4 && text.length > 30) {

                if (!latestNight || hour > new Date(latestNight.time).getHours()) {
                    latestNight = message;
                }

            }

            /* Which topics does this message belong to? */

            var tags = [];

            topicMatchers.forEach(function (topic) {

                if (topic.pattern.test(lower)) {

                    topic.count += 1;
                    tags.push(topic);

                }

            });

            /* Is it worth keeping? */

            var score = 0;

            if (message.pinned) {
                score += RULES.pinnedScore;
            }

            score += reactionTotal * RULES.reactionScore;

            score += tags.length * RULES.topicScore;

            score += Math.min(
                RULES.lengthCap,
                Math.floor(text.length / RULES.lengthDivisor)
            );

            var trimmedLength = text.trim().length;

            var worthKeeping = trimmedLength > 0
                && (
                    message.pinned
                        || (reactionTotal > 0 && trimmedLength >= RULES.minimumReacted)
                        || (tags.length > 0 && trimmedLength >= RULES.minimumLength)
                );

            if (worthKeeping) {

                candidates.push({
                    message: message,
                    tags: tags,
                    score: score,
                    reactionTotal: reactionTotal
                });

            }

        });


        /*
            Keep the best candidates, but stop any single topic
            from taking over the page. Pinned and reacted
            messages always survive.
        */

        candidates.sort(function (a, b) {

            return b.score - a.score || b.message.time - a.message.time;

        });

        var kept = [];

        candidates.forEach(function (candidate) {

            if (kept.length >= RULES.maximumMoments) {
                return;
            }

            var alwaysKeep = candidate.message.pinned || candidate.reactionTotal > 0;

            if (!alwaysKeep) {

                var blocked = candidate.tags.every(function (topic) {

                    return topic.kept >= topic.limit;

                });

                if (candidate.tags.length && blocked) {
                    return;
                }

            }

            candidate.tags.forEach(function (topic) {

                topic.kept += 1;

            });

            var text = candidate.message.text;

            kept.push({
                id: candidate.message.id,
                source: candidate.message.source,
                sourceLabel: candidate.message.sourceLabel,
                time: candidate.message.time,
                author: candidate.message.author,
                person: candidate.message.person,
                text: text.length > RULES.previewLength
                    ? text.slice(0, RULES.previewLength - 1) + "…"
                    : text,
                attachments: candidate.message.attachments,
                reactions: candidate.message.reactions,
                pinned: candidate.message.pinned,
                reply: candidate.message.reply,
                tags: candidate.tags.map(function (topic) {

                    return { id: topic.id, label: topic.label };

                }),
                score: candidate.score
            });

        });

        /* Newest first is the most useful default order. */

        kept.sort(function (a, b) {

            return b.time - a.time;

        });


        /* Days, streaks and gaps. */

        var dayKeys = Object.keys(dayTally).sort();

        var peakDay = null;

        dayKeys.forEach(function (key) {

            if (!peakDay || dayTally[key] > peakDay.count) {

                peakDay = { key: key, count: dayTally[key] };

            }

        });

        var streak = { days: 0, start: null, end: null };
        var bestStreak = { days: 0, start: null, end: null };
        var gap = { days: 0, start: null, end: null };

        var previous = null;

        dayKeys.forEach(function (key) {

            var current = new Date(key + "T12:00:00");

            if (previous) {

                var distance = Math.round((current - previous) / 86400000);

                if (distance === 1) {

                    streak.days += 1;
                    streak.end = key;

                } else {

                    if (streak.days > bestStreak.days) {
                        bestStreak = { days: streak.days, start: streak.start, end: streak.end };
                    }

                    streak = { days: 1, start: key, end: key };

                    if (distance - 1 > gap.days) {

                        gap = {
                            days: distance - 1,
                            start: window.ML.dayKey(previous),
                            end: key
                        };

                    }

                }

            } else {

                streak = { days: 1, start: key, end: key };

            }

            previous = current;

        });

        if (streak.days > bestStreak.days) {
            bestStreak = { days: streak.days, start: streak.start, end: streak.end };
        }


        /* Emoji league table. */

        var emojiList = Object.keys(emojiTally).map(function (glyph) {

            return { emoji: glyph, count: emojiTally[glyph] };

        });

        emojiList.sort(function (a, b) {

            return b.count - a.count;

        });

        emojiList = emojiList.slice(0, RULES.emojiTop);


        /* Busiest hour. */

        var busiestHour = 0;

        hourTally.forEach(function (count, hour) {

            if (count > hourTally[busiestHour]) {
                busiestHour = hour;
            }

        });


        /* Span. */

        var firstMessage = messages.length
            ? messages[0]
            : null;

        var lastMessage = messages.length
            ? messages[messages.length - 1]
            : null;

        var spanDays = firstMessage && lastMessage
            ? Math.floor((lastMessage.time - firstMessage.time) / 86400000) + 1
            : 0;


        /* Milestones. */

        var milestones = [];

        if (firstMessage) {

            milestones.push({
                label: "First message",
                time: firstMessage.time,
                person: firstMessage.person,
                text: firstMessage.text
            });

        }

        var firstLove = null;

        for (var i = 0; i < messages.length; i += 1) {

            if (findLoveDeclarations(messages[i].text || "").length > 0) {

                firstLove = messages[i];

                break;

            }

        }

        if (firstLove) {

            milestones.push({
                label: "First \u201cI love you\u201d",
                time: firstLove.time,
                person: firstLove.person,
                text: firstLove.text
            });

        }

        if (peakDay) {

            milestones.push({
                label: "Busiest day",
                time: new Date(peakDay.key + "T12:00:00").getTime(),
                person: null,
                text: peakDay.count.toLocaleString("en-GB") + " messages in one day"
            });

        }

        if (lastMessage) {

            milestones.push({
                label: "Most recent message",
                time: lastMessage.time,
                person: lastMessage.person,
                text: lastMessage.text
            });

        }

        milestones.sort(function (a, b) {

            return a.time - b.time;

        });


        return {

            generatedAt: Date.now(),

            sources: sources,

            totals: totals,

            perPerson: perPerson,

            span: {
                first: firstMessage ? firstMessage.time : null,
                last: lastMessage ? lastMessage.time : null,
                days: spanDays,
                activeDays: dayKeys.length
            },

            peakDay: peakDay,

            bestStreak: bestStreak,

            longestGap: gap,

            busiestHour: busiestHour,

            emojis: emojiList,

            phrases: phraseTotals,

            longest: longest
                ? {
                    time: longest.time,
                    person: longest.person,
                    author: longest.author,
                    characters: longest.text.length,
                    text: longest.text.length > RULES.previewLength
                        ? longest.text.slice(0, RULES.previewLength - 1) + "…"
                        : longest.text
                }
                : null,

            latestNight: latestNight
                ? {
                    time: latestNight.time,
                    person: latestNight.person,
                    text: latestNight.text.length > 240
                        ? latestNight.text.slice(0, 239) + "…"
                        : latestNight.text
                }
                : null,

            topics: topicMatchers.map(function (topic) {

                return {
                    id: topic.id,
                    label: topic.label,
                    count: topic.count,
                    kept: topic.kept
                };

            }).filter(function (topic) {

                return topic.kept > 0;

            }),

            milestones: milestones,

            moments: kept,

            dayIndex: dayTally

        };

    }


    /* =====================================================
       LOADING
    ===================================================== */

    /*
        A source can list several possible filenames, because
        it is easy to save an export as chat2.0.json when the
        site is looking for Chat2.0.json. Each is tried in
        turn and the first one that loads wins.
    */

    function fetchSource(source) {

        var candidates = Array.isArray(source.files)
            ? source.files.slice()
            : [source.file];

        var blockedByProtocol = false;

        function attempt(index) {

            if (index >= candidates.length) {

                return Promise.resolve({
                    source: source,
                    found: false,
                    reason: blockedByProtocol
                        ? "file-protocol"
                        : "missing"
                });

            }

            var name = candidates[index];

            return window.fetch(name, { cache: "no-cache" })

                .then(function (response) {

                    if (!response.ok) {
                        return attempt(index + 1);
                    }

                    return response.json()

                        .then(function (data) {

                            return {
                                source: source,
                                found: true,
                                file: name,
                                data: data
                            };

                        })

                        .catch(function () {

                            /* Found but unreadable — try the next name. */

                            return attempt(index + 1);

                        });

                })

                .catch(function () {

                    if (window.location.protocol === "file:") {
                        blockedByProtocol = true;
                    }

                    return attempt(index + 1);

                });

        }

        return attempt(0);

    }


    function fingerprint(results) {

        return results.map(function (result) {

            if (!result.found) {
                return result.source.id + ":none";
            }

            var count = result.data && result.data.messageCount
                ? result.data.messageCount
                : rowsFor(result.data).length;

            var stamp = (result.data && result.data.exportedAt) || "";

            return result.source.id + ":" + count + ":" + stamp;

        }).join("|");

    }


    function readCache(key) {

        var cached = window.ML.store.get(RULES.cacheKey, null);

        if (cached && cached.key === key && cached.summary) {
            return cached.summary;
        }

        return null;

    }


    function writeCache(key, summary) {

        window.ML.store.set(RULES.cacheKey, {
            key: key,
            summary: summary
        });

    }


    function clearCache() {

        window.ML.store.remove(RULES.cacheKey);

    }


    var inFlight = null;


    function load(options) {

        var settings = options || {};

        var onProgress = typeof settings.onProgress === "function"
            ? settings.onProgress
            : function () { return undefined; };

        if (inFlight && !settings.force) {
            return inFlight;
        }

        var active = CHAT_SOURCES.filter(function (source) {

            return source.enabled !== false;

        });

        onProgress("Looking for your chat exports…");

        inFlight = Promise.all(active.map(fetchSource))

            .then(function (results) {

                var loaded = results.filter(function (result) {

                    return result.found;

                });

                if (!loaded.length) {

                    var blockedByProtocol = results.some(function (result) {

                        return result.reason === "file-protocol";

                    });

                    return Promise.reject({
                        kind: blockedByProtocol
                            ? "file-protocol"
                            : "no-sources",
                        results: results
                    });

                }

                var key = fingerprint(results);

                if (!settings.force) {

                    var cached = readCache(key);

                    if (cached) {

                        onProgress("Loaded from your last visit.");

                        return cached;

                    }

                }

                onProgress("Reading " + loaded.length + " " + window.ML.plural(loaded.length, "archive") + "…");

                return window.ML.yieldToBrowser().then(function () {

                    var everything = [];
                    var callTotal = 0;

                    var sourceReport = results.map(function (result) {

                        if (!result.found) {

                            return {
                                id: result.source.id,
                                label: result.source.label,
                                file: (result.source.files || [result.source.file]).join(" or "),
                                found: false,
                                optional: Boolean(result.source.optional),
                                reason: result.reason,
                                count: 0
                            };

                        }

                        var normalised = normalise(result.data, result.source);

                        callTotal += normalised.calls;

                        normalised.messages.forEach(function (message) {

                            everything.push(message);

                        });

                        return {
                            id: result.source.id,
                            label: result.source.label,
                            file: result.file,
                            found: true,
                            optional: Boolean(result.source.optional),
                            format: normalised.format,
                            count: normalised.messages.length,
                            calls: normalised.calls
                        };

                    });

                    everything.sort(function (a, b) {

                        return a.time - b.time;

                    });

                    onProgress("Finding the moments worth keeping…");

                    return window.ML.yieldToBrowser().then(function () {

                        var summary = analyse(everything, sourceReport, callTotal);

                        writeCache(key, summary);

                        return summary;

                    });

                });

            });

        return inFlight;

    }


    /* =====================================================
       RAW ARCHIVE

       The summary deliberately throws the full message log
       away, so it can be cached in a few hundred kilobytes.
       After Hours needs to read every message, so it asks
       for the raw archive separately. Kept in memory only,
       never written to the cache.
    ===================================================== */

    var rawInFlight = null;


    function loadRaw() {

        if (rawInFlight) {
            return rawInFlight;
        }

        var active = CHAT_SOURCES.filter(function (source) {

            return source.enabled !== false;

        });

        rawInFlight = Promise.all(active.map(fetchSource)).then(function (results) {

            var everything = [];

            results.forEach(function (result) {

                if (!result.found) {
                    return;
                }

                normalise(result.data, result.source).messages.forEach(function (message) {

                    everything.push(message);

                });

            });

            everything.sort(function (a, b) {

                return a.time - b.time;

            });

            return everything;

        });

        return rawInFlight;

    }


    /* =====================================================
       ON THIS DAY

       Works off the day index in the summary, so it costs
       nothing and needs no message text.
    ===================================================== */

    function onThisDay(summary, when) {

        if (!summary || !summary.dayIndex) {
            return null;
        }

        var date = when || new Date();

        var month = window.ML.pad(date.getMonth() + 1);
        var day = window.ML.pad(date.getDate());

        var suffix = "-" + month + "-" + day;

        var hits = [];

        Object.keys(summary.dayIndex).forEach(function (key) {

            if (key.length === 10 && key.slice(4) === suffix && key.slice(0, 4) !== String(date.getFullYear())) {

                hits.push({ key: key, count: summary.dayIndex[key] });

            }

        });

        hits.sort(function (a, b) {

            return a.key < b.key ? -1 : 1;

        });

        return hits.length
            ? hits
            : null;

    }


    /* =====================================================
       PUBLIC API
    ===================================================== */

    window.ChatData = {
        SOURCES: CHAT_SOURCES,
        TOPICS: TOPICS,
        RULES: RULES,
        load: load,
        loadRaw: loadRaw,
        clearCache: clearCache,
        onThisDay: onThisDay
    };

}());
