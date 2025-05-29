/**
 * A helper function to format the private key in the RS256 format
 * @param privateKey
 * @returns
 */
export const formatPrivateKey = (privateKey: string) => {
  // Remove any existing PEM headers/footers if present
  let cleanKey = privateKey
    .replace(/-----BEGIN PRIVATE KEY-----/g, '')
    .replace(/-----END PRIVATE KEY-----/g, '')
    .replace(/-----BEGIN RSA PRIVATE KEY-----/g, '')
    .replace(/-----END RSA PRIVATE KEY-----/g, '')
    .trim();
  
  // Remove all whitespace and newlines
  cleanKey = cleanKey.replace(/\s+/g, '');
  
  // Split into 64-character lines (standard PEM format)
  const lines = [];
  for (let i = 0; i < cleanKey.length; i += 64) {
    lines.push(cleanKey.slice(i, i + 64));
  }
  
  // Return properly formatted PEM private key
  return `-----BEGIN PRIVATE KEY-----\n${lines.join('\n')}\n-----END PRIVATE KEY-----`;
};
