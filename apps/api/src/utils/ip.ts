import { isIPv4, isIPv6 } from "node:net";

// gets girst bit of x-forwarded-for header (which is the original client ip)
// but then if its ipv6 we need to only store the /64 subnet as one to avoid easy abuse of new ip for each request
export function getSimplifiedIp(request: Request) {
    const ipHeader = request.headers.get("x-forwarded-for") || "unknown";
    const ip = ipHeader.split(",").map(e => e.trim()).filter(e => e.length)[0] || ipHeader;
    if (isIPv4(ip)) return ip;
    if (isIPv6(ip)) return expandAndGet64Subnet(ip);
    return ipHeader.trim();
}

export function expandAndGet64Subnet(ipv6: string) {
    let [left, right] = ipv6.split('::');
    let leftGroups = left ? left.split(':') : [];
    let rightGroups = right ? right.split(':') : [];

    // Calculate how many missing "0000" groups are replaced by "::"
    const missingCount = 8 - (leftGroups.length + rightGroups.length);
    const middleGroups = new Array(missingCount).fill('0000');

    const fullAddress = [...leftGroups, ...middleGroups, ...rightGroups];

    // Pad individual groups with leading zeros (e.g., "db8" -> "0db8")
    const paddedGroups = fullAddress.map(group => group.padStart(4, '0'));

    // Return the first four groups for the /64 subnet
    return paddedGroups.slice(0, 4).join(':') + '::/64';
}