export enum PlanType {
    FREE = "FREE",
    UNLIMITED = "UNLIMITED",
}

export const storageLimit = {
    [PlanType.FREE]: 100_000_000,
    [PlanType.UNLIMITED]: Number.POSITIVE_INFINITY,
};

export const customDomainLimit = {
    [PlanType.FREE]: 3,
    [PlanType.UNLIMITED]: Number.POSITIVE_INFINITY,
};

export const tempEmailsLimit = {
    [PlanType.FREE]: 10,
    [PlanType.UNLIMITED]: Number.POSITIVE_INFINITY,
};

export const aliasLimit = {
    [PlanType.FREE]: 5,
    [PlanType.UNLIMITED]: Number.POSITIVE_INFINITY,
};

export const mailboxUsersLimit = {
    [PlanType.FREE]: 3,
    [PlanType.UNLIMITED]: Number.POSITIVE_INFINITY,
};
