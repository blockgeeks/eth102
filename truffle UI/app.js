App = {
    web3Provider: null,
    contracts: {},

    init: function () {
        console.log("App.init()");
        return App.initWeb3();
    },

    initWeb3: function () {
        if (typeof web3 !== 'undefined') {
            App.web3Provider = web3.currentProvider;
            console.log("found existing web3 provider");
        } else {
            App.web3Provider = new Web3.providers.HttpProvider("http://127.0.0.1:7545");
            console.log("connecting to local Ganache");
        }
        web3 = new Web3(App.web3Provider);
        console.log("initialized web3 instance");
        return App.initContract();
    },

    initContract: function () {
        $.getJSON("Election.json", function (artifactData) {
            App.contracts.Election = TruffleContract(artifactData);
            App.contracts.Election.setProvider(App.web3Provider);
            console.log("initialized Election contract");

            return App.initUI();
        });
    },

    initUI: function () {
        console.log("App.initUI()");
        var electionInstance;

        App.contracts.Election.deployed().then(function (instance) {
            electionInstance = instance;
            return electionInstance.name.call();
        }).then(function (name) {
            $("#election-name")[0].innerHTML = name;
            return electionInstance.candidates.call(0);
        }).then(function (candidate1) {
            $("#results #candidate-name").children()[0].innerHTML = candidate1[0];
            $("#results #vote-count").children()[0].innerHTML = candidate1[1];
            return electionInstance.candidates.call(1);
        }).then(function (candidate2) {
            $("#results #candidate-name").children()[1].innerHTML = candidate2[0];
            $("#results #vote-count").children()[1].innerHTML = candidate2[1];
        }).catch(function (err) {
            console.log(err.message);
        });

        return App.bindEvents();
    },

    bindEvents: function () {
        $(".vote").on('click', function () {
            var voteIndex = $(this).attr("data-index");
            App.submitVote(voteIndex);
        });
    },

    submitVote: function (voteIndex) {
        console.log("App.submitVote()");

        App.contracts.Election.deployed().then(function (instance) {
            return instance.vote(voteIndex, {
                from: web3.eth.accounts[0]
            });
        }).then(function (result) {
            console.log("tx hash: " + result.tx);
            for (var i = 0; i < result.logs.length; i++) {
                var log = result.logs[i];
                if (log.event == "VoteSubmitted") {
                    App.updateVoteCount();
                }
            }
        }).catch(function (err) {
            console.log(err.message);
        });
    },

    updateVoteCount: function () {
        console.log("App.updateVoteCount()");
        var electionInstance;

        App.contracts.Election.deployed().then(function (instance) {
            electionInstance = instance;
            return electionInstance.candidates.call(0);
        }).then(function (result1) {
            $("#results #vote-count").children()[0].innerHTML = result1[1];
            return electionInstance.candidates.call(1);
        }).then(function (result2) {
            $("#results #vote-count").children()[1].innerHTML = result2[1];
        }).catch(function (err) {
            console.log(err.message);
        });
    }
};

$(window).on("load", function () {
    App.init();
});