export interface ForeignAddressType {
  name: string;
  symbol: string;
  address: string;
}

export interface Metadata {
  name: string;
  description: string;
  image: string | File | undefined;
  email?: string;
  foreignAddresses: {
    [key: string]: ForeignAddressType;
  };
}
