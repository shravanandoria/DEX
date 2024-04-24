// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract mock_USDC is ERC20 {
    constructor(uint256 supply) ERC20("USDC Mock", "USDC") {
        _mint(msg.sender, supply * 10 ** decimals());
    }

    function decimals() override public view returns (uint8) {
        return 6;
    }
}