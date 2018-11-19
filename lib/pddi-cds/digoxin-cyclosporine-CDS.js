const winston = require('winston');

const pddiValueSets = require('../pddi-cds-valuesets.json');

// VALUE SETS FOR THIS PDDI CDS RULE (TODO: move to a global variable file?)
const cyclosporines = pddiValueSets.cyclosporine
if (!cyclosporines) {
    winston.log('error', 'digoxin-cyclosporine-CDS - not able to retrieve cyclosporine value set!');
    return null;
}
winston.log('info',  "digoxin-cyclosporine-CDS - cyclosporine value set:",{cyclosporines});

const digoxins = pddiValueSets.digoxin
if (!digoxins) {
    winston.log('error', 'digoxin-digoxin-CDS - not able to retrieve digoxin value set!');
    return null;
}
winston.log('info',  "digoxin-cyclosporine-CDS - digoxin value set:",{digoxins});

const diuretics = pddiValueSets.diuretics
if (!diuretics) {
    winston.log('error', 'digoxin-digoxin-CDS - not able to retrieve diuretic value set!');
    return null;
}
winston.log('info',  "digoxin-cyclosporine-CDS - diuretic value set:",{diuretics});

const calciums = pddiValueSets["serum calcium"]
if (!calciums) {
    winston.log('error', 'digoxin-digoxin-CDS - not able to retrieve serum calcium value set!');
    return null;
}
winston.log('info',  "digoxin-cyclosporine-CDS - serum calcium value set:",{calciums});

const potassiums = pddiValueSets["serum potassium"]
if (!potassiums) {
    winston.log('error', 'digoxin-digoxin-CDS - not able to retrieve serum potassium value set!');
    return null;
}
winston.log('info',  "digoxin-cyclosporine-CDS - serum potassium value set:",{potassiums});

const magnesiums = pddiValueSets["serum magnesium"]
if (!magnesiums) {
    winston.log('error', 'digoxin-digoxin-CDS - not able to retrieve serum magnesium value set!');
    return null;
}
winston.log('info',  "digoxin-cyclosporine-CDS - serum magnesium value set:",{magnesiums});

const creatinines = pddiValueSets["serum creatinine"]
if (!creatinines) {
    winston.log('error', 'digoxin-digoxin-CDS - not able to retrieve serum creatinine value set!');
    return null;
}
winston.log('info',  "digoxin-cyclosporine-CDS - serum creatinine value set:",{creatinines});

const digoxinLevels = pddiValueSets["digoxin concentration"]
if (!digoxinLevels) {
    winston.log('error', 'digoxin-digoxin-CDS - not able to retrieve digoxin concentration value set!');
    return null;
}
winston.log('info',  "digoxin-cyclosporine-CDS - digoxin concentration value set:",{digoxinLevels});

