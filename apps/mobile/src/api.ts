import type { CreateCaptureRequest, CreateCaptureResponse } from "@dtb/api";
import * as SecureStore from "expo-secure-store";

const API_BASE_URL_KEY = "dtb.apiBaseUrl";
const ACCESS_TOKEN_KEY = "dtb.accessToken";

export interface MobileApiSettings {
  apiBaseUrl?: string;
  accessToken?: string;
}

export async function readMobileApiSettings(): Promise<MobileApiSettings> {
  const apiBaseUrl = await SecureStore.getItemAsync(API_BASE_URL_KEY);
  const accessToken = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
  const settings: MobileApiSettings = {};

  if (apiBaseUrl) {
    settings.apiBaseUrl = apiBaseUrl;
  }
  if (accessToken) {
    settings.accessToken = accessToken;
  }

  return settings;
}

export async function saveMobileApiSettings(settings: MobileApiSettings): Promise<void> {
  if (settings.apiBaseUrl) {
    await SecureStore.setItemAsync(API_BASE_URL_KEY, settings.apiBaseUrl);
  }
  if (settings.accessToken) {
    await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, settings.accessToken);
  }
}

export async function saveCapture(payload: CreateCaptureRequest): Promise<CreateCaptureResponse> {
  const apiBaseUrl = (await SecureStore.getItemAsync(API_BASE_URL_KEY)) || "http://localhost:3000";
  const accessToken = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);

  const response = await fetch(`${apiBaseUrl}/api/captures`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(accessToken ? { authorization: `Bearer ${accessToken}` } : {})
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`Capture failed with ${response.status}`);
  }

  return response.json();
}
