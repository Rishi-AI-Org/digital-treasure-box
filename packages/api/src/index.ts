import type { CabinetItem, CapturePayload, CaptureStatus, ProviderMetadata } from "@dtb/core";

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
  };
}

export interface CreateCaptureRequest extends CapturePayload {
  cabinetId?: string;
}

export interface CreateCaptureResponse {
  capture: {
    id: string;
    status: CaptureStatus;
    payload: CapturePayload;
    item?: CabinetItem;
  };
}

export interface ResolveCaptureResponse {
  metadata: ProviderMetadata;
  status: CaptureStatus;
}

export interface PublicCabinetResponse {
  cabinet: {
    title: string;
    ownerName: string;
    shareId: string;
    theme: "mono" | "ruby" | "forest" | "paper";
  };
  items: CabinetItem[];
}

export interface ArchiveSearchResponse {
  items: CabinetItem[];
}

