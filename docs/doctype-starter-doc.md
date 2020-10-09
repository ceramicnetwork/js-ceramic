# Ceramic Doctypes

In order to implement a new Ceramic Doctype there are a couple of interfaces which should be followed:

- **Doctype**
	- This interface is used to implement an actual document.
- **DoctypeHandler**
	- This interface is used to implement the state transition handler for the document which will be executed by the Ceramic node.

There are other constructs which need to be used in order to create a `Doctype`:
- **DoctypeStatic**
	- Decorator for the Doctype implementation
- **DoctypeConstructor**
	- Describes the Doctype constructor which needs to be implemented.

One interface worth noting is the `CeramicAPI` interface which lets the developer communicate with the Ceramic node in two ways:
- **directly**: the node is the process running on the same machine
- **indirectly**: the node is running somewhere else and the communication is done over the HTTP protocol.
	
# Doctype
The interface is listed in the code snipped below.

```
/**  
 * Describes common doctype attributes 
 */
 abstract class Doctype extends EventEmitter {  
    constructor(private _state: DocState, private _context: Context) {  
        super()  
    }  
  
    get id(): string {  
        return DoctypeUtils.createDocId(this.state.log[0])  
    }  
  
    get doctype(): string {  
        return this._state.doctype  
    }  
  
    get content(): any {  
        return cloneDeep(this.state.content)  
    }  
  
    get owners(): Array<string> {  
        return cloneDeep(this.state.owners)  
    }  
  
    get state(): DocState {  
        return cloneDeep(this._state)  
    }  
  
    set state(state: DocState) {  
        this._state = state  
    }  
  
    get context(): Context {  
        return this._context  
    }  
  
    get head(): CID {  
        return this.state.log[this.state.log.length - 1]  
    }  
  
   /**  
    * Makes a change on an existing document 
    * @param params - Change parameteres  
    * @param opts - Initialization options  
    */  
    abstract change(params: Record<string, any>, opts?: InitOpts): Promise<void>;  
}
```

The interface extends the `EventEmitter` interface which means that the developer can subscribe to events emitted from the Ceramic node like the `change` event (*more events will be defined in the future*).

The method `change` is more or less sugar coding for the developer since all the operations can be implemented using the `CeramicAPI` interface. For example the snipped below describes `TileDoctype` included in the Ceramic node out-of-the-box.

```
const DOCTYPE = 'tile'  
  
/**  
 * Tile doctype parameters 
 */
export interface TileParams {  
	content: object;  
	owners?: Array<string>;  
}  
  
/**  
 * Tile doctype implementation 
 */
@DoctypeStatic<DoctypeConstructor<TileDoctype>>()  
export class TileDoctype extends Doctype {  
  
    /**  
     * Change existing Tile doctype 
     * @param params - Change parameters  
     * @param opts - Initialization options  
    */  
    async change(params: TileParams, opts?: InitOpts): Promise<void> {  
        ...
    }  
  
    /**  
     * Create Tile doctype 
     * @param params - Create parameters  
     * @param context - Ceramic context  
     * @param opts - Initialization options  
     */  
    static async create(params: TileParams, context: Context, opts?: InitOpts): {
        ...    
    }  
  
    /**  
      * Creates genesis record 
      * @param params - Create parameters  
      * @param context - Ceramic context  
      * @param opts - Initialization options  
      */  
    static async makeGenesis(params: Record<string, any>, context?: Context, opts: InitOpts = {}): Promise<Record<string, any>> {  
        ... 
    }  
  
    /**  
      * Make change record 
      * @param doctype - Tile doctype instance  
      * @param user - User instance  
      * @param newContent - New context  
      * @private  
      */  
    static async _makeRecord(doctype: Doctype, user: User, newContent: any): Promise<Doctype> {  
        ...
    }  
  
    /**  
      * Sign Tile record 
      * @param user - User instance  
      * @param record - Record to be signed  
      * @private  
      */  
    static async _signRecord(record: any, user: User): Promise<any> {  
        ...
    }  
}
```


# DoctypeHandler

The interface is listed in the code snipped below.

```
/**  
 * Describes document type handler functionality 
 */
interface DoctypeHandler<T extends Doctype> {  
  /**  
   * The string name of the doctype 
   */  
   name: string;  
  
  /**  
   * The doctype class 
   */  
   doctype: DoctypeConstructor<T>;  
  
  /**  
    * Applies record to the document (genesis|signed|anchored) 
    * @param record - Record intance  
    * @param cid - Record CID  
    * @param context - Ceramic context  
    * @param state - Document state  
    */  
  applyRecord(record: any, cid: CID, context: Context, state?: DocState): Promise<DocState>;  
}

```

This interface is used for determining the next **state** of the document. The method worth noting is `applyRecord` which is used for that *state transition*. The code snippet below describes `TileDoctypeHandler` which is included in the Ceramic node out-of-the-box as well.

