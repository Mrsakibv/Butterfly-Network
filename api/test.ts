export default function handler(
  req: Request
): Response {
  if (req.method !== 'GET') {
    return Response.json(
      {
        success: false,
        message: 'Method not allowed',
      },
      { status: 405 }
    );
  }

  return Response.json({
    success: true,
    message: 'Butterfly Network API is connected!',
  });
}