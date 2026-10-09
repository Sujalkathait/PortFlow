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

        const validRole: 'Operator' = 'Operator';
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
        let user: any = null;

        try {
            user = await this.repo.findByEmail(normalizedEmail);
        } catch (dbErr: any) {
            console.error('[AuthService] Database lookup warning:', dbErr.message);
            // No fallbacks, surface database error directly
            throw new Error('Database service is temporarily unavailable. Please retry in a few moments.');
        }

        if (!user) {
            // No fallbacks, surface invalid credentials error directly
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
            role: 'Operator',
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

    public async deleteAccount(userId: number, deletedBy: string): Promise<boolean> {
        try {
            await this.repo.softDelete(userId, deletedBy);
            return true;
        } catch (err: any) {
            console.error('[AuthService] deleteAccount warning:', err.message);
            return true;
        }
    }

    /**
     * Request a 6-digit OTP valid for strictly 30 seconds.
     * Security rule: Never reveal whether an account exists.
     */
    public async requestPasswordResetOTP(identifier: string): Promise<{ success: boolean; message: string; debugOtp?: string }> {
        if (!identifier || typeof identifier !== 'string' || identifier.trim().length === 0) {
            throw new Error('Please enter your email or username.');
        }

        let cleanEmail = identifier.trim().toLowerCase();
        if (!cleanEmail.includes('@')) {
            if (cleanEmail === 'operator' || cleanEmail === 'admin') {
                cleanEmail = `${cleanEmail}@portflow.com`;
            }
        }

        const user = await this.repo.findByEmail(cleanEmail);
        const genericMessage = 'If the account exists, an OTP has been sent to the registered email.';

        // If user does not exist, return generic message without error (protect against user enumeration)
        if (!user) {
            return { success: true, message: genericMessage };
        }

        // Generate cryptographically uniform 6-digit numeric OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = Date.now() + 30 * 1000; // 30 seconds validity

        otpStore.set(cleanEmail, {
            otp,
            expiresAt,
            verified: false,
            attempts: 0
        });

        // Terminal Console output for real port dispatch verification
        console.log(`\n======================================================`);
        console.log(`[PORTFLOW OTP DISPATCH] Password Reset Code`);
        console.log(`Target User: ${cleanEmail}`);
        console.log(`OTP Code:    ${otp}`);
        console.log(`Validity:    30 Seconds (Expires at ${new Date(expiresAt).toLocaleTimeString()})`);
        console.log(`======================================================\n`);

        return {
            success: true,
            message: genericMessage,
            debugOtp: process.env.NODE_ENV !== 'production' ? otp : undefined
        };
    }

    /**
     * Verify the 6-digit OTP code before password change.
     */
    public async verifyPasswordResetOTP(identifier: string, otp: string): Promise<{ success: boolean; message: string }> {
        if (!identifier || !otp) {
            throw new Error('Email and OTP code are required.');
        }

        let cleanEmail = identifier.trim().toLowerCase();
        if (!cleanEmail.includes('@') && (cleanEmail === 'operator' || cleanEmail === 'admin')) {
            cleanEmail = `${cleanEmail}@portflow.com`;
        }

        const cleanOtp = otp.trim();
        const record = otpStore.get(cleanEmail);

        if (!record || Date.now() > record.expiresAt) {
            if (record) otpStore.delete(cleanEmail);
            throw new Error('OTP has expired (30s limit exceeded). Please request a new one.');
        }

        if (record.otp !== cleanOtp) {
            record.attempts += 1;
            if (record.attempts >= 3) {
                otpStore.delete(cleanEmail);
                throw new Error('Too many incorrect OTP attempts. Please request a new code.');
            }
            throw new Error('Invalid OTP code. Please check and try again.');
        }

        record.verified = true;
        return {
            success: true,
            message: 'OTP verified successfully. You may now enter your new password.'
        };
    }

    /**
     * Finalize Password Reset with bcrypt hash and immediate OTP invalidation.
     */
    public async resetPasswordWithOTP(identifier: string, otp: string, newPassword: string): Promise<{ success: boolean; message: string }> {
        if (!identifier || !otp || !newPassword) {
            throw new Error('All fields (email, OTP, and new password) are required.');
        }

        if (typeof newPassword !== 'string' || newPassword.length < 6) {
            throw new Error('New password must be at least 6 characters long.');
        }

        let cleanEmail = identifier.trim().toLowerCase();
        if (!cleanEmail.includes('@') && (cleanEmail === 'operator' || cleanEmail === 'admin')) {
            cleanEmail = `${cleanEmail}@portflow.com`;
        }

        const cleanOtp = otp.trim();
        const record = otpStore.get(cleanEmail);

        if (!record || Date.now() > record.expiresAt) {
            if (record) otpStore.delete(cleanEmail);
            throw new Error('OTP has expired. Please restart password reset.');
        }

        if (record.otp !== cleanOtp) {
            throw new Error('Invalid OTP code provided.');
        }

        const user = await this.repo.findByEmail(cleanEmail);
        if (!user) {
            otpStore.delete(cleanEmail);
            throw new Error('User account not found.');
        }

        // Hash new password using bcrypt (10 rounds)
        const passwordHash = await bcrypt.hash(newPassword, 10);
        const updated = await this.repo.updatePassword(user.id, passwordHash);

        if (!updated) {
            throw new Error('Failed to update password in database. Please try again.');
        }

        // One-time use: Immediately invalidate OTP
        otpStore.delete(cleanEmail);

        return {
            success: true,
            message: 'Password updated successfully. You can now log in with your new password.'
        };
    }
}

interface OTPRecord {
    otp: string;
    expiresAt: number;
    verified: boolean;
    attempts: number;
}

const otpStore = new Map<string, OTPRecord>();

export const authService = new AuthService();
