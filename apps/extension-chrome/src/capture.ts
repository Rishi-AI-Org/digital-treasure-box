interface ExtensionSettings {
  apiBaseUrl?: string;
  accessToken?: string;
}

interface CreateCaptureRequest {
  cabinetId?: string;
  url?: string;
  text?: string;
  title?: string;
  note?: string;
  tags?: string[];
  sourceApp?: string;
  selectedText?: string;
  youtubeStartSeconds?: number;
  youtubeEndSeconds?: number;
}

interface CreateCaptureResponse {
  capture: {
    id: string;
    status: "pending" | "processing" | "ready" | "failed" | "blocked";
    payload: CreateCaptureRequest;
    item?: unknown;
  };
}

export async function readSettings(): Promise<ExtensionSettings> {
  return chrome.storage.sync.get(["apiBaseUrl", "accessToken"]);
}

export async function saveSettings(settings: ExtensionSettings): Promise<void> {
  await chrome.storage.sync.set(settings);
}

export async function sendCapture(payload: CreateCaptureRequest): Promise<CreateCaptureResponse> {
  const settings = await readSettings();
  const apiBaseUrl = settings.apiBaseUrl || "http://localhost:3000";

  const response = await fetch(`${apiBaseUrl}/api/captures`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(settings.accessToken ? { authorization: `Bearer ${settings.accessToken}` } : {})
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`Capture failed with ${response.status}`);
  }

  return response.json();
}
