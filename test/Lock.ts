import { expect } from "chai";
import { ethers, network } from "hardhat";
import { Contract, ContractFactory, ContractInterface, Signer, Wallet } from "ethers";

const initial_eth_usd_price = 50;
const one_USDC = 10 ** 6; 
const max_allowed_leverage = 50; 

let dex_contract: Contract;
let usdc_contract: Contract;
let usdc_acc: Wallet;
let usdc_supply = 1000_000;

let account1: Signer;
let account2: Signer;

let account1_addr: String;
let account2_addr: String;

describe("Test Case for the DEX contract", function() {
  
  // DEPLOYING SOME USDC TEST TOKENS
  it("Deploy USDC tokens", async () => {
    const [_account1, _account2] = await ethers.getSigners();

    const contract = await ethers.deployContract("mock_USDC", [usdc_supply])
    await contract.deployed()
    const USDC_address = contract.address.toString()

    usdc_contract = await ethers.getContractAt("IERC20", USDC_address);

    await usdc_contract.connect(_account1).transfer(_account2.address.toString(), usdc_supply / 2 * one_USDC);

    account1 = _account1;
    account2 = _account2;

    account1_addr = _account1.address.toString();
    account2_addr = _account2.address.toString();
  })

  // DEPLOYING DEX CONTRACT
  // WE ARE INITIALLY PASSING USDC TOKEN ADDRESS AND INITIAL PRICE OF ETH/USD AS $50 FOR SIMPLE CALCULATIONS
  it("Deploys the contract", async () => {
      const contract = await ethers.deployContract("DEX", [usdc_contract.address.toString(), initial_eth_usd_price, max_allowed_leverage])
      await contract.deployed();
      dex_contract = contract;
  })

  // APPROVING DEX CONTRACT TO DEPOSIT USDC TOKENS FROM USERS WALLET
  it("Approves DEX to deposit USDC tokens", async () => {
    await usdc_contract.connect(account1).approve(dex_contract.address.toString(), usdc_supply * one_USDC)
    await usdc_contract.connect(account2).approve(dex_contract.address.toString(), usdc_supply * one_USDC)
  })

  // DEPOSITING THE USDC TOKENS TO THE DEX
  // DEPOSITING 100 USDC FROM ACCOUNT_1
  it("Deposits USDC to DEX", async () => {
    await dex_contract.connect(account1).deposit_usdc(100)  
  })

  let user_bal_before_long_profit_position_opening : Number; // USER'S ACC BAL BEFORE OPENING THE LONG POSITION

  // OPENING A LONG POSITION WITH 100 USD COLLATERAL WHICH WILL BE DEDUCTED FROM INITALLY DEPOSITED 100 USD
  it("Testing Long Position - Testing Profit Calulation", async () => {
    user_bal_before_long_profit_position_opening = parseInt( await dex_contract.connect(account1).address_to_userBal(account1_addr))
    console.log({user_bal_before_long_profit_position_opening})

    await dex_contract.connect(account1).openPosition(100, 2, true); // 100 - COLLATERAL, 2 - LEVERAGE, true - LONG POSITION
  })

  // LET'S SAY THE PRICE OF ETH/USD INCREASED FROM $50 -> $60
  it("Updating asset amount from $50 to $60", async () => {
    await dex_contract.connect(account1).update_current_eth_usd_price(60);
  })

  // BOOKING THE PROFIT FROM LONG POSITION
  it("Closing Profitable Position", async () => {
    await dex_contract.connect(account1).closePosition(0);
    const user_bal_after_closing_profit_long_position = await dex_contract.connect(account1).address_to_userBal(account1_addr)
    console.log({user_bal_after_closing_profit_long_position})

    expect(user_bal_after_closing_profit_long_position).greaterThan(user_bal_before_long_profit_position_opening)
  })

  // RESETTING THE PRICE OF ETH/USD BACK TO $50 FOR SIMPLE CALCULATIONS
  it("Updating asset amount from $60 to $50", async () => {
    await dex_contract.connect(account1).update_current_eth_usd_price(50);
  })


  let user_bal_before_loss_long_position: Number; // USER'S ACC BAL BEFORE OPENING 2ND LONG POSITION

  // OPENING 2ND LONG POSITION
  it("Testing Long Position - Testing Loss Calulation", async () => {    
    user_bal_before_loss_long_position = parseInt( await dex_contract.connect(account1).address_to_userBal(account1_addr))
    console.log({user_bal_before_loss_long_position})

    await dex_contract.connect(account1).openPosition(100, 2, true);
  })

  // LET'S SAY THE PRICE OF ETH/USD DROPS FROM $50 -> $40
  it("Updating asset amount from $60 to $40", async () => {
    await dex_contract.connect(account1).update_current_eth_usd_price(40);
    const new_asset_price = await dex_contract.current_eth_usd_price()
  })
  
  // BOOKING LOSS FROM LONG POSITION
  it("Closing Loss Position", async () => {
    const before_closing = await dex_contract.address_to_userBal(account1_addr)
    await dex_contract.connect(account1).closePosition(1);
    const user_bal_after_loss_long_position = parseInt( await dex_contract.connect(account1).address_to_userBal(account1_addr))
    console.log({user_bal_after_loss_long_position})
    expect(user_bal_after_loss_long_position).lessThan( user_bal_before_loss_long_position);
  })

  // RESETTING THE PRICE OF ETH/USD BACK TO $50 FOR SIMPLE CALCULATIONS
  it("Resetting asset amount to $50", async () => {
    await dex_contract.connect(account1).update_current_eth_usd_price(50);
  })

  // ------------ SHORT SELLING TESTING-----------------

  it("Deposits USDC to DEX from Account 2", async () => {
    console.log("-------------SHORT SELLING TESTING-------------------")
    
    await dex_contract.connect(account2).deposit_usdc(100)  
  })

  let user_bal_before_profit_short_position: Number; // USER'S ACC BAL BEFORE OPENING SHORT POSITION

  // OPENING SHORT POSITION
  it("Testing Short Position - Testing Profit Calulation", async () => {
    user_bal_before_profit_short_position = parseInt( await dex_contract.connect(account2).address_to_userBal(account2_addr))
    console.log({user_bal_before_profit_short_position})

    await dex_contract.connect(account2).openPosition(100, 2, false);
  })

  // LET'S SAY THE PRICE OF ETH/USD DROPS FROM $50 -> $40
  it("Updating asset amount from $50 to $40", async () => {
    await dex_contract.connect(account2).update_current_eth_usd_price(40);
  })

  // BOOKING THE PROFIT FROM SHORT POSITION
  it("Closing Profitable Position", async () => {
    await dex_contract.connect(account2).closePosition(0);
    const user_bal_after_profit_short_position = parseInt( await dex_contract.connect(account2).address_to_userBal(account2_addr))
    console.log({user_bal_after_profit_short_position})
    expect(user_bal_after_profit_short_position).greaterThan(user_bal_before_profit_short_position);
  })

  // RESETTING THE PRICE OF ETH/USD BACK TO $50 FOR SIMPLE CALCULATIONS
  it("Updating asset amount from $40 to $50", async () => {
    await dex_contract.connect(account2).update_current_eth_usd_price(50);
  })


  let user_bal_before_loss_short_position: Number; // USER'S ACC BAL BEFORE OPENING 2ND SHORT POSITION
  
  it("Testing Short Position - Testing Loss Calulation", async () => {
    user_bal_before_loss_short_position = parseInt( await dex_contract.connect(account2).address_to_userBal(account2_addr));
    console.log({user_bal_before_loss_short_position})
    await dex_contract.connect(account2).openPosition(100, 2, false);
  })

  // LET'S SAY THE PRICE OF ETH/USD INCREASED FROM $50 -> $60
  it("Updating asset amount from $50 to $60", async () => {
    await dex_contract.connect(account2).update_current_eth_usd_price(60);
  })

  // BOOKING THE LOSS FROM 2ND SHORT POSITION
  it("Closing Profitable Position", async () => {
    await dex_contract.connect(account2).closePosition(1);
    
    const user_bal_after_loss_short_position = parseInt( await dex_contract.connect(account2).address_to_userBal(account2_addr))
    console.log({user_bal_after_loss_short_position})
    expect(user_bal_after_loss_short_position).lessThan(user_bal_before_loss_short_position)
  })
})

