import { NextRequest, NextResponse } from "next/server";
import { getOrderInfo } from "@/lib/ratehawk-booking";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const orderId = searchParams.get("order_id");

  if (!orderId) {
    return NextResponse.json({ error: "order_id lazımdır" }, { status: 400 });
  }

  const result = await getOrderInfo([orderId]);

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 404 });
  }

  return NextResponse.json(result.order);
}

export async function POST(req: NextRequest) {
  try {
    const { order_ids } = await req.json();
    if (!order_ids?.length) {
      return NextResponse.json({ error: "order_ids lazımdır" }, { status: 400 });
    }

    const result = await getOrderInfo(order_ids);

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 404 });
    }

    return NextResponse.json(result.order);
  } catch {
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
