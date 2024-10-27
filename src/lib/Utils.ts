export function matchesSearch(value: string, search: string) {
  return value.toLowerCase().includes(search.toLowerCase());
}
