import { Router, type Request, type Response } from 'express';
import { HomeController } from '../controllers/home-controller';
import { AuthController } from '../controllers/auth-controller';
import { TicketCategoryController } from '../controllers/ticket-category-controller';
import { TicketController } from '../controllers/ticket-controller';
import { authMiddleware } from '../middlewares/auth-middleware';
import { registerRequest, loginRequest } from '../validations/auth-validation';
import { ticketCategoryRequest } from '../validations/ticket-category-validation';
import { ticketRequest } from '../validations/ticket-validation';

const router = Router();
const homeController = new HomeController();
const authController = new AuthController();
const ticketCategoryController = new TicketCategoryController();
const ticketController = new TicketController();

/**
 * Public Routes
 */
router.get('/', (req, res) => homeController.index(req, res));

/**
 * Auth Routes Group
 */
router.post('/auth/register', registerRequest, (req: Request, res: Response) => 
  authController.register(req, res)
);

router.post('/auth/login', loginRequest, (req: Request, res: Response) => 
  authController.login(req, res)
);

/**
 * Protected Routes Group
 */
router.use(authMiddleware);

router.get('/profile', (req: Request, res: Response) => {
  res.json({
    status: 'success',
    message: 'Profile retrieved',
    data: (req as any).user,
  });
});

router.get('/ticket/category', (req: Request, res: Response) => ticketCategoryController.index(req, res));
router.post('/ticket/category', ticketCategoryRequest, (req: Request, res: Response) => ticketCategoryController.store(req, res));
router.get('/ticket/category/:uuid', (req: Request, res: Response) => ticketCategoryController.show(req, res));
router.put('/ticket/category/:uuid', ticketCategoryRequest, (req: Request, res: Response) => ticketCategoryController.update(req, res));
router.delete('/ticket/category/:uuid', (req: Request, res: Response) => ticketCategoryController.destroy(req, res));

router.get('/ticket', (req: Request, res: Response) => ticketController.index(req, res));
router.post('/ticket', ticketRequest, (req: Request, res: Response) => ticketController.store(req, res));
router.get('/ticket/:uuid', (req: Request, res: Response) => ticketController.show(req, res));
router.put('/ticket/:uuid', ticketRequest, (req: Request, res: Response) => ticketController.update(req, res));
router.put('/ticket/:uuid/resolve', (req: Request, res: Response) => ticketController.resolve(req, res));
router.delete('/ticket/:uuid', (req: Request, res: Response) => ticketController.destroy(req, res));

export default router;