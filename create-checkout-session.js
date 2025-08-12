import Stripe from "stripe";
const stripe = new Stripe(process.env.STRIPE_SECRET);

// CORS簡易対応（Firebase Hostingから直接叩けるように）
function cors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: process.env.STRIPE_PRICE_ID, quantity: 1 }],
      success_url: `${process.env.SITE_URL}/?success=true`,
      cancel_url: `${process.env.SITE_URL}/?canceled=true`,
      metadata: { uid: "dev-uid" } // 後でFirebase AuthのUIDに差し替え
    });
    return res.status(200).json({ url: session.url });
  } catch (e) {
    return res.status(400).json({ error: e.message });
  }
}
