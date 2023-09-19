
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
     * @returns PeerJs connection
     */
    getCon(id) {
        return this.connectionsById[id]
    }

    /**
     * 
     * @param {string} id 
     */
    setServer(id) {
        for (const con of this.connectionArr) {
            if (con.PeerId === id) {
                con.isServer = true;
            } else {
                con.isServer = false;
            }
        }
    }

    /**
     * 
     * @returns the PeerJs Connection object for the current server
     */
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

    start = 0;
    end = 0;
    vote = 0;
    otherVotes = [{ vote: 0, id: "" }];

    /**
     * 
     * @param {VotingSession} remoteSession voting session started by remote server
     * @param {string} id of the remote session
     * @param {*} _vote manual override of the random vote for this session
     */
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
        if (_vote) {
            this.vote = _vote;
        }
    }

    /**
     * generate a random vote for this session
     */
    castVote() {
        let ret = this.vote === null;
        this.vote = Math.floor(Math.random() * VotingSession.MAX_VOTE);
        return ret;
    }

    Expire(){
        this.end = 0;
        this.start = 0;
    }

    /**
     * 
     * @param {VotingSession} other vote cast by remote session
     * @param {string} id of remote session
     */
    addOtherSession(other, id) {
        if (this.start > other.start) {
            this.start = other.start;
        }
        if (this.end < other.end) {
            this.end = other.end;
        }
        this.otherVotes.push({ vote: other.vote, id: id })
    }


    /**
     * 
     * @param {number} totalExpected number of expected remote sessions that should cast a vote
     * @returns {true | string | null} true if this instance should become server string to indicate which other instance should become server or null to indicate voting has not finished yet
     */
    checkWinner(totalExpected){
        if (this.otherVotes.length >= totalExpected) {
            this.otherVotes = this.otherVotes.sort((a, b) => b.vote - a.vote);
            if (this.otherVotes[0].vote < this.vote) {
                console.log(`becoming Server with vote ${this.vote}`);
                return true;
            }
            console.log(`${this.otherVotes[0].id} should become server with vote ${this.otherVotes[0].vote}`);
            return this.otherVotes[0].id;
        }
        console.log(`waiting for ${totalExpected} votes, received ${this.otherVotes.length}`)
        return null;
    }

    /**
     * 
     * @returns {boolean} true if the current session is active
     */
    IsActive() { return Date.now() > this.start && Date.now() < this.end };
}

function TestTracker() {
    let connTrack = new connectionTracker();
    console.log(connTrack)
    connTrack.push({ dat: 1 }, "tees12")
    connTrack.push({ dat: 2 }, "tees1234")
    connTrack.push({ dat: 3 }, "tees12345")
    console.log(connTrack)
    connTrack.setServer("tees12345")
    console.log(connTrack.getCon("tees12"))
    console.log(connTrack.getCon("tees1234"))
    console.log(connTrack.getServer())
    console.log(Object.keys(connTrack.connectionsById))
    connTrack.remove("tees1234")
    console.log(Object.keys(connTrack.connectionsById))
    connTrack.remove("tees12345")
    console.log(Object.keys(connTrack.connectionsById))
}

export { VotingSession, connectionTracker, TestTracker }