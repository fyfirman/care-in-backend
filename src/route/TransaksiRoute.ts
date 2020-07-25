import { Router } from 'express'
import {
  pesanNakes,
  updateOneTransaksi,
  getRiwayatTransaksi,
  transaksiChatKirim,
} from '../controller/TransaksiController'
import { auth } from '../middleware/auth'
import { transaksiChatAmbil } from '../controller/TransaksiController'

const router = Router()

/**
 * @method POST
 * @route /api/v1/transaksi/:nakesId
 * @access Private (pasien)
 * @desc Create Transaksi
 */
router.post('/:nakesId', auth, pesanNakes)

/**
 * @method PUT
 * @route /api/v1/transaksi/:transaksiId
 * @access Private
 * @desc Update Transaksi and Create Riwayat Transaksi
 */
router.put('/:transaksiId', auth, updateOneTransaksi)

/**
 * @method GET
 * @route /api/v1/transaksi
 * @access Private
 * @desc Get current transaksi and riwayat transaksi req.user.id
 */
router.get('/', auth, getRiwayatTransaksi)

/**
 * @method POST
 * @route /api/v1/transaksi/:transaksiId/chat
 * @access Private
 * @desc Create chat
 */
router.post('/:transaksiId/chat', auth, transaksiChatKirim)

/**
 * @method GET
 * @route /api/v1/transaksi/:transaksiId/chat
 * @access Private
 * @desc Get all chat
 */
router.get('/:transaksiId/chat', auth, transaksiChatAmbil)

export default router
