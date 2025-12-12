/**
 * TR: Kullanıcı state yönetimi için EntityStore.
 * EN: EntityStore for user state management.
 *
 * @author Ahmet ALTUN
 * @github github.com/biyonik
 * @linkedin linkedin.com/in/biyonik
 * @email ahmet.altun60@gmail.com
 */
import { Injectable } from '@angular/core';
import { EntityStore, PaginatedResponse, FetchParams, EntityId } from 'ng-signalify/store';
import { User } from './user.model';

// Mock API service
const MOCK_USERS: User[] = [
  {
    id: 1,
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    age: 30,
    role: 'admin',
    status: 'active',
    birthDate: new Date('1993-05-15'),
    emailVerified: true,
    bio: 'Software developer and tech enthusiast',
    createdAt: new Date('2023-01-15'),
    updatedAt: new Date('2023-01-15')
  },
  {
    id: 2,
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane@example.com',
    age: 28,
    role: 'user',
    status: 'active',
    birthDate: new Date('1995-08-22'),
    emailVerified: true,
    bio: 'UI/UX designer passionate about creating beautiful interfaces',
    createdAt: new Date('2023-02-10'),
    updatedAt: new Date('2023-02-10')
  },
  {
    id: 3,
    firstName: 'Bob',
    lastName: 'Johnson',
    email: 'bob@example.com',
    age: 35,
    role: 'user',
    status: 'inactive',
    birthDate: new Date('1988-12-03'),
    emailVerified: false,
    bio: 'Project manager with 10 years of experience',
    createdAt: new Date('2023-03-05'),
    updatedAt: new Date('2023-03-05')
  },
  {
    id: 4,
    firstName: 'Alice',
    lastName: 'Williams',
    email: 'alice@example.com',
    age: 26,
    role: 'user',
    status: 'pending',
    birthDate: new Date('1997-04-18'),
    emailVerified: false,
    bio: 'Marketing specialist and content creator',
    createdAt: new Date('2023-04-12'),
    updatedAt: new Date('2023-04-12')
  },
  {
    id: 5,
    firstName: 'Charlie',
    lastName: 'Brown',
    email: 'charlie@example.com',
    age: 32,
    role: 'guest',
    status: 'active',
    birthDate: new Date('1991-07-25'),
    emailVerified: true,
    bio: 'Data analyst and statistics expert',
    createdAt: new Date('2023-05-20'),
    updatedAt: new Date('2023-05-20')
  },
  {
    id: 6,
    firstName: 'Diana',
    lastName: 'Martinez',
    email: 'diana@example.com',
    age: 29,
    role: 'user',
    status: 'active',
    birthDate: new Date('1994-11-30'),
    emailVerified: true,
    bio: 'Full stack developer specializing in Angular',
    createdAt: new Date('2023-06-08'),
    updatedAt: new Date('2023-06-08')
  },
  {
    id: 7,
    firstName: 'Edward',
    lastName: 'Davis',
    email: 'edward@example.com',
    age: 40,
    role: 'admin',
    status: 'active',
    birthDate: new Date('1983-02-14'),
    emailVerified: true,
    bio: 'Senior architect and team lead',
    createdAt: new Date('2023-07-01'),
    updatedAt: new Date('2023-07-01')
  }
];

@Injectable({ providedIn: 'root' })
export class UserStore extends EntityStore<User> {
  constructor() {
    super({
      name: 'users',
      selectId: (user) => user.id,
      defaultPageSize: 10,
      cacheTTL: 5 * 60 * 1000,
      optimistic: true
    });
  }

  protected async fetchAll(params: FetchParams): Promise<PaginatedResponse<User>> {
    // Simulate API call delay
    await this.delay(500);
    
    let filtered = [...MOCK_USERS];
    
    // Apply search filter
    if (params.filters?.['search']) {
      const search = String(params.filters['search']).toLowerCase();
      filtered = filtered.filter((u: User) => 
        u.firstName.toLowerCase().includes(search) ||
        u.lastName.toLowerCase().includes(search) ||
        u.email.toLowerCase().includes(search)
      );
    }
    
    // Apply sorting with null checks
    if (params.sort) {
      filtered.sort((a, b) => {
        const aVal = a[params.sort!.field as keyof User];
        const bVal = b[params.sort!.field as keyof User];
        // Use == null to check for both null and undefined
        if (aVal == null || bVal == null) return 0;
        const modifier = params.sort!.direction === 'asc' ? 1 : -1;
        return aVal > bVal ? modifier : -modifier;
      });
    }
    
    // ✅ PAGINATION - Use defaults if undefined
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 10;
    
    // Debug logging
    console.log('🔍 UserStore fetchAll Pagination:', { 
      page, 
      pageSize, 
      totalFiltered: filtered.length,
      paramsReceived: params 
    });
    
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const data = filtered.slice(start, end);
    
    console.log('🔍 UserStore Sliced Data:', { 
      start, 
      end, 
      slicedCount: data.length,
      actualData: data.map(u => ({ id: u.id, name: `${u.firstName} ${u.lastName}` }))
    });
    
    return {
      data,
      total: filtered.length,
      page,
      pageSize,
      totalPages: Math.ceil(filtered.length / pageSize)
    };
  }

  protected async fetchOne(id: EntityId): Promise<User> {
    await this.delay(300);
    const user = MOCK_USERS.find(u => u.id === id);
    if (!user) throw new Error('User not found');
    return { ...user };
  }

  protected async createOne(data: Partial<User>): Promise<User> {
    await this.delay(500);
    const newUser = {
      ...data,
      id: Math.max(...MOCK_USERS.map(u => u.id)) + 1,
      createdAt: new Date(),
      updatedAt: new Date()
    } as User;
    MOCK_USERS.push(newUser);
    return newUser;
  }

  protected async updateOne(id: EntityId, data: Partial<User>): Promise<User> {
    await this.delay(500);
    const index = MOCK_USERS.findIndex(u => u.id === id);
    if (index === -1) throw new Error('User not found');
    
    MOCK_USERS[index] = {
      ...MOCK_USERS[index],
      ...data,
      updatedAt: new Date()
    };
    return { ...MOCK_USERS[index] };
  }

  protected async deleteOne(id: EntityId): Promise<void> {
    await this.delay(500);
    const index = MOCK_USERS.findIndex(u => u.id === id);
    if (index === -1) throw new Error('User not found');
    MOCK_USERS.splice(index, 1);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