// CDS FUNCTIONS
module.exports.ruleAppliesToContext = function(resources) {
    winston.log('info','ruleAppliesToContext entry');
    
    if (!resources.length) {
    winston.log('error', 'no resources to process!');
    return null;
    } else {
    winston.log('info', 'testing if rule applies to resources', {resources});
    };

    // pull out a list of RxNorm drug CUIs from the CDS Hooks input
    medOrderCuis = []
    medStatementCuis = []
    observationCodes = []
    resources.forEach((resource) => {
        winston.log('info','resource type', resource);
        if (resource.resourceType === 'MedicationOrder' || resource.resourceType === 'MedicationRequest'){
            if (resource.medicationCodeableConcept){
                if(resource.medicationCodeableConcept.coding){
                    date = resource.dateWritten;
                    codings = resource.medicationCodeableConcept.coding;
                    codings.forEach((coding) => {
                        if (coding.code && coding.system === 'http://www.nlm.nih.gov/research/umls/rxnorm') {
                            med = {
                               code: null,
                               date: null,
                               prefetch: false
                            };
                            med.code = coding.code;
                            med.date = date;
                            medOrderCuis.push(med);
                        }
                    });
                }
            }
        } else if (resource.resourceType === 'MedicationStatement'){
            if (resource.medicationCodeableConcept){
                if(resource.medicationCodeableConcept.coding){
                    date = resource.dateAsserted;
                    codings = resource.medicationCodeableConcept.coding;
                    codings.forEach((coding) => {
                        if (coding.code && coding.system === 'http://www.nlm.nih.gov/research/umls/rxnorm') {
                            med = {
                               code: null,
                               date: null,
                               prefetch: true // MedicationStatement only occurs in prefetch
                            };
                            med.code = coding.code;
                            med.date = date;
                            medStatementCuis.push(med);
                        }
                    });
                }
            }
        } else if (resource.resourceType === 'Observation') {
            // TODO account for observation dates (effectiveDateTime or valueDateTime?)
            obs = {
                code: null,
                value: null,
                unit: null
            };
            if (resource.code){
                if (resource.code.coding){
                    codings = resource.code.coding;
                    codings.forEach((coding) => {
                        if (coding.code && coding.system === 'http://loinc.org') {
                            obs.code = coding.code;
                        }
                    });
                }
            }
            if (resource.valueQuantity){
                if (resource.valueQuantity.value){
                    obs.value = resource.valueQuantity.value
                    obs.unit = resource.valueQuantity.unit
                }
            } 
            observationCodes.push(obs);
        }
    });
    winston.log('info','medOrderCuis',{medOrderCuis});
    winston.log('info','medStatementCuis',{medStatementCuis});
    winston.log('info','observationCodes',{observationCodes});

    // test if the drug cuis are used in this rule
    cyclosporine = null;
    digoxin = null;
    diuretic = null;
    calcium = null;
    potassium = null;
    magnesium = null;
    creatinine = null;
    digoxinLevel = null;
    medStatementCuis.forEach((med) => {
        if (cyclosporines[med.code]){
            cyclosporine = med;
        } else if (digoxins[med.code]){
            digoxin = med;
        } else if (diuretics[med.code]){
            diuretic = med;
        }
    }); 
    // a new medication order overrides a medication statement
    medOrderCuis.forEach((med) => {
        if (cyclosporines[med.code]){
            cyclosporine = med;
        } else if (digoxins[med.code]){
            digoxin = med;
        } else if (diuretics[med.code]){
            diuretic = med;
        }
    });
    observationCodes.forEach((obs) => {
        if (calciums[obs.code]){
            calcium = obs;
        } else if (potassiums[obs.code]){
            potassium = obs;
        } else if (magnesiums[obs.code]){
            magnesium = obs;
        } else if (creatinines[obs.code]){
            creatinine = obs;
        } else if (digoxinLevels[obs.code]){
            digoxinLevel = obs;
        }
    });
    winston.log('info','tested for cyclosporine and digoxin:',{cyclosporine, digoxin});
    // scenarios to account for: 
    // on digoxin and cyclosporin - digoxin level below 0.9 ng/mL 
    // on digoxin and cyclosporin - serum creatinine, potassium, magnesium, calcium present.
    // on digoxin and cyclosporin - no digoxin level checked
    // on digoxin and cyclosporin - no  serum creatinine, potassium, magnesium, calcium
    // as the implementation currently stands, the last 2 scenarios seem to be functionality equivalent.
    // NOTE: based on scenario list all seem to presume no diuretics are being prescribed
    if (cyclosporine && digoxin && digoxinLevel && !diuretic) {
        return {'cyclosporine':cyclosporine, 'digoxin':digoxin, 'digoxinLevel':digoxinLevel}
    } else if (cyclosporine && creatinine && magnesium && potassium && calcium && !diuretic) {
        return {'cyclosporine':cyclosporine, 'digoxin':digoxin, 'creatinine':creatinine, "magnesium":magnesium, "potassium":potassium, "calcium":calcium }
    } else if (cyclosporine && digoxin && !creatinine && !magnesium & !potassium && !calcium && !diuretic) {
        return {'cyclosporine':cyclosporine, 'digoxin':digoxin}
    } else if (cyclosporine && digoxin && !digoxinLevel && !diuretic) {
        return {'cyclosporine':cyclosporine, 'digoxin':digoxin}
    } else if (cyclosporine && digoxin && !diuretic) {
        return {'cyclosporine':cyclosporine, 'digoxin':digoxin}
    }
    return null;
};

