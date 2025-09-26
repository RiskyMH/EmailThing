import { verifyAuthenticationResponse, verifyRegistrationResponse } from "@simplewebauthn/server";

const HOST_SETTINGS = {
    expectedOrigin: [process.env.VERCEL_URL, "http://localhost:3000", "https://emailthing.app", "https://pwa.emailthing.app"].filter(Boolean) as string[],
    expectedRPID: [process.env.RPID, "localhost", "emailthing.app", "pwa.emailthing.app"].filter(Boolean) as string[],
};

export async function verifyCredentials(challenge: string, credential: Credential & any) {
    if (credential == null) {
        throw new Error("Invalid Credentials");
    }

    const verification = await verifyRegistrationResponse({
        response: credential,
        expectedChallenge: Buffer.from(challenge).toString("base64").replace("==", ""),
        requireUserVerification: true,
        ...HOST_SETTINGS,
    });

    if (!verification.verified) {
        throw new Error("Invalid Credentials - Registration verification failed.");
    }

    const { id: credentialID, publicKey: credentialPublicKey } = verification.registrationInfo?.credential ?? {};

    if (credentialID == null || credentialPublicKey == null) {
        throw new Error("Registration failed");
    }

    return {
        ...verification.registrationInfo,
        credentialID: credentialID,
        publicKey: Buffer.from(credentialPublicKey).toString("base64"),
    };
}

export async function verifyCredentialss(
    challenge: string,
    credential: Credential & any,
    existing: { id: string; publicKey: string },
) {
    if (credential == null) {
        throw new Error("Invalid Credentials");
    }

    const verification = await verifyAuthenticationResponse({
        response: credential,
        expectedChallenge: Buffer.from(challenge).toString("base64").replaceAll("=", ""),
        requireUserVerification: true,
        credential: {
            id: existing.id,
            counter: 0,
            publicKey: Buffer.from(existing.publicKey, "base64"),
        },
        ...HOST_SETTINGS,
    });

    if (!verification.verified) {
        throw new Error("Invalid Credentials - Registration verification failed.");
    }

    const { credentialID } = verification.authenticationInfo ?? {};

    if (credentialID == null) {
        throw new Error("Registration failed");
    }

    return {
        ...verification.authenticationInfo,
        credentialID: credentialID,
    };
}
