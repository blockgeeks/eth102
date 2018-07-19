var Election = artifacts.require("Election");

contract('Election', function (accounts) {

    it("name should be as set in constructor", function () {
        return Election.deployed().then(function (instance) {
            return instance.name.call();
        }).then(function (name) {
            assert.equal(name, "Presidential Election 2020", "name was not as expected");
        });
    });

    it("votes from unauthorized users should not count", function () {
        var electionInstance;
        var preVoteCount;

        return Election.deployed().then(function (instance) {
            electionInstance = instance;
            return electionInstance.candidates.call(0);
        }).then(function (firstCandidateResult) {
            preVoteCount = firstCandidateResult[1].toNumber();
            return electionInstance.vote(0, {
                from: accounts[0]
            });
        }).then(function () {
            return electionInstance.candidates.call(0);
        }).then(function (firstCandidateResult) {
            assert.equal(preVoteCount, firstCandidateResult[1].toNumber(), "unauthorized user vote was counted");
        });
    });

    it("non-owners cannot authorize voters", function () {
        return Election.deployed().then(function (instance) {
            return instance.authorize(accounts[1], {
                from: accounts[1]
            });
        }).then(function () {
            assert(false, "non-owner cannot call authorize");
        }).catch(function () {
            assert(true, "expected error when non-owner calls authorize");
        });
    });

    it("authorized votes should be counted", function () {
        var electionInstance;
        var preVoteCount;

        return Election.deployed().then(function (instance) {
            electionInstance = instance;
            return electionInstance.candidates.call(0);
        }).then(function (firstCandidateResult) {
            preVoteCount = firstCandidateResult[1].toNumber();
            return electionInstance.authorize(accounts[1], {
                from: accounts[0]
            });
        }).then(function () {
            return electionInstance.vote(0, {
                from: accounts[1]
            });
        }).then(function () {
            return electionInstance.candidates.call(0);
        }).then(function (firstCandidateResult) {
            assert(preVoteCount < firstCandidateResult[1].toNumber(), "candidate vote count should increase after submitting authorized vote");
        });
    });

    it("authorized users can only vote once", function () {
        return Election.deployed().then(function (instance) {
            return instance.vote(0, {
                from: accounts[1]
            });
        }).then(function () {
            assert(false, "authorized users cannot vote twice");
        }).catch(function () {
            assert(true, "expected error when authorized user votes twice");
        });
    });
});