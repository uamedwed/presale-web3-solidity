import { expect } from 'chai'
import { ethers } from 'hardhat'
import { ContractFactory, Signer } from 'ethers'
import { Store } from '../typechain-types'
import { faker } from '@faker-js/faker'

describe('Store', function () {
  let StoreFactory: ContractFactory
  let store: Store
  let owner: Signer
  let addr1: Signer
  let addr2: Signer
  const version: number = 1
  const title = faker.lorem.word(13)

  beforeEach(async () => {
    StoreFactory = await ethers.getContractFactory('Store')
    ;[owner, addr1, addr2] = await ethers.getSigners()
    store = (await StoreFactory.deploy()) as Store
  })

  const initializeData = async (quantity: number = 10, price: number = 1) => {
    await store.connect(owner).addProduct(title, BigInt(price), BigInt(quantity))
    const newProduct = (await store.getProducts())[0]
    return {
      productId: newProduct[0],
      title: newProduct[1],
      price: newProduct[2],
      quantity: newProduct[3],
      available: newProduct[4],
      productArray: newProduct
    }
  }

  describe('Deployment', function () {
    it(`Should set the correct version: ( ${version} )`, async function () {
      expect(await store.VERSION()).to.equal(version)
    })

    it(`Should set the correct owner`, async function () {
      expect(await store.owner()).to.equal(await owner.getAddress())
    })
  })

  describe('Getting products', function () {
    it('Should get products', async function () {
      await store.connect(owner).addProduct(title, BigInt(1), BigInt(10))
      await store.connect(owner).addProduct(title + '2', BigInt(2), BigInt(5))
      expect((await store.getProducts()).length).to.equal(2)
    })

    it('Should get product', async function () {
      const { productId } = await initializeData()
      expect((await store.getProduct(productId))[1]).to.equal(title)
    })

    it('Should get not exists product', async function () {
      const { productId } = await initializeData()
      expect((await store.getProduct(productId + BigInt(1)))[0]).to.equal(ethers.ZeroAddress)
    })
  })
  describe('Adding products', function () {
    it('Should add product', async function () {
      const { productId, title, price, quantity, available, productArray } = await initializeData()
      expect(productArray.length).to.equal(5)
      expect(productArray).to.include.members([productId, title, price, quantity, available])
    })

    it('Should emit the correct event on add product', async function () {
      expect(await store.connect(owner).addProduct(title, BigInt(1), BigInt(10)))
        .to.emit(store, 'AddedProduct')
        .withArgs((await store.getProducts())[0][0], title, BigInt(1), BigInt(10), true)
    })

    it('Should not allow add product if not owner', async function () {
      await expect(store.connect(addr1).addProduct(title, BigInt(1), BigInt(10))).to.be.revertedWithCustomError(
        store,
        'OwnableUnauthorizedAccount'
      )
    })

    it('Should not allow add product with zero price', async function () {
      await expect(store.connect(owner).addProduct(title, BigInt(0), BigInt(10))).to.be.revertedWith('Not zero price')
    })

    it('Should set correct available after registration', async function () {
      const { productId } = await initializeData()
      await expect((await store.getProduct(productId))[4]).to.equal(true)
    })
  })

  describe('Changing product', function () {
    it('Should change available product to false', async function () {
      const { productId } = await initializeData()
      expect((await store.getProduct(productId))[4]).to.equal(true)
      await store.changeAvailableProduct(productId)
      expect((await store.getProduct(productId))[4]).to.equal(false)
    })

    it('Should change available product to true', async function () {
      const { productId } = await initializeData(5, 1)
      expect((await store.getProduct(productId))[4]).to.equal(true)
      await store.changeAvailableProduct(productId)
      expect((await store.getProduct(productId))[4]).to.equal(false)
      await store.changeAvailableProduct(productId)
      expect((await store.getProduct(productId))[4]).to.equal(true)
    })

    it('Should emit the correct event on change available product', async function () {
      const { productId } = await initializeData()
      expect(await store.changeAvailableProduct(productId))
        .to.emit(store, 'ChangedPriceProduct')
        .withArgs(productId, false)
    })

    it('Should not allow change available product if not owner', async function () {
      const { productId } = await initializeData()
      await expect(store.connect(addr1).changeAvailableProduct(productId)).to.be.revertedWithCustomError(
        store,
        'OwnableUnauthorizedAccount'
      )
    })

    it('Should change price product', async function () {
      const { productId } = await initializeData()
      expect((await store.getProduct(productId))[2]).to.equal(BigInt(1))
      await store.changePriceProduct(productId, BigInt(2))
      expect((await store.getProduct(productId))[2]).to.equal(BigInt(2))
    })

    it('Should emit the correct event on change prices product', async function () {
      const { productId } = await initializeData()
      expect(await store.changePriceProduct(productId, BigInt(2)))
        .to.emit(store, 'ChangedPriceProduct')
        .withArgs(productId, BigInt(2))
    })

    it('Should not allow change product price to zero', async function () {
      const { productId } = await initializeData()
      await expect(store.changePriceProduct(productId, BigInt(0))).to.be.revertedWith('Not zero price')
    })

    it('Should not allow change product price if not owner', async function () {
      const { productId } = await initializeData()
      await expect(store.connect(addr1).changePriceProduct(productId, BigInt(10))).to.be.revertedWithCustomError(
        store,
        'OwnableUnauthorizedAccount'
      )
    })
  })

  describe('Buying product', function () {
    it('Should buy product', async function () {
      const { productId } = await initializeData()
      await store.connect(addr1).buyProduct(productId, { value: BigInt(1) })
      expect((await store.connect(addr1).getPurchases(addr1.getAddress()))[0][0]).to.equal(productId)
    })

    it('Should buy product with correct balances', async function () {
      const productQuantity = 10
      const initialUserBalance = await ethers.provider.getBalance(addr1.getAddress())
      const initialContractBalance = await ethers.provider.getBalance(store.target)
      const { productId } = await initializeData(productQuantity, 1)
      const tx = await store.connect(addr1).buyProduct(productId, { value: BigInt(1) })
      const txReceipt: any = await tx.wait()
      const gasUsed = txReceipt.gasUsed * tx.gasPrice
      const currentUserBalance = await ethers.provider.getBalance(addr1.getAddress())
      const currentContractBalance = await ethers.provider.getBalance(store.target)
      expect(currentUserBalance).to.equal(initialUserBalance - BigInt(1) - gasUsed)
      expect(currentContractBalance).to.equal(initialContractBalance + BigInt(1))
    })

    it('Should not allow buy not available product', async function () {
      const { productId } = await initializeData()
      await store.connect(owner).changeAvailableProduct(productId)
      await expect(store.connect(addr1).buyProduct(productId, { value: BigInt(1) })).to.be.revertedWith(
        'Product is not available'
      )
    })

    it('Should not allow buy with insufficient value', async function () {
      const { productId } = await initializeData(10, 3)
      await expect(store.connect(addr1).buyProduct(productId, { value: BigInt(1) })).to.be.revertedWith(
        'Insufficient value'
      )
    })

    it('Should not allow buy with zero quantity', async function () {
      const { productId } = await initializeData(1, 1)
      await store.connect(addr1).buyProduct(productId, { value: BigInt(1) })
      await expect(store.connect(addr1).buyProduct(productId, { value: BigInt(1) })).to.be.revertedWith(
        'Product is out of stock'
      )
    })

    it('Should emit the correct event on purchase product', async function () {
      const { productId } = await initializeData()
      expect(await store.connect(addr1).buyProduct(productId, { value: BigInt(1) }))
        .to.emit(store, 'Purchased')
        .withArgs(addr1.getAddress(), productId, BigInt(1))
    })
  })

  describe('Contract Management', function () {
    it('Should allow the owner to transfer ownership', async function () {
      await store.connect(owner).transferOwnership(await addr2.getAddress())
      expect(await store.owner()).to.equal(await addr2.getAddress())
    })

    it('Should allow the owner to pause and unpause the contract', async function () {
      await store.connect(owner).pause()
      expect(await store.paused()).to.be.true

      await store.connect(owner).unpause()
      expect(await store.paused()).to.be.false
    })

    it('Should not allow non-owner to transfer ownership or pause', async function () {
      await expect(store.connect(addr1).transferOwnership(await addr2.getAddress())).to.be.revertedWithCustomError(
        store,
        'OwnableUnauthorizedAccount'
      )
      await expect(store.connect(addr1).pause()).to.be.revertedWithCustomError(store, 'OwnableUnauthorizedAccount')
    })

    it('Should emit the correct event on paused contract', async function () {
      await expect(await store.connect(owner).pause()).to.emit(store, 'Paused')
    })

    it('Should emit the correct event on unpaused contract', async function () {
      await store.connect(owner).pause()
      await expect(await store.connect(owner).unpause()).to.emit(store, 'Unpaused')
    })

    it('Should not allow buy product when paused', async function () {
      await store.connect(owner).pause()
      const { productId } = await initializeData(1, 1)

      await expect(store.connect(addr1).buyProduct(productId, { value: BigInt(1) })).to.be.revertedWithCustomError(
        store,
        'EnforcedPause'
      )
    })
  })

  describe('Withdrawal Management', function () {
    it('Should allow the owner to withdraw funds', async function () {
      const productPrice = 1
      const { productId } = await initializeData(10, productPrice)
      await store.connect(addr1).buyProduct(productId, { value: BigInt(productPrice) })
      const initialBalance = await ethers.provider.getBalance(owner.getAddress())

      const tx = await store.connect(owner).withdrawFunds(BigInt(productPrice))
      const txReceipt: any = await tx.wait()
      const gasUsed = txReceipt.gasUsed * tx.gasPrice

      const finalBalance = await ethers.provider.getBalance(owner.getAddress())
      expect(finalBalance).to.equal(initialBalance - gasUsed + BigInt(productPrice))
    })

    it('Should emit the correct event on withdrawal', async function () {
      const productPrice = 1
      const { productId } = await initializeData(10, productPrice)
      await store.connect(addr1).buyProduct(productId, { value: BigInt(productPrice) })
      await expect(store.connect(owner).withdrawFunds(BigInt(productPrice)))
        .to.emit(store, 'Withdrawal')
        .withArgs(BigInt(productPrice))
    })

    it('Should not allow non-owners to withdraw funds', async function () {
      const productPrice = 1
      const { productId } = await initializeData(10, productPrice)
      await store.connect(addr1).buyProduct(productId, { value: BigInt(productPrice) })
      await expect(store.connect(addr1).withdrawFunds(BigInt(productPrice))).to.be.revertedWithCustomError(
        store,
        'OwnableUnauthorizedAccount'
      )
    })

    it('Should not allow withdrawal of funds greater than contract balance', async function () {
      const highAmount = BigInt(1000)
      await expect(store.connect(owner).withdrawFunds(highAmount)).to.be.revertedWith('Not enough funds')
    })
  })
})
