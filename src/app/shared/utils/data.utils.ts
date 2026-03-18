export function nbFiltersApplied(filterFormValue: any): number {
  return Object.entries(filterFormValue)
    .map(([_, value]) => value)
    .filter(value => value !== undefined && value !== null).length;
}
