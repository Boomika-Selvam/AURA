import jwt from 'jsonwebtoken';

const accessExpiry = '15m';
const refreshExpiry = '7d';

export function signAccessToken(user) {
  return jwt.sign({ sub: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET || 'dev-secret', {
    expiresIn: accessExpiry
  });
}

export function signRefreshToken(user) {
  return jwt.sign({ sub: user.id }, process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret', {
    expiresIn: refreshExpiry
  });
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret');
}
