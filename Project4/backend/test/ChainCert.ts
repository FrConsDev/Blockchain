import { expect } from "chai";
import { ethers, network } from "hardhat";
import { ChainCert } from "../typechain-types";
import { HDNodeWallet, parseEther } from "ethers";

async function connectRandomSigner() {
  const randomSigner = ethers.Wallet.createRandom().connect(ethers.provider);

  await network.provider.send("hardhat_setBalance", [
    randomSigner.address,
    "0x56BC75E2D63100000"
  ]);

  return randomSigner;
}

describe("ChainCert", function () {
  let signer1: HDNodeWallet;
  let contract: ChainCert;

  const serialNumber = "SN-1-1";
  const publicId = "PID-1-1";
  const metadataURI = "ipfs://example_metadata_SN-1-1";
  const enterprise = ethers.Wallet.createRandom();
  const price = parseEther("1");

  before(async function () {
    signer1 = await connectRandomSigner();
  });

  beforeEach(async function () {
    contract = await ethers.deployContract("ChainCert");
  });

  async function mintTestProduct(more = 0) {
    const testTx = await contract.mintProduct(
      enterprise,
      metadataURI,
      more !== 0 ? `${serialNumber}-${more}` : serialNumber,
      more !== 0 ? `${publicId}-${more}` : publicId
    );

    return testTx;
  }

  async function claimTestProduct(clamingSerialNumber = serialNumber) {
    const testTx = await contract.connect(signer1).claimProduct(clamingSerialNumber);

    return testTx;
  }

  async function putForSalesTestProduct(salesToken = 1, priceTestProduct = price) {
    const testTx = await contract.connect(signer1).putForSales(salesToken, priceTestProduct);

    return testTx;
  }

  describe("Minting Products", function () {
    it("should mint and emit a mint event correctly", async function () {
      await expect(contract.mintProduct(enterprise, metadataURI, serialNumber, publicId))
        .to.emit(contract, 'ProductMinted').withArgs(enterprise, 1, metadataURI, serialNumber, publicId);
    });

    it("should revert because of duplicate serial number", async function () {
      await mintTestProduct();
      await expect(contract.mintProduct(enterprise, metadataURI, serialNumber, publicId))
        .to.be.revertedWith("Product already registered");
    });

    it("should revert because of duplicate publicId", async function () {
      await mintTestProduct();
      await expect(contract.mintProduct(enterprise, metadataURI, 'serialNumber', publicId))
        .to.be.revertedWith("PublicId already used");
    });

    it("should revert because only owner can mint", async function () {
      await expect(contract.connect(signer1).mintProduct(enterprise, metadataURI, serialNumber, publicId))
        .to.be.revertedWithCustomError(contract, "OwnableUnauthorizedAccount")
    });
  });

  describe("Claiming Products", function () {
    it("should allow a user to claim a product", async function () {
      await mintTestProduct();
      await expect(contract.connect(signer1).claimProduct(serialNumber)).to.emit(contract, 'ProductClaimed')
        .withArgs(signer1.address, 1, serialNumber, publicId, metadataURI, true);
    });

    it("should revert because product doesnt exist", async function () {
      await mintTestProduct();
      await expect(contract.connect(signer1).claimProduct('serialNumber'))
        .to.be.revertedWith("Product not found");
    });

    it("should revert because product is already claimed", async function () {
      await mintTestProduct();
      await claimTestProduct();
      await expect(contract.connect(signer1).claimProduct(serialNumber))
        .to.be.revertedWith("Product already claimed");
    });
  });

  describe("Retrieve Products", function () {
    it("should product details", async function () {
      await mintTestProduct();
      const productDetails = await contract.connect(signer1).getProductDetailsByPublicId(publicId);

      expect(productDetails.serialNumber).to.equal(serialNumber);
      expect(productDetails.publicId).to.equal(publicId);
      expect(productDetails.metadataURI).to.equal(metadataURI);
      expect(productDetails.enterprise).to.equal(enterprise);
      expect(productDetails.isClaimed).to.equal(false);
    });

    it("should product details with serial number", async function () {
      await mintTestProduct();
      const productDetails = await contract.connect(signer1).getProductDetailsByPublicId(serialNumber);

      expect(productDetails.serialNumber).to.equal(serialNumber);
      expect(productDetails.publicId).to.equal(publicId);
      expect(productDetails.metadataURI).to.equal(metadataURI);
      expect(productDetails.enterprise).to.equal(enterprise);
      expect(productDetails.isClaimed).to.equal(false);
    });

    it("should revert because product doesnt exist", async function () {
      await mintTestProduct();
      await expect(contract.connect(signer1).getProductDetailsByPublicId('publicId'))
        .to.be.revertedWith("Product not found");
    });

    it("should allow user to retrieve their product", async function () {
      await mintTestProduct();
      await claimTestProduct();
      await mintTestProduct(1);
      await claimTestProduct(serialNumber.concat('-1'));

      const productOwner = await contract.connect(signer1).getProductsByOwner(signer1.address);
      expect(productOwner).length(2);
      expect(productOwner[0].serialNumber).to.equal(serialNumber);
      expect(productOwner[0].publicId).to.equal(publicId);
      expect(productOwner[0].metadataURI).to.equal(metadataURI);
      expect(productOwner[0].enterprise).to.equal(enterprise);
      expect(productOwner[0].isClaimed).to.equal(true);
      expect(productOwner[1].serialNumber).to.equal(serialNumber.concat('-1'));
      expect(productOwner[1].publicId).to.equal(publicId.concat('-1'));
      expect(productOwner[1].metadataURI).to.equal(metadataURI);
      expect(productOwner[1].enterprise).to.equal(enterprise);
      expect(productOwner[1].isClaimed).to.equal(true);
    });


    it("should not retrieve not owned product", async function () {
      await mintTestProduct();
      await claimTestProduct();
      await mintTestProduct(1);
      await claimTestProduct(serialNumber.concat('-1'));
      await mintTestProduct(2);

      const newRandomSigner = await connectRandomSigner();
      await contract.connect(newRandomSigner).claimProduct(serialNumber.concat('-2'));

      const productOwner = await contract.connect(newRandomSigner).getProductsByOwner(newRandomSigner.address);
      expect(productOwner).length(1);

    });

    it("should revert because any product is owned", async function () {
      await mintTestProduct();
      expect(await contract.connect(signer1).getProductsByOwner(signer1.address)).to.be.deep.equal([]);
    });
  });

  describe("Listing Products for Sale", function () {
    it("should allow the owner to list a product for sale", async function () {
      await mintTestProduct();
      await claimTestProduct();
      await expect(contract.connect(signer1).putForSales(1, price))
        .to.emit(contract, 'ProductListedForSale')
        .withArgs(1, price);
    });

    it("should revert because the caller is not the owner", async function () {
      await mintTestProduct();
      const newRandomSigner = await connectRandomSigner();
      await expect(contract.connect(newRandomSigner).putForSales(1, price))
        .to.be.revertedWith("Not token owner");
    });

    it("should revert because product not exist", async function () {
      await mintTestProduct();
      await claimTestProduct();
      await expect(contract.connect(signer1).putForSales(99, price))
        .to.be.revertedWith("Product does not exist");
    });

    it("should revert because the price is zero", async function () {
      await mintTestProduct();
      await claimTestProduct();
      await expect(contract.connect(signer1).putForSales(1, 0))
        .to.be.revertedWith("Price must be greater than 0");
    });
  });

  describe("Buying a Product", function () {
    it("should allow a user to buy a product", async function () {
      await mintTestProduct();
      await claimTestProduct();
      await putForSalesTestProduct();
      const newRandomSigner = await connectRandomSigner();

      const balanceBefore = await ethers.provider.getBalance(newRandomSigner.address);
      const sellerBalanceBefore = await ethers.provider.getBalance(signer1.address);

      await expect(
        contract.connect(newRandomSigner).buy(1, { value: price })
      )
        .to.emit(contract, "ProductSold")
        .withArgs(1, signer1.address, newRandomSigner.address, price);

      const balanceAfter = await ethers.provider.getBalance(newRandomSigner.address);
      const sellerBalanceAfter = await ethers.provider.getBalance(signer1.address);

      expect(balanceAfter).to.be.below(balanceBefore - price);
      expect(sellerBalanceAfter).to.be.equal(sellerBalanceBefore + price);

      const product = await contract.getProductsByOwner(newRandomSigner.address);

      expect(product.length).to.equal(1);

      expect(product[0].tokenId).to.equal(1);
      expect(product[0].price).to.equal(0);
      expect(product[0].isForSale).to.equal(false);
    });

    it("should revert because the product is not for sale", async function () {
      await mintTestProduct();

      await expect(
        contract.connect(signer1).buy(1, { value: price })
      ).to.be.revertedWith("Product not for sale");
    });

    it("should revert because the product doest not exist", async function () {
      await expect(
        contract.connect(signer1).buy(99, { value: price })
      ).to.be.revertedWith("Product does not exist");
    });

    it("should revert because the buyer does not have enough funds", async function () {
      await mintTestProduct();
      await claimTestProduct();
      await putForSalesTestProduct();
      const newRandomSigner = await connectRandomSigner();

      await expect(
        contract.connect(newRandomSigner).buy(1, { value: parseEther("0.1") })
      ).to.be.revertedWith("Funds not equal to price");

      await expect(
        contract.connect(newRandomSigner).buy(1, { value: parseEther("2") })
      ).to.be.revertedWith("Funds not equal to price");
    });

    it("should revert because the buyer is the owner of the product", async function () {
      await mintTestProduct();
      await claimTestProduct();
      await putForSalesTestProduct();

      await expect(
        contract.connect(signer1).buy(1, { value: price })
      ).to.be.revertedWith("Cannot buy your own product");
    });

    it("should transfer the product correctly to the buyer", async function () {
      await mintTestProduct();
      await claimTestProduct();
      await putForSalesTestProduct();
      const newRandomSigner = await connectRandomSigner();

      await expect(
        contract.connect(newRandomSigner).buy(1, { value: price })
      )
        .to.emit(contract, "ProductSold")
        .withArgs(1, signer1.address, newRandomSigner.address, price);

      const newOwner = await contract.ownerOf(1);
      expect(newOwner).to.equal(newRandomSigner.address);
    });

    it("should move the last token when a non-last token is removed", async function () {
      await mintTestProduct();
      await mintTestProduct(2);
      await mintTestProduct(3);
      await claimTestProduct();
      await claimTestProduct("SN-1-1-2");
      await claimTestProduct("SN-1-1-3");

      const productOwner = await contract.connect(signer1).getProductsByOwner(signer1.address);
      expect(productOwner).length(3);
      await putForSalesTestProduct(2);

      const newRandomSigner = await connectRandomSigner();

      await expect(
        contract.connect(newRandomSigner).buy(2, { value: price })
      )
        .to.emit(contract, "ProductSold")
        .withArgs(2, signer1.address, newRandomSigner.address, price);
      const productsAfterRemovalAddr1 = await contract.getProductsByOwner(signer1.address);
      const productsAfterRemovalAddr2 = await contract.getProductsByOwner(newRandomSigner.address);

      expect(productsAfterRemovalAddr1.length).to.equal(2);
      expect(productsAfterRemovalAddr2.length).to.equal(1);

      expect(productsAfterRemovalAddr1[0].tokenId).to.equal(1);
      expect(productsAfterRemovalAddr1[1].tokenId).to.equal(3);
      expect(productsAfterRemovalAddr2[0].tokenId).to.equal(2);
    });
  });

  it("should remove for sales if transfered", async function () {
    await mintTestProduct();
    await claimTestProduct();
    await putForSalesTestProduct();
    const ownerBeforeTransfer = await contract.ownerOf(1);
    expect(ownerBeforeTransfer).to.equal(signer1.address);

    const newRandomSigner = await connectRandomSigner();

    await contract.connect(signer1).transferFrom(signer1.address, newRandomSigner.address, 1);
    const newProduct = await contract.getProductsByOwner(newRandomSigner.address);

    expect(newProduct.length).to.equal(1);
    expect(newProduct[0].isForSale).to.equal(false);
    expect(newProduct[0].price).to.equal(0);
    expect(newProduct[0].isClaimed).to.equal(true);
  });

  it("should revert if transfer fails using call", async function () {
    await mintTestProduct();
    const buggedSigner = await connectRandomSigner();
    await contract.connect(buggedSigner).claimProduct(serialNumber);
    await contract.connect(buggedSigner).putForSales(1, price);
    const failingBytecode = "0x6080604052348015600f57600080fd5b5060e88061001e6000396000f3fe6080604052600080fdfea2646970667358221220430b3271e7928a4f8a66f8fd2d897df02e2b53b660bda1ec8d2cc1c3d1b86e2764736f6c634300080a0033";

    await ethers.provider.send("hardhat_setCode", [
      buggedSigner.address,
      failingBytecode
    ]);

    const newRandomSigner = await connectRandomSigner();

    await expect(
      contract.connect(newRandomSigner).buy(1, { value: parseEther("1") })
    ).to.be.revertedWith("Transfer failed");
  });
});
