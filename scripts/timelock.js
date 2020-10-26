const Timelock = artifacts.require('Timelock');
const config = require('../truffle-config');
const timeLock_config = require('./timelock-config');
const timeLock_methods = require('./timelock-methods');
const contracts = require('./contracts-config');
const providers = require('../providers');

const argv = require('minimist')(process.argv.slice(2), {string: ['network']});
const readlineSync = require('readline-sync');

//
// function encodeParameters(types, values) {
//     const abi = new ethers.utils.AbiCoder();
//     try {
//         return abi.encode(types, values);
//     } catch (e) {
//         console.log(e);
//     }
// }
//
// async function latestBlockTIme() {
//     const block = await web3.eth.getBlock('latest');
//     return new web3.utils.BN(block.timestamp);
// }
//
// async function setTimeLockPendingAdminQueueTransaction(sender) {
//     console.log('setTimeLockPendingAdmin - Queue - Transaction..');
//     let lastest = await latestBlockTIme();
//     console.log('latest: ', lastest.toString());
//     let eta = lastest.add(time.duration.minutes(config.delay));
//     console.log('eta: ', eta.toString())
//
//
//     let newPendingOwner = config.setPendingAdmin.pendingAdmin;
//     let params = encodeParameters(['address'], [newPendingOwner]);
//     console.log('params', params.toString())
//     await this.timelock.queueTransaction(
//         this.timelock.address, '0', 'setPendingAdmin(address)',
//         params,
//         eta,
//         {from: sender}
//     ).then(function (t) {
//         console.log("Transaction - :", t)
//     }).catch(function (e) {
//         console.log(e);
//     });
// }
//
//
// async function setTimeLockPendingAdminExecuteTransaction(sender) {
//     console.log('setTimeLockPendingAdmin - Execute - Transaction..');
//     let eta = new web3.utils.BN(config.etaNumber);
//     console.log('eta: ', eta.toString())
//
//     let newPendingOwner = config.setPendingAdmin.pendingAdmin;
//     let params = encodeParameters(['address'], [newPendingOwner]);
//     console.log('params', params.toString())
//     await this.timelock.executeTransaction(
//         this.timelock.address, '0', 'setPendingAdmin(address)',
//         params,
//         eta,
//         {from: sender}
//     ).then(function (t) {
//         console.log("Transaction - :", t)
//     }).catch(function (e) {
//         console.log(e);
//     });
// }
//
// async function setFeeToQueueTransaction(sender) {
//     console.log('setFeeTo QueueTransaction..');
//
//     let lastest = await latestBlockTIme();
//     console.log('latest: ', lastest.toString());
//     let eta = lastest.add(time.duration.minutes(config.delay));
//     console.log('eta: ', eta.toString())
//
//     let feeTo = config.setFeeTo.feeTo;
//     let params = encodeParameters(['address'], [feeTo]);
//     console.log('params', params.toString())
//     await this.timelock.queueTransaction(
//         this.factory.address, '0', 'setFeeTo(address)',
//         params,
//         eta,
//         {from: sender}
//     ).then(function (t) {
//         console.log("Transaction - :", t)
//     }).catch(function (e) {
//         console.log(e);
//     });
// }
//
// async function setFeeToExecuteTransaction(sender) {
//     console.log('addProvider ExecuteTransaction..');
//     let eta = new web3.utils.BN(config.etaNumber);
//     console.log('eta: ', eta.toString())
//
//     let feeTo = config.setFeeTo.feeTo;
//     let params = encodeParameters(['address'], [feeTo]);
//     console.log('params', params.toString())
//     await this.timelock.executeTransaction(
//         this.factory.address, '0', 'setFeeTo(address)',
//         params,
//         eta,
//         {from: sender}
//     ).then(function (t) {
//         console.log("Transaction - :", t)
//     }).catch(function (e) {
//         console.log(e);
//     });
// }
//
// async function addProviderQueueTransaction(sender) {
//     console.log('addProvider QueueTransaction..');
//
//     let lastest = await latestBlockTIme();
//     console.log('latest: ', lastest.toString());
//     let eta = lastest.add(time.duration.minutes(config.delay));
//     console.log('eta: ', eta.toString())
//
//     let token = config.addProvider.token;
//     let vault = config.addProvider.vault;
//
//     let params = encodeParameters(['address', 'address'], [token, vault]);
//     console.log('params', params.toString())
//     await this.timelock.queueTransaction(
//         this.investment.address, '0', 'addProvider(address,address)',
//         params,
//         eta,
//         {from: sender}
//     ).then(function (t) {
//         console.log("Transaction - :", t)
//     }).catch(function (e) {
//         console.log(e);
//     });
// }
//
// async function addProviderExecuteTransaction(sender) {
//     console.log('setFeeTo ExecuteTransaction..');
//     let eta = new web3.utils.BN(config.etaNumber);
//     console.log('eta: ', eta.toString())
//
//     let token = config.addProvider.token;
//     let vault = config.addProvider.vault;
//
//     let params = encodeParameters(['address', 'address'], [token, vault]);
//     console.log('params', params.toString())
//     await this.timelock.executeTransaction(
//         this.investment.address, '0', 'addProvider(address,address)',
//         params,
//         eta,
//         {from: sender}
//     ).then(function (t) {
//         console.log("Transaction - :", t)
//     }).catch(function (e) {
//         console.log(e);
//     });
// }
//
// async function changeReservesRatioQueueTransaction(sender) {
//     console.log('changeReservesRatio QueueTransaction..');
//
//     let lastest = await latestBlockTIme();
//     console.log('latest: ', lastest.toString());
//     let eta = lastest.add(time.duration.minutes(config.delay));
//     console.log('eta: ', eta.toString())
//
//     let token = config.changeReservesRatio.token;
//     let reservesRatio = config.changeReservesRatio.reservesRatio;
//
//     let params = encodeParameters(['address', 'uint256'], [token, reservesRatio]);
//     console.log('params', params.toString())
//     await this.timelock.queueTransaction(
//         this.investment.address, '0', 'changeReservesRatio(address,uint256)',
//         params,
//         eta,
//         {from: sender}
//     ).then(function (t) {
//         console.log("Transaction - :", t)
//     }).catch(function (e) {
//         console.log(e);
//     });
// }
//
// async function changeReservesRatioExecuteTransaction(sender) {
//     console.log('setFeeTo ExecuteTransaction..');
//     let eta = new web3.utils.BN(config.etaNumber);
//     console.log('eta: ', eta.toString())
//
//     let token = config.changeReservesRatio.token;
//     let reservesRatio = config.changeReservesRatio.reservesRatio;
//
//     let params = encodeParameters(['address', 'uint256'], [token, reservesRatio]);
//     console.log('params', params.toString())
//     await this.timelock.executeTransaction(
//         this.investment.address, '0', 'changeReservesRatio(address,uint256)',
//         params,
//         eta,
//         {from: sender}
//     ).then(function (t) {
//         console.log("Transaction - :", t)
//     }).catch(function (e) {
//         console.log(e);
//     });
// }
//
// async function setMigratorQueueTransaction(sender) {
//     console.log('setMigratorQueueTransaction..');
//
//     let lastest = await latestBlockTIme();
//     console.log('latest: ', lastest.toString());
//     let eta = lastest.add(time.duration.minutes(config.delay));
//     console.log('eta: ', eta.toString())
//
//     let migrator = config.setMigrator.migrator;
//     let params = encodeParameters(['address'], [migrator]);
//     console.log('params', params.toString())
//     await this.timelock.queueTransaction(
//         this.chef.address, '0', 'setMigrator(address)',
//         params,
//         eta,
//         {from: sender}
//     ).then(function (t) {
//         console.log("Transaction - :", t)
//     }).catch(function (e) {
//         console.log(e);
//     });
// }
//
// async function setMigratorExecuteTransaction(sender) {
//     console.log('setMigratorExecuteTransaction..');
//     let eta = new web3.utils.BN(config.etaNumber);
//     console.log('eta: ', eta.toString())
//
//     let migrator = config.setMigrator.migrator;
//     let params = encodeParameters(['address'], [migrator]);
//     console.log('params', params.toString())
//     await this.timelock.executeTransaction(
//         this.chef.address, '0', 'setMigrator(address)',
//         params,
//         eta,
//         {from: sender}
//     ).then(function (t) {
//         console.log("Transaction - :", t)
//     }).catch(function (e) {
//         console.log(e);
//     });
// }
//
//
// async function transferOwnershipQueueTransaction(sender) {
//     console.log('transferOwnership-Queue-Transaction..');
//
//     let lastest = await latestBlockTIme();
//     console.log('latest: ', lastest.toString());
//     let eta = lastest.add(time.duration.minutes(config.delay));
//     console.log('eta: ', eta.toString())
//
//     let newOwner = config.transferOwnership.newOwner;
//     let params = encodeParameters(['address'], [newOwner]);
//     console.log('params', params.toString())
//     await this.timelock.queueTransaction(
//         config.transferOwnership.contract, '0', 'transferOwnership(address)',
//         params,
//         eta,
//         {from: sender}
//     ).then(function (t) {
//         console.log("Transaction - :", t)
//     }).catch(function (e) {
//         console.log(e);
//     });
// }
//
// async function transferOwnershipExecuteTransaction(sender) {
//     console.log('transferOwnership-Execute-Transaction..');
//     let eta = new web3.utils.BN(config.etaNumber);
//     console.log('eta: ', eta.toString())
//
//     let newOwner = config.transferOwnership.newOwner;
//     let params = encodeParameters(['address'], [newOwner]);
//
//     console.log('params', params.toString())
//     await this.timelock.executeTransaction(
//         config.transferOwnership.contract, '0', 'transferOwnership(address)',
//         params,
//         eta,
//         {from: sender}
//     ).then(function (t) {
//         console.log("Transaction - :", t)
//     }).catch(function (e) {
//         console.log(e);
//     });
// }
//
// async function addPoolQueueTransaction(sender) {
//     console.log('addPoolQueueTransaction..');
//
//     let lastest = await latestBlockTIme();
//     console.log('latest: ', lastest.toString());
//     let eta = lastest.add(time.duration.minutes(config.delay));
//     console.log('eta: ', eta.toString())
//
//     let allocPoint = config.addPool.allocPoint;
//     let lpToken = config.addPool.lpAddress;
//
//     let params = encodeParameters(['uint256', 'address', 'bool'], [allocPoint, lpToken, false]);
//     console.log('params', params.toString())
//     await this.timelock.queueTransaction(
//         this.chef.address, '0', 'add(uint256,address,bool)',
//         params,
//         eta,
//         {from: sender}
//     ).then(function (t) {
//         console.log("Transaction - :", t)
//     }).catch(function (e) {
//         console.log(e);
//     });
// }
//
// async function addPoolExecuteTransaction(sender) {
//     console.log('addPoolExecuteTransaction..');
//     let eta = new web3.utils.BN(config.etaNumber);
//     console.log('eta: ', eta.toString())
//
//     let allocPoint = config.addPool.allocPoint;
//     let lpToken = config.addPool.lpAddress;
//
//     let params = encodeParameters(['uint256', 'address', 'bool'], [allocPoint, lpToken, false]);
//     console.log('params', params.toString())
//
//     await this.timelock.executeTransaction(
//         this.chef.address, '0', 'add(uint256,address,bool)',
//         params,
//         eta,
//         {from: sender}
//     ).then(function (t) {
//         console.log("Transaction - :", t)
//     }).catch(function (e) {
//         console.log(e);
//     });
// }
//
// async function setPointQueueTransaction(sender) {
//     console.log('setPointQueueTransaction..');
//
//     let lastest = await latestBlockTIme();
//     console.log('latest: ', lastest.toString());
//     let eta = lastest.add(time.duration.minutes(config.delay));
//     console.log('eta: ', eta.toString())
//
//     let pid = config.setAllocPoint.pid;
//     let allocPoint = config.setAllocPoint.allocPoint
//     let params = encodeParameters(['uint256', 'uint256', 'bool'], [pid, allocPoint, false]);
//     console.log('params', params.toString())
//     await this.timelock.queueTransaction(
//         this.chef.address, '0', 'set(uint256,uint256,bool)',
//         params,
//         eta,
//         {from: sender}
//     ).then(function (t) {
//         console.log("Transaction - :", t)
//     }).catch(function (e) {
//         console.log(e);
//     });
// }
//
//
// async function setPointExecuteTransaction(sender) {
//     console.log('setPointExecuteTransaction..');
//
//     let pid = config.setAllocPoint.pid;
//     let allocPoint = config.setAllocPoint.allocPoint
//     let eta = new web3.utils.BN(config.etaNumber);
//     console.log('eta: ', eta.toString())
//
//     let params = encodeParameters(['uint256', 'uint256', 'bool'], [pid, allocPoint, false]);
//     console.log('params', params.toString())
//     await this.timelock.executeTransaction(
//         this.chef.address, '0', 'set(uint256,uint256,bool)',
//         params,
//         eta,
//         {from: sender}
//     ).then(function (t) {
//         console.log("Transaction - :", t)
//     }).catch(function (e) {
//         console.log(e);
//     });
// }
//
// async function setPointCancelTransaction(sender) {
//     console.log('setPointCancelTransaction..');
//
//     let pid = config.setAllocPoint.pid;
//     let allocPoint = config.setAllocPoint.allocPoint
//     let eta = new web3.utils.BN(config.etaNumber);
//     console.log('eta: ', eta.toString())
//
//     let params = encodeParameters(['uint256', 'uint256', 'bool'], [pid, allocPoint, false]);
//     console.log('params', params.toString())
//     await this.timelock.cancelTransaction(
//         this.chef.address, '0', 'set(uint256,uint256,bool)',
//         params,
//         eta,
//         {from: sender}
//     ).then(function (t) {
//         console.log("Transaction - :", t)
//     }).catch(function (e) {
//         console.log(e);
//     });
// }

