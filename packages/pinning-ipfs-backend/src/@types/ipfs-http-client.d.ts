declare module 'ipfs-http-client' {
  import Ipfs from 'ipfs'

  export default function ipfsClient(config: any): Ipfs.Ipfs;
}
