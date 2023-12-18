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
    bool isRegistered;
  }

  mapping(address => Registration) public registrations;

  uint public startDate;
  uint public endDate;
  uint public maxRegistrations;
  uint private registrationCount;

  /// @notice Error when the user has already been registered in the presale.
  /// @param startDate Start presale after this time.
  /// @param endDate End presale after this time.
  error PresaleIncorrectDates(uint startDate, uint endDate);

  /// @notice User is already registered for the presale.
  /// @param user Address of user registered.
  /// @param timestamp Timestamp of registration.
  error UserAlreadyRegistered(address user, uint timestamp);

  /// @notice Occurs when presale is not active.
  /// @param startDate Start presale after this time.
  /// @param endDate End presale after this time.
  error PresaleIsNotActive(uint startDate, uint endDate);

  /// @notice Registration limit for the presale has been exceeded.
  /// @param registrationCount Current number of presale registrations.
  /// @param maxRegistrations Maximum number of registrations in the presale.
  error RegistrationLimitExceeded(uint registrationCount, uint maxRegistrations);

  /// @notice Error when the new maximum registrations limit is set lower than the current count.
  /// @param newMaxRegistrations Maximum number of registrations in the presale.
  /// @param registrationCount Current number of presale registrations.
  error InvalidMaxRegistrationsUpdate(uint newMaxRegistrations, uint registrationCount);

  /// @dev Ensure user registration one time.
  modifier isRegistered() {
    if (registrations[msg.sender].isRegistered) {
      revert UserAlreadyRegistered({ user: msg.sender, timestamp: registrations[msg.sender].timestamp });
    }
    _;
  }

  /// @dev Ensure the dates correct.
  /// @param _startDate Start presale after this time.
  /// @param _endDate End presale after this time.
  modifier onlyCorrectDates(uint _startDate, uint _endDate) {
    if (_startDate > _endDate) {
      revert PresaleIncorrectDates({ startDate: _startDate, endDate: _endDate });
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
  modifier onlyCorrectRegistrationCount() {
    if (registrationCount >= maxRegistrations) {
      revert RegistrationLimitExceeded(registrationCount, maxRegistrations);
    }
    _;
  }

  /// @dev Ensure correct number of maximum registrations in changing
  modifier validateMaxRegistrations(uint _maxRegistrations) {
    if (_maxRegistrations < registrationCount) {
      revert InvalidMaxRegistrationsUpdate(_maxRegistrations, registrationCount);
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
    registrationCount = 0;
  }

  /// @notice Allows the contract owner to pause all activities in the store.
  function pause() external onlyOwner whenNotPaused {
    _pause();
  }

  /// @notice Allows the contract owner to resume all activities in the store.
  function unpause() external onlyOwner whenPaused {
    _unpause();
  }

  /// @notice Registers a user for the presale if the presale is active, they are not already registered, and the maximum registration limit has not been reached.
  function register() external isRegistered onlyPresaleActive onlyCorrectRegistrationCount whenNotPaused {
    Registration memory registration;
    registration.user = msg.sender;
    registration.timestamp = block.timestamp;
    registration.isRegistered = true;
    registrationCount++;
    registrations[msg.sender] = registration;
    emit Registered(msg.sender, block.timestamp);
  }

  /// @notice Check registration on presale by address.
  /// @param _user Address of user.
  /// @return Registration details by user.
  function checkRegistration(address _user) external view returns (Registration memory) {
    return registrations[_user];
  }

  /// @notice Updates the settings of the presale, including start date, end date, and maximum number of registrations.
  /// @param _newStartDate New start date of Presale.
  /// @param _newEndDate New end date of Presale.
  /// @param _maxRegistrations New count of max registrations.
  function setSettings(
    uint _newStartDate,
    uint _newEndDate,
    uint _maxRegistrations
  ) external onlyOwner onlyCorrectDates(_newStartDate, _newEndDate) validateMaxRegistrations(_maxRegistrations) {
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
