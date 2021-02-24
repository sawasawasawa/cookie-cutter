// Local storage Key ID.
const COOKIE_JAR_ID = 'bf2b15a7912-cookie-cutter-cookie-jar';
const LOCALSTORAGE_JAR_ID = 'bf2b15a7912-cookie-cutter-localstorage-jar';

// Script to run on the page to retrieve the cookie.
const getCookieFn = () => {
  return '(() => { return document.cookie; })();';
};

const getLocalStorageFn = () => {
  return `(() => { 
  return JSON.stringify({...localStorage}); })();
  `;
};

// Script to run to set the cookie for the page.
// Returns a string representation of an IIFE which sets the cookie.
const setCookieFn = (cookieString) => {
  const str = [];
  cookieString.split(';').forEach(pair => {
    const trimmed = pair.trim();

    // If the cookie contains a double quote, wrap cookie in single quotes.
    // Otherwise, wrap in double quotes.
    if (trimmed.indexOf('"') >= 0) {
      str.push(`document.cookie = '${trimmed}';`);
    } else {
      str.push(`document.cookie = "${trimmed}";`);
    }
  });

  const result = str.join(' ');
  return `(() => { ${result} })();`;
};

const setLocalStorageFn = (localStorageString) => {
  return `(() => { Object.entries(${localStorageString}).forEach(([key, value])=>localStorage.setItem(key, value)) })();`;
};

const cookie2Json = (cookieString) => {
  return cookieString.split(';').reduce((hash, pair) => {
    const [key, value] = pair.split('=');
    return Object.assign({}, hash, { [key.trim()]: value });
  }, {});
};

// Runs a function to get the current tab's document.cookie
// and stores in the extension's local storage.
const copyCookie = () => {
  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    const tab = tabs[0];
    const cookieFn = getCookieFn();
    chrome.tabs.executeScript(tab.id, { code: getCookieFn() }, (cookieString) => {
      window.localStorage.setItem(COOKIE_JAR_ID, cookieString);
    });

    chrome.tabs.executeScript(tab.id, { code: getLocalStorageFn() }, (localStorageString) => {
      window.localStorage.setItem(LOCALSTORAGE_JAR_ID, localStorageString);
    });
  });

};

const pasteCookie = () => {
  const cookieString = window.localStorage.getItem(COOKIE_JAR_ID);
  const localStorageObject = window.localStorage.getItem(LOCALSTORAGE_JAR_ID);

  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    const tab = tabs[0];
    chrome.tabs.executeScript(tab.id, { code: setCookieFn(cookieString) });

    chrome.tabs.executeScript(tab.id, { code: setLocalStorageFn(localStorageObject) });
})};

// Chrome setup
const contextMenuIds = {
  root: 'cookie-cutter-context-root',
  copy: 'cookie-cutter-context-root-copy',
  paste: 'cookie-cutter-context-root-paste'
};

const rootMenu = chrome.contextMenus.create({
  id: contextMenuIds.root,
  title: 'Cookie Cutter'
});

const copy = chrome.contextMenus.create({
  parentId: contextMenuIds.root,
  id: contextMenuIds.copy,
  title: 'Yank',
  onclick: copyCookie
});

const paste = chrome.contextMenus.create({
  parentId: contextMenuIds.root,
  id: contextMenuIds.paste,
  title: 'Inject',
  onclick: pasteCookie
});
