import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { clusterApiUrl, Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { createTransferCheckedInstruction, getAssociatedTokenAddress, getMint } from "@solana/spl-token";
import BigNumber from "bignumber.js";
import products from "./products.json";

const usdcAddress = new PublicKey("6XrFntaeYLg4mCdpRtQRmJq9uaqNLmQGeYq2MWvNZkJR");
const sellerAddress = '3BsUJmhfjNReQusd1NEV2dQxUyHeAVbHWB878BPS23aZ';
const sellerPublicKey = new PublicKey(sellerAddress);

const createTransaction = async (req, res) => {
    try {
        // Extract the transaction data from the request body
        const { buyer, orderID, itemID } = req.body;

        // If we don't have something we need, stop!
        if (!buyer) {
            return res.status(400).json({
                message: "Missing buyer address",
            });
        }

        if (!orderID) {
            return res.status(400).json({
                message: "Missing Order ID",
            })
        }

        // Fetch item price from products.json using itemID.
        const itemPrice = products.find((item) => item.id === itemID).price;

        if (!itemPrice) {
            return res.status(404).json({
                message: "Item not found. Please check item ID",
            });
        }

        // Convert our price to the correct format
        const bigAmount = BigNumber(itemPrice);
        const buyerPublicKey = new PublicKey(buyer);
        const network = WalletAdapterNetwork.Devnet;
        const endpoint = clusterApiUrl(network);
        const connection = new Connection(endpoint);

        // A blockhash is sort of like an ID for a block. It lets you identify each block.
        const buyerUsdcAddress = await getAssociatedTokenAddress(usdcAddress, buyerPublicKey);
        const shopUsdcAddress = await getAssociatedTokenAddress(usdcAddress, sellerPublicKey)
        const { blockhash } = await connection.getLatestBlockhash("finalized");

        const usdcMint = await getMint(connection, usdcAddress);
        // The first two things we need - a recent block ID and the public key of the fee payer.
        const tx = new Transaction({
            recentBlockhash: blockhash,
            feePayer: buyerPublicKey,
        });

        // This is the "action" that the transaction will take
        // We're creating a different type of transfer instruction
        const transferInstruction = createTransferCheckedInstruction(
            buyerUsdcAddress,
            usdcAddress,   // This is the address of the token we want to transfer
            shopUsdcAddress,
            buyerPublicKey,
            bigAmount.toNumber() * 10 ** (await usdcMint).decimals,
            usdcMint.decimals   // The token could have any number of decimals
        );
        
        // We're adding more instructions to the transaction
        transferInstruction.keys.push({
            // We'll use our OrderID to find this transaction later
            pubkey: new PublicKey(orderID),
            isSigner: false,
            isWritable: false
        });

        tx.add(transferInstruction);

        // Formatting our transaction
        const serializedTransaction = tx.serialize({
            requireAllSignatures: false,
        });
        const base64 = serializedTransaction.toString("base64");
        
        res.status(200).json({
            transaction: base64,
        })
    } catch (error) {
        console.error(error);

        res.status(500).json({ error: "error creating tx" });
        return;
    }
}

export default function handler(req, res) {
    if (req.method === "POST") {
        createTransaction(req, res);
    } else {
        res.status(405).end();
    }
}
