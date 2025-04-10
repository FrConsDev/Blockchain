// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "erc721a/contracts/ERC721A.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "hardhat/console.sol";

contract ChainCert is ERC721A, Ownable, ReentrancyGuard {
    struct Product {
        string serialNumber;
        string publicId;
        string metadataURI;
        address enterprise;
        bool isClaimed;
        bool isForSale;
        uint256 price;
        uint256 tokenId;
        bool exists;
    }

    mapping(string => uint256) private _publicIdToTokenId;
    mapping(string => uint256) private _serialNumberToTokenId;
    mapping(uint256 => Product) private _products;

    mapping(address => uint256[]) private _ownedTokens;
    mapping(uint256 => uint256) private _ownedTokensIndex;

    event ProductMinted(
        address indexed recipient,
        uint256 tokenId,
        string metadata,
        string serialNumber,
        string publicId
    );

    event ProductClaimed(
        address indexed buyer,
        uint256 indexed tokenId,
        string serialNumber,
        string publicId,
        string metadataURI,
        bool isClaimed
    );

    event ProductListedForSale(uint256 tokenId, uint256 price);
    event ProductSold(
        uint256 tokenId,
        address indexed from,
        address indexed to,
        uint256 price
    );

    constructor() ERC721A("ChainCert", "CC") Ownable(msg.sender) {}

    modifier productExists(uint256 tokenId) {
        require(_products[tokenId].exists, "Product does not exist");
        _;
    }

    function _startTokenId() internal pure override returns (uint256) {
        return 1;
    }

    /**
     * @dev Mint a NFT for a product on behalf of an enterprise
     * @param recipient Address associated with the product
     * @param metadata Product metadata URI
     * @param serialNumber Unique product serial number
     * @param publicId Unique product public ID
     */
    function mintProduct(
        address recipient,
        string memory metadata,
        string memory serialNumber,
        string memory publicId
    ) external onlyOwner returns (uint256) {
        uint256 snTokenId = _serialNumberToTokenId[serialNumber];
        uint256 pidTokenId = _publicIdToTokenId[publicId];

        require(
            snTokenId == 0 || !_products[snTokenId].exists,
            "Product already registered"
        );
        require(
            pidTokenId == 0 || !_products[pidTokenId].exists,
            "PublicId already used"
        );

        uint256 newTokenId = _nextTokenId();

        _serialNumberToTokenId[serialNumber] = newTokenId;
        _publicIdToTokenId[publicId] = newTokenId;

        _products[newTokenId] = Product({
            serialNumber: serialNumber,
            publicId: publicId,
            metadataURI: metadata,
            enterprise: recipient,
            isClaimed: false,
            isForSale: false,
            price: 0,
            tokenId: newTokenId,
            exists: true
        });

        emit ProductMinted(
            recipient,
            newTokenId,
            metadata,
            serialNumber,
            publicId
        );

        _mint(address(this), 1);

        return newTokenId;
    }

    /**
     * @dev A buyer claims product ownership by sending the serial number
     * @param serialNumber Unique product serial number
     */
    function claimProduct(string memory serialNumber) external nonReentrant {
        uint256 tokenId = _serialNumberToTokenId[serialNumber];
        require(_products[tokenId].exists, "Product not found");
        Product storage product = _products[tokenId];
        require(!product.isClaimed, "Product already claimed");

        _approve(msg.sender, tokenId, false);
        safeTransferFrom(address(this), msg.sender, tokenId);

        product.isClaimed = true;

        emit ProductClaimed(
            msg.sender,
            tokenId,
            serialNumber,
            product.publicId,
            product.metadataURI,
            true
        );
    }

    /**
     * @dev List a product for sale
     * @param tokenId Token ID of the product
     * @param price Price for selling the product
     */
    function putForSales(
        uint256 tokenId,
        uint256 price
    ) external productExists(tokenId) {
        require(ownerOf(tokenId) == msg.sender, "Not token owner");
        require(price > 0, "Price must be greater than 0");

        Product storage product = _products[tokenId];
        product.isForSale = true;
        product.price = price;

        emit ProductListedForSale(tokenId, price);
    }

    /**
     * @dev Buy a product that is listed for sale
     * @param tokenId Token ID of the product
     */
    function buy(
        uint256 tokenId
    ) external payable nonReentrant productExists(tokenId) {
        Product storage product = _products[tokenId];
        require(product.isForSale, "Product not for sale");
        require(msg.value == product.price, "Funds not equal to price");

        address seller = ownerOf(tokenId);
        require(seller != msg.sender, "Cannot buy your own product");

        _approve(msg.sender, tokenId);
        safeTransferFrom(seller, msg.sender, tokenId);
        (bool success, ) = payable(seller).call{value: msg.value}("");
        require(success, "Transfer failed");

        emit ProductSold(tokenId, seller, msg.sender, msg.value);
    }

    /**
     * @dev Return product details from a publicId or serialNumber
     * @param publicIdOrSerialNumber Unique product public ID or serial number
     */
    function getProductDetailsByPublicId(
        string memory publicIdOrSerialNumber
    ) external view returns (Product memory) {
        uint256 tokenId = _publicIdToTokenId[publicIdOrSerialNumber];

        if (tokenId == 0) {
            tokenId = _serialNumberToTokenId[publicIdOrSerialNumber];
        }

        require(_products[tokenId].exists, "Product not found");

        return _products[tokenId];
    }

    /**
     * @dev Hook that is called after any transfer of tokens. It updates the mapping of owned tokens.
     * @param from The address that is sending the token
     * @param to The address that is receiving the token
     * @param startTokenId The first token ID in the transfer
     */
    function _afterTokenTransfers(
        address from,
        address to,
        uint256 startTokenId,
        uint256 /*quantity*/
    ) internal override {
        uint256 tokenId = startTokenId;
        require(
            _products[tokenId].exists,
            "Product does not exist after transfer"
        );

        Product storage product = _products[tokenId];

        if (product.isForSale) {
            product.isForSale = false;
            product.price = 0;
        }

        if (from != address(0)) {
            _removeTokenFromOwner(from, tokenId);
        }

        _addTokenToOwner(to, tokenId);

        super._afterTokenTransfers(from, to, tokenId, 1);
    }

    function _addTokenToOwner(address to, uint256 tokenId) internal {
        _ownedTokensIndex[tokenId] = _ownedTokens[to].length;
        _ownedTokens[to].push(tokenId);
    }

    function _removeTokenFromOwner(address from, uint256 tokenId) internal {
        uint256 lastTokenIndex = _ownedTokens[from].length - 1;
        uint256 tokenIndex = _ownedTokensIndex[tokenId];

        if (tokenIndex != lastTokenIndex) {
            uint256 lastTokenId = _ownedTokens[from][lastTokenIndex];
            _ownedTokens[from][tokenIndex] = lastTokenId;
            _ownedTokensIndex[lastTokenId] = tokenIndex;
        }

        _ownedTokens[from].pop();
        delete _ownedTokensIndex[tokenId];
    }

    /**
     * @dev Retrieve the list of products owned by a given address
     * @param owner Address of the product owner
     */
    function getProductsByOwner(
        address owner
    ) external view returns (Product[] memory) {
        uint256 balance = _ownedTokens[owner].length;
        Product[] memory products = new Product[](balance);

        for (uint256 i = 0; i < balance; i++) {
            products[i] = _products[_ownedTokens[owner][i]];
        }

        return products;
    }
}
