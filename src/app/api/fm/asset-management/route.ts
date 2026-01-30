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

    if (type === "departments" || type === "department") {
      // Check if your Directus collection is actually 'department' or 'departments'
      // Based on your previous snippet, let's try 'department' first as the endpoint
      const res = await fetch(`${DIRECTUS_URL}/items/department?limit=-1`, {
        headers: AUTH_HEADERS,
      });
      const json = await res.json();

      if (!res.ok) console.error("Department Fetch Error:", json);

      // Return the array directly so the frontend can map it
      return NextResponse.json(json.data || []);
    }
    if (type === "users" || type === "user") {
      const res = await fetch(`${DIRECTUS_URL}/items/user?limit=-1`, {
        headers: AUTH_HEADERS,
      });
      const json = await res.json();
      return NextResponse.json(json.data || []);
    }

    // 2. Main Asset Fetching Logic (Manual Merge for reliability)
    const [assetsRes, itemsRes] = await Promise.all([
      fetch(`${DIRECTUS_URL}/items/assets_and_equipment?limit=-1&sort=-id`, {
        headers: AUTH_HEADERS,
        cache: "no-store",
      }),
      fetch(
        `${DIRECTUS_URL}/items/items?fields=id,item_name,item_type.type_name,item_classification.classification_name&limit=-1`,
        { headers: AUTH_HEADERS },
      ),
    ]);

    const assetsJson = await assetsRes.json();
    const itemsJson = await itemsRes.json();

    if (!assetsRes.ok || !itemsRes.ok)
      throw new Error("Failed to fetch from Directus");

    const assets = assetsJson.data || [];
    const itemsMap = new Map<number, ItemLookup>(
      (itemsJson.data || []).map((i: ItemLookup) => [i.id, i]),
    );

    // 3. Merge Logic (Ensures item_name is never N/A if it exists in items table)
    const mergedData = assets.map((asset: any) => {
      // Directus sometimes returns an object or just an ID for FKs
      const actualItemId =
        typeof asset.item_id === "object" ? asset.item_id?.id : asset.item_id;
      const itemDetails = itemsMap.get(Number(actualItemId));

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
    console.error("GET Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST remains the same as our previous successful version
export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Step 1: Create Item
    const itemRes = await fetch(`${DIRECTUS_URL}/items/items`, {
      method: "POST",
      headers: AUTH_HEADERS,
      body: JSON.stringify({
        item_name: body.item_name,
        item_type: 2,
        item_classification: 1,
      }),
    });

    const itemData = await itemRes.json();
    if (!itemRes.ok)
      return NextResponse.json({ error: "Item step failed" }, { status: 400 });

    const newItemId = itemData.data.id;

    // Step 2: Create Asset linked to Item
    const assetPayload = {
      item_id: newItemId,
      condition: body.condition || "Good",
      cost_per_item: Number(body.cost_per_item) || 0,
      quantity: Number(body.quantity) || 1,
      total: Number(body.cost_per_item || 0) * Number(body.quantity || 1),
      life_span: Number(body.life_span) || 12,
      date_acquired: body.date_acquired || new Date().toISOString(),
      department: body.department ? Number(body.department) : null,
      encoder: 81,
    };

    const assetRes = await fetch(`${DIRECTUS_URL}/items/assets_and_equipment`, {
      method: "POST",
      headers: AUTH_HEADERS,
      body: JSON.stringify(assetPayload),
    });

    const assetData = await assetRes.json();
    return NextResponse.json(assetData.data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
