import { createPublicClient, http } from "viem";
import { bsc } from "viem/chains";
import { BSC_RPC_URL, SELF_NFT_ADDRESS } from "@/lib/constants";
import { selfNftAbi } from "@/lib/abi/self-nft-abi";
import { hashString } from "@/lib/helpers";
import { NextResponse } from "next/server";
import { extractParams, fetchMetadata } from "../lib/utils";
import { isAuthorized } from "../lib/utils";

const chains = {
  1: "eth",
  56: "bsc",
  137: "polygon",
  43114: "avax",
  42161: "arb",
};

export const runtime = "edge";

export async function OPTIONS(req: Request) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function GET(req: Request): Promise<NextResponse> {
  const apiKey = req.headers.get("authorization");
  if (!isAuthorized(apiKey)) {
    return NextResponse.json({ error: "Unauthorized" }, {
      status: 401,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  const { name, chainId } = extractParams(new URL(req.url), [
    "name",
    "chainId",
  ]);
  const parsedChainId = parseInt(chainId || "") as keyof typeof chains;

  if (!name || isNaN(parsedChainId)) {
    return NextResponse.json({ error: "Name and valid chainId required" }, {
      status: 400,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  try {
    const client = createPublicClient({
      chain: bsc,
      transport: http(BSC_RPC_URL),
    });

    const resolvedAddress = await client.readContract({
      address: SELF_NFT_ADDRESS,
      abi: selfNftAbi,
      functionName: "ownerOf",
      args: [hashString(name)],
    });

    const tokenUri = await client.readContract({
      address: SELF_NFT_ADDRESS,
      abi: selfNftAbi,
      functionName: "tokenURI",
      args: [hashString(name)],
    });

    const metadata = await fetchMetadata(tokenUri);
    console.log(metadata);

    try {
      const metadataAddress =
        metadata.foreignAddresses[chains[parsedChainId]].address;
      return NextResponse.json({ address: metadataAddress }, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    } catch (error) {
      return NextResponse.json({ address: resolvedAddress }, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }
  } catch (error) {
    console.error("Error resolving name:", error);
    return NextResponse.json({ error: "Internal Server Error" }, {
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }
}