module.exports.runRule = function(cdsStateInit) {
    winston.log('info','runRule entry', cdsStateInit);
    cdsState = cdsStateInit;
    if (!(cdsState.drugPair && cdsState.drugPair.cyclosporine && cdsState.drugPair.digoxin)){
    winston.log('error','runRule - drugpair, cyclosporine, and/or digoxin code missing from cdsState!');
    return null;
    }

    // Initialize the CDS State with general properties for this trigger
    // base card level 1
    cdsState.mechanism = "The mechanism of this interaction appears to be mediated through P-glycoprotein inhibition by cyclosporine. P-glycoprotein is a major transporter for digoxin efflux.";
    cdsState.clinicalConsequences = "Increased risk of digitalis toxicity that may lead to cardiac arrhythmias";
    cdsState.seriousness = "Digoxin toxicity is potentially serious. The clinical consequences may include anorexia, nausea, vomiting, visual changes, and cardiac arrhythmias.";
    cdsState.severity = "While digitalis toxicity is a serious potential clinical consequence, it can produce a range of cardiac arrhythmias and rhythm disturbances that vary in severity, from manageable bradycardia to life-threatening ventricular fibrillation.";
    cdsState.generalRecommendedAction = "For patients with a reliable plasma digoxin concentration in normal range, it is reasonable to anticipate an increase in plasma concentrations after the initiation of cyclosporine. Following initiation, close monitoring and adjusting the digoxin dose as needed is recommended."
    cdsState.ruleBranch = 'Potential Drug-Drug Interaction between digoxin (product) and cyclosporin (product)'
    cdsState.ruleBranchRecommendedAction = 'Consultation'
    cdsState.evidence = 'Increased risk of digoxin toxicity. Digoxin toxicity is potentially serious. The clinical consequences may include anorexia, nausea, vomiting, visual changes, and cardiac arrhythmias.'

    // Case :
    if ( cdsState.drugPair.cyclosporine && cdsState.drugPair.digoxin && cdsState.drugPair.digoxinLevel ){
        // card 2
        if ( cyclosporines[cdsState.drugPair.cyclosporine.code] && digoxins[cdsState.drugPair.digoxin.code] && digoxinLevels[cdsState.drugPair.digoxinLevel.code] && ((cdsState.drugPair.digoxinLevel.unit === 'ng/mL' && cdsState.drugPair.digoxinLevel.value < 0.9) || (cdsState.drugPair.digoxinLevel.unit === 'nmol/L' && cdsState.drugPair.digoxinLevel.value < 1.2)) ) { 
            winston.log('info', 'Patient has digoxin level within 30 days that is below 0.9 ng/mL (SI: 1.2 nmol/L)');
            cdsState.ruleBranch = 'Patient has digoxin level within 30 days that is below 0.9 ng/mL (SI: 1.2 nmol/L)';
            cdsState.ruleBranchRecommendedAction = 'Assess risk and take action if necessary';
            cdsState.evidence = `(Digoxin Level: ${cdsState.drugPair.digoxinLevel.value} ${cdsState.drugPair.digoxinLevel.unit}) 
                For patients with a reliable plasma digoxin concentration in normal range, it is reasonable to anticipate an increase in plasma concentrations after the initiation of cyclosporine. Following initiation, close monitoring and adjusting the digoxin dose as needed is recommended`
            cdsState.ruleBranchAction[0].ruleBranchActionType = 'create'
            cdsState.ruleBranchAction[0].ruleBranchActionDescription = 'Order digoxin trough within 24 hours from the initiation of cyclosporin'
            cdsState.ruleBranchAction[0].ruleBranchActionResource = 'ProcedureRequest'
            cdsState.ruleBranchAction.push({
                ruleBranchActionType: 'create',
                ruleBranchActionDescription: 'Preemptively reduce digoxin dose with new order',
                ruleBranchActionResource: 'MedicationOrder'
            })
            return cdsState;
        }
    } else if ( cdsState.drugPair.cyclosporine && cdsState.drugPair.digoxin && cdsState.drugPair.creatinine && cdsState.drugPair.magnesium && cdsState.drugPair.potassium && cdsState.drugPair.calcium ) {
        if ( cyclosporines[cdsState.drugPair.cyclosporine.code] && digoxins[cdsState.drugPair.digoxin.code] && creatinines[cdsState.drugPair.creatinine.code] && magnesiums[cdsState.drugPair.magnesium.code] && potassiums[cdsState.drugPair.potassium.code] && calciums[cdsState.drugPair.calcium.code] ) {
            // scenario 1-1 card 3
            winston.log('info', 'Within 100 days, the patient has had electrolyte and serum creatinine levels checked, and they are not on a potassium sparing or loop diuretic.');
            cdsState.ruleBranch = 'Within 100 days, the patient has had electrolyte and serum creatinine levels checked, and they are not on a potassium sparing or loop diuretic.';
            cdsState.ruleBranchRecommendedAction = 'Assess risk and take action if necessary';
            cdsState.evidence = `(Potassium: ${cdsState.drugPair.potassium.value} ${cdsState.drugPair.potassium.unit})
            (Magnesium: ${cdsState.drugPair.magnesium.value} ${cdsState.drugPair.magnesium.unit})
            (Calcium: ${cdsState.drugPair.calcium.value} ${cdsState.drugPair.calcium.unit}) 
            (Serum creatinine: ${cdsState.drugPair.creatinine.value} ${cdsState.drugPair.creatinine.unit}) 
            Hypokalemia, hypomagnesemia, and hypercalcemia may potentiate digoxin toxicity. 50-70% of digoxin is excreted unchanged in the urine. Changing renal function may increase serum concentrations and risk of toxicity`
            cdsState.ruleBranchAction[0].ruleBranchActionType = 'create'
            cdsState.ruleBranchAction[0].ruleBranchActionDescription = 'order for serum creatinine'
            cdsState.ruleBranchAction[0].ruleBranchActionResource = 'ProcedureRequest'
            cdsState.ruleBranchAction.push({
                ruleBranchActionType: 'create',
                ruleBranchActionDescription: 'order for electrolyte panel ',
                ruleBranchActionResource: 'ProcedureRequest'
            })
            return cdsState;
        }
    }
    else {
        // only digoxin and cyclosporine (base card)
        winston.log('info', 'Base card');
        if ( !cdsState.drugPair.digoxin.prefetch && cdsState.drugPair.cyclosporine.prefetch ) {
            cdsState.ruleBranchAction[0].ruleBranchActionType = 'create'
            cdsState.ruleBranchAction[0].ruleBranchActionDescription = 'Request communication with cyclosporine prescriber'
            cdsState.ruleBranchAction[0].ruleBranchActionResource = 'ProcedureRequest'
            cdsState.ruleBranchAction.push({
                ruleBranchActionType: 'delete',
                ruleBranchActionDescription: 'Discontinue digoxin order',
                ruleBranchActionResource: 'N/A'
            })
        }
        else if ( cdsState.drugPair.digoxin.prefetch && !cdsState.drugPair.cyclosporine.prefetch ) {
            cdsState.ruleBranchAction[0].ruleBranchActionType = 'create'
            cdsState.ruleBranchAction[0].ruleBranchActionDescription = 'Request communication with digoxin prescriber'
            cdsState.ruleBranchAction[0].ruleBranchActionResource = 'ProcedureRequest'
            cdsState.ruleBranchAction.push({
                ruleBranchActionType: 'delete',
                ruleBranchActionDescription: 'Discontinue cyclosporine order',
                ruleBranchActionResource: 'N/A'
            })
        }
        return cdsState;
    }
    // TODO: use else if for the other branches
    
    // default - no branching logic - return incomplete cdsState -- TODO:should report error? 
    return cdsState;
}
