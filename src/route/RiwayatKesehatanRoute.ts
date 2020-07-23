import { Router } from 'express'

import {
  createRiwayatKesehatan,
  getManyRiwayatKesehatan,
  updateOneRiwayatKesehatan,
  deleteOneRiwayatKesehatan,
} from '../controller/RiwayatKesehatanController'
import { auth } from '../middleware/auth'

const router = Router()

/**
 * @method POST
 * @route /api/v1/riwayat-kesehatan/:pasienId
 * @access Private (self)
 * @desc Create new record
 */
router.post('/:pasienId', auth, createRiwayatKesehatan)

/**
 * @method GET
 * @route /api/v1/riwayat-kesehatan/:pasienId
 * @access Private (self)
 * @desc Get all riwayat kesehatan record
 */
router.get('/:pasienId', auth, getManyRiwayatKesehatan)

/**
 * @method PUT
 * @route /api/v1/riwayat-kesehatan/:id
 * @access Private (self)
 * @desc Update riwayat kesehatan record
 */
router.put('/:id', auth, updateOneRiwayatKesehatan)

/**
 * @method DELETE
 * @route /api/v1/riwayat-kesehatan/:id
 * @access Private (self)
 * @desc Update riwayat kesehatan record
 */
router.delete('/:id', auth, deleteOneRiwayatKesehatan)

export default router
