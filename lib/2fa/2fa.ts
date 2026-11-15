import speakeasy from 'speakeasy';
import QRCode from 'qrcode';

export async function generateSecret(email: string) {
  const secret = speakeasy.generateSecret({
    name: `Suzuki Bike (${email})`,
    length: 32,
  });

  const qrCode = await QRCode.toDataURL(secret.otpauth_url!);

  return {
    secret: secret.base32,
    qrCode,
    backupCodes: generateBackupCodes(),
  };
}

export function verifyToken(secret: string, token: string): boolean {
  return speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token,
    window: 2,
  });
}

export function verifyBackupCode(backupCodes: string, code: string): { valid: boolean; remaining: string } {
  const codes = backupCodes.split(',').map(c => c.trim());
  const index = codes.indexOf(code);

  if (index === -1) {
    return { valid: false, remaining: backupCodes };
  }

  codes.splice(index, 1);
  return { valid: true, remaining: codes.join(', ') };
}

export function generateBackupCodes(): string {
  const codes = [];
  for (let i = 0; i < 10; i++) {
    const code = Math.random().toString(36).substring(2, 10).toUpperCase();
    codes.push(code);
  }
  return codes.join(', ');
}
