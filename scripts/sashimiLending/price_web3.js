const Web3 = require('web3');
const info = require('../../info.json');
const lendingConfig = require("./sashimi-lending-config");
const SashimiOracle = require('../../build/contracts/PriceOracle.json');
const IUniswapV2Pair = require('../../build/contracts/IUniswapV2Pair.json');
const helper = require('../helper');
const { encode, sign } = require('./reporter');
const { time } = require('./Helpers');
const fetch = require('node-fetch');
const { URL, URLSearchParams } = require('url');
const HttpsProxyAgent = require('https-proxy-agent');
const BigNumber = require('bignumber.js');
const schedule = require('node-schedule');

let config = lendingConfig.networks.mainnet;
let tokenMap = config.tokenMap;
let sashimiOracle;

async function fetch_get(url){
  return await fetch(url,{
    agent: new HttpsProxyAgent("http://127.0.0.1:1087") //proxy only use in local.Online can remove it.
  });
}

async function feth_post(url){
  return await fetch(url,{
    method: 'post',
    headers: { 'Content-Type': 'application/json' },
    agent: new HttpsProxyAgent("http://127.0.0.1:1087") //proxy only use in local.Online can remove it.
  });
}

async function postPrices(timestamp, prices2dArr, symbols, signer = reporter) {
  let {
    messages,
    signatures
  } = prices2dArr.reduce(({ messages, signatures }, prices, i) => {
    const signedMessages = sign(
      encode(
        'prices',
        timestamp,
        prices
      ),
      signer.privateKey
    );

    return signedMessages.reduce(({ messages, signatures }, { message, signature }) => {
      return {
        messages: [...messages, message],
        signatures: [...signatures, signature],
      };
    }, { messages, signatures });
  }, { messages: [], signatures: [] });
  sashimiOracle = new web3.eth.Contract(SashimiOracle.abi, config.contracts.oracle);
  var gasPrice = await getGasPrice();  
  var gasAmount = await sashimiOracle.methods.postPrices(messages, signatures, symbols).estimateGas({from:info.addresses.reporter, gasPrice: gasPrice.toNumber()});
  console.log(gasAmount.toString());
  const transactionFee = parseInt(gasAmount.toString()) * parseInt(gasPrice.toString()) / 10**18;
  console.log(transactionFee);
  //await sashimiOracle.methods.postPrices(messages, signatures, symbols).send({from:info.addresses.reporter, gasPrice: gasPrice.toNumber(), gas: 1000000});
  //await sashimiOracle.methods.postPrices(messages, signatures, symbols).send({from:info.addresses.alice,gasPrice: 1000000000});
}

async function getGasPrice(){
  try{
      let url = new URL('https://api.etherscan.io/api');
      let params = {
        "module": "gastracker",
        "action": "gasoracle",
        "apikey": info.api_etherscan
      };
      url.search = new URLSearchParams(params).toString();
      let response = await fetch_get(url);
      let gasOracle = await response.json();
      if(gasOracle.status != "1" || gasOracle.message !="OK"){
          //TODO Add retry logic
      }
      console.log(gasOracle.result.FastGasPrice);
      return new web3.utils.BN(parseInt(gasOracle.result.FastGasPrice) * 10**9);
  }
  catch(e){
      console.log(e)
  }
}

async function getPriceInHuobi(pair){
  if(pair == undefined || pair == "") return new BigNumber(0);
  let url = new URL('https://api.huobi.pro/market/detail/merged');
  let params = {
    "symbol": pair
  };
  url.search = new URLSearchParams(params).toString();
  let response = await fetch_get(url);
  let result = await response.json();
  if(result.status != 'ok'){
    //TODO retry logic
  }
  //console.log(result);
  return new BigNumber(result.tick.close);
}

async function getPriceInBinance(pair){
  if(pair == undefined || pair == "") return new BigNumber(0);
  let url = new URL("https://api.binance.com/api/v3/ticker/price");
  let params = {
    "symbol": pair
  };
  url.search = new URLSearchParams(params).toString();
  let response = await fetch_get(url);
  let result = await response.json();
  if(result.price == undefined)
  {
    //TODO retry logic
  }
  //console.log(result);
  return new BigNumber(result.price);
}

async function getSashimiPriceInAEX(){
  let url = new URL("https://api.aex.zone/v3/ticker.php");
  let params = {
    "mk_type": "usdt",
    "coinname": "sashimi"
  };
  url.search = new URLSearchParams(params).toString();
  let response = await feth_post(url);
  let result = await response.json();
  if(result.code != 20000)
  {
    //TODO retry logic
  }
  //console.log(result);
  return new BigNumber(result.data.ticker.last);
}

/*
  return value with decimals 6
*/
async function getPriceInUniswap(symbol,ethPriceInUSD){
  var token = tokenMap[symbol];
  if(token.uniswap.lpTokenAddress == undefined || token.uniswap.lpTokenAddress == "") return web3.utils.toBN(0);
  var uniswapPair = new web3.eth.Contract(IUniswapV2Pair.abi, token.uniswap.lpTokenAddress);
  var reserves = await uniswapPair.methods.getReserves().call();
  let price = 0;
  var reserve1 = web3.utils.toBN(reserves.reserve1);
  var reserve0 = web3.utils.toBN(reserves.reserve0);
  var decimals = web3.utils.toBN(10 ** token.decimals);
  if (!token.uniswap.isReversed) {
    price = decimals.mul(reserve1).div(reserve0); //decimals of priceInETH is 18
  }else{
    price = decimals.mul(reserve0).div(reserve1); //decimals of priceInETH is 18
  }
  if(symbol == 'ETH'){
    ethPriceInUniswap = price;
    return price;
  } 
  return price.mul(ethPriceInUSD).div(web3.utils.toBN(10**18));
}

