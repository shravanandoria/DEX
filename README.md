# DEX (Decentralized Exchange) Smart Contract Documentation

# Overview
This Solidity smart contract, named DEX, facilitates decentralized trading functionalities. It allows users to open and close positions with leverage on a decentralized exchange. The contract supports the use of USDC (USD Coin) as collateral for trading. Users can deposit, withdraw, open, and close positions within the constraints of the contract's rules.

# Contract Details
Solidity Version: ^0.8.25 <br />
License: MIT <br />
Collateral Token: USDC (address provided during contract deployment) <br />
Initial ETH/USDC Price: Provided during contract deployment <br />
Maximum Allowed Leverage: Provided during contract deployment <br />

# How To Interact With The Contract
1. First you have to deploy the Dex contract and provide <br/>
   . Collateral Token Address. For now, we are using the USDC token <br/> 
   . Initial ETH/USDC Price <br/>
   . Maximum Allowed Leverage <br/>

2. The user has to first approve this deployed DEX contract to transfer USDC from the user's wallet to this contract.
3. Once the tokens are deposited user can view their deposited tokens by calling the address_to_userBal(user_addr) function.
4. Now the user can use these deposited tokens to open as many positions as they want simply by calling the openPosition() function. The user has to provide the collateral amount, it should be <= deposited token amount, leverage for ex:- if the user has put 2 then it is 2X leverage, and type of position, true means long position and false means short position.
5. Once the position is opened, the user can modify the eth/usd asset value however they like by calling and providing a new price to the update_current_eth_usd_price(new_price) function.
6. Now user can close the position by providing the position id to the closePosition(position_id) function.
7. As per the user's position P/L the user's account balance is updated.
