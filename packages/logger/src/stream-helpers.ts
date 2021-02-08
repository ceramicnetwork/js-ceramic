import { Writable } from 'stream';
import {
    createStream as createRfsStream,
    Options as RfsOptions
} from 'rotating-file-stream';

/**
 * A handler for writable streams that only writes if the stream has finished
 * processing or draining
 */
export class SafeStreamHandler {
  public ready = true;
  protected stream: Writable;
  protected name: string;

  constructor(stream: Writable, name?: string) {
    this.stream = stream;
    this.name = name;
  }

  /**
   * Writes `message` to the instance's internal stream
   * @param message Message to write
   */
  public write(message: string): void {
    this.writeStream(message);
  }

  /**
   * Calls `end` on this instance's internal stream
   * @param args Arguments to `internal.Writable.end`
   */
  public end(...args: any): void {
    this.stream.end(...args)
  }

  protected writeStream(message: string): void {
    if (!this.ready) {
      console.warn(`Stream busy: ${this.name}. Write will be dropped: "${message}"`);
      return;
    }
    this.ready = false;

    this.stream.on('error', (err) => {
      throw err;
    });
    this.stream.on('drain', () => {
      this.ready = true;
      return;
    })
    this.stream.on('finish', () => {
      this.ready = true;
      return;
    })
    this.ready = this.stream.write(message, () => {
      return;
    });
  }
}

/**
 * A wrapper for the `rfs` module that will optionally write to disk immediately
 * by creating and closing a new stream on each write.
 */
export class RotatingFileStream {
  private filePath: string;
  private immediate: boolean;
  private stream: Writable | undefined;
  private options: RfsOptions;

  constructor(filePath: string,  writeImmediately?: boolean, options?: RfsOptions) {
    this.filePath = filePath;
    this.immediate = writeImmediately;
    this.options = options;
    if (!this.immediate) {
      this.stream = createRfsStream(this.filePath, options);
    }
  }

  /**
   * Writes `message` to the instance's internal stream
   * @param message Message to write
   */
  public write(message: string): void {
    let fileStream = this.stream;
    if (this.immediate) {
      fileStream = createRfsStream(this.filePath, this.options);
    }
    const stream = new SafeStreamHandler(fileStream, this.filePath);
    stream.write(message);
    if (this.immediate) {
      stream.end();
    }
  }

  /**
   * Ends the instance's internal stream
   * 
   * When `immediate` is not `true`, a call to `write` after calling this method
   * will throw an error.
   */
  public end(): void {
    if (this.stream !== undefined) {
      this.stream.end();
    }
  }
}
