import { NextResponse } from "next/server";
import { lpgBillingService } from "@/modules/supply-chain-management/inventory-management/lpg-billing/services/lpg-billing-service";
import { handleApiError } from "@/modules/supply-chain-management/inventory-management/stock-adjustment/utils/error-handler";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get("siteId");
    if (!siteId) return NextResponse.json({ data: [] });
    
    const data = await lpgBillingService.fetchCylindersBySite(Number(siteId));
    return NextResponse.json({ data });
  } catch (error) {
    return handleApiError(error);
  }
}
