import type {
  SalesOrderCustomerLite,
  SalesOrderDetailLite,
  SalesOrderSummary,
} from "../types";

interface SalesOrderReportLiteResponse {
  salesOrders: SalesOrderSummary[];
  customers: SalesOrderCustomerLite[];
}

async function parseError(res: Response): Promise<string> {
  try {
    const json = await res.json();
    return json?.error || json?.message || JSON.stringify(json);
  } catch {
    return res.statusText || "Request failed";
  }
}

export async function fetchRecentSalesOrders(
  page = 1,
  pageSize = 15,
): Promise<SalesOrderReportLiteResponse> {
  const params = new URLSearchParams({
    page: page.toString(),
    pageSize: pageSize.toString(),
  });

  const res = await fetch(
    `/api/crm/customer-hub/sales-order-report?${params.toString()}`,
    {
      cache: "no-store",
    },
  );

  if (!res.ok) {
    const err = await parseError(res);
    throw new Error(err || `Failed to fetch sales orders (${res.status})`);
  }

  return res.json() as Promise<SalesOrderReportLiteResponse>;
}

export async function fetchSalesOrderDetails(
  orderId: number,
): Promise<SalesOrderDetailLite[]> {
  const res = await fetch(
    `/api/crm/customer-hub/sales-order-report?orderId=${orderId}`,
    {
      cache: "no-store",
    },
  );

  if (!res.ok) {
    const err = await parseError(res);
    throw new Error(err || `Failed to fetch order details (${res.status})`);
  }

  const json = await res.json();
  return json.data || [];
}
