import setting
 from "../config/setting";
const SUPABASE_URL = setting.SUPABASE_URL;
const SUPABASE_ANON_KEY = setting.SUPABASE_KEY;

export async function sendOrderEmail(
  userName: any,
  userEmail: any,
  cartList: any,
  address: any,
  cartTotal: any,
  orderId: any,
  orderDate: any
): Promise<void> {
  const payload: any = {
    userName,
    userEmail,
    cartList,
    address,
    cartTotal,
    orderId,
    orderDate,
  };

  try {
    const res = await fetch(
      `${SUPABASE_URL}/functions/v1/clever-function`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    if (!res.ok) {
      console.error("Email sending failed with status:", res);
    }
  } catch (err) {
    console.error("Email sending failed:", err);
  }
}

export async function sendDeliveryEmail(
  payload: any
): Promise<void> {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/functions/v1/deliveryMail`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    if (!res.ok) {
      console.error("Email sending failed with status:", res.status);
    } else {
      console.log("Email sent successfully");
    }
  } catch (err) {
    console.error("Email sending failed:", err);
  }
}

export async function sendNotification(
  payload: any
): Promise<void> {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/functions/v1/smart-endpoint`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    if (!res.ok) {
      console.error("Push notification failed with status:", res.status);
    } else {
      console.log("Notification sent successfully");
    }
  } catch (err) {
    console.error("Notification sending failed:", err);
  }
}
