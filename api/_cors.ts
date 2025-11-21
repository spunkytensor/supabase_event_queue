import { VercelRequest, VercelResponse } from '@vercel/node';

export function setCORSHeaders(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );
}

export function handleCORS(req: VercelRequest, res: VercelResponse): boolean {
  setCORSHeaders(res);
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return true;
  }
  return false;
}
