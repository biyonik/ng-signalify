/**
 * TR: Kullanıcı veri modeli.
 * EN: User data model.
 *
 * @author Ahmet ALTUN
 * @github github.com/biyonik
 * @linkedin linkedin.com/in/biyonik
 * @email ahmet.altun60@gmail.com
 */
export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  age: number;
  role: 'admin' | 'user' | 'guest';
  status: 'active' | 'inactive' | 'pending';
  birthDate: Date | null;
  emailVerified: boolean;
  bio: string;
  createdAt?: Date;
  updatedAt?: Date;
}
