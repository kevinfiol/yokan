let NIL = void 0,
  MODE = 2,
  MODES = { off: 1, throw: 2, warn: 3 },
  CHECK = {
    number: Number.isFinite,
    array: Array.isArray,
    boolean: x => typeof x === 'boolean',
    object: x => x && Object.getPrototypeOf(x) === Object.prototype,
    string: x => typeof x === 'string',
    function: x => typeof x === 'function',
    defined: x => x !== NIL
  };

export const setMode = mode => MODE = MODES[mode] || 2;

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
  let model = obj => MODE !== 1 ? parse(schema, obj, true) : obj;
  model.schema = schema;
  model.type = 'object';
  return model;
}

function validateProp({ required = true, validate, type }, chain, val) {
  if (MODE === 1) return;

  let typecheck = type ? CHECK[type] : NIL,
    err = required && !CHECK.defined(val)
      ? chain + ' is a required property'
      : typecheck && !(typecheck(val) || (!required && !CHECK.defined(val)))
      ? chain + ' must be of type: ' + type
      : validate && !validate(val, CHECK)
      ? chain + ' failed validation'
      : NIL;

  if (err) {
    if (MODE === 2) throw Error(err);
    if (MODE === 3) console.warn(err);
  }
}

function parse(schema, obj, proxy, chain = '') {
  if (!obj) return;

  for (let k in schema) {
    let newChain = chain + '.' + k,
      checks = schema[k],
      val = obj[k];

    if (checks.default && !CHECK.defined(val))
      val = obj[k] = checks.default;

    validateProp(checks, newChain, val);

    if (checks.schema)
      obj[k] = parse(checks.schema, val, proxy, newChain);
  }

  if (proxy) return new Proxy(obj, {
    set(_, k, val) {
      let newChain = chain + '.' + k,
        checks = schema[k];
      validateProp(checks, newChain, val)
      if (checks.schema) parse(checks.schema, val, false, newChain);
      return Reflect.set(...arguments);
    }
  });
}
