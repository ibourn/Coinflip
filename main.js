var web3 = new Web3(Web3.givenProvider);
var contractInstance;

var pause;
var newNameEvent;
var adduser;
var addContract;
var maxEvent;

//add => celle du rinicpal car
$(document).ready(function() {
    window.ethereum.enable().then(function(accounts){
        adduser = accounts[0];
        console.log("User address : " + adduser);
        //ADD THE ADDRESS OF PROXY HERE :
        addContract = "0x45800Fe22eCC4923437599E2aDBaC8f5b4036674";
        contractInstance = new web3.eth.Contract(abi, addContract, {from: adduser});
        console.log("Contract address : " + contractInstance.address);


        fetchAndDisplay();

        listenToGeneralEvents();

    });

    //-----------------Triggered if metamask account changes
    window.ethereum.on('accountsChanged', function (accounts) {
      //MEMO pas sure que la manip soit approriée mais sinon msg erreur add from non valide
      window.ethereum.enable().then(function(accounts){
          adduser = accounts[0];
          console.log("User address changed to : " + adduser);
          contractInstance = new web3.eth.Contract(abi, addContract, {from: adduser});
          console.log("Contract address : " + contractInstance.address);

          fetchAndDisplay();

          listenToGeneralEvents();

      });
    })


    $("#bet_btn").click(flip);
    $("#claim_btn").click(claimRewards);
    $("#name_btn").click(setName);

    $("#pause_btn").click(setPause);
    $("#unpause_btn").click(setUnpause);
    $("#min_btn").click(updateMinimumBet);
    $("#max_btn").click(updateMaximumBet);
    $("#mult_btn").click(updateJackpotFactor);
    //$("#contract_btn").click(upgrade);
    $("#deposit_btn").click(deposit);
    $("#emergencywithdraw_btn").click(emergencyWithdrawAll);
    $("#emergencyclaim_btn").click(emergencyClaimAllRewards);

    $("#owner_btn").click(ownerAccess);

});


function ownerAccess() {

  $('#access_msg').text("Only owner! functions disabled");
  $('#access_msg').addClass(" text-danger");
  $('#access_adr').text(adduser.toString());
  $('.toast').toast('show');
}

function fetchAndDisplay(){
  fetchAndDisplayPendingBet();

  fetchAndDisplayBalance();

  fetchAndDisplayReward();

  fetchAndDisplayPauseState();

  contractInstance.methods.getMinimumBet().call().then(function(res){
   display("#min_span", res, "fetch");
  });

  contractInstance.methods.getMaximumBet().call().then(function(res){
   display("#max_span",res, "fetch");
  });

  contractInstance.methods.getJackpotFactor().call().then(function(res){
   display("#reward_factor",res, "fetch");
   console.log("fetch : FACTOR : " + res);
  });

  contractInstance.methods.getName(adduser).call().then(function(res){
    display("#name_output", ((res != "") ? res : adduser), "fetch");
  });
}

function fetchAndDisplayPendingBet(){
  // contractInstance.methods.getUserPendingBetState().call().then(function(res){
  //  if(res) {
  //    pendingFlip();
  //  }
  // });
}

function fetchAndDisplayBalance(){
  contractInstance.methods.getContractBalance().call().then(function(res){
   display("#balance_output", res, "fetch");
  });
}

function fetchAndDisplayReward(){
    contractInstance.methods.getTotalReward().call({from : adduser}).then(function(res){
     display("#reward_output", res, "fetch");
   });
}

function fetchAndDisplayPauseState(){
  //call appel methode via l enoeud sans transaction (renvoi erroe, resultat)
  contractInstance.methods.getPauseState().call().then(function(res){
    pauseStateManager(res);
    //console.log(res);
  });
}

