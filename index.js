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

export const field = (obj, _type) => {
  if (CHECK.function(obj)) return { validate: obj, _type };
  return { ...obj, _type };
};

export const number = obj => field(obj, 'number');
export const array = obj => field(obj, 'array');
export const boolean = obj => field(obj, 'boolean');
export const object = obj => field(obj, 'object');
export const string = obj => field(obj, 'string');

export function Model(schema) {
  let model = obj => MODE !== 1 ? parse(schema, obj, true, '') : obj;
  model.schema = schema;
  model._type = 'object';
  return model;
}

function validateProp({ required = true, type, validate, _type }, chain, val) {
  if (MODE === 1) return;

  let typecheck = _type ? CHECK[_type] : NIL,
    err = required && !CHECK.defined(val)
      ? chain + ' is a required property'
      : typecheck && !(typecheck(val) || (!required && !CHECK.defined(val)))
      ? chain + ' must be of type: ' + _type + ', received: ' + typeof val
      : validate && !validate(val, CHECK)
      ? chain + ' failed validation'
      : NIL;

  if (err) {
    if (MODE === 2) throw Error(err);
    if (MODE === 3) console.warn(err);
  }

  if (_type === 'array' && type)
    for (let i = 0, len = val.length; i < len; i++)
      validateProp({ _type: type }, chain + '[' + i + ']', val[i]);
}

function parse(schema, obj, proxy, chain, isArr) {
  if (!isArr && obj)
    for (let k in schema) {
      if (k === '_type') continue;

      let subSchema,
        newChain = chain + '.' + k,
        checks = schema[k],
        val = obj[k];

      if (checks.default && !CHECK.defined(val))
        val = obj[k] = checks.default;

      validateProp(checks, newChain, val);

      if (subSchema = checks.schema || typeof val === 'object' && checks)
        obj[k] = parse(subSchema, val, proxy, newChain, checks._type === 'array');
    }

  if (proxy && obj) return new Proxy(obj, {
    set(o, k, val) {
      let newChain = chain + (isArr
        ? '[' + k + ']'
        : '.' + k),
      checks = isArr
        ? { _type: schema.type }
        : schema[k];

      if (!isArr || (isArr && !Object.hasOwn(o, k) && schema.type))
        validateProp(checks, newChain, val);

      if (!isArr && checks.schema)
        parse(checks.schema, val, false, newChain);

      return Reflect.set(...arguments);
    }
  });
}