async function getPriceInSashimiswap(symbol,ethPriceInUSD){
  var token = tokenMap[symbol];
  if(token.sashimiswap.lpTokenAddress == undefined || token.sashimiswap.lpTokenAddress == "") return web3.utils.toBN(0);
  var sashimiswapPair = new web3.eth.Contract(IUniswapV2Pair.abi, token.sashimiswap.lpTokenAddress);
  var reserves = await sashimiswapPair.methods.getReserves().call();
  let price = 0;
  var reserve1 = web3.utils.toBN(reserves.reserve1);
  var reserve0 = web3.utils.toBN(reserves.reserve0);
  var decimals = web3.utils.toBN(10 ** token.decimals);
  if (!token.sashimiswap.isReversed) {
    price = decimals.mul(reserve1).div(reserve0); //decimals of priceInETH is 18
  }else{
    price = decimals.mul(reserve0).div(reserve1); //decimals of priceInETH is 18
  }
  if(symbol == 'ETH'){
    ethPriceInSashimiswap = price;
    return price;
  } 
  return price.mul(ethPriceInUSD).div(web3.utils.toBN(10**18));
}

async function getPrice(symbol){
  var huobiPrice = await getPriceInHuobi(tokenMap[symbol].huobi.pair);
  if(tokenMap[symbol].huobi.nextPair != undefined){
    huobiPrice = huobiPrice.times(await getPriceInHuobi(tokenMap[symbol].huobi.nextPair));
  }
  //console.log(huobiPrice.toString());
  var binancePrice = await getPriceInBinance(tokenMap[symbol].binance.pair);
  if(tokenMap[symbol].binance.nextPair != undefined){
    binancePrice = binancePrice.times(await getPriceInBinance(tokenMap[symbol].binance.nextPair));
  }
  //console.log(binancePrice.toString());
  var uniswapPrice = await getPriceInUniswap(symbol,ethPriceInUniswap);
  //console.log((new BigNumber(uniswapPrice.toString()).div(10**6)).toString());
  var price = huobiPrice.times(tokenMap[symbol].huobi.weight).plus(binancePrice.times(tokenMap[symbol].binance.weight)).plus(new BigNumber(uniswapPrice.toString()).times(tokenMap[symbol].uniswap.weight).div(10**6)).div(1000);
  //console.log(price.toString());
  return price.decimalPlaces(tokenMap[symbol].price_decimals,BigNumber.ROUND_DOWN);
}

async function getSashimiPrice(){
  var aexPrice = await getSashimiPriceInAEX();
  //console.log(aexPrice.toString());
  await getPriceInSashimiswap("ETH",ethPriceInSashimiswap);
  var sashimiPrice = await getPriceInSashimiswap("SASHIMI",ethPriceInSashimiswap);
  //console.log(new BigNumber(sashimiPrice.toString()).div(10**6).toString());
  return aexPrice.plus(new BigNumber(sashimiPrice.toString()).div(10**6)).div(2).decimalPlaces(tokenMap["SASHIMI"].price_decimals,BigNumber.ROUND_DOWN);
}

let web3;
let ethPriceInUniswap = 0;
let ethPriceInSashimiswap = 0;

async function main() { 
  console.log("start");
  try {
    if(web3 == undefined){
      web3 = new Web3(config.provider());
      web3.eth.defaultAccount=info.addresses.alice;
      console.log("Init web3")
    }
    let prices = await helper.readJson("prices.json");// get price from prices.json
    let post = [];
    for (const [symbol, token] of Object.entries(tokenMap)) {
      let price = 0;
      if(symbol == "SASHIMI"){
        price = await getSashimiPrice();
      }else{
        price = await getPrice(symbol);
      }
      if (prices[symbol] == undefined) { // post price when symbol is not in prices.json
        prices[symbol] = price;
        post.push(token);
      }
      else {
        var originPrice = new BigNumber(prices[symbol]);
        var upperBound = originPrice.times(1.001);
        var lowerBound = originPrice.times(0.999);
        if(price.gt(upperBound) || price.lt(lowerBound)){ //post price when price change is larger than offset
          prices[symbol] = price;
          post.push(token);
        }
      }
    }
    if(post.length > 0){
      let symobls = [];
      let priceArray = [];
      priceArray[0] = [];
      for(const token of post){
        symobls.push(token.symbol);
        var array = [token.symbol, prices[token.symbol].toNumber()];
        priceArray[0].push(array);
      }
      console.log(JSON.stringify(symobls));
      console.log(JSON.stringify(priceArray));
      const reporter = web3.eth.accounts.privateKeyToAccount(info.keyMap.reporter);
      const timestamp = time() - 5;      
      await postPrices(timestamp, priceArray, symobls, reporter); //update oracle price 
      console.log(JSON.stringify(prices));
      await helper.writeJsonSync("prices", prices); //save pirces to prices.json
    } 
  } catch (error) {
    console.log(error);
  }  
  console.log('End.');
}


var j = schedule.scheduleJob('*/2 * * * *', function(fireDate){
  console.log('This job was supposed to run at ' + fireDate + ', but actually ran at ' + new Date());
  (async () => {  
    try {
      await main();
    } catch (e) {
      console.log(e);
    }
  })();
});
// (async () => {  
//   try {
//     await main();
//   } catch (e) {
//     console.log(e);
//   }
//   process.exit();  
// })();