function pauseStateManager(state){
  //call appel methode via l enoeud sans transaction (renvoi erroe, resultat)
    if (state) {
      $("#unpause_btn").removeAttr("disabled", "enabled");
      $("#pause_btn").attr("disabled", "disabled");
    } else {
      $("#unpause_btn").attr("disabled", "disabled");
      $("#pause_btn").removeAttr("disabled", "enabled");
    }
    //console.log(res);
  //});
}

function display(id, res, src) {
  if (src != "reset") {
    switch (id) {
      case "#min_span" :
        $("#min_span").text(web3.utils.fromWei(res.toString(),"ether") + " ");
        break;
      case "#max_span" :
        $("#max_span").text(" " + web3.utils.fromWei(res.toString(),"ether"));
        break;
      // case "#name_output" :
      //   $("#name_output").text(res);
      //   break;
      case "#reward_factor" :
        //res -= 1; // bet * 3 => win 2 times the bet (no decimal)
        $("#reward_factor").text(res - 1);
        break;
      // case "#name_output" :
      //   $("#name_output").text(res);
      //   break;
      case "#balance_output" :
        $("#balance_output").text(web3.utils.fromWei(res.toString(),"ether"));
        break;
      case "#reward_output" :
        $("#reward_output").text(web3.utils.fromWei(res.toString(),"ether"));
        break;
      // case "#evt_output" :
      //   $("#evt_output").text(res);
      //   break;
      default:
        $(id).text(res);
    }
  } else {
    $(id).val(res);
  }

    console.log(src + " " + id + " to " + res);
  }



function listenToGeneralEvents(){
  contractInstance.events.evtSettingsUpdated(function(error, event){
    settingEventManager(error, event);
  });

  contractInstance.events.evtPauseSet(function(error, event){
    settingEventManager(error, event);
  });

  contractInstance.events.evtFundingOperation(function(error, event){
    fundingEventManager(error, event);
  });
}

//ETAT POUR PAUSE ET POUR ETAT JOUERUR EN COURS ou WAITING
function settingEventManager(error, event) {
  if(!error) {
    switch(event.returnValues._param) {
      case "minimumBet" :
        display("#min_span", event.returnValues._value, "set");
        break;
      case "maximumBet" :
        display("#max_span", event.returnValues._value, "set");
        break;
      case "jackpotFator" :
        display("#reward_factor", event.returnValues._value, "set");
        break;
      case "pause" :
        pauseStateManager(event.returnValues._value);
        break;
    }
  } else {
    console.log(error);
  }
}

//To do : add a param in event to get the new value and don't have to call via fetch
function fundingEventManager(error, event) {
  if(!error) {
    switch(event.returnValues._param) {
      case "deposit" :
        fetchAndDisplayBalance();
        console.log(event);
        break;
      case "emergencyWithdrawAll" :
        fetchAndDisplayBalance();
        fetchAndDisplayReward();
        console.log(event);
        break;
      case "emergencyClaimAllRewards" :
        fetchAndDisplayBalance();
        fetchAndDisplayReward();
        console.log(event);
        break;
      case "claimRewards" :
        console.log(event);
        break;
      case "withdrawReward" :
        console.log(event);
        break;
      case "withdraw" :
        console.log(event);
        break;
    }
  } else {
    console.log(error);
  }
}



//-------------------user functions


