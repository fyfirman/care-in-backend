import { Router } from 'express'

import { createNotifikasi } from '../controller/NotifikasiController'
import { auth } from '../middleware/auth'

const router = Router()

/**
 * @method POST
 * @route /api/v1/notifikasi/
 * @access Private 
 * @desc Send token to firebase messaging cloud
 */
router.post('/', auth, createNotifikasi)

export default router
