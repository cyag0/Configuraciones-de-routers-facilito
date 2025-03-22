import { Address4 } from "ip-address";

export type Subnet = {
  network: string;
  mask: number;
  firstAddress: string;
  lastAddress: string;
};

export function calculateSubnets(
  network: string,
  originalMask: number,
  newMask: number
): Subnet[] {
  try {
    console.log("hello");

    const baseNetwork = new Address4(`${network}/${originalMask}`);
    const subnetSize = 2 ** (newMask - originalMask); // Number of subnets

    console.log("Base network:", baseNetwork.toString());
    console.log("Subnet size:", subnetSize);

    let subnetsList: Subnet[] = [];
    let currentAddress = baseNetwork.startAddress().bigInt();
    let step = BigInt(2 ** (32 - newMask));

    for (let i = 0; i < 256; i++) {
      let newSubnet = new Address4(
        Address4.fromBigInt(currentAddress).address + `/${newMask}`
      );
      subnetsList.push({
        network: newSubnet.addressMinusSuffix?.toString() || "",
        mask: newMask,
        firstAddress: newSubnet.startAddressExclusive().address,
        lastAddress: newSubnet.endAddress().address,
      });
      currentAddress += step;
    }

    //quita la primera y la ultima
    subnetsList.shift();
    subnetsList.pop();

    console.log("Subnets:", subnetsList);

    return subnetsList;
  } catch (error) {
    console.error("Error in subnet calculation:", error);
    return [];
  }
}
