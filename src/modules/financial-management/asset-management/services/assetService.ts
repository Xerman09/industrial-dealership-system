import { AssetFormValues } from "../types";

const API_ROUTE = "/api/fm/asset-management";

async function apiRequest(url: string, options?: RequestInit) {
  const res = await fetch(url, options);
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Request failed");
  }
  return res.json();
}

export const assetService = {
  getDepartments: () => apiRequest(`${API_ROUTE}?type=departments`),

  getUsers: () => apiRequest(`${API_ROUTE}?type=users`),

  getAssets: () => apiRequest(API_ROUTE),

  createAsset: (values: AssetFormValues, encoderId: number) =>
    apiRequest(API_ROUTE, {
      method: "POST",
      body: JSON.stringify({
        ...values,
        encoder: encoderId,
        // Format date for Directus string format
        date_acquired: values.date_acquired.toISOString().split("T")[0],
      }),
    }),
};
