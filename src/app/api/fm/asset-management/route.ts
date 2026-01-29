// src/app/api/fm/asset-management/route.ts
import { NextResponse } from "next/server";

const DIRECTUS_URL = "http://goatedcodoer:8056";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");

    if (type === "departments") {
      const res = await fetch(`${DIRECTUS_URL}/items/department`);
      return NextResponse.json(await res.json());
    }

    if (type === "users") {
      const res = await fetch(`${DIRECTUS_URL}/items/user?limit=-1`);
      return NextResponse.json(await res.json());
    }

    // This forces Directus to expand relationship IDs into full objects
    // src/app/api/fm/asset-management/route.ts
    const res = await fetch(
      `${DIRECTUS_URL}/items/assets_and_equipment?fields=*,item_id.item_name`,
      { cache: "no-store" },
    );

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // STEP 1: Create the entry in the 'items' table
    const itemPayload = {
      item_name: body.item_name,
      // Fallback to default IDs if input isn't a number
      item_type: isNaN(Number(body.item_type)) ? 2 : Number(body.item_type),
      item_classification: isNaN(Number(body.item_classification))
        ? 1
        : Number(body.item_classification),
    };

    const itemRes = await fetch(`${DIRECTUS_URL}/items/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(itemPayload),
    });

    if (!itemRes.ok) throw new Error("Item table insert failed");
    const itemData = await itemRes.json();
    const newItemId = itemData.data.id;

    // STEP 2: Create the Asset and link it to the Item ID
    const assetPayload = {
      item_id: newItemId,
      barcode: body.barcode || null,
      condition: body.condition,
      cost_per_item: Number(body.cost_per_item),
      date_acquired: body.date_acquired,
      department: Number(body.department),
      employee: body.employee ? Number(body.employee) : null,
      encoder: 81, // Based on your debug logs
      quantity: Number(body.quantity),
      rfid_code: body.rfid_code || null,
      total: Number(body.cost_per_item) * Number(body.quantity),
      life_span: Number(body.life_span),
    };

    const assetRes = await fetch(`${DIRECTUS_URL}/items/assets_and_equipment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(assetPayload),
    });

    return NextResponse.json(await assetRes.json());
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
