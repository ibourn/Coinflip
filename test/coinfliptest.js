//const BigNumber = require('bignumber.js');

//DUE TO VARIABLES VISIBILITY SET TO PRIVATE NO MORE TESTABLE

const CoinflipBase = artifacts.require('CoinflipBase'); //charge contrat Dogs/ fichier build
const CoinflipMainV1 = artifacts.require('CoinflipMainV1'); //charge contrat Dogs
const Proxy = artifacts.require('CoinflipProxy'); //charge contrat Proxy
const truffleAssert = require('truffle-assertions');
const CoinflipMainV0 = artifacts.require('CoinflipMainV0');
const CoinflipMainV2 = artifacts.require('CoinflipMainV2');

const Float_MIN = 1e-10;
//mocha mise en commentaire runner.js l846

//compile => solidity / migrate =>js / develop-ganache/console test
//Attention pour test : fichier deploy partie test
//et mettre fonction public pour tester
//contract('CoinflipMain', async function(accounts) {
contract('CoinflipMainV1', async function(accounts) {

  let instance;

  let option1 = {value : web3.utils.toWei("1", "ether")};
  let option2 = {value : web3.utils.toWei("1", "ether")};
  let option3 = {from : accounts[0]};
  let option4 = {from : accounts[1]};
  let option5 = {from : accounts[2]};
  let option6 = {from : accounts[0], value : web3.utils.toWei("1", "ether")};
  let option7 = {from : accounts[1], value : web3.utils.toWei("1", "ether")};
  let option8 = {from : accounts[2], value : web3.utils.toWei("1", "ether")};
  let option9 = {from : accounts[0], value : web3.utils.toWei("5", "ether")};


  before(async function() {
    instance = await CoinflipMainV1.deployed();
  });


  it("should initialize correctly", async function() {
    //instance = await CoinflipMain.deployed();
    let mini = await instance.getMinimumBet();
    let maxi = await instance.getMaximumBet();
    let factor = await instance.getJackpotFactor();
    let pause = await instance.getPauseState();
    assert(pause == false);//, "paused should be false");
    assert(factor == 2);//, "factor should be 2");
    assert(maxi == web3.utils.toWei("1", "ether"), "maxi should be 1 ether");//, "maxi should be 1000 finney");
    assert(mini == web3.utils.toWei("0.01", "ether"), "mini should 0.01 ether");//, "mini should be 10 finney");
    console.log("initialization : factor 2 mini 0.01 maxi 1");
  });
  it("should set minimum of bet correctly", async function() {
    await truffleAssert.passes(instance.updateMinimumBet(web3.utils.toWei("0.05", "ether")));
    let mini = await instance.getMinimumBet();
    console.log("new minimum of bet is " + web3.utils.fromWei(mini, "ether"));
  });
  it("should not allow to set a maximum < to the minimum", async function() {
    await truffleAssert.fails(instance.updateMaximumBet(web3.utils.toWei("0.01", "ether")), truffleAssert.ErrorType.REVERT);
    let maxi = await instance.getMaximumBet();
    let mini = await instance.getMinimumBet();
    console.log("try to set maximum of bet at 0.01 ether\n" + "maximum of bet is " + web3.utils.fromWei(maxi, "ether")+ "minimum of bet is " + web3.utils.fromWei(mini), "ether");
  });
  it("should return 0 or 1", async function() {
    let res = await instance.runPseudoRandom();
    assert(res == 0 || res == 1);
  });

  it("should accept a deposit from owner and set the balance correctly", async function() {
    //PB : bignumber => to do
    //let balanceBefore = await parseInt(web3.utils.fromWei(instance.getContractStates().bal, "ether"));
    await truffleAssert.passes(instance.deposit({value : web3.utils.toWei("10", "ether"), from : accounts[0]}), truffleAssert.ErrorType.REVERT);
    //let balanceAfter = await parseInt(web3.utils.fromWei(instance.getContractStates().bal, "ether"));
    //assert((balanceAfter - balanceBefore) == 20, "amount received not consistent");
  });
  it("should not accept a deposit from user", async function() {
    await truffleAssert.fails(instance.deposit({value : web3.utils.toWei("20", "ether"), from : accounts[3]}), truffleAssert.ErrorType.REVERT);
  });
  it("should initialize a bet correctly for user 5", async function() {

    await instance.deposit(option9);
    //let res2 = await instance.getlistOfBetslength();
    await instance.initializeNewBet(web3.utils.toWei("0.05", "ether"),accounts[5]);
    let res = await instance.getLastBet();
    let statesAfter = await instance.getContractStates({from :accounts[5]});
    //let lastId = await instance.getLastBetId();
    console.log("amount of the bet : " + web3.utils.fromWei(res.amount, "ether") );
    console.log("jackpot factor : " + res.factor );
    console.log(" size of _listOfBets : " + statesAfter.nBets.toNumber());
    assert(res.factor == 0, "factor not valid");
    assert(res.amount == web3.utils.toWei("0.05", "ether"), "amount not valid");
    assert(statesAfter.nBets  == 1, "no bet added to _listOfBets");
    // console.log("res" + res3.amount );
    // assert(res3.amount == web3.utils.toWei("0.05", "ether"), "index non valide");
  });
  it("should set the bet initialized to won correctly for user 5", async function() {
    //let res2 = await instance.getlistOfBetslength();
  //  await instance.initializeNewBet(web3.utils.toWei("0.05", "ether"),accounts[5]);
//    let res3 = await instance.getlastBet();
    await instance.setNewBetState(1,accounts[5]);
    let res = await instance.getLastBet();
    console.log("won : " + res.win);
    console.log("jackpot factor : " + res.factor);
    assert(res.factor == 2, "factor not valid");
    assert(res.win == true, "win state not valid");

    // console.log("res" + res3.amount );
    // assert(res3.amount == web3.utils.toWei("0.05", "ether"), "index non valide");
  });
  it("should close the winning bet correctly for user 5", async function() {
    //let res2 = await instance.getlistOfBetslength();
    let statesBefore = await instance.getContractStates();
    let accountBefore = await instance.getAccountOfUser(accounts[5]);
  //  await instance.initializeNewBet(web3.utils.toWei("0.05", "ether"),accounts[5]);
    //await instance.setNewBetState(1,accounts[5]);
    await instance.closeNewBet(accounts[5]);
    let accountAfter = await instance.getAccountOfUser(accounts[5]);
    let lastBet =  await instance.getLastBetOfUser(accounts[5]);
    let statesAfter = await instance.getContractStates();
    let reward = accountAfter.rewToClaim - accountBefore.rewToClaim;
    let totRewardDif = statesAfter.totReward - statesBefore.totReward;
    let index = accountAfter.firstClaimIndex;
    let bet = accountAfter.totLost - accountBefore.totLost;
    let isWon = lastBet.won;
    console.log("account : " + accounts[5] + "\nisknow " + accountAfter.known + " name : " + accountAfter.userName +
     " indexOfFirstBetToClaim : " +accountAfter.firstClaimIndex + " nbr of bets : " + accountAfter.nBets +
     " rewardToClaim : " + web3.utils.fromWei(accountAfter.rewToClaim, "ether") + " totlost : " +web3.utils.fromWei(accountAfter.totLost, "ether"));
    console.log("lastbet : amountBet " + web3.utils.fromWei(lastBet.bet, "ether") + " factor : " + lastBet.factor +
      " isWin : " +lastBet.won + " isClosed : " + lastBet.closed +
      " isClaimed : " + lastBet.claimed);
    console.log("contract states : nBets " + statesAfter.nBets + " nAccounts : " + statesAfter.nAccounts +
     " totReward : " +statesAfter.totReward);
    assert(index > 0, "index of bet with a reward to claim should be >0");
    assert(isWon, "isWon not valid");
    assert(bet == web3.utils.toWei("0.05", "ether"), "amount of bet logged in lost not valid");
    assert(reward == totRewardDif && reward >0, "reward in contract and in account not consistent");
    // console.log("res" + res3.amount );
    // assert(res3.amount == web3.utils.toWei("0.05", "ether"), "index non valide");
  });
  it("should run a flip and set the variables correctly", async function() {
    //let res2 = await instance.getlistOfBetslength();
    let statesBefore = await instance.getContractStates();
    let accountBefore = await instance.getAccountOfUser(accounts[1]);
    await instance.flip({value : web3.utils.toWei("0.05", "ether"), from : accounts[1]});
    let accountAfter = await instance.getAccountOfUser(accounts[1]);
    let lastBet =  await instance.getLastBetOfUser(accounts[1]);
    let statesAfter = await instance.getContractStates();
    let isWon = lastBet.won;
    let rewUserUp = accountAfter.rewToClaim > accountBefore.rewToClaim;
    let rewTotUp = statesAfter.totReward > statesBefore.totReward;
    let listBetsUp = statesAfter.nBets > statesBefore.nBets;
    let claimIndex = accountAfter.firstClaimIndex > 0;
    console.log("account : " + accounts[1] + "\nisknow " + accountAfter.known + " name : " + accountAfter.userName +
     " indexOfFirstBetToClaim : " +accountAfter.firstClaimIndex + " nbr of bets : " + accountAfter.nBets +
     " rewardToClaim : " + web3.utils.fromWei(accountAfter.rewToClaim, "ether") + " totlost : " +web3.utils.fromWei(accountAfter.totLost, "ether"));
    console.log("lastbet : amountBet " + web3.utils.fromWei(lastBet.bet, "ether") + " factor : " + lastBet.factor +
      " isWin : " +lastBet.won + " isClosed : " + lastBet.closed +
      " isClaimed : " + lastBet.claimed);
    console.log("contract states : nBets " + statesAfter.nBets + " nAccounts : " + statesAfter.nAccounts +
     " totReward : " +statesAfter.totReward);
    assert((isWon && rewUserUp && rewTotUp) || (!isWon && !rewUserUp && !rewTotUp), "win state and reward from account and list of bets not valid");
    assert((isWon && claimIndex) || (!isWon), "bet won, no index (toclaim) valid");
    // console.log("res" + res3.amount );
    // assert(res3.amount == web3.utils.toWei("0.05", "ether"), "index non valide");
  });
  it("should run many flip and set correctly rewards & balances", async function() {
    let accArray = [1, 2, 3, 4, 6, 8, 9]; //id of accounts betting
    let betOrderArray = [1, 1, 2, 3, 3, 4, 4, 4, 6, 8, 8, 8, 9]; //order of accounts betting

    let cumRewardUsersBefore = 0.0;
    for (i = 0; i < accArray.length ; i++) {
      let account = await instance.getAccountOfUser(accounts[accArray[i]]);
      cumRewardUsersBefore += parseFloat(web3.utils.fromWei(account.rewToClaim, "ether"));
    }

    let statesBefore = await instance.getContractStates();
    let totRewardContractBefore = parseFloat(web3.utils.fromWei(statesBefore.totReward, "ether"));
    let nbrBetsBefore = statesBefore.nBets;
    console.log("contract : n bets : " + statesBefore.nBets + ", n accounts : " + statesBefore.nAccounts +
      ",balance : " + web3.utils.fromWei(statesBefore.bal, "ether") + ",totReward : " + web3.utils.fromWei(statesBefore.totReward, "ether"));

    for (i = 0; i < betOrderArray.length ; i++) {
      let account = await instance.getAccountOfUser(accounts[betOrderArray[i]]);
      console.log("acount before : " + accounts[betOrderArray[i]]+ "\n  claim index : " + account.firstClaimIndex +
         " n user bets : " + account.nBets + " reward : " + web3.utils.fromWei(account.rewToClaim, "ether") +
         " loss : " + web3.utils.fromWei(account.totLost, "ether") + "\n");
      await instance.flip({value : web3.utils.toWei("0.05", "ether"), from : accounts[betOrderArray[i]]});
      let states = await instance.getContractStates();
      account = await instance.getAccountOfUser(accounts[betOrderArray[i]]);
      let userBet = await instance.getLastBetOfUser(accounts[betOrderArray[i]]);
      console.log("bet : amount : " + web3.utils.fromWei(userBet.bet, "ether") + ", won ? : " + userBet.won);
      console.log("acount after : " + accounts[betOrderArray[i]]+ "\n  claim index : " + account.firstClaimIndex +
        " n user bets : " + account.nBets + " reward : " + web3.utils.fromWei(account.rewToClaim, "ether") +
        " loss : " + web3.utils.fromWei(account.totLost, "ether"));
      console.log("contract : n bets : " + states.nBets + ", n accounts : " + states.nAccounts +
        ",balance : " + web3.utils.fromWei(states.bal, "ether") + ",totReward : " + web3.utils.fromWei(states.totReward, "ether") + "\n");
    }

    let cumRewardUsersAfter = 0.0;
    for (i = 0; i < accArray.length ; i++) {
      let account = await instance.getAccountOfUser(accounts[accArray[i]]);
      cumRewardUsersAfter += parseFloat(web3.utils.fromWei(account.rewToClaim, "ether"));
    }

    let statesAfter = await instance.getContractStates();
    let totRewardContractAfter = parseFloat(web3.utils.fromWei(statesAfter.totReward, "ether"));
    let nbrBetsAfter = statesAfter.nBets;
    console.log("contract : reward before : " +totRewardContractBefore + " reward after : " + totRewardContractAfter + "\ncumul user reward before : " + cumRewardUsersBefore + " after : " +cumRewardUsersAfter);
    assert((totRewardContractAfter - totRewardContractBefore) - (cumRewardUsersAfter - cumRewardUsersBefore) < Float_MIN, "rewards not consistent");
    assert((nbrBetsAfter - nbrBetsBefore) == betOrderArray.length, "nbr of bets not consistent");
});
  it("should set the name correctly", async function() {
    await instance.setName("bob", {from :  accounts[5]});
    let res = await instance.getName(accounts[5]);
    console.log("name : " + res);
    assert(res == "bob", "name not valid");
  });
  it("should add a new account correctly", async function() {
    let accBefore = await instance.getContractStates();
    await instance.addAccount({from :  accounts[7]});
    let accAfter = await instance.getContractStates();
    assert(accAfter.nAccounts.toNumber() > accBefore.nAccounts.toNumber(), "no account added");
  });
  it("should not add an account if already known", async function() {
    let accBefore = await instance.getContractStates();
    await instance.addAccount({from :  accounts[7]});
    let accAfter = await instance.getContractStates();
    assert(accAfter.nAccounts.toNumber() == accBefore.nAccounts.toNumber(), "one account added");
  });
  it("should not accept a bet > balance - rewards to claim", async function() {
    await truffleAssert.fails(instance.flip({value : web3.utils.toWei("50", "ether"), from : accounts[3]}), truffleAssert.ErrorType.REVERT);
  });
  it("should not accept a bet > maximum", async function() {
    await truffleAssert.fails(instance.flip({value : web3.utils.toWei("2", "ether"), from : accounts[3]}), truffleAssert.ErrorType.REVERT);
  });
  it("should not accept a bet < minimum", async function() {
    await truffleAssert.fails(instance.flip({value : web3.utils.toWei("0.0001", "ether"), from : accounts[3]}), truffleAssert.ErrorType.REVERT);
  });
  it("should withraw to user the reward to claim", async function() {
    //PB bignumber
    //var BN = web3.utils.BN;

    let accountBefore = await instance.getAccountOfUser(accounts[1]);
    let contractBefore = await instance.getContractStates();
    let indexOfRewBefore = accountBefore.firstClaimIndex;
    let userRewardBefore = parseFloat(web3.utils.fromWei(accountBefore.rewToClaim, "ether"));
    let rewardOfContractBefore = parseFloat(web3.utils.fromWei(contractBefore.totReward, "ether"));
    console.log("acount before : " + accounts[1]+ "\n  claim index : " + indexOfRewBefore.toString() +
      " reward to claim : " + userRewardBefore.toString());
    console.log("contract total Reward to claim before : " + rewardOfContractBefore);

    // await BigNumber(web3.utils.fromWei((instance.claimRewards({from : accounts[1]})), "ether"));
    //PB bignumber
    //var BN = web3.utils.BN;
    let amount = await instance.claimRewards({from : accounts[1]})

    let accountAfter = await instance.getAccountOfUser(accounts[1]);
    let contractAfter = await instance.getContractStates();
    let indexOfRewAfter = accountAfter.firstClaimIndex;
    let userRewardAfter = parseFloat(web3.utils.fromWei(accountAfter.rewToClaim, "ether"));
    let rewardOfContractAfter = parseFloat(web3.utils.fromWei(contractAfter.totReward, "ether"));
    console.log("acount after : " + accounts[1]+ "\n  claim index : " + indexOfRewAfter +
      " reward to claim : " + userRewardAfter);
    console.log("contract total Reward to claim after : " + rewardOfContractAfter);

    assert(indexOfRewAfter == 0, "index of first bet won to claim not consistent");
    assert(userRewardAfter == 0.0, "reward to claim from user should be 0");
    //ATTENTION aux comparaisons de float
    assert((userRewardBefore - userRewardAfter) - (rewardOfContractBefore - rewardOfContractAfter) < Float_MIN, "withdraw from user account not consistent");
  });
  it("should not withraw to all users the rewards if send by user", async function() {
    await instance.pause();
    await truffleAssert.fails(instance.emergencyClaimAllRewards({from : accounts[1]}));
    await instance.unPause();
  });
  it("should not withraw to all users the rewards if not paused", async function() {
    await truffleAssert.fails(instance.emergencyClaimAllRewards({from : accounts[0]}));
  });
  it("should withraw to all users the rewards to claim and set the bets to 'claimed'", async function() {
    let i = 0;

    let statesBefore = await instance.getContractStates();
    console.log("contract before : n bets : " + statesBefore.nBets + ", n accounts : " + statesBefore.nAccounts +
      ", balance : " + web3.utils.fromWei(statesBefore.bal, "ether") + ", totReward : " + web3.utils.fromWei(statesBefore.totReward, "ether"));

    await instance.pause();
    let amount = await instance.emergencyClaimAllRewards({from : accounts[0]});
    console.log("\nemergencyClaimAllRewards\n");
    await instance.unPause();

    let statesAfter = await instance.getContractStates();
    console.log("contract after : n bets : " + statesAfter.nBets + ", n accounts : " + statesAfter.nAccounts +
      ", balance : " + web3.utils.fromWei(statesAfter.bal, "ether") + ", totReward : " + web3.utils.fromWei(statesAfter.totReward, "ether"));

    let cumulfirstClaimIndex = 0;
    for (i = 0; i < 10 ; i++) {
      let account = await instance.getAccountOfUser(accounts[i]);
      cumulfirstClaimIndex += account.firstClaimIndex;
      console.log("user :" + i + "claim index : " + account.firstClaimIndex);
    }
    let nbets = statesAfter.nBets;
    let isClaimed = true;
    for (i = 0; i < nbets ; i++) {
      let betIsClaimed = await instance.getClaimSateOfBet(i);
      isClaimed = isClaimed && betIsClaimed
      console.log("bet index : " + i + " isClaimed : " + betIsClaimed);
    //  console.log("user :" + i + "claim index : " + account.firstClaimIndex);
    }
    assert(web3.utils.fromWei(statesAfter.totReward, "ether") == 0, "tot rewards to claim from contract should be 0");
    assert(isClaimed == true, "all bets should be set to 'claimed'");
    assert(cumulfirstClaimIndex == 0, "index of frist bet to claim of all users should be 0");
  });
  it("should not withraw the balance to user", async function() {
    await instance.pause();
    await truffleAssert.fails(instance.emergencyWithdrawAll({from : accounts[1]}));
    await instance.unPause();
  });
  it("should not withraw the balance to owner if not paused", async function() {
    await truffleAssert.fails(instance.emergencyWithdrawAll({from : accounts[0]}));
  });
  it("should withraw the balance to owner", async function() {
    await instance.pause();
    await truffleAssert.passes(instance.emergencyWithdrawAll({from : accounts[0]}));
    await instance.unPause();
  });

});

