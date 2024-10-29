import {Document, ToJSOptions} from 'yaml';

export class YAMLDocument<T> extends Document {
  toJS(opt?: ToJSOptions & {[p: string]: unknown}): T {
    return super.toJS(opt) as T;
  }
}
