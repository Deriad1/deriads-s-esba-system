// Minimal test endpoint
export default async function handler(req, res) {
  return res.json({
    status: 'success',
    message: 'Archives test endpoint works!',
    data: []
  });
}
