export const enum PlanType {
    DEMO = "DEMO",
    FREE = "FREE",
    UNLIMITED = "UNLIMITED",
}

export const storageLimit = {
    [PlanType.DEMO]: 0,
    [PlanType.FREE]: 100_000_000,
    [PlanType.UNLIMITED]: Number.POSITIVE_INFINITY,
};

export const customDomainLimit = {
    [PlanType.DEMO]: 0,
    [PlanType.FREE]: 3,
    [PlanType.UNLIMITED]: Number.POSITIVE_INFINITY,
};

export const tempEmailsLimit = {
    [PlanType.DEMO]: 0,
    [PlanType.FREE]: 10,
    [PlanType.UNLIMITED]: Number.POSITIVE_INFINITY,
};

export const aliasLimit = {
    [PlanType.DEMO]: 0,
    [PlanType.FREE]: 5,
    [PlanType.UNLIMITED]: Number.POSITIVE_INFINITY,
};

export const mailboxUsersLimit = {
    [PlanType.DEMO]: 0,
    [PlanType.FREE]: 3,
    [PlanType.UNLIMITED]: Number.POSITIVE_INFINITY,
};
