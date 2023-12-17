import { ethers } from 'hardhat'

async function main() {
  const [deployer] = await ethers.getSigners()

  console.log('Deploying contracts with the account: ', deployer.address)

  const startDate = Math.floor((new Date().getTime() - 2 * 60 * 60 * 1000) / 1000).toFixed(0)
  const endDate = Math.floor((new Date().getTime() + 5 * 24 * 60 * 60 * 1000) / 1000)
  const maxRegistrations = 13
  const Presale = await ethers.getContractFactory('Presale')
  const presale = await Presale.deploy(startDate, endDate, maxRegistrations)

  await presale.waitForDeployment()

  console.log('Deployed contract address: ', presale.target)
  console.log('VERSION: ', (await presale.VERSION()).toString())
}

main().catch((error) => {
  console.log(error)
  process.exit(1)
})
