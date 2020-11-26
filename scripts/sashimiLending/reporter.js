"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const web3_1 = __importDefault(require("web3"));
const web3 = new web3_1.default(null); // This is just for encoding, etc.
;
function getKeyAndValueType(kind) {
    switch (kind) {
        case 'prices':
            return ['symbol', 'decimal'];
        default:
            throw new Error(`Unknown kind of data "${kind}"`);
    }
}
exports.getKeyAndValueType = getKeyAndValueType;
function fancyParameterDecoder(paramType) {
    let actualParamType = paramType, actualParamDec = (x) => x;
    if (paramType == 'decimal') {
        actualParamType = 'uint64';
        actualParamDec = (x) => x / 1e6;
    }
    if (paramType == 'symbol') {
        actualParamType = 'string';
        actualParamDec = (x) => x; // we don't know what the original case was anymore
    }
    return [actualParamType, actualParamDec];
}
exports.fancyParameterDecoder = fancyParameterDecoder;
function decode(kind, messages) {
    const [keyType, valueType] = getKeyAndValueType(kind);
    const [kType, kDec] = fancyParameterDecoder(keyType);
    const [vType, vDec] = fancyParameterDecoder(valueType);
    return messages.map((message) => {
        const { 0: kind_, 1: timestamp, 2: key, 3: value } = web3.eth.abi.decodeParameters(['string', 'uint64', kType, vType], message);
        if (kind_ != kind)
            throw new Error(`Expected data of kind ${kind}, got ${kind_}`);
        return [timestamp, key, value];
    });
}
exports.decode = decode;
function fancyParameterEncoder(paramType) {
    let actualParamType = paramType, actualParamEnc = (x) => x;
    // We add a decimal type for reporter convenience.
    // Decimals are encoded as uints with 6 decimals of precision on-chain.
    if (paramType === 'decimal') {
        actualParamType = 'uint64';
        actualParamEnc = (x) => web3.utils.toBN(1e6).muln(x).toString();
    }
    if (paramType == 'symbol') {
        actualParamType = 'string';
        actualParamEnc = (x) => x.toUpperCase();
    }
    return [actualParamType, actualParamEnc];
}
exports.fancyParameterEncoder = fancyParameterEncoder;
function encode(kind, timestamp, pairs) {
    const [keyType, valueType] = getKeyAndValueType(kind);
    const [kType, kEnc] = fancyParameterEncoder(keyType);
    const [vType, vEnc] = fancyParameterEncoder(valueType);
    const actualPairs = Array.isArray(pairs) ? pairs : Object.entries(pairs);
    return actualPairs.map(([key, value]) => {
        return web3.eth.abi.encodeParameters(['string', 'uint64', kType, vType], [kind, timestamp, kEnc(key), vEnc(value)]);
    });
}
exports.encode = encode;
function encodeRotationMessage(rotationTarget) {
    return web3.eth.abi.encodeParameters(['string', 'address'], ['rotate', rotationTarget]);
}
exports.encodeRotationMessage = encodeRotationMessage;
function sign(messages, privateKey) {
    const actualMessages = Array.isArray(messages) ? messages : [messages];
    return actualMessages.map((message) => {
        const hash = web3.utils.keccak256(message);
        const { r, s, v } = web3.eth.accounts.sign(hash, privateKey);
        const signature = web3.eth.abi.encodeParameters(['bytes32', 'bytes32', 'uint8'], [r, s, v]);
        const signatory = web3.eth.accounts.recover(hash, v, r, s);
        return { hash, message, signature, signatory };
    });
}
exports.sign = sign;
async function signWith(messages, signer) {
    const actualMessages = Array.isArray(messages) ? messages : [messages];
    return await Promise.all(actualMessages.map(async (message) => {
        const hash = web3.utils.keccak256(message);
        const { r, s, v } = await signer(hash);
        const signature = web3.eth.abi.encodeParameters(['bytes32', 'bytes32', 'uint8'], [r, s, v]);
        const signatory = web3.eth.accounts.recover(hash, v, r, s);
        return { hash, message, signature, signatory };
    }));
}
exports.signWith = signWith;
//# sourceMappingURL=reporter.js.map