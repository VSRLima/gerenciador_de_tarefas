import { AuthenticatedUser } from '../entities/user';

export interface TokenServicePort {
  sign(payload: AuthenticatedUser): string;
  verify(token: string): AuthenticatedUser | null;
  revoke(token: string | null | undefined): void;
}
