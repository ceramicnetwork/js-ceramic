import EventSource from 'eventsource'

async function main() {
  const source = new EventSource('http://localhost:7007/api/v0/feed/aggregation/documents')
  source.addEventListener('message', (event) => {
    console.log('event', event)
  })
  console.log('listening...')
  source.addEventListener('error', error => {
    console.log('err', error)
  })
  await new Promise(resolve => setTimeout(resolve, 2000))
  console.log('stop')
}

main()
