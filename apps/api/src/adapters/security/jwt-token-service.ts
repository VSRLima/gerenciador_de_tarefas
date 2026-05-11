import jwt, { JwtPayload, SignOptions } from 'jsonwebtoken';
import { AuthenticatedUser } from '../../core/entities/user';
import { TokenServicePort } from '../../core/ports/token-service-port';
import { env } from '../../shared/config/env';

export class JwtTokenService implements TokenServicePort {
  private readonly revokedTokens = new Map<string, number>();

  public sign(payload: AuthenticatedUser): string {
    return jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'],
    });
  }

  public verify(token: string): AuthenticatedUser | null {
    this.pruneRevokedTokens();

    if (this.revokedTokens.has(token)) {
      return null;
    }

    try {
      return jwt.verify(token, env.JWT_SECRET) as AuthenticatedUser;
    } catch {
      return null;
    }
  }

  public revoke(token: string | null | undefined): void {
    if (!token) {
      return;
    }

    const payload = jwt.verify(token, env.JWT_SECRET, {
      ignoreExpiration: true,
    }) as JwtPayload;

    this.pruneRevokedTokens();
    this.revokedTokens.set(
      token,
      typeof payload.exp === 'number' ? payload.exp * 1_000 : Date.now(),
    );
  }

  private pruneRevokedTokens(): void {
    const now = Date.now();

    for (const [token, expiresAt] of this.revokedTokens.entries()) {
      if (expiresAt <= now) {
        this.revokedTokens.delete(token);
      }
    }
  }
}