contract('Proxy', async function(accounts) {

  let instance;
  let instanceProxy;

  let option1 = {value : web3.utils.toWei("1", "ether")};
  let option2 = {value : web3.utils.toWei("1", "ether")};
  let option3 = {from : accounts[0]};
  let option4 = {from : accounts[1]};
  let option5 = {from : accounts[2]};
  let option6 = {from : accounts[0], value : web3.utils.toWei("1", "ether")};
  let option7 = {from : accounts[1], value : web3.utils.toWei("1", "ether")};
  let option8 = {from : accounts[2], value : web3.utils.toWei("1", "ether")};
  let option9 = {from : accounts[0], value : web3.utils.toWei("5", "ether")};


  before(async function() {
    //instanceCoinflip = await CoinflipMain.deployed();
    //instanceProxy = await Proxy.new(instanceCoinflip.address);//, {from : accounts[0]});
    instanceProxy = await Proxy.deployed();
    //let instanceCoinflip = await CoinflipMain.deployed();
    //instanceProxy = await Proxy.new(instanceCoinflip.address)
    instance = await CoinflipMainV1.at(instanceProxy.address);
  });


  it("should initialize correctly", async function() {
    instance.initialize(accounts[0]);

    let mini = await instance.getMinimumBet();
    let maxi = await instance.getMaximumBet();
    let factor = await instance.getJackpotFactor();
    let pause = await instance.getPauseState();
    console.log("initialization : factor 2 mini 0.01 maxi 1"+
      "\n min: "+parseFloat((web3.utils.fromWei(mini,"ether")))  + " max: " + web3.utils.fromWei(maxi,"ether"));


    assert(pause == false);//, "paused should be false");
    //assert(factor == 2);//, "factor should be 2");
    assert(maxi == web3.utils.toWei("1", "ether"), "maxi should be 1 ether");//, "maxi should be 1000 finney");
    assert(mini == web3.utils.toWei("0.01", "ether"), "mini should 0.01 ether");//, "mini should be 10 finney");
  });
  it("should set minimum of bet correctly", async function() {
    await truffleAssert.passes(instance.updateMinimumBet(web3.utils.toWei("0.05", "ether")));
    let mini = await instance.getMinimumBet();
    console.log("new minimum of bet is " + web3.utils.fromWei(mini, "ether"));
  });
  it("should not allow to set a maximum < to the minimum", async function() {
    await truffleAssert.fails(instance.updateMaximumBet(web3.utils.toWei("0.01", "ether")), truffleAssert.ErrorType.REVERT);
    let maxi = await instance.getMaximumBet();
    let mini = await instance.getMinimumBet();
    console.log("try to set maximum of bet at 0.01 ether\n" + "maximum of bet is " + web3.utils.fromWei(maxi, "ether")+ "minimum of bet is " + web3.utils.fromWei(mini), "ether");
  });
  it("should return 0 or 1", async function() {
    let res = await instance.runPseudoRandom();
    assert(res == 0 || res == 1);
  });

  it("should accept a deposit from owner and set the balance correctly", async function() {
    //PB : bignumber => @TODO
    //let balanceBefore = await parseInt(web3.utils.fromWei(instance.getContractStates().bal, "ether"));
    await truffleAssert.passes(instance.deposit({value : web3.utils.toWei("10", "ether"), from : accounts[0]}), truffleAssert.ErrorType.REVERT);
    //let balanceAfter = await parseInt(web3.utils.fromWei(instance.getContractStates().bal, "ether"));
    //assert((balanceAfter - balanceBefore) == 20, "amount received not consistent");
  });
  it("should not accept a deposit from user", async function() {
    await truffleAssert.fails(instance.deposit({value : web3.utils.toWei("20", "ether"), from : accounts[3]}), truffleAssert.ErrorType.REVERT);
  });
  it("should initialize a bet correctly for user 5", async function() {

  //  await instance.deposit(option9);
    //let res2 = await instance.getlistOfBetslength();
    await instance.initializeNewBet(web3.utils.toWei("0.05", "ether"),accounts[5]);
    let res = await instance.getLastBet();
    let resfactor = res.factor;
    let resamount = res.amount;
    let stateContract = await instance.getContractStates({from : accounts[5]});
    let statesAfter = stateContract.nBets;
    //let lastId = await instance.getLastBetId();
    console.log("amount of the bet : " + web3.utils.fromWei(resamount, "ether") );
    console.log("jackpot factor : " + resfactor );
    console.log(" size of _listOfBets : " + statesAfter.toNumber());
///    assert(res.factor == 0, "factor not valid");
  //  assert(res.amount == web3.utils.toWei("0.05", "ether"), "amount not valid");
  //  assert(statesAfter.nBets  == 1, "no bet added to _listOfBets");
    // console.log("res" + res3.amount );
    // assert(res3.amount == web3.utils.toWei("0.05", "ether"), "index non valide");
  });
  it("should set the bet initialized to won correctly for user 5", async function() {
    //let res2 = await instance.getlistOfBetslength();
  //  await instance.initializeNewBet(web3.utils.toWei("0.05", "ether"),accounts[5]);
//    let res3 = await instance.getlastBet();
    await instance.setNewBetState(1,accounts[5]);
    let res = await instance.getLastBet();
    console.log("won : " + res.win);
    console.log("jackpot factor : " + res.factor);
    assert(res.factor == 2, "factor not valid");
    assert(res.win == true, "win state not valid");

    // console.log("res" + res3.amount );
    // assert(res3.amount == web3.utils.toWei("0.05", "ether"), "index non valide");
  });

  it("should close the winning bet correctly for user 5", async function() {
    //let res2 = await instance.getlistOfBetslength();
    let statesBefore = await instance.getContractStates();
    let accountBefore = await instance.getAccountOfUser(accounts[5]);

    await instance.closeNewBet(accounts[5]);
    let accountAfter = await instance.getAccountOfUser(accounts[5]);
    let lastBet =  await instance.getLastBetOfUser(accounts[5]);
    let statesAfter = await instance.getContractStates();
    let reward = accountAfter.rewToClaim - accountBefore.rewToClaim;
    let totRewardDif = statesAfter.totReward - statesBefore.totReward;
    let index = accountAfter.firstClaimIndex;
    let bet = accountAfter.totLost - accountBefore.totLost;
    let isWon = lastBet.won;
    console.log("account : " + accounts[5] + "\nisknow " + accountAfter.known + " name : " + accountAfter.userName +
     " indexOfFirstBetToClaim : " +accountAfter.firstClaimIndex + " nbr of bets : " + accountAfter.nBets +
     " rewardToClaim : " + web3.utils.fromWei(accountAfter.rewToClaim, "ether") + " totlost : " +web3.utils.fromWei(accountAfter.totLost, "ether"));
    console.log("lastbet : amountBet " + web3.utils.fromWei(lastBet.bet, "ether") + " factor : " + lastBet.factor +
      " isWin : " +lastBet.won + " isClosed : " + lastBet.closed +
      " isClaimed : " + lastBet.claimed);
    console.log("contract states : nBets " + statesAfter.nBets + " nAccounts : " + statesAfter.nAccounts +
     " totReward : " +statesAfter.totReward);
    assert(index > 0, "index of bet with a reward to claim should be >0");
    assert(isWon, "isWon not valid");
    assert(bet == web3.utils.toWei("0.05", "ether"), "amount of bet logged in lost not valid");
    assert(reward == totRewardDif && reward >0, "reward in contract and in account not consistent");
  });
  it("should run a flip and set the variables correctly", async function() {
    //let res2 = await instance.getlistOfBetslength();
    let statesBefore = await instance.getContractStates();
    let accountBefore = await instance.getAccountOfUser(accounts[1]);
    await instance.flip({value : web3.utils.toWei("0.05", "ether"), from : accounts[1]});
    let accountAfter = await instance.getAccountOfUser(accounts[1]);
    let lastBet =  await instance.getLastBetOfUser(accounts[1]);
    let statesAfter = await instance.getContractStates();
    let isWon = lastBet.won;
    let rewUserUp = accountAfter.rewToClaim > accountBefore.rewToClaim;
    let rewTotUp = statesAfter.totReward > statesBefore.totReward;
    let listBetsUp = statesAfter.nBets > statesBefore.nBets;
    let claimIndex = accountAfter.firstClaimIndex > 0;
    console.log("account : " + accounts[1] + "\nisknow " + accountAfter.known + " name : " + accountAfter.userName +
     " indexOfFirstBetToClaim : " +accountAfter.firstClaimIndex + " nbr of bets : " + accountAfter.nBets +
     " rewardToClaim : " + web3.utils.fromWei(accountAfter.rewToClaim, "ether") + " totlost : " +web3.utils.fromWei(accountAfter.totLost, "ether"));
    console.log("lastbet : amountBet " + web3.utils.fromWei(lastBet.bet, "ether") + " factor : " + lastBet.factor +
      " isWin : " +lastBet.won + " isClosed : " + lastBet.closed +
      " isClaimed : " + lastBet.claimed);
    console.log("contract states : nBets " + statesAfter.nBets + " nAccounts : " + statesAfter.nAccounts +
     " totReward : " +statesAfter.totReward);
    assert((isWon && rewUserUp && rewTotUp) || (!isWon && !rewUserUp && !rewTotUp), "win state and reward from account and list of bets not valid");
    assert((isWon && claimIndex) || (!isWon), "bet won, no index (toclaim) valid");
  });
  it("should run many flip and set correctly rewards & balances", async function() {
    let accArray = [1, 2, 3, 4, 6, 8, 9]; //id of accounts betting
    let betOrderArray = [1, 1, 2, 3, 3, 4, 4, 4, 6, 8, 8, 8, 9]; //order of accounts betting

    let cumRewardUsersBefore = 0.0;
    for (i = 0; i < accArray.length ; i++) {
      let account = await instance.getAccountOfUser(accounts[accArray[i]]);
      cumRewardUsersBefore += parseFloat(web3.utils.fromWei(account.rewToClaim, "ether"));
    }

    let statesBefore = await instance.getContractStates();
    let totRewardContractBefore = parseFloat(web3.utils.fromWei(statesBefore.totReward, "ether"));
    let nbrBetsBefore = statesBefore.nBets;
    console.log("contract : n bets : " + statesBefore.nBets + ", n accounts : " + statesBefore.nAccounts +
      ",balance : " + web3.utils.fromWei(statesBefore.bal, "ether") + ",totReward : " + web3.utils.fromWei(statesBefore.totReward, "ether"));

    for (i = 0; i < betOrderArray.length ; i++) {
      let account = await instance.getAccountOfUser(accounts[betOrderArray[i]]);
      console.log("acount before : " + accounts[betOrderArray[i]]+ "\n  claim index : " + account.firstClaimIndex +
         " n user bets : " + account.nBets + " reward : " + web3.utils.fromWei(account.rewToClaim, "ether") +
         " loss : " + web3.utils.fromWei(account.totLost, "ether") + "\n");
      await instance.flip({value : web3.utils.toWei("0.05", "ether"), from : accounts[betOrderArray[i]]});
      let states = await instance.getContractStates();
      account = await instance.getAccountOfUser(accounts[betOrderArray[i]]);
      let userBet = await instance.getLastBetOfUser(accounts[betOrderArray[i]]);
      console.log("bet : amount : " + web3.utils.fromWei(userBet.bet, "ether") + ", won ? : " + userBet.won);
      console.log("acount after : " + accounts[betOrderArray[i]]+ "\n  claim index : " + account.firstClaimIndex +
        " n user bets : " + account.nBets + " reward : " + web3.utils.fromWei(account.rewToClaim, "ether") +
        " loss : " + web3.utils.fromWei(account.totLost, "ether"));
      console.log("contract : n bets : " + states.nBets + ", n accounts : " + states.nAccounts +
        ",balance : " + web3.utils.fromWei(states.bal, "ether") + ",totReward : " + web3.utils.fromWei(states.totReward, "ether") + "\n");
    }

    let cumRewardUsersAfter = 0.0;
    for (i = 0; i < accArray.length ; i++) {
      let account = await instance.getAccountOfUser(accounts[accArray[i]]);
      cumRewardUsersAfter += parseFloat(web3.utils.fromWei(account.rewToClaim, "ether"));
    }

    let statesAfter = await instance.getContractStates();
    let totRewardContractAfter = parseFloat(web3.utils.fromWei(statesAfter.totReward, "ether"));
    let nbrBetsAfter = statesAfter.nBets;
    console.log("contract : reward before : " +totRewardContractBefore + " reward after : " + totRewardContractAfter + "\ncumul user reward before : " + cumRewardUsersBefore + " after : " +cumRewardUsersAfter);
    assert((totRewardContractAfter - totRewardContractBefore) - (cumRewardUsersAfter - cumRewardUsersBefore) < Float_MIN, "rewards not consistent");
    assert((nbrBetsAfter - nbrBetsBefore) == betOrderArray.length, "nbr of bets not consistent");
});
  it("should set the name correctly", async function() {
    await instance.setName("bob", {from :  accounts[5]});
    let res = await instance.getName(accounts[5]);
    console.log("name : " + res);
    assert(res == "bob", "name not valid");
  });
  it("should add a new account correctly", async function() {
    let accBefore = await instance.getContractStates();
    await instance.addAccount({from :  accounts[7]});
    let accAfter = await instance.getContractStates();
    assert(accAfter.nAccounts.toNumber() > accBefore.nAccounts.toNumber(), "no account added");
  });
  it("should not add an account if already known", async function() {
    let accBefore = await instance.getContractStates();
    await instance.addAccount({from :  accounts[7]});
    let accAfter = await instance.getContractStates();
    assert(accAfter.nAccounts.toNumber() == accBefore.nAccounts.toNumber(), "one account added");
  });
  it("should not accept a bet > balance - rewards to claim", async function() {
    await truffleAssert.fails(instance.flip({value : web3.utils.toWei("50", "ether"), from : accounts[3]}), truffleAssert.ErrorType.REVERT);
  });
  it("should not accept a bet > maximum", async function() {
    await truffleAssert.fails(instance.flip({value : web3.utils.toWei("2", "ether"), from : accounts[3]}), truffleAssert.ErrorType.REVERT);
  });
  it("should not accept a bet < minimum", async function() {
    await truffleAssert.fails(instance.flip({value : web3.utils.toWei("0.0001", "ether"), from : accounts[3]}), truffleAssert.ErrorType.REVERT);
  });
  it("should withraw to user the reward to claim", async function() {
    //PB bignumber
    //var BN = web3.utils.BN;

    let accountBefore = await instance.getAccountOfUser(accounts[1]);
    let contractBefore = await instance.getContractStates();
    let indexOfRewBefore = accountBefore.firstClaimIndex;
    let userRewardBefore = parseFloat(web3.utils.fromWei(accountBefore.rewToClaim, "ether"));
    let rewardOfContractBefore = parseFloat(web3.utils.fromWei(contractBefore.totReward, "ether"));
    console.log("acount before : " + accounts[1]+ "\n  claim index : " + indexOfRewBefore.toString() +
      " reward to claim : " + userRewardBefore.toString());
    console.log("contract total Reward to claim before : " + rewardOfContractBefore);

    // await BigNumber(web3.utils.fromWei((instance.claimRewards({from : accounts[1]})), "ether"));
    //PB bignumber
    //var BN = web3.utils.BN;
    let amount = await instance.claimRewards({from : accounts[1]})

    let accountAfter = await instance.getAccountOfUser(accounts[1]);
    let contractAfter = await instance.getContractStates();
    let indexOfRewAfter = accountAfter.firstClaimIndex;
    let userRewardAfter = parseFloat(web3.utils.fromWei(accountAfter.rewToClaim, "ether"));
    let rewardOfContractAfter = parseFloat(web3.utils.fromWei(contractAfter.totReward, "ether"));
    console.log("acount after : " + accounts[1]+ "\n  claim index : " + indexOfRewAfter +
      " reward to claim : " + userRewardAfter);
    console.log("contract total Reward to claim after : " + rewardOfContractAfter);

    assert(indexOfRewAfter == 0, "index of first bet won to claim not consistent");
    assert(userRewardAfter == 0.0, "reward to claim from user should be 0");
    //ATTENTION aux comparaisons de float
    assert((userRewardBefore - userRewardAfter) - (rewardOfContractBefore - rewardOfContractAfter) < Float_MIN, "withdraw from user account not consistent");
  });
  it("should not withraw to all users the rewards if send by user", async function() {
    await instance.pause();
    await truffleAssert.fails(instance.emergencyClaimAllRewards({from : accounts[1]}));
    await instance.unPause();
  });
  it("should not withraw to all users the rewards if not paused", async function() {
    await truffleAssert.fails(instance.emergencyClaimAllRewards({from : accounts[0]}));
  });
  it("should withraw to all users the rewards to claim and set the bets to 'claimed'", async function() {
    //PB bignumber
    //var BN = web3.utils.BN;
// await BigNumber(web3.utils.fromWei((instance.claimRewards({from : accounts[1]})), "ether"));
    //PB bignumber
    //var BN = web3.utils.BN;
    let i = 0;

    let statesBefore = await instance.getContractStates();
    console.log("contract before : n bets : " + statesBefore.nBets + ", n accounts : " + statesBefore.nAccounts +
      ", balance : " + web3.utils.fromWei(statesBefore.bal, "ether") + ", totReward : " + web3.utils.fromWei(statesBefore.totReward, "ether"));

    await instance.pause();
    let amount = await instance.emergencyClaimAllRewards({from : accounts[0]});
    console.log("\nemergencyClaimAllRewards\n");
    await instance.unPause();

    let statesAfter = await instance.getContractStates();
    console.log("contract after : n bets : " + statesAfter.nBets + ", n accounts : " + statesAfter.nAccounts +
      ", balance : " + web3.utils.fromWei(statesAfter.bal, "ether") + ", totReward : " + web3.utils.fromWei(statesAfter.totReward, "ether"));

    let cumulfirstClaimIndex = 0;
    for (i = 0; i < 10 ; i++) {
      let account = await instance.getAccountOfUser(accounts[i]);
      cumulfirstClaimIndex += account.firstClaimIndex;
      console.log("user :" + i + "claim index : " + account.firstClaimIndex);
    }
    let nbets = statesAfter.nBets;
    let isClaimed = true;
    for (i = 0; i < nbets ; i++) {
      let betIsClaimed = await instance.getClaimSateOfBet(i);
      isClaimed = isClaimed && betIsClaimed
      console.log("bet index : " + i + " isClaimed : " + betIsClaimed);
    //  console.log("user :" + i + "claim index : " + account.firstClaimIndex);
    }
    assert(web3.utils.fromWei(statesAfter.totReward, "ether") == 0, "tot rewards to claim from contract should be 0");
    assert(isClaimed == true, "all bets should be set to 'claimed'");
    assert(cumulfirstClaimIndex == 0, "index of frist bet to claim of all users should be 0");
  });
  it("should not withraw the balance to user", async function() {
    await instance.pause();
    await truffleAssert.fails(instance.emergencyWithdrawAll({from : accounts[1]}));
    await instance.unPause();
  });
  it("should not withraw the balance to owner if not paused", async function() {
    await truffleAssert.fails(instance.emergencyWithdrawAll({from : accounts[0]}));
  });
  it("should withraw the balance to owner", async function() {
    await instance.pause();
    await truffleAssert.passes(instance.emergencyWithdrawAll({from : accounts[0]}));
    await instance.unPause();
  });
  it("should updtade to V0, say 'hello', and give the number of bets done before", async function() {
    let instanceCoinflipV0 = await CoinflipMainV0.deployed();
    await instanceProxy.upgrade(instanceCoinflipV0.address);
    instance = await CoinflipMainV0.at(instanceProxy.address);
    let res = await instance.sayHelloAndGiveBets();
    console.log(res.word + " nbr of bets done : "+ res.nbet);
    assert(res.word == "hello", "should say 'hello'");
  });
  it("should updtade to V2 and set the name correctly", async function() {
    let instanceCoinflipV2 = await CoinflipMainV2.deployed();
    await instanceProxy.upgrade(instanceCoinflipV2.address);
    instance = await CoinflipMainV2.at(instanceProxy.address);

    await instance.setName("bob", {from :  accounts[5]});
    let res = await instance.getName(accounts[5]);
    console.log("name : " + res);
    assert(res == "bob", "name not valid");
  });
});

