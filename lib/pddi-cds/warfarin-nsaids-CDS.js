const winston = require('winston');

const pddiValueSets = require('../pddi-cds-valuesets.json');

// VALUE SETS FOR THIS PDDI CDS RULE (TODO: move to a global variable file?)
const UGIBs = pddiValueSets.UGIB
if (!UGIBs) {
    winston.log('error', 'warfarin-nsaids-CDS - not able to retrieve UGIB value set!');
    return null;
}
winston.log('info', "warfarin-nsaids-CDS - UGIBs value set:",{UGIBs});

const warfarins = pddiValueSets.warfarin
if (!warfarins) {
    winston.log('error', 'warfarin-nsaids-CDS - not able to retrieve warfarin value set!');
    return null;
}
winston.log('info',  "warfarin-nsaids-CDS - warfarin value set:",{warfarins});

const nsaids = pddiValueSets.nsaids
if (!nsaids) {
    winston.log('error', 'warfarin-nsaids-CDS - not able to retrieve nsaids value set!');
    return null;
}
winston.log('info',  "warfarin-nsaids-CDS - nsaids value set:",{nsaids});

const PPIs = pddiValueSets.PPIs
if (!PPIs) {
    winston.log('error', 'warfarin-nsaid-CDS - not able to retrieve PPIs value set!');
    return null;
}
winston.log('info', "warfarin-nsaid-CDS - PPIs value set;", {PPIs});

const systemicCorticosteroids = pddiValueSets["Systemic corticosteroids"]
if (!PPIs) {
    winston.log('error', 'warfarin-nsaid-CDS - not able to retrieve systemic corticosteroids value set!');
    return null;
}
winston.log('info', "warfarin-nsaid-CDS - systemic corticosteroids value set;", {systemicCorticosteroids});

const misoprostols = pddiValueSets.Misoprostol
if (!misoprostols) {
    winston.log('error', 'warfarin-nsaid-CDS - not able to retrieve misoprostol value set!');
    return null;
}
winston.log('info', "warfarin-nsaid-CDS - misoprostol value set;", {misoprostols});

const topicalDiclofenacs = pddiValueSets["topical diclofenac"]
if (!topicalDiclofenacs) {
    winston.log('error', 'warfarin-nsaids-CDS - not able to retrieve topical diclofenac value set!');
    return null;
}
winston.log('info',  "warfarin-nsaids-CDS - topical diclofenac value set:",{topicalDiclofenacs});

const aldosteroneAntagonists = pddiValueSets["aldosterone antagonists"]
if (!aldosteroneAntagonists) {
    winston.log('error', 'warfarin-nsaids-CDS - not able to retrieve aldosterone antagonists value set!');
    return null;
}
winston.log('info',  "warfarin-nsaids-CDS - aldosterone antagonists value set:",{aldosteroneAntagonists});

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
    warfarin = null;
    nsaid = null;
    misoprostol = null;
    PPI = null;
    topicaldiclofenac = null;
    systemiccorticosteroid = null;
    aldosteroneantagonist = null;
    resourceCuis.forEach((cui) => {
	if (warfarins[cui]){
	    warfarin = cui
	} else if (nsaids[cui]){
	    nsaid = cui
	}   else if (misoprostols[cui]){
	    misoprostol = cui
    } else if (topicalDiclofenacs[cui]){
	    topicaldiclofenac = cui
    } else if (PPIs[cui]){
        PPI = cui
    } else if (aldosteroneAntagonists[cui]) {
        aldosteroneantagonist = cui
    } else if (systemicCorticosteroids[cui]) {
        systemiccorticosteroid = cui
    }
    });
    winston.log('info','tested for warfarin and nsaid:',{warfarin,nsaid});

    if (warfarin && topicaldiclofenac && nsaid){
        return {'warfarin': warfarin, 'topicaldiclofenac': topicaldiclofenac}
    } else if (warfarin && nsaid && misoprostol){
	return {'warfarin':warfarin,'nsaid':nsaid, 'misoprostol':misoprostol};
    } else if (warfarin && nsaid && PPI){
        return {'warfarin':warfarin, 'nsaid':nsaid, 'PPI':PPI}
    } else if (warfarin && nsaid){
        return {'warfarin':warfarin, 'nsaid':nsaid}
    } else if (warfarin && nsaid && aldosteroneantagonist) {
        return {'warfarin': warfarin, 'nsaid': nsaid, 'aldosteroneantagonist': aldosteroneantagonist}
    } else if (warfarin && nsaid && systemiccorticosteroid) {
        return {'warfarin': warfarin, 'nsaid': nsaid, 'systemiccorticosteroid': systemiccorticosteroid}
    }
    return null;
};

module.exports.runRule = function(cdsStateInit) {
    winston.log('info','runRule entry');
    cdsState = cdsStateInit;
    if (!(cdsState.drugPair && cdsState.drugPair.warfarin && cdsState.drugPair.nsaid)){
	winston.log('error','runRule - drugpair, warfarin, and/or nsaid code missing from cdsState!');
	return null;
    }

    // Initialize the CDS State with general properties for this trigger
    cdsState.mechanism = "Non-steroidal anti-inflammatory drugs (NSAIDs) have antiplatelet effects which increase the bleeding risk when combined with oral anticoagulants such as warfarin. The antiplatelet effect of NSAIDs lasts only as long as the NSAID is present in the circulation, unlike aspirin’s antiplatelet effect, which lasts for up to 2 weeks after aspirin is discontinued. NSAIDs also can cause peptic ulcers and most of the evidence for increased bleeding risk with NSAIDs plus warfarin is due to upper gastrointestinal bleeding (UGIB).";
    cdsState.clinicalConsequences = "Increased risk of bleeding including gastrointestinal bleeding, intracranial hemorrhage, and cerebral hemorrhage";
    cdsState.seriousness = "Bleeding is a serious potential clinical consequence because it can result in death, life-threatening hospitalization, and disability.";
    cdsState.severity = "While bleeding is a serious potential clinical consequence, severity can vary from easily tolerated to incapacitating";
    cdsState.generalRecommendedAction = "If the NSAID is being used as an analgesic or antipyretic, it would be prudent to use an alternative such as acetaminophen. In some people, acetaminophen can increase the anticoagulant effect of warfarin, so monitor the INR if acetaminophen is used in doses over 2 g/day for a few days. For more severe pain consider short-term opioids in place of the NSAID."


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