function flip(){
    var success;
    var evtBetResult = 0;
    var evtBetClosed = 0;
    var betInput = $("#bet_input").val();
    var userConfig = {
        from : adduser,
        value: web3.utils.toWei(betInput,"ether")
    }

    //---------------SCENARIO
    //---------------user actives flip button =>
    //--------disable the button as only one bet is allow
    $("#bet_btn").attr("disabled", "disabled");
    //--------display an animation to wait the end of the process
    $("#bet_btn").html("<span id='bet_spin' " +
      "class='spinner-border spinner-border-sm'></span>Processing...");
    //---------indication of step : bet taken, waiting for Tx
    display("#evt_output", "Waiting for your transaction...", "pending");


    contractInstance.methods.flip().send(userConfig)
    .on("transactionHash", function(hash){
        console.log("flip hash : " + hash);
    })
    .on("confirmation", function(confirmationNr){
        console.log("flip conf : " + confirmationNr);
    })
    .on("receipt", function(receipt){
        console.log("flip rcpt : " + receipt);
    })
    .on('error', function(receipt){
      //---------------error occured with Tx => stop the scenario
        $("#bet_btn").removeAttr("disabled", "enabled");
        $("#bet_btn").html("Flip the coin");
        //-------------display for 3 sec a msg for Tx error
        display("#evt_output", "Something went wrong, no bet taken", "pending");
        setTimeout(function(){
          display("#evt_output", "", "pending");
        }, 3000);

        console.error;
    })


    //---------------listen to the events and filter the user
    //---------indication of step : Tx received, bet initialized
    contractInstance.events.evtBetOpened(function(error, event){
      if(event.returnValues._user.toLowerCase() == adduser){
        display("#evt_output", event.returnValues._msg, "pending");
      }
    })
    //---------indication of step : Query to oracle, waiting the answer
    contractInstance.events.evtBetQuery(function(error, event){
      if(event.returnValues._user.toLowerCase() == adduser){
        display("#evt_output", event.returnValues._msg, "pending");
      }
    });
    //---------indication of step : result received, evalutaion
    contractInstance.events.evtBetResume(function(error, event){
      if(event.returnValues._user.toLowerCase() == adduser){
        display("#evt_output", event.returnValues._msg, "pending");
      }
    });
    //---------indication of step : bet won or lost
    contractInstance.events.evtBetResult(function(error, event){
      if(event.returnValues._user.toLowerCase() == adduser){
        var resultOfBet = (event.returnValues._isWon) ?
        "  Hip hip hooray! YOU WON! Your reward increased... will you succeed in emptying the contract? " :
        "  Bet lost! Sorry, it's even money... try again! Take one more chance! ";
        display("#evt_output", resultOfBet, "pending");
        evtBetResult += 1;
        if (evtBetResult == 1) {
          appendAlert("#mainContainer", resultOfBet , event.returnValues._isWon);
        }
      }
    });

    //---------------contract send event : bet closed for this user=>
    //--------enable the button and reset the button state
    contractInstance.events.evtBetClosed(function(error, event){
      if(event.returnValues._user.toLowerCase() == adduser){
        $("#bet_btn").removeAttr("disabled", "enabled");
        $("#bet_btn").html("Flip the coin");
    //---------indication of step : reset the information field
        display("#evt_output", "", "pending");
    //---------indication of step : bet closed or aborted
        evtBetClosed += 1;
        success = !(event.returnValues._status == "Aborted, refund in progress...");
        if (evtBetClosed == 1) {
          appendAlert("#colUser", event.returnValues._status ,success);
        }
        fetchAndDisplayBalance();
        fetchAndDisplayReward();
       }
    });
    display("#bet_input", "", "reset");

}

function pendingFlip(){
    //---------------SCENARIO
    //---------------there's a pending flip =>
    //--------disable the button as only one bet is allow
    $("#bet_btn").attr("disabled", "disabled");
    //--------display an animation to wait the end of the process
    $("#bet_btn").html("<span id='bet_spin' " +
      "class='spinner-border spinner-border-sm'></span>Processing...");
    //---------indication of step : bet taken, waiting for Tx
    display("#evt_output", "You have a pending bet...", "pending");

    //---------indication of step : bet won or lost
    contractInstance.events.evtBetResult(function(error, event){
      if(event.returnValues._user.toLowerCase() == adduser){
        var resultOfBet = (event.returnValues._isWon) ?
        "  Hip hip hooray! YOU WON ! Your reward increased... " :
        "  Bet lost! Sorry, it's even money... try again! Take one more chance! ";
        display("#evt_output", resultOfBet, "pending");
        evtBetResult += 1;
        if (evtBetResult == 1) {
          appendAlert("#mainContainer", resultOfBet , event.returnValues._isWon);
        }
      }
    });

    //---------------contract send event : bet closed for this user=>
    //--------enable the button and reset the button state
    contractInstance.events.evtBetClosed(function(error, event){
      if(event.returnValues._user.toLowerCase() == adduser){
        $("#bet_btn").removeAttr("disabled", "enabled");
        $("#bet_btn").html("Flip the coin");
    //---------indication of step : reset the information field
        display("#evt_output", "", "pending");
    //---------indication of step : bet closed or aborted
        evtBetClosed += 1;
        success = !(event.returnValues._status == "Aborted, refund in progress...");
        if (evtBetClosed == 1) {
          appendAlert("#colUser", event.returnValues._status ,success);
        }
        fetchAndDisplayBalance();
        fetchAndDisplayReward();
       }
    });

}


