let NIL = void 0,
  THROW = true,
  VALIDATE = true,
  CHECK = {
    number: Number.isFinite,
    array: Array.isArray,
    boolean: x => typeof x === 'boolean',
    object: x => x && Object.getPrototypeOf(x) === Object.prototype,
    string: x => typeof x === 'string',
    function: x => typeof x === 'function',
    defined: x => x !== NIL
  };


export const field = (obj, type) => {
  if (CHECK.function(obj)) return { validate: obj, type };
  return { ...obj, type };
};

export const number = obj => field(obj, 'number');
export const array = obj => field(obj, 'array');
export const boolean = obj => field(obj, 'boolean');
export const object = obj => field(obj, 'object');
export const string = obj => field(obj, 'string');

export function Model(schema) {
  let model = obj => VALIDATE ? parse(schema, obj) : obj;
  model.schema = schema;
  model.type = 'object';
  return model;
}

function validateProp({ required = true, validate, type }, key, val) {
  let typecheck = type ? CHECK[type] : NIL;
  if (required && !CHECK.defined(val)) throw 'You need the property: ' + key;
  if (typecheck && !(typecheck(val) || required ? false : !CHECK.defined(val))) throw 'Value must be of type ' + type;
  if (validate && !validate(val)) throw 'Prop failed validation';
}

function parse(schema, obj, proxy = 1) {
  for (let k in schema) {
    let checks = schema[k],
      val = obj[k];

    if (checks.default && !CHECK.defined(val)) val = obj[k] = checks.default;
    if (VALIDATE || THROW) validateProp(checks, k, val);
    if (checks.schema) obj[k] = parse(checks.schema, val, proxy);
  }

  if (proxy) return new Proxy(obj, {
    set(_, prop, value) {
      let checks = schema[prop];
      validateProp(checks, prop, value)
      if (checks.schema) parse(checks.schema, value, 0);
      return Reflect.set(...arguments);
    }
  });
}
