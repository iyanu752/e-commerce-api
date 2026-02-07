import { UserRole } from '../../schemas/user.schema';

export interface CurrentUserPayload {
  id: string;
  email: string;
  role: UserRole;
}
