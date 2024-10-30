import { keccak256, toUtf8Bytes } from "ethers/lib/utils";

export function removeIpfsPrefix(url: string): string {
  const ipfsPrefix = "ipfs://";
  if (url.startsWith(ipfsPrefix)) {
    url = url.slice(ipfsPrefix.length);
  }

  return url;
}

export const hashString = (str: string) => {
  return BigInt(keccak256(toUtf8Bytes(str)));
};
