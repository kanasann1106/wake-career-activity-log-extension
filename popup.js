document.addEventListener("DOMContentLoaded", async () => {
  console.log("WAKE Career拡張機能: ポップアップが読み込まれました");
  const pageTitle = document.getElementById("page-title");
  const pageUrl = document.getElementById("page-url");
  const logTypeSelect = document.getElementById("log-type");
  const commentTextarea = document.getElementById("comment");
  const registerBtn = document.getElementById("register-btn");
  const openPageBtn = document.getElementById("open-page-btn");
  const cancelBtn = document.getElementById("cancel-btn");
  const statusDiv = document.getElementById("status");

  let currentPageInfo = null;

  function showStatus(message, type = "loading") {
    statusDiv.textContent = message;
    statusDiv.className = `status ${type}`;
    statusDiv.style.display = "block";
  }

  function hideStatus() {
    statusDiv.style.display = "none";
  }

  async function loadPageInfo() {
    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      const response = await chrome.tabs.sendMessage(tab.id, {
        action: "getPageInfo",
      });

      if (response) {
        currentPageInfo = response;
        pageTitle.textContent = response.title;
        pageUrl.textContent = response.url;
        console.log("取得したページ情報:", response);
      } else {
        pageTitle.textContent = "ページ情報を取得できませんでした";
        pageUrl.textContent = "";
      }
    } catch (error) {
      console.error("Failed to get page info:", error);
      pageTitle.textContent = "ページ情報を取得できませんでした";
      pageUrl.textContent = "";
    }
  }

  function hideFormElements() {
    const formGroups = document.querySelectorAll('.form-group');
    const buttonGroups = document.querySelectorAll('.button-group');
    
    formGroups.forEach(group => group.style.display = 'none');
    buttonGroups.forEach(group => group.style.display = 'none');
  }

  function showFormElements() {
    const formGroups = document.querySelectorAll('.form-group');
    const buttonGroups = document.querySelectorAll('.button-group');
    
    formGroups.forEach(group => group.style.display = 'block');
    buttonGroups.forEach(group => group.style.display = 'flex');
  }

  async function checkLoginStatus() {
    try {
      const response = await chrome.runtime.sendMessage({
        action: "checkLogin",
      });
      if (!response.isLoggedIn) {
        hideFormElements();
        showStatus("WAKE Careerにログインしてください", "error");

        // ログイン画面への遷移ボタンを作成
        const loginBtn = document.createElement("button");
        loginBtn.textContent = "ログイン";
        loginBtn.style.marginTop = "10px";
        loginBtn.style.width = "100%";
        loginBtn.style.padding = "12px";
        loginBtn.style.background = "#007bff";
        loginBtn.style.color = "white";
        loginBtn.style.border = "none";
        loginBtn.style.borderRadius = "4px";
        loginBtn.style.fontSize = "14px";
        loginBtn.style.cursor = "pointer";
        loginBtn.addEventListener("click", () => {
          chrome.tabs.create({ url: "https://wake-career.jp/signin" });
          window.close();
        });

        statusDiv.appendChild(loginBtn);
        return false;
      }
      showFormElements();
      return true;
    } catch (error) {
      console.error("Login check failed:", error);
      hideFormElements();
      showStatus("ログイン状態の確認に失敗しました", "error");
      return false;
    }
  }

  async function registerActivityLog() {
    if (!currentPageInfo) {
      showStatus("ページ情報を取得できませんでした", "error");
      return;
    }

    const logType = logTypeSelect.value;
    const comment = commentTextarea.value.trim();

    if (!logType) {
      showStatus("ログの種類を選択してください", "error");
      return;
    }

    showStatus("登録中...", "loading");
    registerBtn.disabled = true;

    try {
      const logData = {
        type: logType,
        url: currentPageInfo.url,
        title: currentPageInfo.title,
        comment: comment,
        timestamp: new Date().toISOString(),
      };

      const response = await chrome.runtime.sendMessage({
        action: "registerLog",
        data: logData,
      });

      if (response.success) {
        showStatus("登録が完了しました！", "success");
        setTimeout(() => {
          window.close();
        }, 2000);
      } else {
        showStatus(`登録に失敗しました: ${response.error}`, "error");
      }
    } catch (error) {
      console.error("Registration failed:", error);
      showStatus("登録に失敗しました", "error");
    } finally {
      registerBtn.disabled = false;
    }
  }

  registerBtn.addEventListener("click", registerActivityLog);

  openPageBtn.addEventListener("click", () => {
    if (!currentPageInfo) {
      showStatus("ページ情報を取得できませんでした", "error");
      return;
    }

    const logType = logTypeSelect.value;
    const comment = commentTextarea.value.trim();

    if (!logType) {
      showStatus("ログの種類を選択してください", "error");
      return;
    }

    const params = new URLSearchParams({
      url: currentPageInfo.url,
      title: currentPageInfo.title,
      type: logType,
      comment: comment,
    });

    chrome.tabs.create({
      url: `https://wake-career.jp/input-log/activity/create?${params.toString()}`,
    });

    window.close();
  });

  cancelBtn.addEventListener("click", () => {
    window.close();
  });

  await loadPageInfo();
  hideStatus();

  await checkLoginStatus();
});
