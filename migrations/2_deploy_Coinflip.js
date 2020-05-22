//definir notre contract
//const SafeMath = artifacts.require('SafeMath');
const CoinflipMainV1 = artifacts.require('CoinflipMainV1'); //charge contrat Dogs
const Proxy = artifacts.require('CoinflipProxy'); //charge contrat Proxy
const CoinflipMainV0 = artifacts.require('CoinflipMainV0');
const CoinflipMainV2 = artifacts.require('CoinflipMainV2');
const CoinflipMainV3 = artifacts.require('CoinflipMainV3');


//MEMO :
//https://github.com/trufflesuite/truffle/issues/1655
//V3 not deployable withh ropsten : try
//*modify gas
//*other node versions
//=>see CoinflipDapp

module.exports = async function(deployer, network, accounts){
  //MEMO
  //VOIR SI POSSIBLE if network == ropsten V3 si development V2 (fakerandom)
  //dploye une nouvelle instance du contrats
  //await car besoin attendre fini chargement avant poursuivre


/////////////////////////////////TESTS /////////////////////////////
// var instanceProxy,instanceCoinflipV0,instanceCoinflipV1,
// instanceCoinflipV2,instance

/*var instanceCoinflipV1;*/
/////////////////////////////////TEST V1 :
// => CoinflipMainV1
/*
await deployer.deploy(CoinflipMainV1,{from : accounts[0]});
instanceCoinflipV1 = await CoinflipMainV1.deployed();
console.log("coinflip address a: " + instanceCoinflipV1.address);
*/
/////////////////////////////////TEST V0 and Proxy :
// => Proxy -> CoinflipMainV1
// => Proxy upgraded -> CoinflipMainV0
/*
await deployer.deploy(Proxy,instanceCoinflipV1.address,{from : accounts[0]});
await deployer.deploy(CoinflipMainV0,{from : accounts[0]});
*/
// => process in test file :
// instanceProxy = await Proxy.deployed();
// instanceCoinflipV0 = await CoinflipMainV0.deployed();
// await instanceProxy.upgrade(instanceCoinflipV0.address);
// instance = await CoinflipMainV0.at(instanceProxy.address);

/////////////////////////////////TEST V2 : UPGRADE
// => Proxy upgraded -> CoinflipMainV2
/*
await deployer.deploy(CoinflipMainV2,{from : accounts[0]});
*/
// => process in test file / deployment
// instanceCoinflipV2 = await CoinflipMainV2.deployed();
// await instanceProxy.upgrade(instanceCoinflipV2.address);
// instance = await CoinflipMainV2.at(instanceProxy.address);
/////////////////////////////////TESTS /////////////////////////////


/////////////////////////////     TO UPGRADE    /////////////////////////
//await deployer.deploy(CoinflipVersion,{from : accounts[0]});
// instanceCoinflipVersion = await CoinflipVersion.deployed();
// await instanceProxy.upgrade(instanceCoinflipVersion.address);
// instance = await CoinflipVersion.at(instanceProxy.address);
//////////////////////////////////////////////////////////////////////////



/////////////////////////////////DEPLOYMENT V1/////////////////////////////
/*
console.log("Deployment CoinflipV1...");
await deployer.deploy(CoinflipMainV1,{from : accounts[0]});
console.log("coinflipV1 address a: " + CoinflipMainV1.address);
*/
/////////////////////////////////DEPLOYMENT V1 via PROXY///////////////////
/*
console.log("Deployment CoinflipV1 via Proxy...");
await deployer.deploy(CoinflipMainV1,{from : accounts[0]});
var instanceCoinflipV1 = await CoinflipMainV1.deployed();
console.log("coinflipV1 address : " + instanceCoinflipV1.address);

await deployer.deploy(Proxy,instanceCoinflipV1.address,{from : accounts[0]});
var instanceProxy = await Proxy.deployed({from : accounts[0]});
console.log("Proxy address : " + instanceCoinflipV1.address);

var instance = await CoinflipMainV1.at(instanceProxy.address);
await instance.initialize(accounts[0]);
console.log("instance address : " + instance.address);
*/


/////////////////////////////////DEPLOYMENT V2/////////////////////////////
/*
console.log("Deployment CoinflipV2...");
await deployer.deploy(CoinflipMainV2,{from : accounts[0]});
console.log("coinflipV2 address a: " + CoinflipMainV2.address);
*/
/////////////////////////////////DEPLOYMENT V2 via PROXY///////////////////

console.log("Deployment CoinflipV2 via Proxy...");
await deployer.deploy(CoinflipMainV2,{from : accounts[0]});
var instanceCoinflipV2 = await CoinflipMainV2.deployed();
console.log("coinflipV2 address : " + instanceCoinflipV2.address);

await deployer.deploy(Proxy,instanceCoinflipV2.address,{from : accounts[0]});
var instanceProxy = await Proxy.deployed({from : accounts[0]});
console.log("Proxy address : " + instanceProxy.address);

var instance = await CoinflipMainV2.at(instanceProxy.address);
await instance.initialize(accounts[0]);
console.log("instance address : " + instance.address);



/*not usable
/////////////////////////////////DEPLOYMENT V3/////////////////////////////
/*
console.log("Deployment CoinflipV3...");
await deployer.deploy(CoinflipMainV3,{{gas: 4612388, from : accounts[0]});
console.log("coinflipV3 address a: " + CoinflipMainV3.address);
*/
 // deployer.deploy(CoinflipMainV3,{gas: 5500000, from : accounts[0]}).then(function(instance){
 //   instance.deposit({value: web3.utils.toWei("0.1","ether"), from: accounts[0]}).then(function(){
 //     console.log("The contract successfully got funded with 0.5 ether by the contract owner " + accounts[0]);
 //     console.log("The contract address is " + CoinflipMainV3.address);
 //   }).catch(function(err){
 //     console.log("error: " + err);
 //   });
 // }).catch(function(err){
 //   console.log("Fail to deploy " + err);
 // });
/////////////////////////////////DEPLOYMENT V3 via PROXY///////////////////
//metamask projects : acc 0, 1,2,3 funded with eth ropsten
/*
console.log("Deployment CoinflipV3 via Proxy...");
await deployer.deploy(CoinflipMainV3,{{gas: 4612388, from : accounts[0]});

var instanceCoinflipV3 = await CoinflipMainV3.deployed();
console.log("coinflipV3 address : " + instanceCoinflipV3.address);

await deployer.deploy(Proxy,instanceCoinflipV3.address,{{gas: 4612388, from : accounts[0]});
var instanceProxy = await Proxy.deployed({{gas: 4612388, from : accounts[0]});
console.log("Proxy address : " + instanceCoinflipV3.address);

var instance = await CoinflipMainV3.at(instanceProxy.address);
await instance.initialize(accounts[0]);
console.log("instance address : " + instance.address);
/*
*/
/////////////////////////////////DEPLOYMENT : UPGRADE///////////////////////
