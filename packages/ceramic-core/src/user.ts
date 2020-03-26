
class User {

  constructor (private didProvider: any) {}

  async auth (): Promise<void> {
  }

  async sign (payload: any, did: string): Promise<string> {
  }

  async encrypt (payload: any): Promise<any> {
  }

  async decrypt (ciphertext: any): Promise<any> {
  }
}

export default User
