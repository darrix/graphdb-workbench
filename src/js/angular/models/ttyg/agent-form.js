export class AgentFormModel {
    constructor(data) {
        /**
         * @type {string}
         * @private
         */
        this._name = data.name;
        /**
         * @type {string}
         * @private
         */
        this._repositoryId = data.repositoryId;
        /**
         * @type {string}
         * @private
         */
        this._model = data.model;
        /**
         * @type {NumericRangeModel}
         * @private
         */
        this._temperature = data.temperature;
        /**
         * @type {NumericRangeModel}
         * @private
         */
        this._topP = data.topP;
        /**
         * @type {number}
         * @private
         */
        this._seed = data.seed;
        /**
         * @type {AgentInstructionsFormModel}
         * @private
         */
        this._instructions = data.instructions;
        /**
         * @type {ExtractionMethodsFormModel}
         * @private
         */
        this._assistantExtractionMethods = data.assistantExtractionMethods;
        /**
         * @type {AdditionalExtractionMethodsFormModel}
         * @private
         */
        this._additionalExtractionMethods = data.additionalExtractionMethods;
    }

    /**
     * Converts the form model to a payload that can be sent to the backend. The payload is built by getting all the
     * simple values from the form model and calling the toPayload method on the nested complex models.
     * @return {*}
     */
    toPayload() {
        return {
            name: this._name,
            repositoryId: this._repositoryId,
            model: this._model,
            temperature: this._temperature.value,
            topP: this._topP.value,
            seed: this._seed,
            assistantsInstructions: this._instructions.toPayload(),
            assistantExtractionMethods: this._assistantExtractionMethods.toPayload(),
            additionalExtractionMethods: this._additionalExtractionMethods.toPayload()
        };
    }

    /**
     * Checks if at least one extraction method is selected.
     * @return {boolean} - true if at least one extraction method is selected, false otherwise.
     */
    hasExtractionMethodSelected() {
        return this._assistantExtractionMethods.extractionMethods.some((method) => method.selected);
    }

    get id() {
        return this._id;
    }

    set id(value) {
        this._id = value;
    }

    get name() {
        return this._name;
    }

    set name(value) {
        this._name = value;
    }

    get repositoryId() {
        return this._repositoryId;
    }

    set repositoryId(value) {
        this._repositoryId = value;
    }

    get model() {
        return this._model;
    }

    set model(value) {
        this._model = value;
    }

    get temperature() {
        return this._temperature;
    }

    set temperature(value) {
        this._temperature = value;
    }

    get topP() {
        return this._topP;
    }

    set topP(value) {
        this._topP = value;
    }

    get seed() {
        return this._seed;
    }

    set seed(value) {
        this._seed = value;
    }

    get instructions() {
        return this._instructions;
    }

    set instructions(value) {
        this._instructions = value;
    }

    get assistantExtractionMethods() {
        return this._assistantExtractionMethods;
    }

    set assistantExtractionMethods(value) {
        this._assistantExtractionMethods = value;
    }

    get additionalExtractionMethods() {
        return this._additionalExtractionMethods;
    }

    set additionalExtractionMethods(value) {
        this._additionalExtractionMethods = value;
    }
}

export class ExtractionMethodsFormModel {
    constructor(extractionMethods) {
        /**
         * @type {ExtractionMethodFormModel[]}
         * @private
         */
        this._extractionMethods = extractionMethods;
    }

    toPayload() {
        return this._extractionMethods
            .filter((method) => method.selected)
            .map((method) => method.toPayload());
    }

    get extractionMethods() {
        return this._extractionMethods;
    }

    set extractionMethods(value) {
        this._extractionMethods = value;
    }
}

export class ExtractionMethodFormModel {
    constructor(data) {
        this._selected = data.selected || false;
        /**
         * @type {'fts_search' | 'sparql_search' | 'similarity_search' | 'retrieval_search'}
         * @private
         */
        this._method = data.method;
        /**
         * An option which is part of the presentational model and is used to determine which form fields in the sparql
         * extraction method should be shown.
         * This must not go into the payload.
         * @type {'ontologyGraph' | 'sparqlQuery'}
         * @private
         */
        this._sparqlOption = data.sparqlOption;
        /**
         * @type {string}
         * @private
         */
        this._ontologyGraph = data.ontologyGraph;
        /**
         * @type {TextFieldModel}
         * @private
         */
        this._sparqlQuery = data.sparqlQuery;
        /**
         * @type {number}
         */
        this._maxNumberOfTriplesPerCall = data.maxNumberOfTriplesPerCall;
        /**
         * @type {string}
         */
        this._similarityIndex = data.similarityIndex;
        /**
         * @type {NumericRangeModel}
         * @private
         */
        this._similarityIndexThreshold = data.similarityIndexThreshold;
        /**
         * @type {TextFieldModel}
         * @private
         */
        this._queryTemplate = data.queryTemplate;
        /**
         * @type {string}
         * @private
         */
        this._retrievalConnectorInstance = data.retrievalConnectorInstance;
    }

