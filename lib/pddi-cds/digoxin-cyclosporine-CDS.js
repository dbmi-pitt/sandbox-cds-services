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
    calcium = null;
    potassium = null;
    magnesium = null;
    creatinine = null;
    resourceCuis.forEach((cui) => {
        if (cyclosporines[cui]){
            cyclosporine = cui
        } else if (digoxins[cui]){
            digoxin = cui
        } else if (diuretics[cui]){
            diuretic = cui
        } else if (calciums[cui]){
            calcium = cui
        } else if (potassiums[cui]){
            potassium = cui
        } else if (magnesiums[cui]){
            magnesium = cui
        } else if (creatinines[cui]){
            creatinine = cui
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
    // base card level 1
    cdsState.mechanism = "The mechanism of this interaction appears to be mediated through P-glycoprotein inhibition by cyclosporine. P-glycoprotein is a major transporter for digoxin efflux.";
    cdsState.clinicalConsequences = "Increased risk of digitalis toxicity that may lead to cardiac arrhythmias";
    cdsState.seriousness = "Digoxin toxicity is potentially serious. The clinical consequences may include anorexia, nausea, vomiting, visual changes, and cardiac arrhythmias.";
    cdsState.severity = "While digitalis toxicity is a serious potential clinical consequence, it can produce a range of cardiac arrhythmias and rhythm disturbances that vary in severity, from manageable bradycardia to life-threatening ventricular fibrillation.";
    cdsState.generalRecommendedAction = "For patients with a reliable plasma digoxin concentration in normal range, it is reasonable to anticipate an increase in plasma concentrations after the initiation of cyclosporine. Following initiation, close monitoring and adjusting the digoxin dose as needed is recommended."
    cdsState.ruleBranch = 'Potential Drug-Drug Interaction between digoxin (product) and cyclosporin (product)'
    cdsState.ruleBranchRecommendedAction = 'Consultation'
    cdsState.evidence = 'Increased risk of digoxin toxicity. Digoxin toxicity is potentially serious. The clinical consequences may include anorexia, nausea, vomiting, visual changes, and cardiac arrhythmias.'
    // TODO figure out array approach for multiple actions

    // Case :
    if (diuretics[cdsState.drugPair.diuretic]){
        winston.log('info', 'runRule - patient is on diuretic');
        cdsState.ruleBranch = 'patient is on diuretic';
        cdsState.ruleBranchRecommendedAction = 'Assess risk and take action if necessary';
        cdsState.evidence = 'TODO'
        cdsState.ruleBranchAction[0].ruleBranchActionType = 'TODO'
        cdsState.ruleBranchAction[0].ruleBranchActionDescription = 'TODO diuretic'
        return cdsState;
    } else {
        // only digoxin and cyclosporine (base card)
        cdsState.ruleBranchAction[0].ruleBranchActionType = 'create'
        cdsState.ruleBranchAction[0].ruleBranchActionDescription = 'Request communication with digoxin prescriber'
        cdsState.ruleBranchAction.push({
            ruleBranchActionType: 'delete',
            ruleBranchActionDescription: 'Discontinue cyclosporin order'
        })
    }
    // TODO: use else if for the other branches
    
    // default - no branching logic - return incomplete cdsState -- TODO:should report error? 
    return cdsState;
}
