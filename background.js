chrome.runtime.onInstalled.addListener(() => {
  console.log("WAKE Career Activity Log Extension installed");
});

chrome.action.onClicked.addListener((tab) => {
  chrome.action.openPopup();
});

async function checkLoginStatus() {
  try {
    const response = await fetch(
      "https://wake-career.jp/input-log/activity/create",
      {
        credentials: "include",
      }
    );
    const text = await response.text();
    return text.includes("ログの種類");
  } catch (error) {
    console.error("Login status check failed:", error);
    return false;
  }
}

async function registerActivityLog(logData) {
  try {
    // WAKE Careerの登録ページを新しいタブで開き、content scriptを使って登録処理を行う
    const tab = await chrome.tabs.create({
      url: "https://wake-career.jp/input-log/activity/create",
      active: false,
    });

    // ページが読み込まれるまで待機
    await new Promise((resolve) => {
      chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
        if (tabId === tab.id && info.status === "complete") {
          chrome.tabs.onUpdated.removeListener(listener);
          resolve();
        }
      });
    });

    // content scriptを使ってフォーム送信を実行
    const result = await chrome.tabs.sendMessage(tab.id, {
      action: "submitForm",
      data: logData,
    });

    // タブを閉じる
    chrome.tabs.remove(tab.id);

    return result;
  } catch (error) {
    console.error("Activity log registration failed:", error);
    throw error;
  }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "checkLogin") {
    checkLoginStatus().then((isLoggedIn) => {
      sendResponse({ isLoggedIn });
    });
    return true;
  }

  if (request.action === "registerLog") {
    registerActivityLog(request.data)
      .then((result) => {
        sendResponse({ success: true, data: result });
      })
      .catch((error) => {
        sendResponse({ success: false, error: error.message });
      });
    return true;
  }
});
