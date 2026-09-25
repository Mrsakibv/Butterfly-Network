import { createClient } from '@supabase/supabase-js';

export default async function handler(req: any, res: any) {
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

  let deliveryId =
    typeof req.query?.delivery_id === 'string'
      ? req.query.delivery_id.trim()
      : '';

  if (!deliveryId) {
    const body = req.body || {};

    if (typeof body === 'string') {
      try {
        const parsed = JSON.parse(body);
        if (parsed && typeof parsed.delivery_id === 'string') {
          deliveryId = parsed.delivery_id.trim();
        }
      } catch {}
    } else if (typeof body.delivery_id === 'string') {
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

  const { data: delivery, error: findError } = await supabase
    .from('store_deliveries')
    .select(`
      id,
      order_id,
      status,
      store_orders!inner (
        payment_status,
        delivery_status
      )
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

  const order = Array.isArray(delivery.store_orders)
    ? delivery.store_orders[0]
    : delivery.store_orders;

  if (
    delivery.status === 'completed' &&
    order?.delivery_status === 'completed'
  ) {
    return res.status(200).json({
      success: true,
      message: 'Delivery is already completed.',
      delivery_id: deliveryId,
    });
  }

  if (delivery.status !== 'pending') {
    return res.status(409).json({
      success: false,
      message:
        `Delivery is not pending. Current status: ${delivery.status}`,
    });
  }

  if (order?.payment_status !== 'paid') {
    return res.status(409).json({
      success: false,
      message: 'Order payment is not verified.',
    });
  }

  if (order?.delivery_status !== 'pending') {
    return res.status(409).json({
      success: false,
      message:
        `Order delivery is not pending. Current status: ${order?.delivery_status}`,
    });
  }

  const deliveredAt = new Date().toISOString();

  const { data: completedDelivery, error: deliveryError } =
    await supabase
      .from('store_deliveries')
      .update({
        status: 'completed',
        delivered_at: deliveredAt,
        error_message: null,
      })
      .eq('id', deliveryId)
      .eq('status', 'pending')
      .select('id, order_id, status, delivered_at')
      .maybeSingle();

  if (deliveryError) {
    return res.status(500).json({
      success: false,
      message: deliveryError.message,
    });
  }

  if (!completedDelivery) {
    const { data: current } = await supabase
      .from('store_deliveries')
      .select('status')
      .eq('id', deliveryId)
      .maybeSingle();

    if (current?.status === 'completed') {
      return res.status(200).json({
        success: true,
        message: 'Delivery was already completed.',
        delivery_id: deliveryId,
      });
    }

    return res.status(409).json({
      success: false,
      message: 'Delivery could not be completed.',
    });
  }

  const { error: orderError } = await supabase
    .from('store_orders')
    .update({
      delivery_status: 'completed',
      completed_at: deliveredAt,
    })
    .eq('id', delivery.order_id)
    .eq('payment_status', 'paid')
    .eq('delivery_status', 'pending');

  if (orderError) {
    return res.status(500).json({
      success: false,
      message: orderError.message,
    });
  }

  return res.status(200).json({
    success: true,
    message: 'Delivery and order completed successfully.',
    delivery_id: deliveryId,
    order_id: delivery.order_id,
    delivered_at: deliveredAt,
  });
}
