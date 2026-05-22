import { sendCapture } from "./capture.js";

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "save-page",
    title: "Save page to Digital Treasure Box",
    contexts: ["page", "link", "selection"]
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  const sourceUrl = info.linkUrl || tab?.url;
  if (!sourceUrl) {
    return;
  }

  const selectedText =
    info.selectionText ||
    (tab?.id ? await getSelectionFromTab(tab.id).catch(() => undefined) : undefined);

  const payload = {
    url: sourceUrl,
    sourceApp: "chrome-extension"
  };

  if (tab?.title) {
    Object.assign(payload, { title: tab.title });
  }

  if (selectedText) {
    Object.assign(payload, { selectedText });
  }

  await sendCapture(payload);
});

async function getSelectionFromTab(tabId: number): Promise<string | undefined> {
  const [result] = await chrome.scripting.executeScript({
    target: { tabId },
    func: () => window.getSelection()?.toString()
  });

  return result?.result || undefined;
}