```
const DOCTYPE = 'tile'  
  
/**  
 * Tile doctype handler implementation 
 */
export class TileDoctypeHandler implements DoctypeHandler<TileDoctype> {  
   /**  
	* Gets doctype name 
    */  
    get name(): string {  
        return DOCTYPE  
    }  
  
   /**  
    * Gets doctype class 
    */  
    get doctype(): DoctypeConstructor<TileDoctype> {  
        return TileDoctype  
    }  
  
    /**  
      * Create new Tile doctype instance 
      * @param params - Create parameters  
      * @param context - Ceramic context  
      * @param opts - Initialization options  
    */  
    async create(params: TileParams, context: Context, opts?: InitOpts): Promise<TileDoctype> {  
        return TileDoctype.create(params, context, opts)  
    }  
  

   /**  
     * Applies record (genesis|signed|anchor) 
     * @param record - Record  
     * @param cid - Record CID  
     * @param context - Ceramic context  
     * @param state - Document state  
     */  
    async applyRecord(record: any, cid: CID, context: Context, state?: DocState): Promise<DocState> {  
        if (state == null) {  
            // apply genesis  
            return this._applyGenesis(record, cid, context)  
        }  
  
        if (record.proof) {  
            const proofRecord = (await context.ipfs.dag.get(record.proof)).value;  
            return this._applyAnchor(record, proofRecord, cid, state);  
        }  
  
        return this._applySigned(record, cid, state, context)  
    }  
  
   /**  
     * Applies genesis record 
     * @param record - Genesis record  
     * @param cid - Genesis record CID  
     * @param context - Ceramic context  
     * @private  
     */  
    async _applyGenesis(record: any, cid: CID, context: Context): Promise<DocState> {  
        ...  
    }  
  
   /**  
     * Applies signed record 
     * @param record - Signed record  
     * @param cid - Signed record CID  
     * @param state - Document state  
     * @param context - Ceramic context  
     * @private  
     */  
    async _applySigned(record: any, cid: CID, state: DocState, context: Context): Promise<DocState> {  
        ...  
    }  
  
    /**  
     * Applies anchor record 
     * @param record - Anchor record  
     * @param proof - Anchor record proof  
     * @param cid - Anchor record CID  
     * @param state - Document state  
     * @private  
     */  
    async _applyAnchor(record: AnchorRecord, proof: AnchorProof, cid: CID, state: DocState): Promise<DocState> {  
        ...  
    }  
  
    /**  
     * Verifies record signature 
     * @param record - Record to be verified  
     * @param context - Ceramic context  
     * @private  
     */  
    async _verifyRecordSignature(record: any, context: Context): Promise<void> {  
        ...  
    }  
}

```

The `DoctypeHandler` uses `CeramicAPI` which is included in the `Context` instance. `Context` interface is described in the snippet below.

```
interface Context {  
    user?: User;  
    ipfs?: Ipfs.Ipfs; // an ipfs instance  
    resolver?: Resolver; // a DID resolver instance  
    provider?: DIDProvider; // a DID provider (3ID provider initially)  
    anchorService?: AnchorService;  
    api?: CeramicApi; // the self reference to the Ceramic API  
}
``` 


# Appendix

`CeramicAPI` is one of  the main interfaces of the Ceramic node.

```
interface CeramicApi {  
    pin: PinApi;  
  
    /**  
    * Register Doctype handler 
    * @param doctypeHandler - DoctypeHandler instance  
    */  
    addDoctypeHandler<T extends Doctype>(doctypeHandler: DoctypeHandler<T>): void;  
  
   /**  
     * Finds document handler for the doctype
     * @param doctype - Doctype  
    */  
    findDoctypeHandler<T extends Doctype>(doctype: string): DoctypeHandler<T>;  
  
    /**  
      * Create Doctype instance 
      * @param doctype - Doctype name  
      * @param params - Create parameters  
      * @param opts - Initialization options  
      */
    createDocument<T extends Doctype>(doctype: string, params: object, opts?: InitOpts): Promise<T>;  
  
    /**  
      * Create Doctype from genesis record 
      * @param genesis - Genesis record  
      * @param opts - Initialization options  
     */
    createDocumentFromGenesis<T extends Doctype>(genesis: any, opts?: InitOpts): Promise<T>;  
  
    /**  
      * Loads Doctype instance 
      * @param docId - Document ID  
      * @param opts - Initialization options  
     */  
    loadDocument<T extends Doctype>(docId: string, opts?: InitOpts): Promise<T>;  
  
    /**
     * Load all document records by document ID
     * @param docId - Document ID
     */
    loadDocumentRecords(docId: string): Promise<Array<Record<string, any>>>;

    /**  
      * Applies record on the existing document 
      * @param docId - Document ID  
      * @param record - Record to be applied  
      * @param opts - Initialization options  
     */  
    applyRecord<T extends Doctype>(docId: string, record: object, opts?: InitOpts): Promise<T>;  
  
    /**  
      * Set DID provider 
      * @param provider - DID provider instance  
     */
    setDIDProvider (provider: DIDProvider): Promise<void>;  
  
    /**  
      * Closes Ceramic instance 
     */  
    close(): Promise<void>; // gracefully close the ceramic instance  
}
```