function setName(){
  var input = $("#name_input").val();

    contractInstance.methods.setName(input).send()
    .on("transactionHash", function(hash){
        console.log("setName hash : " + hash);
    })
    .on("confirmation", function(confirmationNr){
        console.log("setName conf : " + confirmationNr);
    })
    .on("receipt", function(receipt){
        console.log("setName rcpt : " + receipt);
        appendAlert("#colUser"," New name set : " + input, true);

    })
    .on('error', console.error);

    //MEMO essai de ne pas avoir 3 fois la boite modale en filtrant le bloc ecouté
    //ça ne change rien
    //var latestBlock = web3.eth.blockNumber; //get the latest blocknumber
    //contractInstance.events.evtNameSet({fromBlock: latestBlock}, function(error, event){

    //----waiting the event of the new name set to display it
    //contractInstance.events.evtNameSet({fromBlock: latestBlock}, function(error, event){
    contractInstance.events.evtNameSet(function(error, event){
      if (event.returnValues._user.toLowerCase() == adduser) {
        display("#name_output", event.returnValues._name, "set");
        //appendAlert("#colUser"," New name set : " + input, true); //pb : duplicate action 3 times
        display("#name_input", "", "reset");
      }
    })
    //.on('error', console.error);
}




function claimRewards(){
    contractInstance.methods.claimRewards().send()
    .on("transactionHash", function(hash){
        console.log(hash);
    })
    .on("confirmation", function(confirmationNr){
        console.log(confirmationNr);
    })
    .on("receipt", function(receipt){
        console.log(receipt);
        appendAlert("#colUser", " You claimed your reward! ", true);
        fetchAndDisplayBalance();
        fetchAndDisplayReward();
    })
    .on('error', console.error);

}


//-------------------owner functions
function updateMinimumBet(){
  var input = $("#min_input").val();
  var value = web3.utils.toWei(input,"ether");
    contractInstance.methods.updateMinimumBet(value).send()
    .on("transactionHash", function(hash){
        console.log("updateMin hash : " + hash);
    })
    .on("confirmation", function(confirmationNr){
        console.log("updateMin conf : " + confirmationNr);
    })
    .on("receipt", function(receipt){
        console.log("updateMin rcpt : " + receipt);
        //----inform the owner
        appendAlert("#colOwner"," New minimum set : " + value, true);
    })
    .on("error",function(error){
        console.error;
    })
    display("#min_input", "", "reset");
}

function updateMaximumBet(){
    var input = $("#max_input").val();
    var value = web3.utils.toWei(input,"ether");

    contractInstance.methods.updateMaximumBet(value).send()
    .on("transactionHash", function(hash){
        console.log("updateMax hash : " + hash);
    })
    .on("confirmation", function(confirmationNr){
        console.log("updateMax conf : " + confirmationNr);
    })
    .on("receipt", function(receipt){
        console.log("updateMax rcpt : " + receipt);
        //----inform the owner
        appendAlert("#colOwner"," New maximum set : " + value, true);
    })
    .on("error",function(error){
        console.error;
    })
    display("#max_input", "", "reset");
}