contract('CoinflipMainV2', async function(accounts) {

  let instance;
  let instanceProxy;
  let instanceCoinflipV2;

  let option1 = {value : web3.utils.toWei("1", "ether")};
  let option2 = {value : web3.utils.toWei("1", "ether")};
  let option3 = {from : accounts[0]};
  let option4 = {from : accounts[1]};
  let option5 = {from : accounts[2]};
  let option6 = {from : accounts[0], value : web3.utils.toWei("1", "ether")};
  let option7 = {from : accounts[1], value : web3.utils.toWei("1", "ether")};
  let option8 = {from : accounts[2], value : web3.utils.toWei("1", "ether")};
  let option9 = {from : accounts[0], value : web3.utils.toWei("5", "ether")};



  it("should set minimum of bet correctly", async function() {
    instanceProxy = await Proxy.deployed();
    instanceCoinflipV2 = await CoinflipMainV2.deployed();
    await instanceProxy.upgrade(instanceCoinflipV2.address, {from : accounts[0]});
    instance = await CoinflipMainV2.at(instanceProxy.address, {from : accounts[0]});

    await truffleAssert.passes(instance.updateMinimumBet(web3.utils.toWei("0.02", "ether")));
    let mini = await instance.getMinimumBet();
    console.log("new minimum of bet is " + web3.utils.fromWei(mini, "ether"));
  });
  it("should not allow to set a maximum < to the minimum", async function() {
    instanceProxy = await Proxy.deployed();
    instanceCoinflipV2 = await CoinflipMainV2.deployed();
    await instanceProxy.upgrade(instanceCoinflipV2.address, {from : accounts[0]});
    instance = await CoinflipMainV2.at(instanceProxy.address, {from : accounts[0]});

    await truffleAssert.fails(instance.updateMaximumBet(web3.utils.toWei("0.01", "ether")), truffleAssert.ErrorType.REVERT);
    let maxi = await instance.getMaximumBet();
    let mini = await instance.getMinimumBet();
    console.log("try to set maximum of bet at 0.01 ether\n" + "maximum of bet is " + web3.utils.fromWei(maxi, "ether")+ "minimum of bet is " + web3.utils.fromWei(mini), "ether");
  });
  it("should return 0 or 1", async function() {
    instanceProxy = await Proxy.deployed();
    instanceCoinflipV2 = await CoinflipMainV2.deployed();
    await instanceProxy.upgrade(instanceCoinflipV2.address, {from : accounts[0]});
    instance = await CoinflipMainV2.at(instanceProxy.address);

    let res = await instance.runPseudoRandom();
    assert(res == 0 || res == 1);
  });

  it("should accept a deposit from owner and set the balance correctly", async function() {
    instanceProxy = await Proxy.deployed();
    instanceCoinflipV2 = await CoinflipMainV2.deployed();
    await instanceProxy.upgrade(instanceCoinflipV2.address);
    instance = await CoinflipMainV2.at(instanceProxy.address);
    //PB : bignumber => @TODO
    //let balanceBefore = await parseInt(web3.utils.fromWei(instance.getContractStates().bal, "ether"));
    await truffleAssert.passes(instance.deposit({value : web3.utils.toWei("10", "ether"), from : accounts[0]}), truffleAssert.ErrorType.REVERT);
    //let balanceAfter = await parseInt(web3.utils.fromWei(instance.getContractStates().bal, "ether"));
    //assert((balanceAfter - balanceBefore) == 20, "amount received not consistent");
  });
  it("should not accept a deposit from user", async function() {
    instanceProxy = await Proxy.deployed();
    instanceCoinflipV2 = await CoinflipMainV2.deployed();
    await instanceProxy.upgrade(instanceCoinflipV2.address);
    instance = await CoinflipMainV2.at(instanceProxy.address);

    await truffleAssert.fails(instance.deposit({value : web3.utils.toWei("20", "ether"), from : accounts[3]}), truffleAssert.ErrorType.REVERT);
  });
  it("should initialize a bet correctly for user 5", async function() {
    instanceProxy = await Proxy.deployed();
    instanceCoinflipV2 = await CoinflipMainV2.deployed();
    await instanceProxy.upgrade(instanceCoinflipV2.address);
    instance = await CoinflipMainV2.at(instanceProxy.address);

  //  await instance.deposit(option9);
    //let res2 = await instance.getlistOfBetslength();
    await instance.initializeNewBet(web3.utils.toWei("0.05", "ether"),accounts[5]);
    let res = await instance.getLastBet();
    let resfactor = res.factor;
    let resamount = res.amount;
    let stateContract = await instance.getContractStates({from : accounts[5]});
    let statesAfter = stateContract.nBets;
    //let lastId = await instance.getLastBetId();
    console.log("amount of the bet : " + web3.utils.fromWei(resamount, "ether") );
    console.log("jackpot factor : " + resfactor );
    console.log(" size of _listOfBets : " + statesAfter.toNumber());
///    assert(res.factor == 0, "factor not valid");
  //  assert(res.amount == web3.utils.toWei("0.05", "ether"), "amount not valid");
  //  assert(statesAfter.nBets  == 1, "no bet added to _listOfBets");
    // console.log("res" + res3.amount );
    // assert(res3.amount == web3.utils.toWei("0.05", "ether"), "index non valide");
  });
  it("should set the bet initialized to won correctly for user 5", async function() {
    instanceProxy = await Proxy.deployed();
    instanceCoinflipV2 = await CoinflipMainV2.deployed();
    await instanceProxy.upgrade(instanceCoinflipV2.address);
    instance = await CoinflipMainV2.at(instanceProxy.address);
    //let res2 = await instance.getlistOfBetslength();
  //  await instance.initializeNewBet(web3.utils.toWei("0.05", "ether"),accounts[5]);
//    let res3 = await instance.getlastBet();
    await instance.setNewBetState(1,accounts[5]);
    let res = await instance.getLastBet();
    console.log("won : " + res.win);
    console.log("jackpot factor : " + res.factor);
    assert(res.factor == 2, "factor not valid");
    assert(res.win == true, "win state not valid");

    // console.log("res" + res3.amount );
    // assert(res3.amount == web3.utils.toWei("0.05", "ether"), "index non valide");
  });

  it("should close the winning bet correctly for user 5", async function() {
    instanceProxy = await Proxy.deployed();
    instanceCoinflipV2 = await CoinflipMainV2.deployed();
    await instanceProxy.upgrade(instanceCoinflipV2.address);
    instance = await CoinflipMainV2.at(instanceProxy.address);

    //let res2 = await instance.getlistOfBetslength();
    let statesBefore = await instance.getContractStates();
    let accountBefore = await instance.getAccountOfUser(accounts[5]);
  //  await instance.initializeNewBet(web3.utils.toWei("0.05", "ether"),accounts[5]);
    //await instance.setNewBetState(1,accounts[5]);
    await instance.closeNewBet(accounts[5]);
    let accountAfter = await instance.getAccountOfUser(accounts[5]);
    let lastBet =  await instance.getLastBetOfUser(accounts[5]);
    let statesAfter = await instance.getContractStates();
    let reward = accountAfter.rewToClaim - accountBefore.rewToClaim;
    let totRewardDif = statesAfter.totReward - statesBefore.totReward;
    let index = accountAfter.firstClaimIndex;
    let bet = accountAfter.totLost - accountBefore.totLost;
    let isWon = lastBet.won;
    console.log("account : " + accounts[5] + "\nisknow " + accountAfter.known + " name : " + accountAfter.userName +
     " indexOfFirstBetToClaim : " +accountAfter.firstClaimIndex + " nbr of bets : " + accountAfter.nBets +
     " rewardToClaim : " + web3.utils.fromWei(accountAfter.rewToClaim, "ether") + " totlost : " +web3.utils.fromWei(accountAfter.totLost, "ether"));
    console.log("lastbet : amountBet " + web3.utils.fromWei(lastBet.bet, "ether") + " factor : " + lastBet.factor +
      " isWin : " +lastBet.won + " isClosed : " + lastBet.closed +
      " isClaimed : " + lastBet.claimed);
    console.log("contract states : nBets " + statesAfter.nBets + " nAccounts : " + statesAfter.nAccounts +
     " totReward : " +statesAfter.totReward);
    assert(index > 0, "index of bet with a reward to claim should be >0");
    assert(isWon, "isWon not valid");
    assert(bet == web3.utils.toWei("0.05", "ether"), "amount of bet logged in lost not valid");
    assert(reward == totRewardDif && reward >0, "reward in contract and in account not consistent");
    // console.log("res" + res3.amount );
    // assert(res3.amount == web3.utils.toWei("0.05", "ether"), "index non valide");
  });
  it("should run a flip and set the variables correctly", async function() {
    //let res2 = await instance.getlistOfBetslength();
    let statesBefore = await instance.getContractStates();
    let accountBefore = await instance.getAccountOfUser(accounts[1]);
    await instance.flip({value : web3.utils.toWei("0.05", "ether"), from : accounts[1]});
    let accountAfter = await instance.getAccountOfUser(accounts[1]);
    let lastBet =  await instance.getLastBetOfUser(accounts[1]);
    let statesAfter = await instance.getContractStates();
    let isWon = lastBet.won;
    let rewUserUp = accountAfter.rewToClaim > accountBefore.rewToClaim;
    let rewTotUp = statesAfter.totReward > statesBefore.totReward;
    let listBetsUp = statesAfter.nBets > statesBefore.nBets;
    let claimIndex = accountAfter.firstClaimIndex > 0;
    console.log("account : " + accounts[1] + "\nisknow " + accountAfter.known + " name : " + accountAfter.userName +
     " indexOfFirstBetToClaim : " +accountAfter.firstClaimIndex + " nbr of bets : " + accountAfter.nBets +
     " rewardToClaim : " + web3.utils.fromWei(accountAfter.rewToClaim, "ether") + " totlost : " +web3.utils.fromWei(accountAfter.totLost, "ether"));
    console.log("lastbet : amountBet " + web3.utils.fromWei(lastBet.bet, "ether") + " factor : " + lastBet.factor +
      " isWin : " +lastBet.won + " isClosed : " + lastBet.closed +
      " isClaimed : " + lastBet.claimed);
    console.log("contract states : nBets " + statesAfter.nBets + " nAccounts : " + statesAfter.nAccounts +
     " totReward : " +statesAfter.totReward);
    assert((isWon && rewUserUp && rewTotUp) || (!isWon && !rewUserUp && !rewTotUp), "win state and reward from account and list of bets not valid");
    assert((isWon && claimIndex) || (!isWon), "bet won, no index (toclaim) valid");
    // console.log("res" + res3.amount );
    // assert(res3.amount == web3.utils.toWei("0.05", "ether"), "index non valide");
  });
  it("should run many flip and set correctly rewards & balances", async function() {
    let accArray = [1, 2, 3, 4, 6, 8, 9]; //id of accounts betting
    let betOrderArray = [1, 1, 2, 3, 3, 4, 4, 4, 6, 8, 8, 8, 9]; //order of accounts betting

    let cumRewardUsersBefore = 0.0;
    for (i = 0; i < accArray.length ; i++) {
      let account = await instance.getAccountOfUser(accounts[accArray[i]]);
      cumRewardUsersBefore += parseFloat(web3.utils.fromWei(account.rewToClaim, "ether"));
    }

    let statesBefore = await instance.getContractStates();
    let totRewardContractBefore = parseFloat(web3.utils.fromWei(statesBefore.totReward, "ether"));
    let nbrBetsBefore = statesBefore.nBets;
    console.log("contract : n bets : " + statesBefore.nBets + ", n accounts : " + statesBefore.nAccounts +
      ",balance : " + web3.utils.fromWei(statesBefore.bal, "ether") + ",totReward : " + web3.utils.fromWei(statesBefore.totReward, "ether"));

    for (i = 0; i < betOrderArray.length ; i++) {
      let account = await instance.getAccountOfUser(accounts[betOrderArray[i]]);
      console.log("acount before : " + accounts[betOrderArray[i]]+ "\n  claim index : " + account.firstClaimIndex +
         " n user bets : " + account.nBets + " reward : " + web3.utils.fromWei(account.rewToClaim, "ether") +
         " loss : " + web3.utils.fromWei(account.totLost, "ether") + "\n");
      await instance.flip({value : web3.utils.toWei("0.05", "ether"), from : accounts[betOrderArray[i]]});
      let states = await instance.getContractStates();
      account = await instance.getAccountOfUser(accounts[betOrderArray[i]]);
      let userBet = await instance.getLastBetOfUser(accounts[betOrderArray[i]]);
      console.log("bet : amount : " + web3.utils.fromWei(userBet.bet, "ether") + ", won ? : " + userBet.won);
      console.log("acount after : " + accounts[betOrderArray[i]]+ "\n  claim index : " + account.firstClaimIndex +
        " n user bets : " + account.nBets + " reward : " + web3.utils.fromWei(account.rewToClaim, "ether") +
        " loss : " + web3.utils.fromWei(account.totLost, "ether"));
      console.log("contract : n bets : " + states.nBets + ", n accounts : " + states.nAccounts +
        ",balance : " + web3.utils.fromWei(states.bal, "ether") + ",totReward : " + web3.utils.fromWei(states.totReward, "ether") + "\n");
    }

    let cumRewardUsersAfter = 0.0;
    for (i = 0; i < accArray.length ; i++) {
      let account = await instance.getAccountOfUser(accounts[accArray[i]]);
      cumRewardUsersAfter += parseFloat(web3.utils.fromWei(account.rewToClaim, "ether"));
    }

    let statesAfter = await instance.getContractStates();
    let totRewardContractAfter = parseFloat(web3.utils.fromWei(statesAfter.totReward, "ether"));
    let nbrBetsAfter = statesAfter.nBets;
    console.log("contract : reward before : " +totRewardContractBefore + " reward after : " + totRewardContractAfter + "\ncumul user reward before : " + cumRewardUsersBefore + " after : " +cumRewardUsersAfter);
    assert((totRewardContractAfter - totRewardContractBefore) - (cumRewardUsersAfter - cumRewardUsersBefore) < Float_MIN, "rewards not consistent");
    assert((nbrBetsAfter - nbrBetsBefore) == betOrderArray.length, "nbr of bets not consistent");
  });
  it("should set the name correctly", async function() {
    await instance.setName("bob", {from :  accounts[5]});
    let res = await instance.getName(accounts[5]);
    console.log("name : " + res);
    assert(res == "bob", "name not valid");
  });
  it("should add a new account correctly", async function() {
    let accBefore = await instance.getContractStates();
    await instance.addAccount({from :  accounts[7]});
    let accAfter = await instance.getContractStates();
    assert(accAfter.nAccounts.toNumber() > accBefore.nAccounts.toNumber(), "no account added");
  });
  it("should not add an account if already known", async function() {
    let accBefore = await instance.getContractStates();
    await instance.addAccount({from :  accounts[7]});
    let accAfter = await instance.getContractStates();
    assert(accAfter.nAccounts.toNumber() == accBefore.nAccounts.toNumber(), "one account added");
  });
  it("should not accept a bet > balance - rewards to claim", async function() {
    await truffleAssert.fails(instance.flip({value : web3.utils.toWei("50", "ether"), from : accounts[3]}), truffleAssert.ErrorType.REVERT);
  });
  it("should not accept a bet > maximum", async function() {
    await truffleAssert.fails(instance.flip({value : web3.utils.toWei("2", "ether"), from : accounts[3]}), truffleAssert.ErrorType.REVERT);
  });
  it("should not accept a bet < minimum", async function() {
    await truffleAssert.fails(instance.flip({value : web3.utils.toWei("0.0001", "ether"), from : accounts[3]}), truffleAssert.ErrorType.REVERT);
  });
  it("should withraw to user the reward to claim", async function() {
    //PB bignumber
    //var BN = web3.utils.BN;

    let accountBefore = await instance.getAccountOfUser(accounts[1]);
    let contractBefore = await instance.getContractStates();
    let indexOfRewBefore = accountBefore.firstClaimIndex;
    let userRewardBefore = parseFloat(web3.utils.fromWei(accountBefore.rewToClaim, "ether"));
    let rewardOfContractBefore = parseFloat(web3.utils.fromWei(contractBefore.totReward, "ether"));
    console.log("acount before : " + accounts[1]+ "\n  claim index : " + indexOfRewBefore.toString() +
      " reward to claim : " + userRewardBefore.toString());
    console.log("contract total Reward to claim before : " + rewardOfContractBefore);

    // await BigNumber(web3.utils.fromWei((instance.claimRewards({from : accounts[1]})), "ether"));
    //PB bignumber
    //var BN = web3.utils.BN;
    let amount = await instance.claimRewards({from : accounts[1]})

    let accountAfter = await instance.getAccountOfUser(accounts[1]);
    let contractAfter = await instance.getContractStates();
    let indexOfRewAfter = accountAfter.firstClaimIndex;
    let userRewardAfter = parseFloat(web3.utils.fromWei(accountAfter.rewToClaim, "ether"));
    let rewardOfContractAfter = parseFloat(web3.utils.fromWei(contractAfter.totReward, "ether"));
    console.log("acount after : " + accounts[1]+ "\n  claim index : " + indexOfRewAfter +
      " reward to claim : " + userRewardAfter);
    console.log("contract total Reward to claim after : " + rewardOfContractAfter);

    assert(indexOfRewAfter == 0, "index of first bet won to claim not consistent");
    assert(userRewardAfter == 0.0, "reward to claim from user should be 0");
    //ATTENTION aux comparaisons de float
    assert((userRewardBefore - userRewardAfter) - (rewardOfContractBefore - rewardOfContractAfter) < Float_MIN, "withdraw from user account not consistent");
  });
  it("should not withraw to all users the rewards if send by user", async function() {
    await instance.pause();
    await truffleAssert.fails(instance.emergencyClaimAllRewards({from : accounts[1]}));
    await instance.unPause();
  });
  it("should not withraw to all users the rewards if not paused", async function() {
    await truffleAssert.fails(instance.emergencyClaimAllRewards({from : accounts[0]}));
  });
  it("should withraw to all users the rewards to claim and set the bets to 'claimed'", async function() {
    //PB bignumber
    //var BN = web3.utils.BN;
// await BigNumber(web3.utils.fromWei((instance.claimRewards({from : accounts[1]})), "ether"));
    //PB bignumber
    //var BN = web3.utils.BN;
    let i = 0;

    let statesBefore = await instance.getContractStates();
    console.log("contract before : n bets : " + statesBefore.nBets + ", n accounts : " + statesBefore.nAccounts +
      ", balance : " + web3.utils.fromWei(statesBefore.bal, "ether") + ", totReward : " + web3.utils.fromWei(statesBefore.totReward, "ether"));

    await instance.pause();
    let amount = await instance.emergencyClaimAllRewards({from : accounts[0]});
    console.log("\nemergencyClaimAllRewards\n");
    await instance.unPause();

    let statesAfter = await instance.getContractStates();
    console.log("contract after : n bets : " + statesAfter.nBets + ", n accounts : " + statesAfter.nAccounts +
      ", balance : " + web3.utils.fromWei(statesAfter.bal, "ether") + ", totReward : " + web3.utils.fromWei(statesAfter.totReward, "ether"));

    let cumulfirstClaimIndex = 0;
    for (i = 0; i < 10 ; i++) {
      let account = await instance.getAccountOfUser(accounts[i]);
      cumulfirstClaimIndex += account.firstClaimIndex;
      console.log("user :" + i + "claim index : " + account.firstClaimIndex);
    }
    let nbets = statesAfter.nBets;
    let isClaimed = true;
    for (i = 0; i < nbets ; i++) {
      let betIsClaimed = await instance.getClaimSateOfBet(i);
      isClaimed = isClaimed && betIsClaimed
      console.log("bet index : " + i + " isClaimed : " + betIsClaimed);
    //  console.log("user :" + i + "claim index : " + account.firstClaimIndex);
    }
    assert(web3.utils.fromWei(statesAfter.totReward, "ether") == 0, "tot rewards to claim from contract should be 0");
    assert(isClaimed == true, "all bets should be set to 'claimed'");
    assert(cumulfirstClaimIndex == 0, "index of frist bet to claim of all users should be 0");
  });
  it("should not withraw the balance to user", async function() {
    await instance.pause();
    await truffleAssert.fails(instance.emergencyWithdrawAll({from : accounts[1]}));
    await instance.unPause();
  });
  it("should not withraw the balance to owner if not paused", async function() {
    await truffleAssert.fails(instance.emergencyWithdrawAll({from : accounts[0]}));
  });
  it("should withraw the balance to owner", async function() {
    await instance.pause();
    await truffleAssert.passes(instance.emergencyWithdrawAll({from : accounts[0]}));
    await instance.unPause();
  });

});
