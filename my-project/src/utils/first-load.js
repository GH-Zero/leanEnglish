const visited = new Set()
export function isFirstLoad(key) {
  const first = !visited.has(key)
  visited.add(key)
  return first
}
