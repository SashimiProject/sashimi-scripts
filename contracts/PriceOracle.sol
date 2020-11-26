pragma solidity ^0.6.10;
pragma experimental ABIEncoderV2;


interface PriceOracle {

    function getUnderlyingPrice(address slToken) virtual external view returns (uint);
    
    function postPrices(bytes[] calldata messages, bytes[] calldata signatures, string[] calldata symbols) external;
}
