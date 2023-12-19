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
  const registrationFee = ethers.parseEther('0.1')

  beforeEach(async () => {
    PresaleFactory = await ethers.getContractFactory('Presale')
    ;[owner, addr1, addr2] = await ethers.getSigners()
    presale = (await PresaleFactory.deploy(startDate, endDate, maxRegistrations, registrationFee)) as Presale
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
      await presale.connect(addr1).register({ value: registrationFee })
      expect((await presale.connect(addr1).checkRegistration(await addr1.getAddress())).user).to.equal(
        await addr1.getAddress()
      )
    })

    it('Should correct struct and checking of registration on Presale', async function () {
      const userAddress = await addr1.getAddress()
      const tx = await presale.connect(addr1).register({ value: registrationFee })
      const timestamp: any = (await ethers.provider.getBlock(Number(tx.blockNumber)))?.timestamp
      expect(await presale.connect(addr1).checkRegistration(userAddress)).to.include.members([
        userAddress,
        BigInt(timestamp),
        true
      ])
    })

    it('Should emit the correct event after registration', async function () {
      const userAddress = await addr1.getAddress()
      const tx = await presale.connect(addr1).register({ value: registrationFee })
      const timestamp: any = (await ethers.provider.getBlock(Number(tx.blockNumber)))?.timestamp
      expect(tx).to.emit(presale, 'Registered').withArgs(userAddress, timestamp, registrationFee)
    })

    it('Should not allow register if presale is paused', async function () {
      await presale.connect(owner).pause()
      await expect(presale.connect(addr1).register({ value: registrationFee })).to.be.revertedWithCustomError(
        presale,
        'EnforcedPause'
      )
    })

    it('Should not allow register if the maximum number of registrations has been reached', async function () {
      const newMaxRegistrations = 1
      await presale.connect(owner).setSettings(startDate, endDate, newMaxRegistrations, registrationFee)
      await presale.connect(addr1).register({ value: registrationFee })
      await expect(presale.connect(addr2).register({ value: registrationFee }))
        .to.be.revertedWithCustomError(presale, 'RegistrationLimitExceeded')
        .withArgs(newMaxRegistrations, newMaxRegistrations)
    })

    it('Should not allow register if presale is not started', async function () {
      const newStartDate = Math.floor((new Date().getTime() + 3 * 60 * 60 * 1000) / 1000).toFixed(0)
      const newEndDate = Math.floor((new Date().getTime() + 15 * 24 * 60 * 60 * 1000) / 1000)
      await presale.connect(owner).setSettings(newStartDate, newEndDate, maxRegistrations, registrationFee)
      await expect(presale.connect(addr1).register({ value: registrationFee }))
        .to.be.revertedWithCustomError(presale, 'PresaleIsNotActive')
        .withArgs(newStartDate, newEndDate)
    })

    it('Should not allow register if user registered', async function () {
      const userAddress = await addr1.getAddress()
      const tx = await presale.connect(addr1).register({ value: registrationFee })
      const timestamp: any = (await ethers.provider.getBlock(Number(tx.blockNumber)))?.timestamp
      await expect(presale.connect(addr1).register({ value: registrationFee }))
        .to.be.revertedWithCustomError(presale, 'UserAlreadyRegistered')
        .withArgs(userAddress, timestamp)
    })

    it('Should buy product by ETH with correct balances', async function () {
      const userAddress = await addr1.getAddress()
      const initialUserBalance = await ethers.provider.getBalance(userAddress)
      const initialContractBalance = await ethers.provider.getBalance(presale.target)
      const tx = await presale.connect(addr1).register({ value: registrationFee })
      const txReceipt: any = await tx.wait()
      const gasUsed = txReceipt.gasUsed * tx.gasPrice
      const currentUserBalance = await ethers.provider.getBalance(userAddress)
      const currentContractBalance = await ethers.provider.getBalance(presale.target)
      expect(currentUserBalance).to.equal(initialUserBalance - registrationFee - gasUsed)
      expect(currentContractBalance).to.equal(initialContractBalance + registrationFee)
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

    it('Should emit the correct event after changing settings', async function () {
      const newStartDate = Math.floor((new Date().getTime() + 3 * 60 * 60 * 1000) / 1000).toFixed(0)
      const newEndDate = Math.floor((new Date().getTime() + 15 * 24 * 60 * 60 * 1000) / 1000)
      const newMaxRegistrations = 12
      const newRegistrationFee = ethers.parseEther('0.2')

      const oldSettings = await presale.getSettings()
      await expect(
        presale.connect(owner).setSettings(newStartDate, newEndDate, newMaxRegistrations, newRegistrationFee)
      )
        .to.emit(presale, 'ChangedSettings')
        .withArgs(
          oldSettings[0],
          newStartDate,
          oldSettings[1],
          newEndDate,
          oldSettings[2],
          newMaxRegistrations,
          oldSettings[3],
          newRegistrationFee
        )
    })

    it('Should allow change settings', async function () {
      const newStartDate = Math.floor((new Date().getTime() + 3 * 60 * 60 * 1000) / 1000).toFixed(0)
      const newEndDate = Math.floor((new Date().getTime() + 15 * 24 * 60 * 60 * 1000) / 1000)
      const newMaxRegistrations = 12
      const newRegistrationFee = ethers.parseEther('0.2')
      await presale.connect(owner).setSettings(newStartDate, newEndDate, newMaxRegistrations, newRegistrationFee)
      expect(await presale.getSettings()).to.include.members([
        BigInt(newStartDate),
        BigInt(newEndDate),
        BigInt(newMaxRegistrations)
      ])
    })

    it('Should not allow to change small count of max registrations', async function () {
      await presale.connect(owner).setSettings(startDate, endDate, 2, registrationFee)
      await presale.connect(addr1).register({ value: registrationFee })
      await presale.connect(addr2).register({ value: registrationFee })
      await expect(presale.connect(owner).setSettings(startDate, endDate, 1, registrationFee))
        .to.be.revertedWithCustomError(presale, 'InvalidMaxRegistrationsUpdate')
        .withArgs(BigInt(1), BigInt(2))
    })

    it('Should not allow change uncorrected dates settings', async function () {
      const newStartDate = Math.floor((new Date().getTime() + 3 * 60 * 60 * 1000) / 1000).toFixed(0)
      const newEndDate = Math.floor((new Date().getTime() + 2 * 60 * 60 * 1000) / 1000).toFixed(0)
      await expect(presale.connect(owner).setSettings(newStartDate, newEndDate, 1, registrationFee))
        .to.be.revertedWithCustomError(presale, 'PresaleIncorrectDates')
        .withArgs(BigInt(newStartDate), BigInt(newEndDate))
    })

    it('Should not allow change from not owner', async function () {
      await expect(
        presale.connect(addr1).setSettings(startDate, endDate, maxRegistrations, registrationFee)
      ).to.be.revertedWithCustomError(presale, 'OwnableUnauthorizedAccount')
    })

    it('Should allow the owner to withdraw funds in ETH', async function () {
      await presale.connect(addr1).register({ value: registrationFee })
      const initialBalance = await ethers.provider.getBalance(owner.getAddress())

      const tx = await presale.connect(owner).withdrawFunds(registrationFee)
      const txReceipt: any = await tx.wait()
      const gasUsed = txReceipt.gasUsed * tx.gasPrice

      const finalBalance = await ethers.provider.getBalance(owner.getAddress())
      expect(finalBalance).to.equal(initialBalance - gasUsed + registrationFee)
    })

    it('Should emit the correct event on withdrawal ETH', async function () {
      await presale.connect(addr1).register({ value: registrationFee })
      const tx = await presale.connect(owner).withdrawFunds(registrationFee)
      const timestamp = await ethers.provider.getBlock(Number(tx.blockNumber))
      expect(tx).to.emit(presale, 'Withdrawal').withArgs(registrationFee, timestamp)
    })

    it('Should not allow non-owners to withdraw funds', async function () {
      await presale.connect(addr1).register({ value: registrationFee })
      await expect(presale.connect(addr1).withdrawFunds(registrationFee)).to.be.revertedWithCustomError(
        presale,
        'OwnableUnauthorizedAccount'
      )
    })

    it('Should not allow withdrawal of funds greater than contract ETH balance', async function () {
      const highAmount = BigInt(1000)
      await expect(presale.connect(owner).withdrawFunds(highAmount)).to.be.revertedWithCustomError(
        presale,
        'NotEnoughFunds'
      )
    })
  })

  describe('Ownership', function () {
    it('Should set the correct owner on deploy', async function () {
      expect(await presale.owner()).to.equal(await owner.getAddress())
    })

    it('Should transfer ownership correctly', async function () {
      await presale.connect(owner).transferOwnership(addr1.getAddress())
      await presale.connect(addr1).acceptOwnership()
      expect(await presale.owner()).to.equal(await addr1.getAddress())
    })

    it('Should prevent non-owners from transferring ownership', async function () {
      await expect(presale.connect(addr1).transferOwnership(addr1.getAddress())).to.be.reverted
    })

    it('Should prevent ownership transfer without confirmation', async function () {
      await presale.connect(owner).transferOwnership(await addr1.getAddress())
      expect(await presale.owner()).to.equal(await owner.getAddress())
    })
  })
})
