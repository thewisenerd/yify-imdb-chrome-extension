/**
 * Class that fetches and shows yify data
 */
var yifyChecker = {

    apiURL    : "https://yts.ag/api/v2/list_movies.json?query_term=",

    imdbRegex : /http:\/\/[\w]+\.imdb\.com\/title\/(tt[0-9]+)[^$]+$/,

    /**
     * https://github.com/afeld/jsonp
     */
    jsonproxy : "http://jsonp.thewisenerd.me/?url=",

    /**
     * Badge
     */
    Badge : {

        // clear badge
        clear : function() {
            chrome.browserAction.setBadgeText({text:""});
        },

        // set badge
        setBadge : function(str) {
            chrome.browserAction.setBadgeText({text:str+""});
            chrome.browserAction.setBadgeBackgroundColor({color:[204, 0, 0, 230]});
        },

    },

    /**
     * Storage
     */
    Storage : {

        clear : function() {
            chrome.storage.local.set({'html' : ''});
        },

        setText : function(str) {
            chrome.storage.local.set({'html' : str});
        },

    },

    /**
     * Popup
     */
    Popup : {

        // clear popup
        clear : function() {
            var views = chrome.extension.getViews({type: "popup"});
            for (var i = 0; i < views.length; i++) {
                views[i].document.innerHTML = '';
            }
        },

        // set text
        setText : function(str) {
            var views = chrome.extension.getViews({type: "popup"});
            for (var i = 0; i < views.length; i++) {
                views[i].document.innerHTML = bodyText;
            }
        },

    },

    run : function(imdb_id) {
        this.requestJSON(imdb_id);
    },

    /**
     * Fetches json result for the specified movie
     */
    requestJSON : function(imdb_id) {
        var xhr = new XMLHttpRequest();
        var url = this.apiURL + imdb_id;
        if (typeof(this.jsonproxy) !== 'undefined') {
            url = this.jsonproxy + url;
        }
        xhr.open("GET", url, true);
        xhr.onreadystatechange = function() {
            if (xhr.readyState == 4) {
                var resp = JSON.parse(xhr.responseText);
                yifyChecker.showTorrents(resp.data);
            }
        };
        xhr.send();
    },

    /**
     * Shows and saves the html result
     */
    showTorrents : function(data) {
        var bodyText = '';
        if(data.movie_count === 0) {
            bodyText += "No torrent found :(";

            // say zero
            this.Badge.setBadge("0");
        } else {
            var count = data.movies[0].torrents.length;
            // build link
            for(var i = 0; i < count; i++) {
                var title = data.movies[0].title + ' - ' + data.movies[0].torrents[i].quality + ' (' + data.movies[0].torrents[i].size + ')';
                bodyText += '<a href="'+data.movies[0].torrents[i].url+'" target="_blank">'+title+'</a>';
            }
            // say n
            this.Badge.setBadge(count.toString());
        }
        this.Storage.setText(bodyText);

        // just in case changes don't propagate
        this.Popup.setText(bodyText);
    },

};

/**
 * Listen page load event and run checker
 */
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, updatedTab) {
    chrome.tabs.query({'active': true}, function (activeTabs) {
        var url = activeTabs[0].url;
        var m;
        if ((m = yifyChecker.imdbRegex.exec(url)) !== null) {
            yifyChecker.run(m[1]);
        } else {
            yifyChecker.Badge.clear();
            yifyChecker.Storage.clear();
            yifyChecker.Popup.clear();
        }
    });
});

chrome.tabs.onActivated.addListener(function(activeInfo) {
    chrome.tabs.get(activeInfo.tabId, function(tab){
        var url = tab.url;
        var m;
        if ((m = yifyChecker.imdbRegex.exec(url)) !== null) {
            yifyChecker.run(m[1]);
        } else {
            yifyChecker.Badge.clear();
            yifyChecker.Storage.clear();
            yifyChecker.Popup.clear();
        }
    });
});
