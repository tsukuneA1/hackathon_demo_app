const GITHUB_CLIENT_ID = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID;

export const getGitHubAuthUrl = () => {
  const redirectUri = `${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}/auth/callback`;
  
  const params = new URLSearchParams({
    client_id: GITHUB_CLIENT_ID || '',
    redirect_uri: redirectUri,
    scope: 'read:user user:email public_repo',
  });

  return `https://github.com/login/oauth/authorize?${params.toString()}`;
};