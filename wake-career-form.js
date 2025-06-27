function fillActivityLogForm() {
  const urlParams = new URLSearchParams(window.location.search);

  const url = urlParams.get("url");
  const type = urlParams.get("type");
  const comment = urlParams.get("comment");

  if (!url || !type) {
    return;
  }

  setTimeout(() => {
    const urlField = document.querySelector('input[name="url"]');
    if (urlField && url) {
      urlField.value = url;
      urlField.dispatchEvent(new Event("input", { bubbles: true }));
    }

    // ログの種類を設定（input[name="activity_type_id"]のラジオボタンで選択）
    let typeValue;
    if (type === "記事") {
      typeValue = "2";
    } else if (type === "イベント") {
      typeValue = "3";
    }

    if (typeValue) {
      const typeRadio = document.querySelector(
        `input[name="activity_type_id"][value="${typeValue}"]`
      );
      if (typeRadio) {
        // Next.jsのReactイベントをトリガーするために複数のイベントを発火
        typeRadio.checked = true;

        // React の onChange イベントを正しくトリガー
        const reactChangeEvent = new Event("input", { bubbles: true });
        const reactClickEvent = new Event("click", { bubbles: true });
        const reactChangeEvent2 = new Event("change", { bubbles: true });

        typeRadio.dispatchEvent(reactClickEvent);
        typeRadio.dispatchEvent(reactChangeEvent);
        typeRadio.dispatchEvent(reactChangeEvent2);

        // Next.jsの状態更新とレンダリングを待機
        const waitForFormRender = () => {
          let attempts = 0;
          const maxAttempts = 20; // 10秒間待機

          const checkForForm = () => {
            attempts++;
            const urlFieldAfterRender =
              document.querySelector('input[name="url"]');

            if (urlFieldAfterRender) {
              // フォームが見つかったら値を設定
              if (url) {
                urlFieldAfterRender.value = url;
                urlFieldAfterRender.dispatchEvent(
                  new Event("input", { bubbles: true })
                );
                urlFieldAfterRender.dispatchEvent(
                  new Event("change", { bubbles: true })
                );
              }

              const commentFieldAfterRender = document.querySelector(
                'textarea[name="comment"]'
              );
              if (commentFieldAfterRender && comment) {
                commentFieldAfterRender.value = comment;
                commentFieldAfterRender.dispatchEvent(
                  new Event("input", { bubbles: true })
                );
                commentFieldAfterRender.dispatchEvent(
                  new Event("change", { bubbles: true })
                );
              }
            } else if (attempts < maxAttempts) {
              // まだフォームが見つからない場合は500ms後に再試行
              setTimeout(checkForForm, 500);
            }
          };

          checkForForm();
        };

        // 初回レンダリング待機
        setTimeout(waitForFormRender, 500);
      }
    }

    const notification = document.createElement("div");
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #4CAF50;
      color: white;
      padding: 12px 20px;
      border-radius: 4px;
      z-index: 10000;
      font-family: Arial, sans-serif;
      font-size: 14px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.2);
    `;
    notification.textContent = "拡張機能からフォームに自動入力しました";
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.remove();
    }, 3000);
  }, 500);
}

function submitActivityLogForm(logData) {
  return new Promise((resolve, reject) => {
    try {
      // まずログの種類を設定（ラジオボタン）
      let typeValue;
      if (logData.type === "記事") {
        typeValue = "2";
      } else if (logData.type === "イベント") {
        typeValue = "3";
      }

      if (!typeValue) {
        reject(new Error("サポートされていないログの種類です"));
        return;
      }

      const typeRadio = document.querySelector(
        `input[name="activity_type_id"][value="${typeValue}"]`
      );
      if (!typeRadio) {
        reject(new Error("ログの種類のラジオボタンが見つかりませんでした"));
        return;
      }

      // Next.jsのReactイベントを正しくトリガー
      typeRadio.checked = true;

      // React の onChange イベントを正しくトリガー
      const reactClickEvent = new Event("click", { bubbles: true });
      const reactInputEvent = new Event("input", { bubbles: true });
      const reactChangeEvent = new Event("change", { bubbles: true });

      typeRadio.dispatchEvent(reactClickEvent);
      typeRadio.dispatchEvent(reactInputEvent);
      typeRadio.dispatchEvent(reactChangeEvent);

      // Next.jsのレンダリングを待機してフォーム要素を探す
      const waitForFormAndSubmit = () => {
        let attempts = 0;
        const maxAttempts = 40; // 20秒間待機

        const checkAndSubmit = () => {
          attempts++;
          const urlField = document.querySelector('input[name="url"]');
          const commentField = document.querySelector(
            'textarea[name="comment"]'
          );
          const submitButton = document.querySelector(
            'input[type="submit"], button[type="submit"], .btn-submit'
          );

          if (urlField && submitButton) {
            try {
              // フォームに値を設定
              urlField.value = logData.url;
              urlField.dispatchEvent(new Event("input", { bubbles: true }));
              urlField.dispatchEvent(new Event("change", { bubbles: true }));

              if (commentField && logData.comment) {
                commentField.value = logData.comment;
                commentField.dispatchEvent(
                  new Event("input", { bubbles: true })
                );
                commentField.dispatchEvent(
                  new Event("change", { bubbles: true })
                );
              }

              // フォーム送信イベントをリッスン
              const form = submitButton.closest("form");
              if (form) {
                const handleSubmit = (e) => {
                  form.removeEventListener("submit", handleSubmit);
                  setTimeout(() => {
                    if (
                      window.location.href.includes("success") ||
                      document.querySelector(".alert-success, .success-message")
                    ) {
                      resolve({ success: true });
                    } else if (
                      document.querySelector(".alert-error, .error-message")
                    ) {
                      reject(new Error("フォーム送信エラーが発生しました"));
                    } else {
                      resolve({ success: true }); // 成功と仮定
                    }
                  }, 2000);
                };

                form.addEventListener("submit", handleSubmit);
              }

              // フォームを送信
              setTimeout(() => {
                submitButton.click();
              }, 500);
            } catch (error) {
              reject(error);
            }
          } else if (attempts < maxAttempts) {
            // まだフォームが見つからない場合は500ms後に再試行
            setTimeout(checkAndSubmit, 500);
          } else {
            reject(
              new Error(
                "レンダリング後のフォーム要素が見つかりませんでした（タイムアウト）"
              )
            );
          }
        };

        checkAndSubmit();
      };

      // 初回レンダリング待機
      setTimeout(waitForFormAndSubmit, 500);
    } catch (error) {
      reject(error);
    }
  });
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "submitForm") {
    submitActivityLogForm(request.data)
      .then((result) => sendResponse(result))
      .catch((error) => sendResponse({ success: false, error: error.message }));
    return true; // 非同期レスポンスを示す
  }
});

if (
  window.location.hostname === "wake-career.jp" &&
  window.location.pathname.includes("/input-log/activity/create")
) {
  fillActivityLogForm();
}
