import { createClient } from '@supabase/supabase-js';

export default async function handler(
  req: any,
  res: any
) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed',
    });
  }

  const apiKey = req.headers['x-api-key'];
  const expectedKey = process.env.MINECRAFT_API_KEY;

  if (!expectedKey) {
    return res.status(500).json({
      success: false,
      message: 'Minecraft API key is not configured.',
    });
  }

  if (apiKey !== expectedKey) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized.',
    });
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseServiceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return res.status(500).json({
      success: false,
      message: 'Supabase server configuration is missing.',
    });
  }

  // Accept delivery_id from URL query first.
  // Also keep body support as fallback.
  let deliveryId =
    typeof req.query?.delivery_id === 'string'
      ? req.query.delivery_id.trim()
      : '';

  if (!deliveryId) {
    const body = req.body || {};

    if (typeof body === 'string') {
      try {
        const parsedBody = JSON.parse(body);

        if (
          parsedBody &&
          typeof parsedBody.delivery_id === 'string'
        ) {
          deliveryId = parsedBody.delivery_id.trim();
        }
      } catch {
        // Ignore invalid JSON body.
      }
    } else if (
      typeof body.delivery_id === 'string'
    ) {
      deliveryId = body.delivery_id.trim();
    }
  }

  if (!deliveryId) {
    return res.status(400).json({
      success: false,
      message: 'delivery_id is required.',
    });
  }

  const supabase = createClient(
    supabaseUrl,
    supabaseServiceKey
  );

  const { data: delivery, error: findError } =
    await supabase
      .from('store_deliveries')
      .select(`
        id,
        order_id,
        status
      `)
      .eq('id', deliveryId)
      .maybeSingle();

  if (findError) {
    return res.status(500).json({
      success: false,
      message: findError.message,
    });
  }

  if (!delivery) {
    return res.status(404).json({
      success: false,
      message: 'Delivery not found.',
    });
  }

  if (delivery.status !== 'processing') {
    return res.status(409).json({
      success: false,
      message:
        `Delivery is not processing. Current status: ${delivery.status}`,
    });
  }

  const deliveredAt =
    new Date().toISOString();

  const { error: deliveryError } =
    await supabase
      .from('store_deliveries')
      .update({
        status: 'completed',
        delivered_at: deliveredAt,
        error_message: null,
      })
      .eq('id', deliveryId)
      .eq('status', 'processing');

  if (deliveryError) {
    return res.status(500).json({
      success: false,
      message: deliveryError.message,
    });
  }

  const { error: orderError } =
    await supabase
      .from('store_orders')
      .update({
        delivery_status: 'completed',
        completed_at: deliveredAt,
      })
      .eq('id', delivery.order_id);

  if (orderError) {
    return res.status(500).json({
      success: false,
      message: orderError.message,
    });
  }

  return res.status(200).json({
    success: true,
    message: 'Delivery completed successfully.',
    delivery_id: deliveryId,
    delivered_at: deliveredAt,
  });
}