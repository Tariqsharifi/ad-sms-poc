// AdProvider abstraction — طوری طراحی شده که بعداً بشود Applixir را با هر
// شبکه‌ی دیگر (مثلاً نسخه‌ی native با Tapsell/Adivery در اپ آینده) عوض کرد
// بدون اینکه کد صفحه (index.html) تغییر کند.

class AdProvider {
  async loadAndShow() {
    throw new Error("پیاده‌سازی نشده");
  }
}

class ApplixirAdProvider extends AdProvider {
  constructor(apiKey) {
    super();
    this.apiKey = apiKey;
    this._sdkLoaded = false;
  }

  async _ensureSdkLoaded() {
    if (this._sdkLoaded) return;
    await new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://cdn.applixir.com/applixir.app.v6.1.0.js";
      script.onload = resolve;
      script.onerror = () => reject(new Error("بارگذاری Applixir SDK ناموفق بود."));
      document.head.appendChild(script);
    });
    this._sdkLoaded = true;
  }

  async loadAndShow() {
    await this._ensureSdkLoaded();

    return new Promise((resolve, reject) => {
      try {
        initializeAndOpenPlayer({
          apiKey: this.apiKey,
          adStatusCallbackFn: (status) => {
            if (status === "ad-watched") {
              resolve({ completed: true });
            } else if (status === "ad-error" || status === "ad-skipped") {
              resolve({ completed: false });
            }
          },
        });
      } catch (e) {
        reject(e);
      }
    });
  }
}

// برای Test Mode: تبلیغ واقعی نمایش داده نمی‌شود، فقط یک شبیه‌سازی با تأخیر
class MockAdProvider extends AdProvider {
  async loadAndShow() {
    await new Promise((r) => setTimeout(r, 3000));
    return { completed: true };
  }
}

// پیکربندی فعال — اینجا Provider را عوض می‌کنید
const AD_CONFIG = {
  testMode: true, // false کنید برای Live Test با Applixir واقعی
  applixirApiKey: "APPLIXIR_API_KEY_HERE",
};

function getAdProvider() {
  if (AD_CONFIG.testMode) return new MockAdProvider();
  return new ApplixirAdProvider(AD_CONFIG.applixirApiKey);
}
