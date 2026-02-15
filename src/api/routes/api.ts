import { Router, type Request, type Response } from 'express';
import { HomeController } from '../controllers/home-controller';
import { AuthController } from '../controllers/auth-controller';
import { TicketCategoryController as AdminTicketCategoryController } from '../controllers/admin/ticket-category-controller';
import { TicketController as AdminTicketController } from '../controllers/admin/ticket-controller';
import { TicketCategoryController } from '../controllers/ticket-category-controller';
import { TicketController } from '../controllers/ticket-controller';
import { UserController as AdminUserController } from '../controllers/admin/user-controller';
import { authMiddleware } from '../middlewares/auth-middleware';
import { registerRequest, loginRequest } from '../validations/auth/auth-validation';
import { ticketCategoryRequest } from '../validations/ticket/ticket-category-validation';
import { ticketRequest } from '../validations/ticket/ticket-validation';
import { UserController } from '../controllers/user-controller';
import { adminMiddleware } from '../middlewares/admin-middleware';
import { RoleController } from '../controllers/role-controller';

const router = Router();
const homeController = new HomeController();
const authController = new AuthController();
const adminTicketCategoryController = new AdminTicketCategoryController();
const adminTicketController = new AdminTicketController();
const ticketCategoryController = new TicketCategoryController();
const ticketController = new TicketController();
const userController = new UserController();
const adminUserController = new AdminUserController();
const roleController = new RoleController();

router.get('/', (req, res) => homeController.index(req, res));

router.post('/auth/register', registerRequest, (req: Request, res: Response) => 
  authController.register(req, res)
);

router.post('/auth/login', loginRequest, (req: Request, res: Response) => 
  authController.login(req, res)
);

router.use(authMiddleware);

router.get('/user/me', (req: Request, res: Response) => userController.me(req, res));

/**
 * Admin
 */
router.use('/admin', adminMiddleware);

router.get('/admin/ticket/category', (req: Request, res: Response) => adminTicketCategoryController.index(req, res));
router.post('/admin/ticket/category', ticketCategoryRequest, (req: Request, res: Response) => adminTicketCategoryController.store(req, res));
router.get('/admin/ticket/category/:uuid', (req: Request, res: Response) => adminTicketCategoryController.find(req, res));
router.put('/admin/ticket/category/:uuid', ticketCategoryRequest, (req: Request, res: Response) => adminTicketCategoryController.update(req, res));
router.delete('/admin/ticket/category/:uuid', (req: Request, res: Response) => adminTicketCategoryController.destroy(req, res));

router.get('/admin/ticket', (req: Request, res: Response) => adminTicketController.index(req, res));
router.post('/admin/ticket', ticketRequest, (req: Request, res: Response) => adminTicketController.store(req, res));
router.get('/admin/ticket/:uuid', (req: Request, res: Response) => adminTicketController.find(req, res));
router.put('/admin/ticket/:uuid', ticketRequest, (req: Request, res: Response) => adminTicketController.update(req, res));
router.put('/admin/ticket/:uuid/resolve', (req: Request, res: Response) => adminTicketController.resolve(req, res));
router.delete('/admin/ticket/:uuid', (req: Request, res: Response) => adminTicketController.destroy(req, res));

router.get('/admin/user', (req: Request, res: Response) => adminUserController.index(req, res));
router.post('/admin/user', (req: Request, res: Response) => adminUserController.store(req, res));
router.get('/admin/user/:uuid', (req: Request, res: Response) => adminUserController.find(req, res));
router.put('/admin/user/:uuid', (req: Request, res: Response) => adminUserController.update(req, res));
router.delete('/admin/user/:uuid', (req: Request, res: Response) => adminUserController.destroy(req, res));

/**
 * User
 */
router.get('/role', (req: Request, res: Response) => roleController.index(req, res));

router.get('/ticket/category', (req: Request, res: Response) => ticketCategoryController.index(req, res));
router.get('/ticket', (req: Request, res: Response) => ticketController.index(req, res));
router.post('/ticket', ticketRequest, (req: Request, res: Response) => ticketController.store(req, res));
router.get('/ticket/:uuid', (req: Request, res: Response) => ticketController.find(req, res));

export default router;