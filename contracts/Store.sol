// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Address.sol";

/// @title Store - Basic logic for selling products
/// @author Mykhailo Kudriashev
/// @notice This contract allows for the creation and sale of products.
interface IStore {
  /// @notice Represents a added product with its price and quantity
  struct Product {
    uint id;
    string name;
    uint price;
    uint quantity;
    bool available;
  }

  /// @notice Represents a purchases product
  struct Purchase {
    uint product;
    address user;
    uint value;
    uint timestamp;
  }

  function getProducts() external view returns (Product[] memory);

  function getProduct(uint id) external view returns (Product memory);

  function addProduct(string memory name, uint price, uint quantity) external;

  function changeAvailableProduct(uint id) external;

  function changePriceProduct(uint id, uint price) external;

  function buyProduct(uint id) external payable;

  function getPurchases(address user) external view returns (Purchase[] memory);

  function withdrawFunds(uint amount) external;

  /// @notice Emitted when new Product added.
  event AddedProduct(uint id, string name, uint price, uint quantity, bool available);

  /// @notice Emitted when owner changed available of Product.
  event ChangedAvailableProduct(uint id, bool available);

  /// @notice Emitted when owner changed price of Product.
  event ChangedPriceProduct(uint id, uint price);

  /// @notice Emitted when user bought Product.
  event Purchased(address user, uint id, uint value);

  /// @notice Emitted when owner withdraw amount from contract.
  event Withdrawal(uint amount);
}

contract Store is IStore, Pausable, Ownable {
  int public immutable VERSION = 1;

  Product[] public productsList;
  mapping(uint => Product) public products;

  mapping(address => Purchase[]) public purchases;

  /// @notice Allows the contract owner to pause all activities in the store.
  function pause() external onlyOwner whenNotPaused {
    _pause();
  }

  /// @notice Allows the contract owner to resume all activities in the store.
  function unpause() external onlyOwner whenPaused {
    _unpause();
  }

  /// @dev Modifier to zero price for product
  /// @param price of product
  modifier onlyNotZeroPrice(uint price) {
    require(price > 0, "Not zero price");
    _;
  }

  /// @dev Ensure the product is available for purchase.
  /// @param _id Product ID to check availability.
  modifier onlyAvailable(uint _id) {
    require(products[_id].available, "Product is not available");
    _;
  }

  /// @dev Ensure the transaction amount matches the product price.
  /// @param _id Product ID to check price match.
  modifier onlySufficientValue(uint _id) {
    require(products[_id].price == msg.value, "Insufficient value");
    _;
  }

  /// @dev Ensure the product still has stock left.
  /// @param _id Product ID to check quantity.
  modifier onlyNotZeroQuantity(uint _id) {
    require(products[_id].quantity > 0, "Product is out of stock");
    _;
  }

  constructor() Ownable(msg.sender) {}

  /// @notice Retrieves information about products
  /// @return Array of struct Product
  function getProducts() external view returns (Product[] memory) {
    return productsList;
  }

  /// @notice Get details of a specific product.
  /// @param _id ID of the product to retrieve.
  /// @return Product struct with details of the specified product.
  function getProduct(uint _id) external view returns (Product memory) {
    return products[_id];
  }

  /// @notice Add a new product to the store.
  /// @param name Name of the new product.
  /// @param price Price of the new product in wei.
  /// @param quantity Available quantity of the new product.
  function addProduct(string memory name, uint price, uint quantity) external onlyOwner onlyNotZeroPrice(price) {
    uint productId = uint256(keccak256(abi.encodePacked(name, block.timestamp)));
    Product memory newProduct = Product({
      id: productId,
      name: name,
      price: price,
      quantity: quantity,
      available: true
    });
    productsList.push(newProduct);
    products[productId] = newProduct;
    emit AddedProduct(productId, name, price, quantity, true);
  }

  /// @notice Change available amount of Product
  /// @param _id of Product
  function changeAvailableProduct(uint _id) external onlyOwner {
    Product storage product = products[_id];
    product.available = !product.available;
    emit ChangedAvailableProduct(_id, product.available);
  }

  /// @notice Change price of Product
  /// @param _id of Product
  /// @param price new for Product
  function changePriceProduct(uint _id, uint price) external onlyNotZeroPrice(price) onlyOwner {
    Product storage product = products[_id];
    product.price = price;
    emit ChangedPriceProduct(_id, price);
  }

  /// @notice Purchase a specific product from the store.
  /// @param _id ID of the product to be purchased.
  function buyProduct(
    uint _id
  ) external payable whenNotPaused onlyAvailable(_id) onlySufficientValue(_id) onlyNotZeroQuantity(_id) {
    Product storage product = products[_id];
    Purchase memory newPurchase = Purchase({
      product: _id,
      user: msg.sender,
      value: msg.value,
      timestamp: block.timestamp
    });
    purchases[msg.sender].push(newPurchase);
    product.quantity = product.quantity - 1;
    emit Purchased(msg.sender, _id, msg.value);
  }

  /// @notice Retrieve the list of purchases made by a specific user.
  /// @param user Address of the user to retrieve purchases for.
  /// @return Array of Purchase structs detailing the user's purchase
  function getPurchases(address user) external view returns (Purchase[] memory) {
    return purchases[user];
  }

  /// @notice withdraw funds from contract
  /// @param amount Amount for withdraw
  function withdrawFunds(uint amount) external onlyOwner {
    require(address(this).balance >= amount, "Not enough funds");
    Address.sendValue(payable(msg.sender), amount);
    emit Withdrawal(amount);
  }
}
