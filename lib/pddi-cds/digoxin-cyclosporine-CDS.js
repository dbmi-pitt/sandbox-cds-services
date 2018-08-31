const winston = require('winston');

const pddiValueSets = require('../pddi-cds-valuesets.json');

// VALUE SETS FOR THIS PDDI CDS RULE (TODO: move to a global variable file?)
const cyclosporines = pddiValueSets.cyclosporine
if (!warfarins) {
    winston.log('error', 'digoxin-cyclosporine-CDS - not able to retrieve cyclosporine value set!');
    return null;
}
winston.log('info',  "digoxin-cyclosporine-CDS - cyclosporine value set:",{cyclosporines});

const digoxins = pddiValueSets.digoxins
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
            warfarin = cui
        } else if (digoxins[cui]){
            digoxin = cui
        }   else if (diuretics[cui]){
            diuretic = cui
        }
    });
    winston.log('info','tested for cyclosporine and digoxin:',{cyclosporine, digoxin});

    if (cyclosporine && digoxin){
        return {'cyclosporine':cyclosporine, 'digoxin':digoxin}
    }
    else if (cyclosporine && digoxin && diuretic){
        return {'cyclosporine':cyclosporine, 'digoxin':digoxin, 'diuretic':diuretic}
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


    // Case :
    if (topicalDiclofenacs[cdsState.drugPair.topicaldiclofenac]) {
        winston.log('info', 'runRule - NSAID is topical diclofenac');
        cdsState.ruleBranch = 'NSAID is topical diclofenac';
        cdsState.ruleBranchRecommendedAction = "No special precautions";
        cdsState.evidence = "Topical diclofenac has relatively low systemic absorption; in one study a topical gel (16 g/day) produced about 6% of the absorption seen with systemic administration of 150 mg/day. A higher than recommended dose of topical gel (48 g/day) produced 20% of a systemic dose of diclofenac."
        return cdsState;
    } else if (nsaids[cdsState.drugPair.nsaid]){
        winston.log('info','runRule - NSAID is systemic');
        cdsState.ruleBranch = 'NSIAD is systemic';
        cdsState.ruleBranchRecommendedAction = "Assess risk and take action if necessary";
        cdsState.evidence = "Proton pump inhibitors or misoprostol may reduce the risk of UGIB in patients receiving an NSAID and warfarin."
        return cdsState;
    } else if (misoprostols[cdsState.drugPair.misoprostol]){
        winston.log('info','runRule - NSAID is systemic and patient is on misoprostol');
        cdsState.ruleBranch = 'NSIAD is systemic but patient is taking misoprostol';
        cdsState.ruleBranchRecommendedAction = "Assess risk and take action if necessary";
        cdsState.evidence = "Misoprostol may reduce the risk of UGIB in patients receiving an NSAID and warfarin."
        return cdsState;
    } else if (PPIs[cdsState.drugPair.PPI]){
        winston.log('info','runRule - NSAID is systemic and patient is on PPI');
        cdsState.ruleBranch = 'NSAID is systemic but patient is taking PPI';
        cdsState.ruleBranchRecommendedAction = "Assess risk and take action if necessary";
        cdsState.evidence = "Proton pump inhibitors may reduce the risk of UGIB in patient receiving an NSAID and warfarin"
        return cdsState
    }
    // TODO: use else if for the other branches
    
    // default - no branching logic - return incomplete cdsState -- TODO:should report error? 
    return cdsState;
}
