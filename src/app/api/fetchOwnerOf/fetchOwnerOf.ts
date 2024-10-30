// app/api/fetchOwnerOf/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { PinataSDK } from 'pinata-web3';
import { hashString, removeIpfsPrefix } from '@/utils/helpers';
import { selfAddress } from '@/config/addresses';
import { selfAbi } from '@/abi/selfAbi';

const pinata = new PinataSDK({
  pinataJwt: process.env.PINATA_JWT!,
  pinataGateway: process.env.PINATA_GATEWAY!,
  pinataGatewayKey: process.env.PINATA_GATEWAY_KEY!,
});

// Ensure to replace this URL with the appropriate one for your targeted chain
const provider = new ethers.JsonRpcProvider(process.env.BSC_RPC_URL!); // Using ethers.js provider

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const recipientName = searchParams.get('recipientName');

    if (!recipientName || recipientName.length === 0) {
      return NextResponse.json({ error: "Recipient name is required" }, { status: 400 });
    }

    const contract = new ethers.Contract(selfAddress, selfAbi, provider);

    // Get the token URI by calling the `tokenURI` function on the contract
    const tokenUri: string = await contract.tokenURI(hashString(recipientName));

    let metadata = null;
    try {
      if (tokenUri) {
        const file = await pinata.gateways.get(removeIpfsPrefix(tokenUri));
        metadata = file.data;
      }
    } catch (error) {
      console.error("Error fetching metadata from Pinata:", error);
      return NextResponse.json({ error: "Error fetching metadata" }, { status: 500 });
    }

    let ownerOf = null;
    if (metadata && "bsc" in metadata.foreignAddresses) {
      ownerOf = metadata.foreignAddresses.bsc.address;
    } else {
      // If no metadata found, call the `ownerOf` function on the contract
      ownerOf = await contract.ownerOf(hashString(recipientName));
    }

    return NextResponse.json({ ownerOf });
  } catch (error) {
    console.error("Error fetching ownerOf:", error);
    return NextResponse.json({ error: "Error fetching owner information" }, { status: 500 });
  }
}
