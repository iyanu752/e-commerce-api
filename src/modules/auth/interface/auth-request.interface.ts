// auth/interfaces/auth-request.interface.ts
import { Request } from 'express';
import { User } from '../../../schemas/user.schema';

export interface AuthenticatedRequest extends Request {
  user: User;
}
