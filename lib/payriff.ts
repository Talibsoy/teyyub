const PAYRIFF_API_URL = "https://api.payriff.com/api/v2";
const PAYRIFF_API_KEY = process.env.PAYRIFF_API_KEY || "";

export interface PayriffOrderResult {
  orderId: string;
  sessionId: string;
  paymentUrl: string;
}

export async function createPayriffOrder(params: {
  amount: number;
  description: string;
  bookingId: string;
}): Promise<PayriffOrderResult> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.natourefly.com";

  const res = await fetch(`${PAYRIFF_API_URL}/orders/createOrder`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: PAYRIFF_API_KEY,
    },
    body: JSON.stringify({
      body: {
        amount: params.amount,
        currencyType: "AZN",
        description: params.description,
        approveURL: `${baseUrl}/payment/success?bookingId=${params.bookingId}`,
        cancelURL: `${baseUrl}/payment/cancel?bookingId=${params.bookingId}`,
        declineURL: `${baseUrl}/payment/decline?bookingId=${params.bookingId}`,
        language: "AZ",
        directPay: false,
      },
    }),
  });

  const data = await res.json();

  if (data.code !== "00000") {
    throw new Error(data.message || "Payriff xətası");
  }

  return {
    orderId: data.payload.orderId,
    sessionId: data.payload.sessionId,
    paymentUrl: data.payload.paymentUrl,
  };
}

export async function getPayriffOrderStatus(orderId: string): Promise<string> {
  const res = await fetch(`${PAYRIFF_API_URL}/orders/getOrderInformation`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: PAYRIFF_API_KEY,
    },
    body: JSON.stringify({ body: { orderId } }),
  });

  const data = await res.json();
  if (data.code !== "00000") throw new Error(data.message);
  return data.payload.orderStatus; // APPROVED | DECLINED | CANCELED | WAITING
}
