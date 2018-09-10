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
    resourceCuis = []
    resources.forEach((resource) => {
    if (resource.medicationCodeableConcept){
        if(resource.medicationCodeableConcept.coding){
        codings = resource.medicationCodeableConcept.coding;
        codings.forEach((coding) => {
            if (coding.code && coding.system === 'http://www.nlm.nih.gov/research/umls/rxnorm') {
            resourceCuis.push(coding.code);
            }
        });
        }
    }
    });
    winston.log('info','resourceCuis',{resourceCuis});

    // test if the drug cuis are used in this rule
    cyclosporine = null;
    digoxin = null;
    diuretic = null;
    resourceCuis.forEach((cui) => {
        if (cyclosporines[cui]){
            cyclosporine = cui
        } else if (digoxins[cui]){
            digoxin = cui
        }   else if (diuretics[cui]){
            diuretic = cui
        }
    });
    winston.log('info','tested for cyclosporine and digoxin:',{cyclosporine, digoxin});
    if (cyclosporine && digoxin && diuretic){
        return {'cyclosporine':cyclosporine, 'digoxin':digoxin, 'diuretic':diuretic}
    }
    else if (cyclosporine && digoxin){
        return {'cyclosporine':cyclosporine, 'digoxin':digoxin}
    }
    return null;
};

module.exports.runRule = function(cdsStateInit) {
    winston.log('info','runRule entry');
    cdsState = cdsStateInit;
    if (!(cdsState.drugPair && cdsState.drugPair.cyclosporine && cdsState.drugPair.digoxin)){
    winston.log('error','runRule - drugpair, cyclosporine, and/or digoxin code missing from cdsState!');
    return null;
    }

    // Initialize the CDS State with general properties for this trigger
    cdsState.mechanism = "TODO mechansism";
    cdsState.clinicalConsequences = "TODO clinical consequences";
    cdsState.seriousness = "TODO seriousness";
    cdsState.severity = "TODO severity";
    cdsState.generalRecommendedAction = "TODO general recommendedaction"

    //TODO check /services/pddi-cds-med-rx.js for defining drugPair for this library? (see around line 155)
    // Case :
    if (diuretics[cdsState.drugPair.diuretic]){
        winston.log('info', 'runRule - patient is on diuretic');
        cdsState.ruleBranch = 'patient is on diuretic';
        cdsState.ruleBranchRecommendedAction = 'Assess risk and take action if necessary';
        cdsState.evidence = 'TODO'
        return cdsState;
    }
    // TODO: use else if for the other branches
    
    // default - no branching logic - return incomplete cdsState -- TODO:should report error? 
    return cdsState;
}
