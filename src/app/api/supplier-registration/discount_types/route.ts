import { fetchAllDiscountTypes } from "@/modules/financial-management/supplier-registration/services/discount-types";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/supplier-registration/discount-types
 * Fetch all discount types
 */
export async function GET(request: NextRequest) {
  try {
    const discountTypes = await fetchAllDiscountTypes();

    return NextResponse.json(
      {
        data: discountTypes,
        count: discountTypes.length,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error fetching discount types:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch discount types",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
