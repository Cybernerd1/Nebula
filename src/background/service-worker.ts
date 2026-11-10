chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('Nebula extension installed');
    chrome.storage.local.set({
      'nebula-installed-at': Date.now(),
      'nebula-version': chrome.runtime.getManifest().version,
    });
  } else if (details.reason === 'update') {
    console.log('Nebula extension updated');
    chrome.storage.local.set({
      'nebula-updated-at': Date.now(),
      'nebula-version': chrome.runtime.getManifest().version,
    });
  }
});

chrome.runtime.onStartup.addListener(() => {
  console.log('Nebula extension started');
});

chrome.commands.onCommand.addListener((command) => {
  console.log('Command received:', command);
  switch (command) {
    case 'open-search':
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.id) {
          chrome.tabs.sendMessage(tabs[0].id, { type: 'NEBULA_OPEN_SEARCH' });
        }
      });
      break;
    case 'toggle-edit':
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.id) {
          chrome.tabs.sendMessage(tabs[0].id, { type: 'NEBULA_TOGGLE_EDIT' });
        }
      });
      break;
    case 'open-workspace-switcher':
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.id) {
          chrome.tabs.sendMessage(tabs[0].id, { type: 'NEBULA_OPEN_WORKSPACE_SWITCHER' });
        }
      });
      break;
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case 'NEBULA_GET_VERSION':
      sendResponse({ version: chrome.runtime.getManifest().version });
      break;
    case 'NEBULA_OPEN_OPTIONS':
      chrome.runtime.openOptionsPage();
      break;
  }
  return true;
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url?.startsWith('chrome://newtab')) {
    console.log('New tab page loaded');
  }
});

export {};