function updateJackpotFactor(){
    var input = $("#mult_input").val();
    var value = parseInt(input);

    contractInstance.methods.updateJackpotFactor(value).send()
    .on("transactionHash", function(hash){
        console.log("updateFact hash : " + hash);
    })
    .on("confirmation", function(confirmationNr){
        console.log("updateFact conf : " + confirmationNr);
    })
    .on("receipt", function(receipt){
        console.log("updateFact rcpt : " + receipt);
        //----inform the owner
        appendAlert("#colOwner"," New factor set : " + input, true);
    })
    .on("error",function(error){
        console.error;
    })
    display("#mult_input", "", "reset");
  }

function deposit(){
    var depositInput = $("#deposit_input").val();
    var depositValue = {
        value: web3.utils.toWei(depositInput,"ether")
    }
    contractInstance.methods.deposit().send(depositValue)
    .on("transactionHash", function(hash){
        console.log(hash);
    })
    .on("confirmation", function(confirmationNr){
        console.log(confirmationNr);
    })
    .on("receipt", function(receipt){
        console.log(receipt);
        //----inform the owner
        appendAlert("#colOwner"," New deposit : " + web3.utils.toWei(depositInput,"ether"), + " eth", true);
        fetchAndDisplayBalance();
    })
    .on("error",function(error){
        console.error;
    })
}

function emergencyWithdrawAll(){
    contractInstance.methods.emergencyWithdrawAll().send()
    .on("transactionHash", function(hash){
        console.log(hash);
    })
    .on("confirmation", function(confirmationNr){
        console.log(confirmationNr);
    })
    .on("receipt", function(receipt){
        console.log(receipt);
        //----inform the owner
        appendAlert("#colOwner", " Emregency withdraw! ", true);
        fetchAndDisplayBalance();
        fetchAndDisplayReward();
    })
    .on("error",function(error){
        console.error;
    })


}

function emergencyClaimAllRewards(){
    contractInstance.methods.emergencyClaimAllRewards().send()
    .on("transactionHash", function(hash){
        console.log(hash);
    })
    .on("confirmation", function(confirmationNr){
        console.log(confirmationNr);
    })
    .on("receipt", function(receipt){
        console.log(receipt);
        //----inform the owner
        appendAlert("#colOwner", " Emregency claim! ", true);
        fetchAndDisplayBalance();
        fetchAndDisplayReward();
    })
    .on("error",function(error){
        console.error;
    })

}



function setPause(){
    contractInstance.methods.pause().send()
    .on("transactionHash", function(hash){
        console.log(hash);
    })
    .on("confirmation", function(confirmationNr){
        console.log(confirmationNr);
    })
    .on("receipt", function(receipt){
        console.log(receipt);
        //----inform the owner
        appendAlert("#colOwner", " Contract paused! ", true);
    })
    .on("error",function(error){
        console.error;
    });
  //  getPauseState();

}

function setUnpause(){
    contractInstance.methods.unPause().send()
    .on("transactionHash", function(hash){
        console.log(hash);
    })
    .on("confirmation", function(confirmationNr){
        console.log(confirmationNr);
    })
    .on("receipt", function(receipt){
        console.log(receipt);
        //----inform the owner
        appendAlert("#colOwner", " Contract unpaused! ", true);
    })
    .on("error",function(error){
        console.error;
    });
}




//ajouter id en param pour afficher ds bon contanair
function appendAlert(id, txt, success) {
  var element = "";
  var elementAlerte1 = "<div class=\"alert alert-";
  var elementAlerte2 = " alert-dismissible\">" +
  "<a href=\"#\" class=\"close\" data-dismiss=\"alert\" aria-label=\"close\">" +
  "&times;</a><strong>";
  var elementType1 = success ? "success" : "warning";
  var elementType2 = success ? "Success!" : "Warning!" + "</strong>";

  element = elementAlerte1 + elementType1 + elementAlerte2 + elementType2 + txt + "</div>";

  $(id).append(element);
  console.log(element);
}