async function queueTimeLock(context, sender) {
    console.log('Sending queue tx..');
    await this.timelock.queueTransaction(
        context.target, '0', context.sig,
        context.params,
        context.eta,
        {from: sender}
    ).then(function (t) {
        console.log("Transaction - :", t)
    }).catch(function (e) {
        console.log(e);
    });
}

async function executeTimeLock(context, sender) {
    console.log('Sending execute tx..');
    await this.timelock.executeTransaction(
        context.target, '0', context.sig,
        context.params,
        context.eta,
        {from: sender}
    ).then(function (t) {
        console.log("Transaction - :", t)
    }).catch(function (e) {
        console.log(e);
    });
}

async function useKovanProvider() {
    this.timelock = await Timelock.at(contracts.kovan.timeLock);
    return web3 = providers.useKovanProvider();
}

async function useMainnetProvider() {
    this.timelock = await Timelock.at(contracts.mainnet.timeLock);
    return providers.useMainnetProvider();
}

module.exports = async function () {
    console.log(`network: ${argv['network']}\n`
        + `transaction: ${argv['method']}\n`
        + `time lock type: ${argv['type']}\n`
        + `sender: ${config.sender}`);

    if (readlineSync.keyInYN('Are you sure?')) {
        // 'Y' key was pressed.
        console.log('Yes.');
        // Do something...
    } else {
        // Another key was pressed.
        console.log('No.');
        return;
    }

    let web3;
    if (argv['network'] === 'kovan') {
        web3 = await useKovanProvider();
    } else if (argv['network'] === 'mainnet') {
        web3 = await useMainnetProvider();
    }

    let method = argv['method'];
    let timeLockMethod = timeLock_methods.getTimeLockMethod(method);

    let type = argv['type'];
    if (type === timeLock_config.txTypes.queueTransaction) {
        let context = await timeLockMethod.queue(web3);
        await queueTimeLock(context, config.sender);
    } else if (type === timeLock_config.txTypes.executeTransaction) {
        let context = await timeLockMethod.execute(web3);
        await executeTimeLock(context, config.sender);
    }

    console.log('End.');
}




