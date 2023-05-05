import { suite, run } from 'flitch';
import { strict as assert } from 'node:assert';
import { Model, string, number, boolean, object, array, field } from './index.js'

const test = suite('yokan tests');

const consoleWarn = console.warn;

const shouldThrow = fn => {
  let thrown = false;
  try { fn() }
  catch { thrown = true; }
  assert.ok(thrown);
};

test.after.each = () => {
  // clean up
  Model.setMode('throw');
  console.warn = consoleWarn;
};

test('test basic usage', () => {
  const User = Model({
    name: string(),
    age: number(),
    registered: boolean(),
    pets: array(),
    profile: object()
  });

  // should throw on initialization
  shouldThrow(() => {
    User({
      name: 10,
      age: 'not a num',
      registered: true,
      pets: [],
      profile: {}
    });
  })

  const user = User({
    name: 'kevin',
    age: 20,
    registered: true,
    pets: ['maggie'],
    profile: {}
  });

  // modifying with the wrong type should throw
  shouldThrow(() => user.name = 20);

  // object should remain unmodified
  assert.equal(user.name, 'kevin');

  shouldThrow(() => user.age = 'not a num');
  shouldThrow(() => user.registered = 'not a bool');
  shouldThrow(() => user.pets = {});
  shouldThrow(() => user.profile = []);
});

test('nested models', () => {
  const User = Model({
    name: string({ required: false }),
    profile: Model({
      password: string({ required: true }),
      posts: number({ required: false })
    })
  });

  const user = User({
    name: 'kevin',
    profile: {
      password: 'this is required',
      posts: 10
    }
  });

  assert.deepEqual(user, {
    name: 'kevin',
    profile: { password: 'this is required', posts: 10 }
  });

  shouldThrow(() => {
    user.profile.password = 10;
  });

  // should not throw when setting appropriate type
  user.profile.password = 'hunter2';
  assert.equal(user.profile.password, 'hunter2');

  // should throw on initialization
  shouldThrow(() => {
    User({
      name: 'kevin',
      profile: {
        password: 10,
        posts: 'asdfasdf'
      }
    })
  });

  // should not throw when not setting non-required fields
  let tmp = User({
    profile: {
      password: 'passwd'
    }
  });

  // should still typecheck optional fields
  shouldThrow(() => tmp.name = 10);
  tmp.name = 'bro'; // should not throw
  assert.deepEqual(tmp, {
    name: 'bro',
    profile: {
      password: 'passwd'
    }
  });
});

test('validation', () => {
  const User = Model({
    name: string({ validate: x => x.length > 4 })
  });

  const kevin = User({
    name: 'kevin'
  });

  shouldThrow(() => kevin.name = 'kevi');
});

test('warn mode', () => {
  Model.setMode('warn');

  let warns = [];
  console.warn = str => {
    warns.push(str);
  };

  const User = Model({
    age: number({ validate: x => x > 10 }),
    profile: Model({
      nested: Model({
        greatly: Model({
          foo: array({ validate: x => x.length > 5 })
        })
      })
    })
  });

  // this should not throw; should warn
  User({
    age: 9,
    profile: {
      nested: {
        greatly: {
          foo: [1, 2, 3, 4, 5]
        }
      }
    }
  });

  assert.equal(warns.length, 2);
  assert.equal(warns[0], '.age failed validation');
  assert.equal(warns[1], '.profile.nested.greatly.foo failed validation');
});

test('off mode', () => {
  Model.setMode('off');

  let warns = [];
  console.warn = str => warns.push(str);

  // should not warn or throw
  const User = Model({
    age: number({ validate: x => x > 10 })
  });

  User({ age: 9 });
  assert.equal(warns.length, 0);
});

