function getPageInfo() {
  return {
    title: document.title,
    url: window.location.href,
    timestamp: new Date().toISOString()
  };
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getPageInfo') {
    const pageInfo = getPageInfo();
    sendResponse(pageInfo);
  }
  return true;
});

console.log('WAKE Career Activity Log Extension: Content script loaded');