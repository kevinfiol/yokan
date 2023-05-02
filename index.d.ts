type YokanType = 'number' | 'array' | 'boolean' | 'object' | 'string' | 'defined';

type TypeMap = {
  number: (x: unknown) => boolean;
  array: (x: unknown) => boolean;
  boolean: (x: unknown) => boolean;
  object: (x: unknown) => boolean;
  string: (x: unknown) => boolean;
  defined: (x: unknown) => boolean;
};

type FieldProps = {
  required?: any;
  type?: YokanType;
  validate?: (value: unknown, is: TypeMap) => any;
};

// export function field(obj: Function | Record<string, unknown>, type: string): 