test('deeply nested models', () => {
  Model.setMode('warn');
  let warns = [];
  console.warn = str => warns.push(str);

  const User = Model({
    foo: number(),
    bar: Model({
      baz: Model({
        buz: Model({
          name: string()
        })
      })
    })
  });

  User({
    foo: 10,
    bar: {}
  });

  User({
    foo: 10,
    bar: {
      baz: {}
    }
  });

  User({
    foo: 10,
    bar: {
      baz: {
        buz: {
          name: []
        }
      }
    }
  });

  assert.equal(warns.length, 3);
  assert.equal(warns[0], '.bar.baz is a required property');
  assert.equal(warns[1], '.bar.baz.buz is a required property');
  assert.equal(warns[2], '.bar.baz.buz.name must be of type: string, received: object');
});

test('default values', () => {
  const User = Model({
    name: string(),
    age: number({ default: 10 })
  });

  // should not throw because propers with defaults are not required
  const user = User({
    name: 'kevin'
  });

  assert.deepEqual(user, {
    name: 'kevin',
    age: 10
  });
});

test('validation shortcut', () => {
  const User = Model({
    name: string(x => x.length > 5)
  });

  shouldThrow(() => {
    User({
      name: '12345'
    });
  });
});

test('using field properties for optional nested models', () => {
  const Profile = Model({
    age: number({ required: false })
  });

  const User = Model({
    name: string(),
    profile: field({ default: {}, schema: Profile.schema })
  });

  let user = User({
    name: 'kevin'
  });

  assert.deepEqual(user, {
    name: 'kevin',
    profile: {}
  });

  user.profile.age = 10;

  assert.deepEqual(user, {
    name: 'kevin',
    profile: { age: 10 }
  });

  shouldThrow(() => {
    user.profile.age = 'not a number';
  });
});

test('readme sample', () => {
  // define your models
  const Profile = Model({
    password: string(str => str.length > 5),
    pets: array({ type: 'string' })
  });

  // models can be nested
  const User = Model({
    name: string(),
    age: number(),
    profile: Profile
  });

  // create an object; will throw if invalid
  const user = User({
    name: 'kevin',
    age: 20,
    profile: {
      password: 'hunter2',
      pets: ['maggie', 'trixie', 'flitch', 'haku']
    }
  });

  // modify your object as you normally would
  user.name = 'rafael';

  // will throw on invalid assignments
  // throws "Error: .profile.password failed validation"
  shouldThrow(() => user.profile.password = '1234');

  // array type should also be enforced
  shouldThrow(() => user.profile.pets.push(100));
});

test('plain objects default to schemas', () => {
  const User = Model({
    one: string(),
    nested: {
      name: string(),
      subnested: {
        age: number()
      }
    }
  });

  shouldThrow(() => {
    User({
      one: 'num',
      nested: {
        name: 'thing',
        subnested: {
          age: 'notanum'
        }
      }
    })
  });

  // missing properties
  shouldThrow(() => {
    User({
      one: 'one',
      nested: {}
    });
  });

  const user = User({
    one: 'one',
    nested: { name: 'kevin', subnested: { age: 10 } }
  });

  shouldThrow(() => {
    user.nested.subnested.age = 'notanum';
  });
});

test('arrays', () => {
  const User = Model({
    nested: {
      pets: array({ type: 'number' })
    }
  });

  shouldThrow(() => {
    User({
      nested: {
        pets: [1, 2, 3, 'not a number']
      }
    });
  });

  const user = User({
    nested: {
      pets: [1, 2, 3]
    }
  });

  shouldThrow(() => user.nested.pets.push('also not a number'));
});

test('optional schemas', () => {
  const Profile = Model({
    age: number()
  });

  const User = Model({
    name: string(),
    profile: object({ required: false, schema: Profile.schema })
  });

  const user = User({
    name: 'kevin'
  });

  assert.deepEqual(user, {
    name: 'kevin',
    profile: undefined
  });

  user.profile = {
    age: 10
  };

  shouldThrow(() => user.profile.age = 'not a num');
});

run();
