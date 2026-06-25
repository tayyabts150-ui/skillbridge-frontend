import { User } from './interface';

export const admin: User = {
  id: 1,
  name: 'SkillBridge',
  email: 'admin@skillbridge.com',
  avatar: 'images/avatar.jpg',
};

export const guest: User = {
  name: 'unknown',
  email: 'unknown',
  avatar: 'images/avatar-default.jpg',
};
