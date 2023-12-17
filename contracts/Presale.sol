// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract Presale is Pausable, Ownable, ReentrancyGuard {
  int public immutable VERSION = 1;

  struct Registration {
    address user;
    uint timestamp;
    bool isRegister;
  }

  mapping(address => Registration) public registrations;

  uint public startDate;
  uint public endDate;
  uint public maxRegistrations;
  uint private countOfRegistrations;

  /// @notice Occurs when presale dates incorrect.
  /// @param startDate Start presale after this time.
  /// @param endDate End presale after this time.
  error IncorrectDates(uint startDate, uint endDate);

  /// @notice Occurs when user already registered.
  /// @param user Address of user registered.
  /// @param timestamp Timestamp of registration.
  error AlreadyRegistered(address user, uint timestamp);

  /// @notice Occurs when presale is not active.
  /// @param startDate Start presale after this time.
  /// @param endDate End presale after this time.
  error PresaleIsNotActive(uint startDate, uint endDate);

  /// @notice Occurs registration limit exceeded.
  /// @param countOfRegistrations Current number of presale registrations.
  /// @param maxRegistrations Maximum number of registrations in the presale.
  error CountOfRegistrationsExceeded(uint countOfRegistrations, uint maxRegistrations);

  /// @notice Occurs to set the maximum number of registrations less than the current one.
  /// @param newMaxRegistrations Maximum number of registrations in the presale.
  /// @param countOfRegistrations Current number of presale registrations.
  error ReducedCountOfRegistrations(uint newMaxRegistrations, uint countOfRegistrations);

  /// @dev Ensure user registration one time.
  modifier isRegister() {
    if (registrations[msg.sender].isRegister) {
      revert AlreadyRegistered({ user: msg.sender, timestamp: registrations[msg.sender].timestamp });
    }
    _;
  }

  /// @dev Ensure the dates correct.
  /// @param _startDate Start presale after this time.
  /// @param _endDate End presale after this time.
  modifier onlyCorrectDates(uint _startDate, uint _endDate) {
    if (_startDate > _endDate) {
      revert IncorrectDates({ startDate: _startDate, endDate: _endDate });
    }
    _;
  }
  /// @dev Ensure the presale active.
  modifier onlyPresaleActive() {
    if (block.timestamp < startDate || block.timestamp > endDate) {
      revert PresaleIsNotActive(startDate, endDate);
    }
    _;
  }

  /// @dev Ensure number of maximum registrations.
  modifier onlyCorrectCountOfRegistrations() {
    if (countOfRegistrations >= maxRegistrations) {
      revert CountOfRegistrationsExceeded(countOfRegistrations, maxRegistrations);
    }
    _;
  }

  /// @dev Ensure correct number of maximum registrations in changing
  modifier onlyCorrectCountOfMaxRegistrations(uint _maxRegistrations) {
    if (_maxRegistrations < countOfRegistrations) {
      revert ReducedCountOfRegistrations(_maxRegistrations, countOfRegistrations);
    }
    _;
  }

  /// @notice Emitted when user registered on presale.
  event Registered(address indexed user, uint timestamp);

  /// @notice Emitted when owner changed settings.
  event ChangedSettings(
    uint oldStartDate,
    uint newStartDate,
    uint oldEndDate,
    uint newEndDate,
    uint oldMaxRegistrations,
    uint maxRegistrations
  );

  constructor(uint _startDate, uint _endDate, uint _maxRegistrations) Ownable(msg.sender) {
    startDate = _startDate;
    endDate = _endDate;
    maxRegistrations = _maxRegistrations;
    countOfRegistrations = 0;
  }

  /// @notice Allows the contract owner to pause all activities in the store.
  function pause() external onlyOwner whenNotPaused {
    _pause();
  }

  /// @notice Allows the contract owner to resume all activities in the store.
  function unpause() external onlyOwner whenPaused {
    _unpause();
  }

  /// @notice Register on presale by address.
  function register() external isRegister onlyPresaleActive onlyCorrectCountOfRegistrations whenNotPaused {
    Registration memory registration;
    registration.user = msg.sender;
    registration.timestamp = block.timestamp;
    registration.isRegister = true;
    countOfRegistrations++;
    registrations[msg.sender] = registration;
    emit Registered(msg.sender, block.timestamp);
  }

  /// @notice Check registration on presale by address.
  /// @param _user Address of user.
  /// @return Registration details by user.
  function checkRegistration(address _user) external view returns (Registration memory) {
    return registrations[_user];
  }

  /// @notice Change setting of presale.
  /// @param _newStartDate New start date of Presale.
  /// @param _newEndDate New end date of Presale.
  /// @param _maxRegistrations New count of max registrations.
  function setSettings(
    uint _newStartDate,
    uint _newEndDate,
    uint _maxRegistrations
  )
    external
    onlyOwner
    onlyCorrectDates(_newStartDate, _newEndDate)
    onlyCorrectCountOfMaxRegistrations(_maxRegistrations)
  {
    uint oldStartDate = startDate;
    uint oldEndDate = endDate;
    uint oldMaxRegistrations = maxRegistrations;
    startDate = _newStartDate;
    endDate = _newEndDate;
    maxRegistrations = _maxRegistrations;
    emit ChangedSettings(oldStartDate, _newStartDate, oldEndDate, _newEndDate, oldMaxRegistrations, maxRegistrations);
  }

  /// @notice Get setting of presale.
  /// @return startDate Start date of Presale.
  /// @return endDate End date of Presale.
  /// @return maxRegistrations Max registrations.
  function getSettings() external view returns (uint, uint, uint) {
    return (startDate, endDate, maxRegistrations);
  }
}
