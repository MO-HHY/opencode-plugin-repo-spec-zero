import { Router } from 'express';

const router = Router();

/**
 * @route GET /api/users
 * @desc Get all users
 * @access Public
 */
router.get('/', (req, res) => {
  res.json([{ id: 1, name: 'John Doe' }]);
});

/**
 * @route POST /api/users
 * @desc Create a new user
 * @access Public
 */
router.post('/', (req, res) => {
  const { name } = req.body;
  res.status(201).json({ id: 2, name });
});

export default router;
