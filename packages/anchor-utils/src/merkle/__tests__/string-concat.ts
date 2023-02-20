import { MergeFunction, Node } from '../merkle-elements.js'

export class StringConcat implements MergeFunction<string, string> {
  async merge(n1: Node<string>, n2: Node<string>, m: string | null): Promise<Node<string>> {
    if (m) {
      return new Node(`Hash(${n1} + ${n2} + Metadata(${m}))`, n1, n2)
    } else {
      return new Node(`Hash(${n1} + ${n2})`, n1, n2)
    }
  }
}
