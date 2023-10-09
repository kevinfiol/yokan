type SchemaType = 'number' | 'array' | 'boolean' | 'object' | 'string' | 'defined';

type TypeMap = {
  number: (x: unknown) => boolean;
  array: (x: unknown) => boolean;
  boolean: (x: unknown) => boolean;
  object: (x: unknown) => boolean;
  string: (x: unknown) => boolean;
  defined: (x: unknown) => boolean;
};

type Validator = (value: unknown, is: TypeMap) => boolean;

type FieldProps = {
  required?: any;
  type?: SchemaType;
  validate?: Validator;
};

type ValidationModel = <T>(obj: T) => T;

type Schema = Record<string, FieldProps | Schema>;

type ModelCreator = (schema: Schema) => ValidationModel;

export const Model: ModelCreator & {
  setMode: (mode: string) => void;
};

export const field = (
  obj: Validator | FieldProps,
  type: string
) => FieldProps;

export const number = (obj?: Validator | FieldProps) => FieldProps;
export const array = (obj?: Validator | FieldProps) => FieldProps;
export const boolean = (obj?: Validator | FieldProps) => FieldProps;
export const object = (obj?: Validator | FieldProps) => FieldProps;
export const string = (obj?: Validator | FieldProps) => FieldProps;
