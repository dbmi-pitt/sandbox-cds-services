const winston = require('winston');

const pddiValueSets = require('../pddi-cds-valuesets.json');

// VALUE SETS FOR THIS PDDI CDS RULE (TODO: move to a global variable file?)
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

const topicalDiclofenac = pddiValueSets["topical diclofenac"]
if (!topicalDiclofenac) {
    winston.log('error', 'warfarin-nsaids-CDS - not able to retrieve topical diclofenac value set!');
    return null;
}
winston.log('info',  "warfarin-nsaids-CDS - topical diclofenac value set:",{topicalDiclofenac});

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
    resourceCuis.forEach((cui) => {
	if (warfarins[cui]){
	    warfarin = cui;
	} else if (nsaids[cui]){
	    nsaid = cui
	}	
    });
    winston.log('info','tested for warfarin and nsaid:',{warfarin,nsaid});

    if (warfarin && nsaid){
	return {'warfarin':warfarin,'nsaid':nsaid};
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

    cdsState.mechanism = "Non-steroidal anti-inflammatory drugs (NSAIDs) have antiplatelet effects which increase the bleeding risk when combined with oral anticoagulants such as warfarin. The antiplatelet effect of NSAIDs lasts only as long as the NSAID is present in the circulation, unlike aspirin’s antiplatelet effect, which lasts for up to 2 weeks after aspirin is discontinued. NSAIDs also can cause peptic ulcers and most of the evidence for increased bleeding risk with NSAIDs plus warfarin is due to upper gastrointestinal bleeding (UGIB).";
    cdsState.clinicalConsequences = "Increased risk of bleeding including gastrointestinal bleeding, intracranial hemorrhage, and cerebral hemorrhage";
    cdsState.seriousness = "Bleeding is a serious potential clinical consequence because it can result in death, life-threatening hospitalization, and disability.";
    cdsState.severity = "While bleeding is a serious potential clinical consequence, severity can vary from easily tolerated to incapacitating";
    cdsState.generalRecommendedAction = "If the NSAID is being used as an analgesic or antipyretic, it would be prudent to use an alternative such as acetaminophen. In some people, acetaminophen can increase the anticoagulant effect of warfarin, so monitor the INR if acetaminophen is used in doses over 2 g/day for a few days. For more severe pain consider short-term opioids in place of the NSAID."
	
    // Case : The NSAIDs is topical diclofenac
    if (topicalDiclofenac[cdsState.drugPair.nsaid]){
	winston.log('info','runRule - NSAIDs is a topical diclofenac');
	cdsState.ruleBranch = 'NSAIDs is a topical diclofenac';
	cdsState.ruleBranchRecommendedAction = "No special precautions";
	cdsState.evidence = "Topical diclofenac has relatively low systemic absorption; in one study a topical gel (16 g/day) produced about 6% of the absorption seen with systemic administration of 150 mg/day. A higher than recommended dose of topical gel (48 g/day) produced 20% of a systemic dose of diclofenac."
	return cdsState;
    } 

    // default - no branching logic - return incomplete cdsState -- TODO:should report error? 
    return cdsState;
}
