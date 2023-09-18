
/**
 * class used to track PeerJs connections 
 */
class connectionTracker {
    constructor() {
        this.connectionsById = [];
        this.connectionArr = [{ isServer: false, PeerId: "", PeerJsConnection: {} }]// present so that VScode knows what type this will be
        this.connectionArr.pop();
    }

    push(connection, id) {
        if (Object.keys(this.connectionsById).includes(id)) {
            this.connectionArr.find(x => x.PeerId == id).PeerJsConnection = connection
        } else {
            this.connectionArr.push({ isServer: false, PeerId: id, PeerJsConnection: connection })
        }
        this.connectionsById[id] = connection
    }

    remove(id) {
        delete this.connectionsById[id];
        this.connectionArr = this.connectionArr.filter(x => x.PeerId != id)
    }

    /**
     * 
     * @param {string} id 
     * @returns 
     */
    getCon(id) {
        return this.connectionsById[id]
    }

    setServer(id) {
        for (const con of this.connectionArr) {
            if (con.PeerId === id) {
                con.isServer = true;
            } else {
                con.isServer = false;
            }
        }
    }

    getServer() {
        return this.connectionArr.find(x => x.isServer == true)?.PeerJsConnection;
    }

    /**
     * 
     * @returns {number} number of connections tracked by this instance
     */
    numConnection = () => this.connectionArr.length

    /**
     * 
     * @returns {string[]} list of string Ids for the connections tracked by this instance
     */
    allPeerIds = () => Object.keys(this.connectionsById)
}


class VotingSession {

    static MAX_VOTE = 268435456;
    constructor(remoteSession = null, id = null, _vote = null) {
        if (remoteSession === null && id === null) {
            this.start = Date.now() - 5000;
            this.end = Date.now() + 5000;
            this.castVote();
            this.otherVotes = [];
        } else {
            this.start = remoteSession.start;
            this.end = remoteSession.end;
            this.vote = null;
            this.otherVotes = [{ vote: remoteSession.vote, id: id }];
        }
        if (_vote){
            this.vote = _vote;
        }
        console.log(this);
    }

    castVote() {
        this.vote = Math.floor(Math.random() * VotingSession.MAX_VOTE);
    }

    /**
     * 
     * @param {VotingSession} other 
     * @param {string} id 
     */
    addOtherSession(other, id, totalExpected) {
        if (this.start > other.start) {
            this.start = other.start;
        }
        if (this.end < other.end) {
            this.end = other.end;
        }
        this.otherVotes.push({ vote: other.vote, id: id })

        console.log(this.otherVotes, totalExpected)
        if (this.otherVotes.length >= totalExpected) {
            this.otherVote = this.otherVotes.sort((a, b) => b.vote - a.vote);
            if (this.otherVotes[0].vote < this.vote) {
                // console.log(`becoming Server with vote ${this.vote}`);
                return true;
            }
            // console.log(`${this.otherVotes[0].id} should become server with vote ${this.otherVotes[0].vote}`);
            return this.otherVotes[0].id;
        }
        return null;
    }

    IsActive() { return Date.now() > this.start && Date.now() < this.end };
}

export { VotingSession, connectionTracker }