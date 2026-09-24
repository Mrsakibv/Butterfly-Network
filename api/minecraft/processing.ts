import { createClient } from '@supabase/supabase-js';

export default async function handler(
  req: any,
  res: any
) {
  if (req.method !== 'GET') {
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

  const supabase = createClient(
    supabaseUrl,
    supabaseServiceKey
  );

  const { data, error } = await supabase
    .from('store_deliveries')
    .select(`
      id,
      order_id,
      player_username,
      commands,
      status,
      attempts,
      created_at,
      store_orders (
        order_number,
        payment_status
      )
    `)
    .eq('status', 'processing')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }

  if (!data) {
    return res.status(200).json({
      success: true,
      delivery: null,
      message: 'No processing deliveries.',
    });
  }

  return res.status(200).json({
    success: true,
    delivery: data,
  });
}