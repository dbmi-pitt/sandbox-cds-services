const express = require('express');

const router = express.Router();
const serviceDefinitions = require('./service-definitions');
const patientGreetingService = require('../services/patient-greeting');
const cmsPriceCheck = require('../services/cms-price-check');
const pddiCdsMedRx = require('../services/pddi-cds-med-rx');

// Discovery Endpoint
router.get('/', (request, response) => {
  const discoveryEndpointServices = {
    services: serviceDefinitions,
  };
  response.json(discoveryEndpointServices);
});

// Routes to CDS Services
router.use('/patient-greeting', patientGreetingService);
router.use('/cms-price-check', cmsPriceCheck);
router.use('/pddi-cds-med-rx', pddiCdsMedRx);

module.exports = router;
