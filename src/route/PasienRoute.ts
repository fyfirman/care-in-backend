import { Router } from 'express'

import {
  createPasien,
  getOnePasien,
  updatePasienProfile,
  updatePasienFoto,
} from '../controller/PasienController'
import { auth } from '../middleware/auth'
import { uploadFoto } from '../middleware/upload'
import { deleteOnePasien } from '../controller/PasienController'

const router = Router()

/**
 * @method POST
 * @route /api/v1/pasien
 * @access Public
 * @desc Register new user
 */
router.post('/', createPasien)

/**
 * @method GET
 * @route /api/v1/pasien/:id
 * @access Private (self)
 * @desc View user profile data
 */
router.get('/:id', auth, getOnePasien)

/**
 * @method PUT
 * @route /api/v1/pasien/:id
 * @access Private (self)
 * @desc Update user profile
 */
router.put('/:id', auth, updatePasienProfile)

/**
 * @method PUT
 * @route /api/v1/pasien/:id/foto
 * @access Private (self)
 * @desc Upload and update user avatar
 */
router.put('/:id/foto', auth, uploadFoto, updatePasienFoto)

/**
 * @method DELETE
 * @route /api/v1/pasien/:id
 * @access Private (self)
 * @desc Delete pasien
 */
router.delete('/:id', auth, deleteOnePasien)

export default router
