import { Router } from 'express'
import {
  pesanNakes,
  updateOneTransaksi,
  getRiwayatTransaksi,
} from '../controller/TransaksiController'
import { auth } from '../middleware/auth'

const router = Router()

/**
 * @method POST
 * @route /api/v1/transaksi/:id
 * @access Private (pasien)
 * @desc Create Transaksi
 */
router.post('/:nakesId', auth, pesanNakes)

router.put('/:transaksiId', auth, updateOneTransaksi)

/**
 * @method GET
 * @route /api/v1/transaksi
 * @access Private (pasien)
 * @desc Create Transaksi
 */
router.get('/', auth, getRiwayatTransaksi)

export default router
