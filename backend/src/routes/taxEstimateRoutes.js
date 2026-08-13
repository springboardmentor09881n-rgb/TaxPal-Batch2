const express = require('express');
const router = express.Router();
const taxEstimateController = require('../controllers/taxEstimateController');
const { protect } = require('../middleware/authMiddleware');
const {
  validate,
  createTaxEstimateValidation,
  updateTaxEstimateValidation,
  taxEstimateIdValidation,
} = require('../validators/taxEstimateValidator');

// Protect all routes
router.use(protect);

router
  .route('/')
  .post(...createTaxEstimateValidation, validate, taxEstimateController.createTaxEstimate)
  .get(taxEstimateController.getTaxEstimates);

router
  .route('/:id')
  .get(...taxEstimateIdValidation, validate, taxEstimateController.getTaxEstimateById)
  .put(
    ...taxEstimateIdValidation,
    ...updateTaxEstimateValidation,
    validate,
    taxEstimateController.updateTaxEstimate
  )
  .delete(...taxEstimateIdValidation, validate, taxEstimateController.deleteTaxEstimate);

module.exports = router;
