import { ethers } from 'hardhat'

async function main() {
  const [deployer] = await ethers.getSigners()

  console.log('Deploying contracts with the account: ', deployer.address)

  const Store = await ethers.getContractFactory('Store')
  const store = await Store.deploy()

  await store.waitForDeployment()

  console.log('Deployed contract address: ', store.target)
  console.log('VERSION: ', (await store.VERSION()).toString())
}

main().catch((error) => {
  console.log(error)
  process.exit(1)
})
