import { NextRequest, NextResponse } from "next/server";
import {
  fetchSupplierById,
  updateSupplier,
  deleteSupplier,
} from "@/modules/financial-management/supplier-registration/services/supplier";
import { SupplierFormSchema } from "@/modules/financial-management/supplier-registration/types/supplier.schema";

/**
 * GET /api/suppliers/[id]
 * Fetch single supplier by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid supplier ID",
        },
        { status: 400 },
      );
    }

    const supplier = await fetchSupplierById(id);

    return NextResponse.json({
      success: true,
      data: supplier,
    });
  } catch (error) {
    console.error(`GET /api/suppliers/${params.id} error:`, error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to fetch supplier",
      },
      { status: 500 },
    );
  }
}

/**
 * PATCH /api/suppliers/[id]
 * Update supplier
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid supplier ID",
        },
        { status: 400 },
      );
    }

    const body = await request.json();

    // Partial validation - allow updating specific fields
    const validatedData = SupplierFormSchema.partial().parse(body);

    const updatedSupplier = await updateSupplier(id, validatedData);

    return NextResponse.json({
      success: true,
      data: updatedSupplier,
      message: "Supplier updated successfully",
    });
  } catch (error) {
    console.error(`PATCH /api/suppliers/${params.id} error:`, error);

    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: error,
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to update supplier",
      },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/suppliers/[id]
 * Delete supplier
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid supplier ID",
        },
        { status: 400 },
      );
    }

    await deleteSupplier(id);

    return NextResponse.json({
      success: true,
      message: "Supplier deleted successfully",
    });
  } catch (error) {
    console.error(`DELETE /api/suppliers/${params.id} error:`, error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to delete supplier",
      },
      { status: 500 },
    );
  }
}
