import {cloneDeep} from "lodash";

export class TtygRestServiceFakeBackend {

    constructor() {
        this.conversations = [];
    }

    getConversations() {
        return new Promise((resolve) => {
            resolve({data: cloneDeep(this.conversations)});
        });
    }

    getConversation(id) {
        return Promise.resolve({data: cloneDeep(this.conversations.find((conversation) => conversation.id === id))});
    }

    renameConversation(id, data) {
        const conversation = this.conversations.find((conversation) => conversation.id === id);
        if (conversation) {
            conversation.name = data.name;
        }
        return Promise.resolve({data: cloneDeep(conversation)});
    }

    exportConversation(id) {
        console.log("Exporting conversation with id: ", id);
        return Promise.resolve();
    }

    askQuestion(data) {
        let answer = {
            id: "msg_Bn07kVDCYT1qmgu1G7Zw0KNe",
            conversationId: data.conversationId,
            agentId: null,
            message: `Reply to '${data.question}'`,
            role: "user",
            timestamp: Date.now()
        };
        const conversation = this.conversations.find((conversation) => conversation.id === data.conversationId);
        if (conversation) {
            conversation.messages.push(answer);
        }
        return Promise.resolve({data: answer});
    }

    deleteConversation(id) {
        this.conversations = this.conversations.filter((conversation) => conversation.id !== id);
        return Promise.resolve();
    }

    createConversation() {
        const conversation = {
            id: `thread_${this.conversations.length}`,
            name: `Thread ${this.conversations.length}`,
            timestamp: Date.now(),
            messages: []
        };
        this.conversations.unshift(conversation);
        return Promise.resolve({data: conversation});
    }
}
