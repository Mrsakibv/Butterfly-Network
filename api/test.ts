export default function handler(
  req: any,
  res: any
) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed',
    });
  }

  return res.status(200).json({
    success: true,
    message: 'Butterfly Network API is connected!',
  });
}