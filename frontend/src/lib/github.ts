const GITHUB_CLIENT_ID = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID;
const REDIRECT_URI = `${window.location.origin}/auth/callback`;

export const getGitHubAuthUrl = () => {
  const params = new URLSearchParams({
    client_id: GITHUB_CLIENT_ID || '',
    redirect_uri: REDIRECT_URI,
    scope: 'read:user user:email public_repo',
  });

  return `https://github.com/login/oauth/authorize?${params.toString()}`;
};

export const exchangeCodeForToken = async (code: string) => {
  // Note: In production, this should be done server-side for security
  // For demo purposes, we'll use GitHub's web flow
  const response = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      client_id: GITHUB_CLIENT_ID,
      client_secret: process.env.NEXT_PUBLIC_GITHUB_CLIENT_SECRET, // This should be server-side only
      code,
    }),
  });

  const data = await response.json();
  return data.access_token;
};