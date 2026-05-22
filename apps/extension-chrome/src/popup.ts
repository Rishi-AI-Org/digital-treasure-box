import { readSettings, saveSettings, sendCapture } from "./capture.js";

const apiBaseUrl = document.querySelector<HTMLInputElement>("#apiBaseUrl");
const accessToken = document.querySelector<HTMLInputElement>("#accessToken");
const status = document.querySelector<HTMLParagraphElement>("#status");
const saveButton = document.querySelector<HTMLButtonElement>("#saveSettings");
const captureButton = document.querySelector<HTMLButtonElement>("#captureTab");

void readSettings().then((settings) => {
  if (apiBaseUrl) {
    apiBaseUrl.value = settings.apiBaseUrl || "http://localhost:3000";
  }
  if (accessToken) {
    accessToken.value = settings.accessToken || "";
  }
});

saveButton?.addEventListener("click", async () => {
  const settings: { apiBaseUrl?: string; accessToken?: string } = {};
  if (apiBaseUrl?.value) {
    settings.apiBaseUrl = apiBaseUrl.value;
  }
  if (accessToken?.value) {
    settings.accessToken = accessToken.value;
  }

  await saveSettings(settings);
  setStatus("Settings saved.");
});

captureButton?.addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.url) {
    setStatus("No active tab URL.");
    return;
  }

  const payload = {
    url: tab.url,
    sourceApp: "chrome-extension"
  };

  if (tab.title) {
    Object.assign(payload, { title: tab.title });
  }

  await sendCapture(payload);
  setStatus("Saved.");
});

function setStatus(message: string) {
  if (status) {
    status.textContent = message;
  }
}
