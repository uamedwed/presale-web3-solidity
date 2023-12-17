import { expect } from 'chai'
import { ethers } from 'hardhat'
import { ContractFactory, Signer } from 'ethers'
import { Presale } from '../typechain-types'

describe('Presale', function () {
  let PresaleFactory: ContractFactory
  let presale: Presale
  let owner: Signer
  let addr1: Signer
  let addr2: Signer
  const version: number = 1
  const startDate = Math.floor((new Date().getTime() - 2 * 60 * 60 * 1000) / 1000).toFixed(0)
  const endDate = Math.floor((new Date().getTime() + 5 * 24 * 60 * 60 * 1000) / 1000)
  const maxRegistrations = 13

  beforeEach(async () => {
    PresaleFactory = await ethers.getContractFactory('Presale')
    ;[owner, addr1, addr2] = await ethers.getSigners()
    presale = (await PresaleFactory.deploy(startDate, endDate, maxRegistrations)) as Presale
  })

  describe('Deployment', function () {
    it(`Should set the correct version: ( ${version} )`, async function () {
      expect(await presale.VERSION()).to.equal(version)
    })

    it('Should set the correct owner', async function () {
      expect(await presale.owner()).to.equal(await owner.getAddress())
    })
  })

  describe('Registration users', function () {
    it('Should register user on Presale', async function () {
      await presale.connect(addr1).register()
      expect((await presale.connect(addr1).checkRegistration(await addr1.getAddress())).user).to.equal(
        await addr1.getAddress()
      )
    })

    it('Should correct struct and checking of registration on Presale', async function () {
      const userAddress = await addr1.getAddress()
      const tx = await presale.connect(addr1).register()
      const timestamp: any = (await ethers.provider.getBlock(Number(tx.blockNumber)))?.timestamp
      expect(await presale.connect(addr1).checkRegistration(userAddress)).to.include.members([
        userAddress,
        BigInt(timestamp),
        true
      ])
    })

    it('Should emit the correct event after registration', async function () {
      const userAddress = await addr1.getAddress()
      const tx = await presale.connect(addr1).register()
      const timestamp: any = (await ethers.provider.getBlock(Number(tx.blockNumber)))?.timestamp
      expect(tx).to.emit(presale, 'Registered').withArgs(userAddress, timestamp)
    })

    it('Should not allow register if presale is paused', async function () {
      await presale.connect(owner).pause()
      await expect(presale.connect(addr1).register()).to.be.revertedWithCustomError(presale, 'EnforcedPause')
    })

    it('Should not allow register if the maximum number of registrations has been reached', async function () {
      const newMaxRegistrations = 1
      await presale.connect(owner).setSettings(startDate, endDate, newMaxRegistrations)
      await presale.connect(addr1).register()
      await expect(presale.connect(addr2).register())
        .to.be.revertedWithCustomError(presale, 'CountOfRegistrationsExceeded')
        .withArgs(newMaxRegistrations, newMaxRegistrations)
    })

    it('Should not allow register if presale is not started', async function () {
      const newStartDate = Math.floor((new Date().getTime() + 3 * 60 * 60 * 1000) / 1000).toFixed(0)
      const newEndDate = Math.floor((new Date().getTime() + 15 * 24 * 60 * 60 * 1000) / 1000)
      await presale.connect(owner).setSettings(newStartDate, newEndDate, maxRegistrations)
      await expect(presale.connect(addr1).register())
        .to.be.revertedWithCustomError(presale, 'PresaleIsNotActive')
        .withArgs(newStartDate, newEndDate)
    })

    it('Should not allow register if user registered', async function () {
      const userAddress = await addr1.getAddress()
      const tx = await presale.connect(addr1).register()
      const timestamp: any = (await ethers.provider.getBlock(Number(tx.blockNumber)))?.timestamp
      await expect(presale.connect(addr1).register())
        .to.be.revertedWithCustomError(presale, 'AlreadyRegistered')
        .withArgs(userAddress, timestamp)
    })
  })

  describe('Management contract', function () {
    it('Should allow the owner to pause and unpause the contract', async function () {
      await presale.connect(owner).pause()
      expect(await presale.paused()).to.be.true

      await presale.connect(owner).unpause()
      expect(await presale.paused()).to.be.false
    })

    it('Should allow get settings', async function () {
      expect(await presale.getSettings()).to.include.members([
        BigInt(startDate),
        BigInt(endDate),
        BigInt(maxRegistrations)
      ])
    })

    it('Should allow change settings', async function () {
      const newStartDate = Math.floor((new Date().getTime() + 3 * 60 * 60 * 1000) / 1000).toFixed(0)
      const newEndDate = Math.floor((new Date().getTime() + 15 * 24 * 60 * 60 * 1000) / 1000)
      const newMaxRegistrations = 12
      await presale.connect(owner).setSettings(newStartDate, newEndDate, newMaxRegistrations)
      expect(await presale.getSettings()).to.include.members([
        BigInt(newStartDate),
        BigInt(newEndDate),
        BigInt(newMaxRegistrations)
      ])
    })

    it('Should not change small count of max registrations', async function () {
      await presale.connect(owner).setSettings(startDate, endDate, 2)
      await presale.connect(addr1).register()
      await presale.connect(addr2).register()
      await expect(presale.connect(owner).setSettings(startDate, endDate, 1))
        .to.be.revertedWithCustomError(presale, 'ReducedCountOfRegistrations')
        .withArgs(BigInt(1), BigInt(2))
    })

    it('Should not allow change uncorrected dates settings', async function () {
      const newStartDate = Math.floor((new Date().getTime() + 3 * 60 * 60 * 1000) / 1000).toFixed(0)
      const newEndDate = Math.floor((new Date().getTime() + 2 * 60 * 60 * 1000) / 1000).toFixed(0)
      await expect(presale.connect(owner).setSettings(newStartDate, newEndDate, 1))
        .to.be.revertedWithCustomError(presale, 'IncorrectDates')
        .withArgs(BigInt(newStartDate), BigInt(newEndDate))
    })

    it('Should not allow change from not owner', async function () {
      await expect(
        presale.connect(addr1).setSettings(startDate, endDate, maxRegistrations)
      ).to.be.revertedWithCustomError(presale, 'OwnableUnauthorizedAccount')
    })
  })
})
