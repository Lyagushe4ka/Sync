const Web3 = require('web3');
const fs = require('fs');

const web3 = new Web3(new Web3.providers.HttpProvider("https://mainnet.era.zksync.io"));

const routerAddress = "0x2da10A1e27bF85cEdD8FFb1AbBe97e53391C0295";
const abiFile = fs.readFileSync("RouterAbi.json");
const abi = JSON.parse(abiFile.toString());
const router = new web3.eth.Contract(abi, routerAddress);

const poolFactoryAddress = "0xf2DAd89f2788a8CD54625C60b55cD3d2D0ACa7Cb";
const poolFactoryAbiFile = fs.readFileSync("PoolFactoryAbi.json");
const poolFactoryAbi = JSON.parse(poolFactoryAbiFile.toString());
const poolFactory = new web3.eth.Contract(poolFactoryAbi, poolFactoryAddress);

const key = '0x' + fs.readFileSync("privateKey.txt").toString();
const account = web3.eth.accounts.privateKeyToAccount(key);
web3.eth.accounts.wallet.add(account);
web3.eth.defaultAccount = account.address;

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'
const tokenA = '0x5aea5775959fbc2557cc8789bc1bf90a239d9a91'; // WETH
const tokenB = '0x3355df6d4c9c3035724fd0e3914de96a5a83aaf4'; // USDC
const value = web3.utils.toWei('0.0001', 'ether');

const start = async () => {
    // get pool address
    // params:
    // tokenA: address of token A
    // tokenB: address of token B
    const poolAddress = await poolFactory.methods.getPool(tokenA, tokenB).call();
    console.log(poolAddress);


    // params:
    // tokenIn: address of token to swap from
    // To: address to send swapped tokens to
    // WithdrawMode: 0 - vault internal transfer, 1 - withdraw and unwrap to naitve ETH, 2 - withdraw and wrap to wETH
    const swapData = web3.eth.abi.encodeParameters(
        ['address', 'address', 'uint8'],
        [tokenA, account.address, 1],
    );

    const steps = [{
        pool: poolAddress, // address of needed pool
        data: swapData, // encoded swap data
        callback: ZERO_ADDRESS, // dunno when it's needed
        callbackData: '0x',
    }];

    // If we want to use the native ETH as the input token,
    // the `tokenIn` on path should be replaced with the zero address.
    const paths = [{
        steps: steps,
        tokenIn: ZERO_ADDRESS, 
        amountIn: value, // amount of tokens to swap
    }];

    // params:
    // paths: array of paths
    // minAmountOut: minimum amount of tokens to receive aka slippage
    // deadline: deadline of trade in unix timestamp
    const tx = await router.methods.swap(
        paths,
        0, // min amount out / slippage
        Date.now() + 1000 * 60, // deadline
    ).send({
        from: account.address,
        value: value,
        gas: 2000000,
        gasPrice: web3.utils.toWei('4', 'gwei'),
    });
    console.log(tx.transactionHash);
}

start();