    toPayload() {
        // Add to the payload only the properties which are available in the model.
        const payload = {};
        payload.method = this._method ? this._method : null;
        // SPARQL method - only one of the following properties can be set
        if (this._sparqlOption === 'ontologyGraph') {
            payload.ontologyGraph = this._ontologyGraph ? this._ontologyGraph : null;
        } else if (this._sparqlOption === 'sparqlQuery') {
            payload.constructQuery = this._sparqlQuery ? this._sparqlQuery.value : null;
        }
        // this is used for all but the SPARQL method
        if (this._maxNumberOfTriplesPerCall) {
            payload.maxNumberOfTriplesPerCall = this._maxNumberOfTriplesPerCall;
        }
        // Similarity search method
        if (this._similarityIndex) {
            payload.similarityIndex = this._similarityIndex;
        }
        if (this._similarityIndexThreshold && this._similarityIndexThreshold.value) {
            payload.similarityIndexThreshold = parseFloat(this._similarityIndexThreshold.value);
        }
        // Retrieval method
        if (this._queryTemplate && this._queryTemplate.value) {
            payload.queryTemplate = this._queryTemplate.value;
        }
        if (this._retrievalConnectorInstance) {
            payload.retrievalConnectorInstance = this._retrievalConnectorInstance;
        }
        return payload;
    }

    get selected() {
        return this._selected;
    }

    set selected(value) {
        this._selected = value;
    }

    get method() {
        return this._method;
    }

    set method(value) {
        this._method = value;
    }

    get sparqlOption() {
        return this._sparqlOption;
    }

    set sparqlOption(value) {
        this._sparqlOption = value;
    }

    get sparqlQuery() {
        return this._sparqlQuery;
    }

    set sparqlQuery(value) {
        this._sparqlQuery = value;
    }

    get ontologyGraph() {
        return this._ontologyGraph;
    }

    set ontologyGraph(value) {
        this._ontologyGraph = value;
    }

    get maxNumberOfTriplesPerCall() {
        return this._maxNumberOfTriplesPerCall;
    }

    set maxNumberOfTriplesPerCall(value) {
        this._maxNumberOfTriplesPerCall = value;
    }

    get similarityIndex() {
        return this._similarityIndex;
    }

    set similarityIndex(value) {
        this._similarityIndex = value;
    }

    get similarityIndexThreshold() {
        return this._similarityIndexThreshold;
    }

    set similarityIndexThreshold(value) {
        this._similarityIndexThreshold = value;
    }

    get queryTemplate() {
        return this._queryTemplate;
    }

    set queryTemplate(value) {
        this._queryTemplate = value;
    }

    get retrievalConnectorInstance() {
        return this._retrievalConnectorInstance;
    }

    set retrievalConnectorInstance(value) {
        this._retrievalConnectorInstance = value;
    }
}

export class AdditionalExtractionMethodsFormModel {
    constructor(data) {
        /**
         * @type {AdditionalExtractionMethodFormModel[]}
         * @private
         */
        this._additionalExtractionMethods = data;
    }

    toPayload() {
        return this._additionalExtractionMethods.map((method) => method.toPayload());
    }

    get additionalExtractionMethods() {
        return this._additionalExtractionMethods;
    }

    set additionalExtractionMethods(value) {
        this._additionalExtractionMethods = value;
    }
}

export class AdditionalExtractionMethodFormModel {
    constructor(data) {
        this._selected = data.selected || false;
        /**
         * @type {'iri_discovery_search'}
         * @private
         */
        this._method = data.method;
    }

    toPayload() {
        return {
            method: this._method
        };
    }

    get selected() {
        return this._selected;
    }

    set selected(value) {
        this._selected = value;
    }

    get method() {
        return this._method;
    }

    set method(value) {
        this._method = value;
    }
}

export class AgentInstructionsFormModel {
    constructor(data) {
        /**
         * @type {string}
         * @private
         */
        this._systemInstruction = data.systemInstruction;
        /**
         * @type {string}
         * @private
         */
        this._userInstruction = data.userInstruction;
    }

    toPayload() {
        return {
            systemInstruction: this._systemInstruction,
            userInstruction: this._userInstruction
        };
    }

    get systemInstruction() {
        return this._systemInstruction;
    }

    set systemInstruction(value) {
        this._systemInstruction = value;
    }

    get userInstruction() {
        return this._userInstruction;
    }

    set userInstruction(value) {
        this._userInstruction = value;
    }
}
