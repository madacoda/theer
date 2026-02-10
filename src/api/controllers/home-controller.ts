import type { Request, Response } from 'express';

/**
 * HomeController
 * Handles basic home requests
 */
export class HomeController {
  /**
   * index
   * Returns a hello world message
   * 
   * @param req - Express request
   * @param res - Express response
   */
  public async index(req: Request, res: Response): Promise<void> {
    res.json({
      message: 'Hello World',
      status: 'success',
    });
  }
}
