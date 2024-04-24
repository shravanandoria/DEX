// SPDX-License-Identifier: MIT

pragma solidity ^0.8.25;
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract DEX {

    // Position Details
    struct Position {
        bool is_long;
        uint256 position_size; // collateral_amount * leverage
        uint16 leverage; // amount of leverage, ex:- 2X, 5x, 15X
        uint256 collateral_amount;
        address position_owner;
        uint256 asset_opening_price; // asset value when this position was opened
        bool position_status; // true: open, false: closed
    }

    // Address of the token, currently we are using USDC
    address public collateralToken;
    // Initial Price for the ETH/USDC price
    uint256 public current_eth_usd_price;

    uint8 public max_allowed_leverage;

    // Decimals for USDC Token
    uint256 one_USDC = 10 ** 6;

    // Tracks you acoount balance
    mapping(address => uint256) public address_to_userBal;

    // Tracks Positions by Users wallet and position ID;
    mapping(address => mapping(uint256 => Position)) public address_to_positionId;

    // Tracks Position Id For Each User
    mapping(address => uint256) public user_positions_id;

    constructor (
        address _collateralToken,
        uint256 _current_eth_usdc_price,
        uint8 _max_allowed_leverage
    ) {
        collateralToken = _collateralToken;
        current_eth_usd_price = _current_eth_usdc_price * one_USDC;
        max_allowed_leverage = _max_allowed_leverage;
    }

    // Function to manually modify the price of ETH/USDC pair
    function update_current_eth_usd_price(uint256 new_price) external {
        require(new_price > 0, "Invalid new price");
        current_eth_usd_price = new_price * one_USDC;
    }

    // This deposited amount(USDC) will be added to user account
    function deposit_usdc(uint256 amount) external {
        require(amount > 0, "Please input a valid amount");

        IERC20(collateralToken).transferFrom(msg.sender, address(this), amount * one_USDC);
        address_to_userBal[msg.sender] = amount * one_USDC;
    }

    // Withdraw amount will be deducted from user account
    function withdraw_usdc(uint256 amount) external {
        require(amount > 0, "Please input a valid amount");
        require(address_to_userBal[msg.sender] >= amount * one_USDC, "You do not have enough usdc");

        IERC20(collateralToken).transfer(msg.sender, amount * one_USDC);
        address_to_userBal[msg.sender] -= amount * one_USDC;
    }
    
    // Multiple Positions can be created with this function
    function openPosition(uint256 _collateralAmount, uint16 leverage, bool _isLong) external {
        require(leverage <= max_allowed_leverage && leverage > 0, "Please input a valid leverage amount");
        require(_collateralAmount > 0, "Please input a valid amount");
        require(address_to_userBal[msg.sender] >= _collateralAmount * one_USDC, "You do not have enough deposited USDC");

        // Storing new positions details to the struct
        Position memory new_position = Position(
            _isLong,
            _collateralAmount * leverage * one_USDC,
            leverage,
            _collateralAmount * one_USDC,
            msg.sender,
            current_eth_usd_price,
            true
        );

        address_to_userBal[msg.sender] -= _collateralAmount * one_USDC; // _collateralAmount of USDC is deducted from user account
        address_to_positionId[msg.sender][user_positions_id[msg.sender]] = new_position; // [user_address][positionId] = new_position
        user_positions_id[msg.sender]++; // Incrementing positionId for this user;
    }
    
    // User can close multiple positions with this function
    function closePosition(uint256 position_id) external {
        
        // Getting info of user position
        Position memory user_position = address_to_positionId[msg.sender][position_id];

        require(user_position.position_status, "This position is already been closed");

        require(user_position.position_owner == msg.sender, "You are not the owner of this position");
        require(user_position.position_size > 0, "Invalid Position");
        
        // Checking if this position is Long or Short
        bool is_long_position = user_position.is_long;

        // Calculating User asset value as per current asset price;
        uint256 current_asset_value = user_position.position_size / user_position.asset_opening_price * current_eth_usd_price;

        if(is_long_position) {
            
            // Modifying user account if the position is profitable or in loss
            if(current_eth_usd_price > user_position.asset_opening_price || current_eth_usd_price < user_position.asset_opening_price) {
                address_to_userBal[msg.sender] += user_position.collateral_amount + current_asset_value - user_position.position_size;
            } else {
                // If asset value doesn't change, return the collateral amount
                address_to_userBal[msg.sender] += user_position.collateral_amount;
            }
        } else {
            // Modifying user account if the position is profitable or in loss
            if(current_eth_usd_price > user_position.asset_opening_price || current_eth_usd_price < user_position.asset_opening_price) {
                address_to_userBal[msg.sender] += user_position.collateral_amount + user_position.position_size - current_asset_value;
            } else {
                // If asset value doesn't change, return the collateral amount
                address_to_userBal[msg.sender] += user_position.collateral_amount;
            }
        }
        // 
        user_position.position_status = false;
    }
}
