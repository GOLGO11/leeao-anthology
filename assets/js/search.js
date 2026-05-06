var showButton = document.getElementById("search-button");
var showButtonMobile = document.getElementById("search-button-mobile");
var hideButton = document.getElementById("close-search-button");
var wrapper = document.getElementById("search-wrapper");
var modal = document.getElementById("search-modal");
var input = document.getElementById("search-query");
var output = document.getElementById("search-results");
var first = null;
var last = null;
var searchVisible = false;
var indexed = false;
var indexing = false;
var indexData = [];
var hasResults = false;

showButton ? showButton.addEventListener("click", displaySearch) : null;
showButtonMobile ? showButtonMobile.addEventListener("click", displaySearch) : null;
hideButton ? hideButton.addEventListener("click", hideSearch) : null;

if (wrapper && modal && input && output) {
  wrapper.addEventListener("click", hideSearch);
  modal.addEventListener("click", function (event) {
    event.stopPropagation();
    event.stopImmediatePropagation();
    return false;
  });

  input.addEventListener("input", function () {
    executeQuery(this.value);
  });
}

document.addEventListener("keydown", function (event) {
  if (event.key == "/") {
    var active = document.activeElement;
    var tag = active.tagName;
    var isInputField = tag === "INPUT" || tag === "TEXTAREA" || active.isContentEditable;

    if (!searchVisible && !isInputField) {
      event.preventDefault();
      displaySearch();
    }
  }

  if (event.key == "Escape") {
    hideSearch();
  }

  if (event.key == "ArrowDown" && searchVisible && hasResults) {
    event.preventDefault();
    if (document.activeElement == input) {
      first.focus();
    } else if (document.activeElement == last) {
      last.focus();
    } else {
      document.activeElement.parentElement.nextSibling.firstElementChild.focus();
    }
  }

  if (event.key == "ArrowUp" && searchVisible && hasResults) {
    event.preventDefault();
    if (document.activeElement == input || document.activeElement == first) {
      input.focus();
    } else {
      document.activeElement.parentElement.previousSibling.firstElementChild.focus();
    }
  }

  if (event.key == "Enter" && searchVisible && hasResults) {
    event.preventDefault();
    if (document.activeElement == input) {
      first.focus();
    } else {
      document.activeElement.click();
    }
  }
});

function displaySearch() {
  if (!wrapper || !input) return;
  buildIndex();
  if (!searchVisible) {
    document.body.style.overflow = "hidden";
    wrapper.style.visibility = "visible";
    input.focus();
    searchVisible = true;
  }
}

function hideSearch() {
  if (searchVisible) {
    document.body.style.overflow = "visible";
    wrapper.style.visibility = "hidden";
    input.value = "";
    output.innerHTML = "";
    document.activeElement.blur();
    searchVisible = false;
    hasResults = false;
  }
}

function fetchJSON(path, callback) {
  var request = new XMLHttpRequest();
  request.onreadystatechange = function () {
    if (request.readyState === 4 && request.status === 200) {
      callback(JSON.parse(request.responseText));
    }
  };
  request.open("GET", path);
  request.send();
}

function buildIndex() {
  if (indexed || indexing || !wrapper) return;
  indexing = true;
  var baseURL = wrapper.getAttribute("data-url").replace(/\/?$/, "/");
  fetchJSON(baseURL + "index.json", function (data) {
    indexData = data.filter(function (item) {
      return item.type !== "tags" && item.type !== "categories" && item.type !== "authors" && item.type !== "series";
    });
    indexed = true;
    indexing = false;
    if (input.value) executeQuery(input.value);
  });
}

function normalize(text) {
  return String(text || "").toLowerCase().replace(/\s+/g, "");
}

function matchScore(item, query) {
  var title = normalize(item.title);
  var summary = normalize(item.summary);
  var content = normalize(item.content);
  var section = normalize(item.section);
  var haystack = title + summary + content + section;
  var q = normalize(query);

  if (!q) return 0;
  if (title.indexOf(q) > -1) return 100;
  if (summary.indexOf(q) > -1) return 70;
  if (content.indexOf(q) > -1) return 50;
  if (section.indexOf(q) > -1) return 30;

  var hits = 0;
  for (var i = 0; i < q.length; i++) {
    if (haystack.indexOf(q[i]) > -1) hits++;
  }
  return hits === q.length ? Math.max(10, hits) : 0;
}

function executeQuery(term) {
  if (!output) return;
  if (!term || !term.trim()) {
    output.innerHTML = "";
    hasResults = false;
    return;
  }

  if (!indexed) {
    buildIndex();
    return;
  }

  var results = indexData
    .map(function (item) {
      return { item: item, score: matchScore(item, term) };
    })
    .filter(function (result) {
      return result.score > 0;
    })
    .sort(function (a, b) {
      return b.score - a.score;
    })
    .slice(0, 12);

  output.innerHTML = results
    .map(function (result) {
      var item = result.item;
      var summaryNode = document.createElement("div");
      summaryNode.innerHTML = item.summary || "";
      var summary = summaryNode.textContent || summaryNode.innerText || "";
      var link = item.externalUrl
        ? 'target="_blank" rel="noopener" href="' + item.externalUrl + '"'
        : 'href="' + item.permalink + '"';

      return `<li class="mb-2">
        <a class="flex items-center px-3 py-2 rounded-md appearance-none bg-neutral-100 dark:bg-neutral-700 focus:bg-primary-100 hover:bg-primary-100 dark:hover:bg-primary-900 dark:focus:bg-primary-900 focus:outline-dotted focus:outline-transparent focus:outline-2"
        ${link} tabindex="0">
          <div class="grow">
            <div class="-mb-1 text-lg font-bold">${item.title}</div>
            <div class="text-sm text-neutral-500 dark:text-neutral-400">${item.section || ""}<span class="px-2 text-primary-500">&middot;</span>${item.date || ""}</div>
            <div class="text-sm italic">${summary}</div>
          </div>
          <div class="ml-2 ltr:block rtl:hidden text-neutral-500">&rarr;</div>
          <div class="mr-2 ltr:hidden rtl:block text-neutral-500">&larr;</div>
        </a>
      </li>`;
    })
    .join("");

  hasResults = results.length > 0;
  if (hasResults) {
    first = output.firstChild.firstElementChild;
    last = output.lastChild.firstElementChild;
  }
}
