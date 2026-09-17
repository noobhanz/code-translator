export interface User {
  id: string;
}

export type UserId = string;

export enum Status {
  Active,
  Disabled,
}

export const DEFAULT_LIMIT = 10;

let currentUser: User | null = null;

/**
 * Looks up a user by id.
 */
export async function getUser(id: UserId): Promise<User | null> {
  return currentUser;
}

export class UserService {
  async find(id: UserId): Promise<User | null> {
    return getUser(id);
  }
}

export { getUser as lookupUser };
export { Status } from "./status";
export * from "./more";

function hidden() {
  return currentUser;
}

export default UserService;
