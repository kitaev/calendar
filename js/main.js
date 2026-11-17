var isLeapYear = function(yr) {
    return (yr%400) ? ( (yr%100) ? ( (yr%4) ? false : true ) : false) : true;
}

var adjustDate = function(date) {
    var adjusted = new Date(date.getTime());
    var isLeap = isLeapYear(adjusted.getFullYear());
    var inc = adjusted.getDay() > 3 ? 1 : -1;
    var target = adjusted.getHours() < 3 ? 0 : 6;
    while(adjusted.getDay() != target) {
        do {
            adjusted.setFullYear(adjusted.getFullYear() + inc);
        } while (isLeapYear(adjusted.getFullYear()) != isLeap);
    }
    return adjusted;
}

var updateTimeAndDate = function(now, adjusted) {
    var date = adjusted.customFormat("#DDDD#");
    if (adjusted.getDay() == 6 || adjusted.getDay() == 0) {
        date = "<span class=\"text-danger\">" + date + "</span>";
    }
    document.getElementById("date").innerHTML = date + adjusted.customFormat(", #MMMM#&nbsp;#DD# " + now.getFullYear());
    var hour =adjusted.customFormat("#hhh#");
    if (hour.length == 1) {
        hour = "0" + hour;
    }
    document.getElementById("time").innerHTML = hour + adjusted.customFormat(":#mm#:#ss#");
}

var generateWeekRow = function(monday, currentMonth, currentDate) {
    var generated = "";
    for(var i = 0; i < 7; i++) {
        var dateClass = monday.getMonth() == currentMonth ? "" : "text-muted";
        if (i >= 5) {
          dateClass += " bg-danger";
        }
        var date = monday.getDate();
        if (currentMonth == monday.getMonth() && currentDate == monday.getDate()) {
            date = "<strong>" + date + "</strong>";
        }
        generated += "<td class=\"" + dateClass + "\">" + date + "</td>";
        monday.setDate(monday.getDate() + 1);
    }
    return generated;
}

var generateMonth = function(adjusted) {
    var date = new Date(adjusted.getTime());
    date.setDate(1);
    while(date.getDay() != 1) {
        date.setDate(date.getDate() - 1);
    }
    var generated = "";
    if (date.getDate() == 1) {
        date.setDate(date.getDate() - 7);
        generated += "<tr>" + generateWeekRow(date, adjusted.getMonth(), adjusted.getDate()) + "</tr>"
    }
    var lastMonth = adjusted.getFullYear() * 12 + adjusted.getMonth();
    while(date.getFullYear() * 12 + date.getMonth() <= lastMonth) {
        generated += "<tr>" + generateWeekRow(date, adjusted.getMonth(), adjusted.getDate()) + "</tr>"
    }
    return generated;
}

var updateCalendar = function(now, adjusted) {
    document.getElementById("month-header").innerHTML = now.customFormat("#MMMM# #YYYY#");
    var body = document.getElementById("month-table");
    body.innerHTML = generateMonth(adjusted);
}

// Date from ?date=yyyy-mm-dd, or null if missing or not a real date.
var parseDateParam = function(search) {
    var match = /[?&]date=(\d{4})-(\d{2})-(\d{2})(?:&|$)/.exec(search);
    if (!match) {
        return null;
    }
    var year = +match[1], month = +match[2] - 1, day = +match[3];
    var date = new Date(year, month, day);
    date.setFullYear(year); // years 0000-0099 would otherwise map to 19xx
    if (date.getFullYear() != year || date.getMonth() != month || date.getDate() != day) {
        return null;
    }
    return date;
}

var fixedDate = null;

// Current time of day, on the date from the URL if one was given.
var currentDate = function() {
    var now = new Date();
    if (fixedDate) {
        now.setFullYear(fixedDate.getFullYear(), fixedDate.getMonth(), fixedDate.getDate());
    }
    return now;
}

var updateView = function() {
    var now = currentDate();
    var adjusted = adjustDate(now);
    updateTimeAndDate(now, adjusted);
    updateCalendar(now, adjusted);
}

var init = function() {
    fixedDate = parseDateParam(window.location.search);
    document.getElementById("jumbo")['onclick'] = function() {
        if (document.getElementById("dateandtime").style.display == 'none') {
            document.getElementById("dateandtime").style.display = 'block';
            document.getElementById("calendar").style.display = 'none';
        } else {
            document.getElementById("dateandtime").style.display = 'none';
            document.getElementById("calendar").style.display = 'block';
        }
    };
    document.getElementById("share").onclick = share;
    document.getElementById("copyright-year").innerHTML = new Date().getFullYear();
    updateView();
    window.setInterval(updateView, 1000);
}
window.onload = init
// Phones and tablets get the native share sheet; desktops copy the link.
var isMobile = function() {
    if (navigator.userAgentData) {
        return navigator.userAgentData.mobile;
    }
    return /Android|iPhone|iPad|iPod|Mobi/i.test(navigator.userAgent)
        || (/Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1); // iPadOS
}

var copyText = function(text) {
    if (navigator.clipboard && window.isSecureContext) {
        return navigator.clipboard.writeText(text);
    }
    return new Promise(function(resolve, reject) {
        var area = document.createElement("textarea");
        area.value = text;
        area.setAttribute("readonly", "");
        area.style.position = "fixed";
        area.style.opacity = "0";
        document.body.appendChild(area);
        area.select();
        var ok = false;
        try { ok = document.execCommand("copy"); } catch (e) {}
        document.body.removeChild(area);
        ok ? resolve() : reject();
    });
}

// Briefly swap the share icon for a check mark to confirm the copy.
var shareFeedbackTimer = null;
var showCopied = function() {
    var button = document.getElementById("share");
    button.className += " copied";
    button.title = "Link copied";
    window.clearTimeout(shareFeedbackTimer);
    shareFeedbackTimer = window.setTimeout(function() {
        button.className = button.className.replace(/ copied/g, "");
        button.title = "Share this page";
    }, 2000);
}

var copyLink = function(url) {
    copyText(url).then(function() {
        showCopied();
    }, function() {
        window.prompt("Copy this link:", url);
    });
}

var share = function() {
    var url = window.location.href;
    if (isMobile() && navigator.share) {
        navigator.share({ title: document.title, url: url })["catch"](function(e) {
            if (e && e.name != "AbortError") {
                copyLink(url);
            }
        });
    } else {
        copyLink(url);
    }
}
