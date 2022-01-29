export async function genesis(context, commit) {
  const contentCid = commit.data
  const data = await context.ipfs.dag.get(contentCid).then((r) => r.value)
  const containsHello = 'hello' in data
  if (!containsHello) throw new Error(`No hello field`)
  const worldNumber = parseInt(data.hello.replace(`world-`, ''), 10)
  if (worldNumber !== 0) throw new Error(`Must be zero`)
  // No validation
  return data
}

export async function apply(context, state, commit) {
  const prev = parseInt(state.content.hello.replace('world-', ''), 10)

  // console.log('streamcode:state', state)
  // console.log('streamcode:commit', commit)

  const contentCid = commit.data
  const data = await context.ipfs.dag.get(contentCid).then((r) => r.value)
  const next = parseInt(data.hello.replace('world-', ''), 10)
  if (next !== prev + 1) throw new Error(`Must increase by 1`)
  // No validation
  return data
}
