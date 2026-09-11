import Razorpay from "razorpay";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { amount, receipt } = await req.json();
    const amountInPaise = Number(amount);

    if (!Number.isInteger(amountInPaise) || amountInPaise < 100) {
      return NextResponse.json(
        { error: "Amount must be an integer of at least 100 paise" },
        { status: 400 },
      );
    }

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return NextResponse.json({ error: "Razorpay is not configured" }, { status: 500 });
    }

    const instance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const order = await instance.orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt: typeof receipt === "string" && receipt.length > 0
        ? receipt.slice(0, 40)
        : `receipt_${Date.now()}`,
    });

    return NextResponse.json({
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (err) {
    const status = typeof err === "object" && err !== null && "statusCode" in err
      ? Number((err as { statusCode?: number }).statusCode)
      : 500;

    return NextResponse.json(
      { error: "Unable to create Razorpay order" },
      { status: status === 401 ? 401 : 500 },
    );
  }
}