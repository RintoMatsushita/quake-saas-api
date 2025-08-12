import Stripe from "stripe";
export const config = { api: { bodyParser: false } }; // これが重要（rawで受ける）

const stripe = new Stripe(process.env.STRIPE_SECRET);

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  // raw body を手で組み立てる
  const buf = await new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", c => chunks.push(c));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });

  const sig = req.headers["stripe-signature"];
  let event;
  try {
    event = stripe.webhooks.constructEvent(
      buf,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    console.log("✅ Checkout completed for uid:", session.metadata?.uid);
    // ここで Firestore を更新したい場合は、別APIを叩く or 将来Auth連携で直接処理
  }

  return res.json({ received: true });
}
