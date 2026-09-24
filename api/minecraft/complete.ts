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

  const { delivery_id } = req.body || {};

  if (!delivery_id) {
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
      status
    `)
    .eq('id', delivery_id)
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
      message: `Delivery is not processing. Current status: ${delivery.status}`,
    });
  }

  const deliveredAt = new Date().toISOString();

  const { error: deliveryError } = await supabase
    .from('store_deliveries')
    .update({
      status: 'completed',
      delivered_at: deliveredAt,
      error_message: null,
    })
    .eq('id', delivery_id)
    .eq('status', 'processing');

  if (deliveryError) {
    return res.status(500).json({
      success: false,
      message: deliveryError.message,
    });
  }

  const { error: orderError } = await supabase
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
    delivery_id: delivery_id,
    delivered_at: deliveredAt,
  });
}