import {
    AdditionalExtractionMethod, AdditionalExtractionMethodModel,
    AgentInstructionsModel,
    AgentListModel,
    AgentModel, ExtractionMethod,
    ExtractionMethodModel
} from "../../models/ttyg/agents";
import {
    AdditionalExtractionMethodFormModel,
    AdditionalExtractionMethodsFormModel,
    AgentFormModel,
    AgentInstructionsFormModel,
    ExtractionMethodFormModel, ExtractionMethodsFormModel
} from "../../models/ttyg/agent-form";
import {NumericRangeModel, TextFieldModel} from "../../models/form-fields";
import {md5HashGenerator} from "../../utils/hash-utils";
import {cloneDeep} from "lodash";

const AGENT_MODEL_DEFAULT_VALUES = {
    name: '',
    repositoryId: '',
    model: 'gpt-4o',
    temperature: new NumericRangeModel({
        value: 0.7,
        minValue: 0,
        maxValue: 2,
        step: 0.1
    }),
    topP: new NumericRangeModel({
        value: 1,
        minValue: 0,
        maxValue: 1,
        step: 0.1
    }),
    seed: 1,
    instructions: new AgentInstructionsFormModel({
        systemInstruction: '',
        userInstruction: ''
    }),
    assistantExtractionMethods: new ExtractionMethodsFormModel([
        new ExtractionMethodFormModel({
            method: ExtractionMethod.SPARQL,
            ontologyGraph: 'http://example.com/swgraph',
            sparqlQuery: new TextFieldModel({
                value: 'select ?s ?p ?o where {?s ?p ?o .}',
                minLength: 1,
                maxLength: 2380
            }),
            selected: false
        }),
        new ExtractionMethodFormModel({
            method: ExtractionMethod.FTS_SEARCH,
            maxNumberOfTriplesPerCall: null,
            selected: false
        }),
        new ExtractionMethodFormModel({
            method: ExtractionMethod.SIMILARITY,
            similarityIndex: null,
            similarityIndexThreshold: new NumericRangeModel({
                value: 0.6,
                minValue: 0,
                maxValue: 1,
                step: 0.1
            }),
            maxNumberOfTriplesPerCall: null,
            selected: false
        }),
        new ExtractionMethodFormModel({
            method: ExtractionMethod.RETRIEVAL,
            retrievalConnectorInstance: null,
            maxNumberOfTriplesPerCall: null,
            queryTemplate: new TextFieldModel({
                value: '{"query": "string"}',
                minLength: 1,
                maxLength: 2380
            }),
            selected: false
        })
    ]),
    additionalExtractionMethods: new AdditionalExtractionMethodsFormModel([
        new AdditionalExtractionMethodFormModel({
            method: AdditionalExtractionMethod.IRI_DISCOVERY_SEARCH
        })
    ])
};

export const newAgentFormModelProvider = () => {
    return new AgentFormModel(cloneDeep(AGENT_MODEL_DEFAULT_VALUES));
};

/**
 * Converts the response from the server to a list of AgentModel.
 * @param {*[]} data
 * @return {AgentListModel}
 */
export const agentListMapper = (data) => {
    if (!data) {
        return new AgentListModel();
    }
    const agentModels = data.map((chat) => agentModelMapper(chat));
    return new AgentListModel(agentModels);
};

export const agentModelMapper = (data) => {
    if (!data) {
        return;
    }
    const hashGenerator = md5HashGenerator();
    return new AgentModel({
        id: data.id,
        name: data.name,
        repositoryId: data.repositoryId,
        model: data.model,
        temperature: data.temperature,
        topP: data.topP,
        seed: data.seed,
        instructions: agentInstructionsMapper(data.instructions),
        assistantExtractionMethods: extractionMethodsMapper(data.assistantExtractionMethods),
        additionalExtractionMethods: additionalExtractionMethodsMapper(data.additionalExtractionMethods)
    }, hashGenerator);
};

const extractionMethodsMapper = (data) => {
    if (!data) {
        return;
    }
    return data.map((extractionMethod) => extractionMethodMapper(extractionMethod));
};

const extractionMethodMapper = (data) => {
    if (!data) {
        return;
    }
    return new ExtractionMethodModel({
        method: data.method,
        ontologyGraph: data.ontologyGraph,
        sparqlQuery: data.sparqlQuery,
        similarityIndex: data.similarityIndex,
        similarityIndexThreshold: data.similarityIndexThreshold,
        maxNumberOfTriplesPerCall: data.maxNumberOfTriplesPerCall,
        queryTemplate: data.queryTemplate,
        retrievalConnectorInstance: data.retrievalConnectorInstance
    });
};

const additionalExtractionMethodsMapper = (data) => {
    if (!data) {
        return;
    }
    return data.map((additionalExtractionMethod) => additionalExtractionMethodMapper(additionalExtractionMethod));
};

const additionalExtractionMethodMapper = (data) => {
    if (!data) {
        return;
    }
    return new AdditionalExtractionMethodModel({
        method: data.method
    });
};

const agentInstructionsMapper = (data) => {
    if (!data) {
        return;
    }
    return new AgentInstructionsModel({
        systemInstruction: data.systemInstruction,
        userInstruction: data.userInstruction
    });
};
