// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

abstract contract Whitelist {
  mapping(address => bool) private _whitelist;
  bool private _whitelistStatus;

  /// @notice Error when the address is already in the whitelist.
  /// @param user The address being checked.
  error UserAlreadyWhitelisted(address user);

  /// @notice Error when the address is not in the whitelist.
  /// @param user The address being checked.
  error UserIsNotWhitelisted(address user);

  /// @dev Error when whitelist is off.
  error EnforcedWhitelist();

  /// @dev Error when whitelist is on.
  error ExpectedWhitelist();

  /// @dev Ensures the address is on the whitelist if whitelist is enforced.
  /// @param _address Address to check.
  modifier onlyWhitelisted(address _address) {
    if (whitelistStatus()) {
      _requiredAddressInWhitelist(_address);
    }
    _;
  }

  /// @dev Ensures the function is accessible only if the address is not on the whitelist when whitelist is enforced.
  /// @param _address Address to check.
  modifier onlyNotWhitelisted(address _address) {
    if (whitelistStatus()) {
      _requiredAddressNotInWhitelist(_address);
    }
    _;
  }

  /// @dev Ensure whitelist is on.
  modifier whenWhitelistOn() {
    _requiredWhitelistOn();
    _;
  }

  /// @dev Ensure whitelist is off.
  modifier whenWhitelistOff() {
    _requiredWhitelistOff();
    _;
  }

  /// @dev Emitted when user added in whitelist.
  event AddedToWhitelist(address indexed user);

  /// @dev Emitted when user removed from whitelist.
  event RemovedFromWhitelist(address indexed user);

  /// @dev Emitted when whitelist was on.
  event WhitelistTurnedOn();

  /// @dev Emitted when whitelist was off.
  event WhitelistTurnedOff();

  /// @dev Initializes the contract with a given whitelist status.
  /// @param _whitelistStatusInit Initial status of the whitelist (true for enabled, false for disabled).
  constructor(bool _whitelistStatusInit) {
    _whitelistStatus = _whitelistStatusInit;
  }

  /// @dev Returns whitelist status.
  function whitelistStatus() public view returns (bool) {
    return _whitelistStatus;
  }

  /// @dev Checking that whitelist is on.
  function _requiredWhitelistOn() internal view {
    if (!whitelistStatus()) {
      revert ExpectedWhitelist();
    }
  }

  /// @dev Checking that whitelist is off.
  function _requiredWhitelistOff() internal view {
    if (whitelistStatus()) {
      revert EnforcedWhitelist();
    }
  }

  /// @dev Checking that address is in whitelist.
  function _requiredAddressInWhitelist(address _address) internal view {
    if (!_isAddressWhitelisted(_address)) {
      revert UserIsNotWhitelisted(_address);
    }
  }

  /// @dev Checking that address is not in whitelist.
  function _requiredAddressNotInWhitelist(address _address) internal view {
    if (_isAddressWhitelisted(_address)) {
      revert UserAlreadyWhitelisted(_address);
    }
  }

  /// @dev Turn on whitelist.
  function _turnOnWhitelist() internal whenWhitelistOff {
    _whitelistStatus = true;
    emit WhitelistTurnedOn();
  }

  /// @dev Turn off whitelist.
  function _turnOffWhitelist() internal whenWhitelistOn {
    _whitelistStatus = false;
    emit WhitelistTurnedOff();
  }

  /// @dev Adds an address to the whitelist, ensuring it is not already whitelisted.
  /// @param _address Address to be added to the whitelist.
  function _addToWhiteList(address _address) internal {
    _requiredAddressNotInWhitelist(_address);
    _whitelist[_address] = true;
    emit AddedToWhitelist(_address);
  }

  /// @dev Adds multiple addresses to the whitelist, skipping addresses already whitelisted.
  /// @param _addresses Array of addresses to be added to the whitelist.
  function _addBatchToWhitelist(address[] memory _addresses) internal {
    for (uint i = 0; i < _addresses.length; i++) {
      if (!_isAddressWhitelisted(_addresses[i])) {
        _whitelist[_addresses[i]] = true;
        emit AddedToWhitelist(_addresses[i]);
      }
    }
  }

  /// @dev Removes an address from the whitelist, ensuring it is currently whitelisted.
  /// @param _address Address to be removed from the whitelist.
  function _removeFromWhitelist(address _address) internal {
    _requiredAddressInWhitelist(_address);
    _whitelist[_address] = false;
    emit RemovedFromWhitelist(_address);
  }

  /// @dev Removes multiple addresses from the whitelist, skipping addresses not currently whitelisted.
  /// @param _addresses Array of addresses to be removed from the whitelist.
  function _removeBatchFromWhiteList(address[] memory _addresses) internal {
    for (uint i = 0; i < _addresses.length; i++) {
      if (_isAddressWhitelisted(_addresses[i])) {
        _whitelist[_addresses[i]] = false;
        emit RemovedFromWhitelist(_addresses[i]);
      }
    }
  }

  /// @notice Checks if an address is whitelisted.
  /// @param _address Address to check.
  /// @return bool True if the address is whitelisted, false otherwise.
  function isAddressWhitelisted(address _address) public view virtual returns (bool) {
    return _isAddressWhitelisted(_address);
  }

  /// @dev Check address for exists in whitelist.
  /// @param _address address for checking
  function _isAddressWhitelisted(address _address) internal view virtual returns (bool) {
    return _whitelist[_address];
  }
}
