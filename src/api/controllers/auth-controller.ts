import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../../infra/db';
import { UserResource } from '../resources/user-resource';

/**
 * AuthController
 * Handles user authentication
 */
export class AuthController {
  /**
   * Register a new user
   */
  public async register(req: Request, res: Response): Promise<void> {
    console.log(req.body);
    try {
      const { name, email, password } = req.body;

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        res.status(422).json({
          message: 'The email has already been taken.',
          errors: {
            email: ['The email has already been taken.'],
          },
        });
        return;
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const user = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
        },
      });

      res.status(201).json(UserResource.single(user, 'User registered successfully'));
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Internal server error',
      });
    }
  }

  /**
   * Login user
   */
  public async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      // Find user
      const user = await prisma.user.findUnique({
        where: { email },
        include: {
          roles: {
            include: { role: true }
          }
        }
      });

      if (!user) {
        res.status(401).json({
          status: 'error',
          message: 'Invalid credentials',
        });
        return;
      }

      // Check password
      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        res.status(401).json({
          status: 'error',
          message: 'Invalid credentials',
        });
        return;
      }

      // Generate token
      const token = jwt.sign(
        { uuid: user.uuid, email: user.email },
        process.env.JWT_SECRET || 'secret',
        { expiresIn: '168h' }
      );

      res.json({
        status: 'success',
        message: 'Login successful',
        data: {
          token,
          user: UserResource.transform(user),
        },
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Internal server error',
      });
    }
  }
}
