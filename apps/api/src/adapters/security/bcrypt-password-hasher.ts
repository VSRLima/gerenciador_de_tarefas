import bcrypt from 'bcryptjs';
import { PasswordHasherPort } from '../../core/ports/password-hasher-port';

export class BcryptPasswordHasher implements PasswordHasherPort {
  public async hash(value: string): Promise<string> {
    return bcrypt.hash(value, 10);
  }

  public async compare(value: string, hashedValue: string): Promise<boolean> {
    return bcrypt.compare(value, hashedValue);
  }
}
