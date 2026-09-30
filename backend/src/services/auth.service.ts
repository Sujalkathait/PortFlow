import bcrypt from 'bcryptjs';
import { IAuthService, IUserRepository } from '../interfaces';
import { RegisterUserDTO, LoginDTO, AuthResponseDTO } from '../models';
import { userRepository } from '../repositories/user.repository';
import { generateToken } from '../middleware/auth';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class AuthService implements IAuthService {
    private repo: IUserRepository;

    constructor(repo: IUserRepository = userRepository) {
        this.repo = repo;
    }

    public async register(data: RegisterUserDTO): Promise<AuthResponseDTO> {
        const { email, password, full_name, role } = data;

        if (!email || !EMAIL_REGEX.test(email)) {
            throw new Error('Please provide a valid email address.');
        }

        if (!password || typeof password !== 'string' || password.length < 6) {
            throw new Error('Password must be at least 6 characters long.');
        }

        if (!full_name || typeof full_name !== 'string' || full_name.trim().length < 2) {
            throw new Error('Full name must be at least 2 characters.');
        }

        const normalizedEmail = email.toLowerCase().trim();
        const existing = await this.repo.findByEmail(normalizedEmail);
        if (existing) {
            throw new Error('An account with this email already exists.');
        }

        const validRole = (role === 'Admin' ? 'Admin' : 'Operator') as 'Admin' | 'Operator';
        const passwordHash = await bcrypt.hash(password, 10);

        const user = await this.repo.create({
            email: normalizedEmail,
            password_hash: passwordHash,
            full_name: full_name.trim(),
            role: validRole,
        });

        const token = generateToken({
            id: user.id,
            email: user.email,
            role: validRole,
            fullName: user.full_name,
        });

        return {
            token,
            user: {
                id: user.id,
                email: user.email,
                full_name: user.full_name,
                role: user.role,
            },
        };
    }

    public async login(data: LoginDTO): Promise<AuthResponseDTO> {
        const { email, password } = data;

        if (!email || !password) {
            throw new Error('Email and password are required.');
        }

        const normalizedEmail = email.toLowerCase().trim();
        const user = await this.repo.findByEmail(normalizedEmail);
        if (!user) {
            throw new Error('Invalid email or password.');
        }

        let passwordMatch = await bcrypt.compare(password, user.password_hash);
        if (!passwordMatch && typeof password === 'string' && password.trim() !== password) {
            passwordMatch = await bcrypt.compare(password.trim(), user.password_hash);
        }
        if (!passwordMatch) {
            throw new Error('Invalid email or password.');
        }

        const token = generateToken({
            id: user.id,
            email: user.email,
            role: user.role as 'Admin' | 'Operator',
            fullName: user.full_name,
        });

        return {
            token,
            user: {
                id: user.id,
                email: user.email,
                full_name: user.full_name,
                role: user.role,
            },
        };
    }

    public async getCurrentUser(userId: number): Promise<any> {
        const user = await this.repo.findById(userId);
        if (!user) {
            throw new Error('User not found.');
        }
        return {
            id: user.id,
            email: user.email,
            full_name: user.full_name,
            role: user.role,
            created_at: user.created_at,
        };
    }
}

export const authService = new AuthService();
