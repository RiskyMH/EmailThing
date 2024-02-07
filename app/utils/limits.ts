
export enum PlanType {
    FREE = 'FREE',
    UNLIMITED = 'UNLIMITED',
}

export const storageLimit = {
    [PlanType.FREE]: 100_000_000,
    [PlanType.UNLIMITED]: Infinity,
}

export const customDomainLimit = {
    [PlanType.FREE]: 3,
    [PlanType.UNLIMITED]: Infinity,
}

export const aliasLimit = {
    [PlanType.FREE]: 5,
    [PlanType.UNLIMITED]: Infinity,
}