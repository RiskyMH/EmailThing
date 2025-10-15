export function todayDate(): `${number}-${number}-${number}` {
    return new Date().toISOString().slice(0, 10) as any;
}
