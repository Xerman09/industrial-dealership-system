import { NextRequest, NextResponse } from "next/server";

const DIRECTUS_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
const DIRECTUS_TOKEN = process.env.DIRECTUS_STATIC_TOKEN;
const headers = {
  "Content-Type": "application/json",
  Authorization: `Bearer ${DIRECTUS_TOKEN}`,
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");

  try {
    let endpoint = "";
    if (type === "departments") endpoint = `${DIRECTUS_URL}/items/department`;
    else if (type === "users") endpoint = `${DIRECTUS_URL}/items/user`;
    else {
      endpoint = `${DIRECTUS_URL}/items/assets_and_equipment?fields=*,item_id.item_name,employee.user_fname,employee.user_lname,department.department_description`;
    }

    const res = await fetch(endpoint, { headers, cache: "no-store" });
    return NextResponse.json(await res.json());
  } catch (error) {
    return NextResponse.json({ error: "Fetch error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const typeRes = await fetch(`${DIRECTUS_URL}/items/item_type`, {
      method: "POST",
      headers,
      body: JSON.stringify({ type_name: body.item_type }),
    }).then((r) => r.json());

    const itemRes = await fetch(`${DIRECTUS_URL}/items/items`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        item_name: body.item_name,
        item_type: typeRes.data.id,
      }),
    }).then((r) => r.json());

    const finalAsset = await fetch(
      `${DIRECTUS_URL}/items/assets_and_equipment`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({
          barcode: body.barcode,
          condition: body.condition,
          quantity: Number(body.quantity),
          cost_per_item: Number(body.cost_per_item),
          total: Number(body.quantity) * Number(body.cost_per_item),
          item_id: itemRes.data.id,
          department: Number(body.department),
          employee: body.employee ? Number(body.employee) : null,
          encoder: Number(body.encoder) || 1,
          date_acquired: body.date_acquired,
        }),
      },
    ).then((r) => r.json());

    return NextResponse.json(finalAsset);
  } catch (error) {
    return NextResponse.json({ error: "Save error" }, { status: 500 });
  }
}
