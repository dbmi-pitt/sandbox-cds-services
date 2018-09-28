// general libaries
const express = require('express');
const uuidv4 = require('uuid/v4');
const winston = require('winston');

// libs provided by this service
const warfarinNsaids = require('../lib/pddi-cds/warfarin-nsaids-CDS');
const digoxinCyclosporines = require('../lib/pddi-cds/digoxin-cyclosporine-CDS');

const pddiValueSets = require('../lib/pddi-cds-valuesets.json');

const router = express.Router();

function getValidCoding(codings, system) {
  let validCoding = null;
  codings.forEach((coding) => {
    if (coding.code && coding.system === system) {
      validCoding = coding;
    } 
  });
  return validCoding;
}

function getValidMedCodingFromConcept(medicationCodeableConcept) {
  let coding = null;
  if (medicationCodeableConcept && medicationCodeableConcept.coding) {
    coding = getValidCoding(medicationCodeableConcept.coding, 'http://www.nlm.nih.gov/research/umls/rxnorm');
  } 
  return coding;
}

function getValidObsCodingFromConcept(observationCodeableConcept) {
  let coding = null;
  if (observationCodeableConcept && observationCodeableConcept.coding) {
    coding = getValidCoding(observationCodeableConcept.coding, 'http://loinc.org');
  } // TODO validate observation coding 
  return coding;
}

function getValidResource(resource, context) {
  let coding = null;

  winston.log('info', 'getValidResource entry', { resource });

  if (resource.resourceType === 'MedicationOrder' || resource.resourceType === 'MedicationRequest') {
    // Check if patient in reference from medication resource refers to patient in context
    if (resource.patient && resource.patient.reference === `Patient/${context.patientId}`) {
      const { medicationCodeableConcept } = resource;

      winston.log('info', 'getValidResource innerblock - medication', { medicationCodeableConcept });

      coding = getValidMedCodingFromConcept(medicationCodeableConcept);
    } else {
      winston.log('error', 'getValidResource - resource.patient.reference does not equal Patient/${context.patientId}');
    }
  } else if (resource.resourceType === 'Observation') {
    if (resource.patient && resource.patient.reference === `Patient/${context.patientId}`) {
      const { code } = resource;

      winston.log('info', 'getValidResource innerblock - observation', { code });

      coding = getValidObsCodingFromConcept(code);
    } else {
      winston.log('error', 'getValidResource - resource.patient.reference does not equal Patient/${context.patientId}');
    }
  }// TODO validate observation coding 
  return coding;
}

function getValidContextResources(request) {
  const resources = [];
  const { context } = request.body;

  winston.log('info', 'getValidContextResources entry');

  if (context && context.patientId && context.medications) {
    const medResources = context.medications;

    winston.log('info', 'getValidContextResources medResources', { medResources });

    medResources.forEach((resource) => {
      const isValidResource = getValidResource(resource, context);
      if (isValidResource) {
        resources.push(resource);
      }
    });
  }
  if (context && context.patientId && context.observations) {
    const obsResources = context.observations;

    winston.log('info', 'getValidContextResources obsResources', { obsResources });

    obsResources.forEach((resource) => {
      const isValidResource = getValidResource(resource, context);
      if (isValidResource) {
        resources.push(resource);
      }
    });
  }

  winston.log('info', 'getValidContextResources exit', { resources });
  return resources;
}

function getCardForCdsState(cdsState, validResources) {
  winston.log('info', 'getCardForCdsState entry');
  // TODO: process the validResources as needed to create actions
  allSuggestions = [];
  winston.log('info', cdsState.ruleBranchAction);
  for (var i = 0; i < cdsState.ruleBranchAction.length; i++){
    allSuggestions.push({
      type: `${cdsState.ruleBranchAction[i].ruleBranchActionType}`,
      description: `${cdsState.ruleBranchAction[i].ruleBranchActionDescription}`,
      resource: `${cdsState.ruleBranchAction[i].ruleBranchActionResource}`
    });
  };
  // just a suggestion card?
  if (cdsState.ruleBranchRecommendedAction === 'Use only if benefit outweighs risk') {
    winston.log('info', 'creating hard-stop');

    const card = {
      summary: `${cdsState.rule} triggered for warfarin (RxCUI ${cdsState.drugPair.warfarin}) and NSAID (RxCUI ${cdsState.drugPair.nsaid}) with context ${cdsState.ruleBranch}`,
      source: { label: 'Potential Drug-drug interaction CDS' },
      indicator: 'hard-stop',
    };
    card.suggestions = [{
      label: `${cdsState.ruleBranchRecommendedAction}. Evidence: ${cdsState.evidence}`,
      actions: allSuggestions
    }];
    return card;
  }
  if (cdsState.ruleBranchRecommendedAction === 'Assess risk and take action if necessary' || cdsState.ruleBranchRecommendedAction === 'Consultation') {
    winston.log('info', 'creating warning card');

    const card = {
      summary: `${cdsState.rule} triggered for warfarin (RxCUI ${cdsState.drugPair.warfarin}) and NSAID (RxCUI ${cdsState.drugPair.nsaid}) with context ${cdsState.ruleBranch}`,
      detail: `${cdsState.mechanism}`,
      source: { label: 'Potential Drug-drug interaction CDS' },
      indicator: 'warning',
    };
    card.suggestions = [{
      label: `${cdsState.ruleBranchRecommendedAction}. Evidence: ${cdsState.evidence}`,
      actions: allSuggestions
    }];
    return card;
  }
  if (cdsState.ruleBranchRecommendedAction === 'No special precautions') {
    winston.log('info', 'creating simple suggestion card');

    const card = {
      summary: `${cdsState.rule} triggered for warfarin (RxCUI ${cdsState.drugPair.warfarin}) and NSAID (RxCUI ${cdsState.drugPair.topicaldiclofenac}) with context ${cdsState.ruleBranch}`,
      source: { label: 'Potential Drug-drug interaction CDS' },
      indicator: 'info',
    };
    card.suggestions = [{
      label: `${cdsState.ruleBranchRecommendedAction}. Evidence: ${cdsState.evidence}`,
    }];
  }

  return null;
}

