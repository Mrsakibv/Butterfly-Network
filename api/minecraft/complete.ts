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

  let deliveryId =
    typeof req.query?.delivery_id === 'string'
      ? req.query.delivery_id.trim()
      : '';

  if (!deliveryId) {
    const body = req.body || {};

    if (typeof body === 'string') {
      try {
        const parsed = JSON.parse(body);
        if (typeof parsed?.delivery_id === 'string') {
          deliveryId = parsed.delivery_id.trim();
        }
      } catch {
        // Ignore invalid JSON.
      }
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

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return res.status(500).json({
      success: false,
      message: 'Supabase server configuration is missing.',
    });
  }

  const supabase = createClient(
    supabaseUrl,
    supabaseServiceKey
  );

  const { data, error } = await supabase.rpc(
    'complete_store_delivery',
    { p_delivery_id: deliveryId }
  );

  if (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }

  const result =
    data && typeof data === 'object' && !Array.isArray(data)
      ? data
      : null;

  if (!result) {
    return res.status(500).json({
      success: false,
      message: 'Invalid completion response.',
    });
  }

  if (!result.success) {
    return res.status(409).json(result);
  }

  return res.status(200).json(result);
}
