let NIL = void 0,
  MODE = 2,
  MODES = { off: 1, throw: 2, warn: 3 },
  CHECK = {
    number: Number.isFinite,
    array: Array.isArray,
    boolean: x => typeof x === 'boolean',
    object: x => x && Object.getPrototypeOf(x) === Object.prototype,
    string: x => typeof x === 'string',
    defined: x => x !== NIL
  };

export const field = (validate, _t) =>
  typeof validate === 'function'
    ? { validate, _t }
    : { ...validate, _t };

export const number = obj => field(obj, 'number');
export const array = obj => field(obj, 'array');
export const boolean = obj => field(obj, 'boolean');
export const object = obj => field(obj, 'object');
export const string = obj => field(obj, 'string');

export function Model(schema) {
  let enabled = MODE !== 1,
    model = obj => enabled ? parse(schema, obj, '') : obj;

  if (enabled) {
    model.schema = schema;
    model._t = 'object';
  }

  return model;
}

Model.setMode = mode => MODE = MODES[mode] || 2;

function validateProp({ required = true, type, validate, _t }, chain, val) {
  if (MODE === 1) return;

  let typecheck = _t ? CHECK[_t] : NIL,
    err = required && !CHECK.defined(val)
      ? chain + ' is a required property'
      : typecheck && !(typecheck(val) || (!required && !CHECK.defined(val)))
      ? chain + ' must be of type: ' + _t + ', received: ' + typeof val
      : validate && !validate(val, CHECK)
      ? chain + ' failed validation'
      : NIL;

  if (err) {
    if (MODE === 2) throw Error(err);
    if (MODE === 3) console.warn(err);
  }

  if (_t === 'array' && type)
    for (let i = 0, len = val.length; i < len; i++)
      validateProp({ _t: type }, chain + '[' + i + ']', val[i]);
}

function parse(schema, obj, chain, isArr) {
  if (!obj) return;

  if (!isArr)
    for (let k in schema) {
      if (k === '_t') continue;

      let subSchema,
        newChain = chain + '.' + k,
        checks = schema[k],
        val = obj[k];

      if (checks.default && !CHECK.defined(val))
        val = obj[k] = checks.default;

      validateProp(checks, newChain, val);

      if (subSchema = checks.schema || typeof val === 'object' && checks)
        obj[k] = parse(subSchema, val, newChain, checks._t === 'array');
    }

  return new Proxy(obj, {
    set(o, k, val) {
      let newChain = chain + (isArr
        ? '[' + k + ']'
        : '.' + k),
      checks = isArr
        ? { _t: schema.type }
        : schema[k];

      if (!isArr || (isArr && !Object.hasOwn(o, k) && schema.type))
        validateProp(checks, newChain, val);

      if (!isArr && checks.schema)
        // proxy the new object
        arguments[2] = parse(checks.schema, val, newChain);

      return Reflect.set(...arguments);
    }
  });
}