function pddiCDS(resources) {
  winston.log('info', 'pddiCDS Entry');

  const cdsStateL = [];
  if (!resources.length) {
    winston.log('error', 'no resources to process!');
    return { cdsStateL: [] };
  }

  cdsStateInit = {
    rule: null,
    drugPair: null, // technically not just drugs, can include lab tests
    ruleBranch: null,
    ruleBranchRecommendedAction: null,
    ruleBranchAction: [{
      ruleBranchActionType: null,
      ruleBranchActionDescription: null,
      ruleBranchActionResource: null
    }], // initialize ruleBranchAction with one set of the tuples, since the card should still output that no action action is required/available if none are created.
    evidence: null,
    mechanism: null,
    clinicalConsequences: null,
    seriousness: null,
    severity: null,
    generalRecommendedAction: null,
    freqExposure: null,
    freqHarmInExposed: null,
  };


  drugPairWarfarinNsaids = warfarinNsaids.ruleAppliesToContext(resources);
  if (drugPairWarfarinNsaids) {
    cdsStateInit.rule = 'Warfarin - NSAIDs';
    cdsStateInit.drugPair = drugPairWarfarinNsaids;

    cdsStatePost = warfarinNsaids.runRule(cdsStateInit);

    cdsStateL.push(cdsStatePost);
  }

  drugPairDigoxinCyclosporine = digoxinCyclosporines.ruleAppliesToContext(resources);
  if (drugPairDigoxinCyclosporine) {
    cdsStateInit.rule = 'Digoxin - Cyclosporines';
    cdsStateInit.drugPair = drugPairDigoxinCyclosporine;

    cdsStatePost = digoxinCyclosporines.runRule(cdsStateInit);

    cdsStateL.push(cdsStatePost);
  }
  // TODO make another JS file with logic between running warfarin-nsaids and/or digoxin-cyclosporines? -- refactor ruleAppliesToContext function

  if (!cdsStateL.length) {
    return [];
  }
  return cdsStateL;
}

function buildCards(cdsStateL, validResources) {
  winston.log('info', 'buildCards entry');

  if (!cdsStateL.length) {
    winston.log('error', 'no values in cdsStateL!');
    return { cards: [] };
  }

  if (!validResources.length) {
    winston.log('error', 'no values in validResources!');
    return { cards: [] };
  }

  winston.log('info', 'buildCards passed input variable tests');
  const cards = [];
  cdsStateL.forEach((cdsState) => {
    const suggestedCard = getCardForCdsState(cdsState, validResources);
    if (suggestedCard) {
      cards.push(suggestedCard);
    }
  });

  if (!cards.length) {
    return { cards: [] };
  }
  return { cards };
}

// CDS Service endpoint
router.post('/', (request, response) => {
  winston.log('info', 'Calling getValidContextResources');
  const validResources = getValidContextResources(request);

  winston.log('info', 'Calling CDS', { validResources });
  const cdsStateL = pddiCDS(validResources);
  winston.log('info', 'cdsStateL', { cdsStateL });

  winston.log('info', 'Calling buildCards');
  const cards = buildCards(cdsStateL, validResources);
  winston.log('info', 'Sending response CDS Hooks cards');
  response.json(cards);
});

// Analytics endpoint
// Because this is a sample service, this service won't include logic to store suggestion UUIDs
// externally to some store to validate the UUID parameter at the analytics endpoint
router.post('/analytics/:uuid', (request, response) => {
  response.sendStatus(200);
});


module.exports = router;
