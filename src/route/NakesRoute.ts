import { Router } from 'express'
import {
  createNakes,
  getOneNakes,
  getManyNakes,
  updateNakesProfile,
  updateNakesFoto,
} from '../controller/NakesController'
import { auth } from '../middleware/auth'
import { deleteOneNakes } from '../controller/NakesController'
import { uploadFoto } from '../middleware/upload'

const router = Router()

/**
 * @method POST
 * @route /api/v1/nakes
 * @access Public
 * @desc Create new Nakes
 */
router.post('/', uploadFoto, createNakes)

/**
 * @method GET
 * @route /api/v1/nakes
 * @access Private (self)
 * @desc Get many nakes
 */
router.get('/', auth, getManyNakes)

/**
 * @method GET
 * @route /api/v1/nakes/:id
 * @access Private
 * @desc Select one nakes by id
 */
router.get('/:id', auth, getOneNakes)

/**
 * @method PUT
 * @route /api/v1/nakes/:id
 * @access Private (self)
 * @desc Update nakes profile
 */
router.put('/:id', auth, updateNakesProfile)

/**
 * @method PUT
 * @route /api/v1/nakes/:id/foto
 * @access Private (self)
 * @desc Update nakes profile foto
 */
router.put('/:id/foto', auth, uploadFoto, updateNakesFoto)

/**
 * @method DELETE
 * @route /api/v1/nakes/:id
 * @access Private (self)
 * @desc Delete nakes
 */
router.delete('/:id', auth, deleteOneNakes)

export default router
