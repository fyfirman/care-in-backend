import { Router } from 'express'
import { generateToken, checkToken } from '../controller/AuthController'
import { auth } from '../middleware/auth'

const router = Router()

/**
 * @method POST
 * @route /api/v1/auth
 * @access Public
 * @desc Generate new token
 */
router.post('/', generateToken)

/**
 * @method GET
 * @route /api/v1/auth
 * @access Private
 * @desc Check token
 */
router.get('/', auth, checkToken)

export default router
