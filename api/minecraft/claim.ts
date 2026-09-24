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

  // API key check
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

  // Get player username from query
  let playerUsername =
    typeof req.query?.player_username === 'string'
      ? req.query.player_username.trim()
      : '';

  // Fallback: try JSON body
  if (!playerUsername) {
    const body = req.body || {};

    if (typeof body === 'string') {
      try {
        const parsedBody = JSON.parse(body);

        if (
          parsedBody &&
          typeof parsedBody.player_username === 'string'
        ) {
          playerUsername =
            parsedBody.player_username.trim();
        }
      } catch {
        // Ignore invalid JSON body
      }
    } else if (
      typeof body.player_username === 'string'
    ) {
      playerUsername =
        body.player_username.trim();
    }
  }

  if (!playerUsername) {
    return res.status(400).json({
      success: false,
      message: 'player_username is required.',
    });
  }

  // Supabase server configuration
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

  // Find oldest pending paid delivery for this player
  const { data: pending, error: findError } =
    await supabase
      .from('store_deliveries')
      .select(`
        id,
        order_id,
        player_username,
        commands,
        status,
        attempts,
        created_at,
        store_orders!inner (
          order_number,
          payment_status
        )
      `)
      .eq('status', 'pending')
      .eq('player_username', playerUsername)
      .eq('store_orders.payment_status', 'paid')
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();

  if (findError) {
    return res.status(500).json({
      success: false,
      message: findError.message,
    });
  }

  if (!pending) {
    return res.status(200).json({
      success: true,
      delivery: null,
      message:
        `No pending delivery found for ${playerUsername}.`,
    });
  }

  // Claim the delivery
  const { data: claimed, error: claimError } =
    await supabase
      .from('store_deliveries')
      .update({
        status: 'processing',
      })
      .eq('id', pending.id)
      .eq('status', 'pending')
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
      .maybeSingle();

  if (claimError) {
    return res.status(500).json({
      success: false,
      message: claimError.message,
    });
  }

  // Another request may have claimed it first
  if (!claimed) {
    return res.status(409).json({
      success: false,
      message:
        'Delivery was already claimed by another request.',
    });
  }

  return res.status(200).json({
    success: true,
    message: 'Delivery claimed successfully.',
    delivery: claimed,
  });
}