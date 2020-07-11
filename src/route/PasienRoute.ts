import { Router } from 'express'

import { create, getOne, updateProfile, updateFoto } from '../controller/PasienController'
import { auth } from '../middleware/auth'
import { uploadFoto } from '../middleware/upload'

const router = Router()

/**
 * @method POST
 * @route /api/v1/pasien
 * @access Public
 * @desc Register new user
 */
router.post('/', create)

/**
 * @method GET
 * @route /api/v1/pasien/:id
 * @access Private (self)
 * @desc View user profile data
 */
router.get('/:id', auth, getOne)

/**
 * @method PUT
 * @route /api/v1/pasien/:id
 * @access Private (self)
 * @desc Update user profile
 */
router.put('/:id', auth, updateProfile)

/**
 * @method PUT
 * @route /api/v1/pasien/:id/foto
 * @access Private (self)
 * @desc Upload and update user avatar
 */
router.put('/:id/foto', auth, uploadFoto, updateFoto)

export default router
