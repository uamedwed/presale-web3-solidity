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
  let ownerAddress: string
  let addr1Address: string
  let addr2Address: string
  const version: number = 1
  const startDate = Math.floor((new Date().getTime() - 2 * 60 * 60 * 1000) / 1000).toFixed(0)
  const endDate = Math.floor((new Date().getTime() + 5 * 24 * 60 * 60 * 1000) / 1000)
  const maxRegistrations = 13
  const registrationFee = ethers.parseEther('0.1')
  const whitelistStatusInit = false

  beforeEach(async () => {
    PresaleFactory = await ethers.getContractFactory('Presale')
    ;[owner, addr1, addr2] = await ethers.getSigners()
    ownerAddress = await owner.getAddress()
    addr1Address = await addr1.getAddress()
    addr2Address = await addr2.getAddress()
    presale = (await PresaleFactory.deploy(
      startDate,
      endDate,
      maxRegistrations,
      registrationFee,
      whitelistStatusInit
    )) as Presale
  })

  describe('Deployment', function () {
    it(`Should set the correct version: ( ${version} )`, async function () {
      expect(await presale.VERSION()).to.equal(version)
    })

    it('Should set the correct owner', async function () {
      expect(await presale.owner()).to.equal(ownerAddress)
    })
  })

  describe('Registration users', function () {
    it('Should register user on Presale', async function () {
      await presale.connect(addr1).register({ value: registrationFee })
      expect((await presale.connect(addr1).checkRegistration(addr1Address)).user).to.equal(addr1Address)
    })

    it('Should correct struct and checking of registration on Presale', async function () {
      const tx = await presale.connect(addr1).register({ value: registrationFee })
      const timestamp: any = (await ethers.provider.getBlock(Number(tx.blockNumber)))?.timestamp
      expect(await presale.connect(addr1).checkRegistration(addr1Address)).to.include.members([
        addr1Address,
        BigInt(timestamp),
        true
      ])
    })

    it('Should emit the correct event after registration', async function () {
      const tx = await presale.connect(addr1).register({ value: registrationFee })
      const timestamp: any = (await ethers.provider.getBlock(Number(tx.blockNumber)))?.timestamp
      expect(tx).to.emit(presale, 'Registered').withArgs(addr1Address, timestamp, registrationFee)
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
      const tx = await presale.connect(addr1).register({ value: registrationFee })
      const timestamp: any = (await ethers.provider.getBlock(Number(tx.blockNumber)))?.timestamp
      await expect(presale.connect(addr1).register({ value: registrationFee }))
        .to.be.revertedWithCustomError(presale, 'UserAlreadyRegistered')
        .withArgs(addr1Address, timestamp)
    })

    it('Should buy product by ETH with correct balances', async function () {
      const initialUserBalance = await ethers.provider.getBalance(addr1Address)
      const initialContractBalance = await ethers.provider.getBalance(presale.target)
      const tx = await presale.connect(addr1).register({ value: registrationFee })
      const txReceipt: any = await tx.wait()
      const gasUsed = txReceipt.gasUsed * tx.gasPrice
      const currentUserBalance = await ethers.provider.getBalance(addr1Address)
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
  })

  describe('Withdraw funds', function () {
    it('Should allow the owner to withdraw funds in ETH', async function () {
      await presale.connect(addr1).register({ value: registrationFee })
      const initialBalance = await ethers.provider.getBalance(ownerAddress)

      const tx = await presale.connect(owner).withdrawFunds(registrationFee)
      const txReceipt: any = await tx.wait()
      const gasUsed = txReceipt.gasUsed * tx.gasPrice

      const finalBalance = await ethers.provider.getBalance(ownerAddress)
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
      expect(await presale.owner()).to.equal(ownerAddress)
    })

    it('Should transfer ownership correctly', async function () {
      await presale.connect(owner).transferOwnership(addr1Address)
      await presale.connect(addr1).acceptOwnership()
      expect(await presale.owner()).to.equal(addr1Address)
    })

    it('Should prevent non-owners from transferring ownership', async function () {
      await expect(presale.connect(addr1).transferOwnership(addr1Address)).to.be.reverted
    })

    it('Should prevent ownership transfer without confirmation', async function () {
      await presale.connect(owner).transferOwnership(addr1Address)
      expect(await presale.owner()).to.equal(ownerAddress)
    })
  })

  describe('Whitelist', function () {
    it('Should correct return status of whitelist', async function () {
      expect(await presale.whitelistStatus()).to.equal(whitelistStatusInit)
    })

    describe('Management settings of Whitelist', function () {
      it('Should allow owner to turn on whitelist', async function () {
        await presale.connect(owner).turnOnWhitelist()
        expect(await presale.whitelistStatus()).to.be.true
      })

      it('Should emit the correct event after owner to turn on whitelist', async function () {
        expect(await presale.connect(owner).turnOnWhitelist()).to.emit(presale, 'WhitelistTurnedOn')
      })

      it('Should emit the correct event after owner to turn off whitelist', async function () {
        await presale.connect(owner).turnOnWhitelist()
        expect(await presale.connect(owner).turnOffWhitelist()).to.emit(presale, 'WhitelistTurnedOff')
      })

      it('Should not allow non-owners turn on whitelist', async function () {
        await expect(presale.connect(addr1).turnOnWhitelist()).to.be.revertedWithCustomError(
          presale,
          'OwnableUnauthorizedAccount'
        )
      })

      it('Should not allow to turn on if whitelist is not turn off', async function () {
        await presale.connect(owner).turnOnWhitelist()
        await expect(presale.connect(owner).turnOnWhitelist()).to.be.revertedWithCustomError(
          presale,
          'EnforcedWhitelist'
        )
      })

      it('Should allow owner to turn off whitelist', async function () {
        await presale.connect(owner).turnOnWhitelist()
        await presale.connect(owner).turnOffWhitelist()
        expect(await presale.whitelistStatus()).to.be.false
      })

      it('Should not allow non-owners turn off whitelist', async function () {
        await expect(presale.connect(addr1).turnOffWhitelist()).to.be.revertedWithCustomError(
          presale,
          'OwnableUnauthorizedAccount'
        )
      })

      it('Should not allow to turn off if whitelist is not turn on', async function () {
        await expect(presale.connect(owner).turnOffWhitelist()).to.be.revertedWithCustomError(
          presale,
          'ExpectedWhitelist'
        )
      })
    })

    describe('Management whitelist', function () {
      it('Should allow owner to add address to whitelist', async function () {
        await presale.connect(owner).addToWhiteList(addr1Address)
        expect(await presale.isAddressWhitelisted(addr1Address)).to.be.true
      })

      it('Should emit the correct event after add address to whitelist', async function () {
        expect(await presale.connect(owner).addToWhiteList(addr1Address))
          .to.emit(presale, 'AddedToWhitelist')
          .withArgs(addr1Address)
      })

      it('Should not allow non-owners to add address to whitelist', async function () {
        await expect(presale.connect(addr1).addToWhiteList(addr1Address)).to.be.revertedWithCustomError(
          presale,
          'OwnableUnauthorizedAccount'
        )
      })

      it('Should allow owner to add array of addresses to whitelist', async function () {
        await presale.connect(owner).addBatchToWhitelist([addr1Address, addr2Address])
        expect(await presale.isAddressWhitelisted(addr1Address)).to.be.true
        expect(await presale.isAddressWhitelisted(addr2Address)).to.be.true
      })

      it('Should emit the correct event after add array of addresses to whitelist', async function () {
        expect(await presale.connect(owner).addBatchToWhitelist([addr1Address, addr2Address]))
          .to.emit(presale, 'AddedToWhitelist')
          .withArgs(addr1Address)
          .and.to.emit(presale, 'AddedToWhitelist')
          .withArgs(addr2Address)
      })

      it('Should not allow non-owners to add array of addresses to whitelist', async function () {
        await expect(
          presale.connect(addr1).addBatchToWhitelist([addr1Address, addr2Address])
        ).to.be.revertedWithCustomError(presale, 'OwnableUnauthorizedAccount')
      })

      it('Should allow owner to remove address from whitelist', async function () {
        await presale.connect(owner).addToWhiteList(addr1Address)
        await presale.connect(owner).removeFromWhitelist(addr1Address)
        expect(await presale.isAddressWhitelisted(addr1Address)).to.be.false
      })

      it('Should emit the correct event after remove address from whitelist', async function () {
        await presale.connect(owner).addToWhiteList(addr1Address)
        expect(await presale.connect(owner).removeFromWhitelist(addr1Address))
          .to.emit(presale, 'RemovedFromWhitelist')
          .withArgs(addr1Address)
      })

      it('Should not allow non-owners to remove address from whitelist', async function () {
        await expect(presale.connect(addr1).removeFromWhitelist(addr1Address)).to.be.revertedWithCustomError(
          presale,
          'OwnableUnauthorizedAccount'
        )
      })

      it('Should allow owner to remove array of addresses from whitelist', async function () {
        await presale.connect(owner).addBatchToWhitelist([addr1Address, addr2Address])
        await presale.connect(owner).removeBatchFromWhiteList([addr1Address, addr2Address])
        expect(await presale.isAddressWhitelisted(addr1Address)).to.be.false
        expect(await presale.isAddressWhitelisted(addr2Address)).to.be.false
      })

      it('Should emit the correct event after remove array of addresses from whitelist', async function () {
        expect(await presale.connect(owner).removeBatchFromWhiteList([addr1Address, addr2Address]))
          .to.emit(presale, 'RemovedFromWhitelist')
          .withArgs(addr1Address)
          .and.to.emit(presale, 'RemovedFromWhitelist')
          .withArgs(addr2Address)
      })

      it('Should not allow non-owners to remove array of addresses from whitelist', async function () {
        await expect(
          presale.connect(addr1).removeBatchFromWhiteList([addr1Address, addr2Address])
        ).to.be.revertedWithCustomError(presale, 'OwnableUnauthorizedAccount')
      })

      it('Should not allow to add address to whitelist if address is exists', async function () {
        await presale.connect(owner).addToWhiteList(addr1Address)
        await expect(presale.connect(owner).addToWhiteList(addr1Address)).to.be.revertedWithCustomError(
          presale,
          'UserAlreadyWhitelisted'
        )
      })

      it('Should not allow to remove address from whitelist if address is not exists', async function () {
        await expect(presale.connect(owner).removeFromWhitelist(addr1Address)).to.be.revertedWithCustomError(
          presale,
          'UserIsNotWhitelisted'
        )
      })

      it('Should allow check address in whitelist', async function () {
        await presale.connect(owner).addToWhiteList(addr2Address)
        expect(await presale.isAddressWhitelisted(addr1Address)).to.be.false
        expect(await presale.isAddressWhitelisted(addr2Address)).to.be.true
      })
    })

    describe('Whitelist in Presale', function () {
      it('Should not allow register user on Presale if whitelist is on', async function () {
        await presale.connect(owner).turnOnWhitelist()
        await expect(presale.connect(addr1).register({ value: registrationFee }))
          .to.be.revertedWithCustomError(presale, 'UserIsNotWhitelisted')
          .withArgs(addr1Address)
      })

      it('Should allow register user on Presale if whitelist is on and user in whitelist', async function () {
        await presale.connect(owner).turnOnWhitelist()
        await presale.connect(owner).addToWhiteList(addr1Address)
        await presale.connect(addr1).register({ value: registrationFee })
        expect((await presale.connect(addr1).checkRegistration(addr1Address)).user).to.equal(addr1Address)
      })
    })
  })
})
