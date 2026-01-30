// src/app/api/fm/asset-management/route.ts
import { NextResponse } from "next/server";

const DIRECTUS_URL = "http://goatedcodoer:8056";
const AUTH_HEADERS = {
  "Content-Type": "application/json",
  Authorization: `Bearer ${process.env.DIRECTUS_STATIC_TOKEN}`,
};

interface ItemLookup {
  id: number;
  item_name: string;
  item_type?: { type_name: string };
  item_classification?: { classification_name: string };
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");

    if (type === "departments") {
      const res = await fetch(`${DIRECTUS_URL}/items/department`, {
        headers: AUTH_HEADERS,
      });
      const json = await res.json();
      return NextResponse.json(json.data || []);
    }

    if (type === "users") {
      const res = await fetch(`${DIRECTUS_URL}/items/user`, {
        headers: AUTH_HEADERS,
      });
      const json = await res.json();
      return NextResponse.json(json.data || []);
    }

    // Main Asset Fetching Logic
    const [assetsRes, itemsRes] = await Promise.all([
      fetch(`${DIRECTUS_URL}/items/assets_and_equipment`, {
        headers: AUTH_HEADERS,
        cache: "no-store",
      }),
      fetch(
        `${DIRECTUS_URL}/items/items?fields=id,item_name,item_type.type_name,item_classification.classification_name`,
        { headers: AUTH_HEADERS },
      ),
    ]);

    const assetsJson = await assetsRes.json();
    const itemsJson = await itemsRes.json();

    const assets = assetsJson.data || [];
    const itemsMap = new Map<number, ItemLookup>(
      itemsJson.data.map((i: ItemLookup) => [i.id, i]),
    );

    const mergedData = assets.map((asset: any) => {
      const itemDetails = itemsMap.get(asset.item_id);
      return {
        ...asset,
        item_name: itemDetails?.item_name ?? "N/A",
        item_type_name: itemDetails?.item_type?.type_name ?? "N/A",
        item_class_name:
          itemDetails?.item_classification?.classification_name ?? "N/A",
      };
    });

    return NextResponse.json(mergedData);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // STEP 1: Create Item
    const itemRes = await fetch(`${DIRECTUS_URL}/items/items`, {
      method: "POST",
      headers: AUTH_HEADERS,
      body: JSON.stringify({
        item_name: body.item_name,
        item_type: isNaN(Number(body.item_type)) ? 2 : Number(body.item_type),
        item_classification: isNaN(Number(body.item_classification))
          ? 1
          : Number(body.item_classification),
      }),
    });

    if (!itemRes.ok) throw new Error("Item table insert failed");
    const itemData = await itemRes.json();
    const newItemId = itemData.data.id;

    // STEP 2: Create Asset
    const assetPayload = {
      item_id: newItemId,
      barcode: body.barcode || null,
      condition: body.condition,
      cost_per_item: Number(body.cost_per_item),
      date_acquired: body.date_acquired,
      department: Number(body.department),
      employee: body.employee ? Number(body.employee) : null,
      encoder: 81,
      quantity: Number(body.quantity),
      rfid_code: body.rfid_code || null,
      total: Number(body.cost_per_item) * Number(body.quantity),
      life_span: Number(body.life_span),
    };

    const assetRes = await fetch(`${DIRECTUS_URL}/items/assets_and_equipment`, {
      method: "POST",
      headers: AUTH_HEADERS,
      body: JSON.stringify(assetPayload),
    });

    const finalResult = await assetRes.json();
    return NextResponse.json(finalResult.data || finalResult);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
